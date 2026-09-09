import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Plus, Trash2 } from 'lucide-react';
import { allPages, listPath, request, type Page } from '../api/client';
import { refreshContent } from '../api/query';
import { ConfirmDialog, Empty, ErrorNotice, Loading, Modal } from './feedback';
import { Pagination } from './pagination';

export interface Column<T> {
  title: string;
  render: (item: T) => ReactNode;
}
export function CollectionPage<T extends { id: number }>({
  resource,
  title,
  description,
  name,
  columns,
  sortable = false,
  deleteMessage,
  filters = {},
  filterBar,
  loadPage,
  loadCollection,
}: {
  resource: string;
  title: string;
  description: string;
  name: (item: T) => string;
  columns: Column<T>[];
  sortable?: boolean;
  deleteMessage?: string;
  filters?: Record<string, string>;
  filterBar?: ReactNode;
  loadPage?: (page: number, signal: AbortSignal) => Promise<Page<T>>;
  loadCollection?: (signal: AbortSignal) => Promise<T[]>;
}) {
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<T | null>(null);
  const [sorting, setSorting] = useState(false);
  const query = useQuery({
    queryKey: [
      'admin',
      resource,
      loadCollection ? 'collection' : page,
      filters,
      loadPage ? 'custom' : 'default',
    ],
    queryFn: async ({ signal }) => {
      if (loadCollection) {
        const items = await loadCollection(signal);
        return {
          items,
          page: 1,
          pageSize: 10,
          total: items.length,
          totalPages: Math.ceil(items.length / 10),
        };
      }
      return loadPage
        ? loadPage(page, signal)
        : request<Page<T>>(listPath(`/admin/${resource}`, page, 10, filters), { signal });
    },
    select: (data) =>
      loadCollection
        ? {
            ...data,
            page,
            items: data.items.slice((page - 1) * data.pageSize, page * data.pageSize),
          }
        : data,
  });
  const remove = useMutation({
    mutationFn: (id: number) => request<void>(`/admin/${resource}/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      setDeleting(null);
      if (query.data?.items.length === 1 && page > 1) setPage(page - 1);
      await refreshContent();
    },
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">CONTENT COLLECTION</p>
          <h1>
            {title}
            <span className="count">{query.data?.total ?? '—'}</span>
          </h1>
          <p>{description}</p>
        </div>
        <div className="actions">
          {sortable && (
            <button onClick={() => setSorting(true)}>
              <ArrowUpDown size={17} />
              调整顺序
            </button>
          )}
          <Link className="button primary" to={`/${resource}/new`}>
            <Plus size={18} />
            新建{title}
          </Link>
        </div>
      </div>
      {filterBar}
      <section className="panel table-panel">
        {query.isPending ? (
          <Loading />
        ) : query.isError ? (
          <ErrorNotice
            error={query.error}
            retry={() => {
              void query.refetch();
            }}
          />
        ) : (
          <>
            {query.data.items.length === 0 ? (
              <Empty text="没有匹配的记录">
                <Link to={`/${resource}/new`}>创建第一条内容</Link>
              </Empty>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      {columns.map((column) => (
                        <th scope="col" key={column.title}>
                          {column.title}
                        </th>
                      ))}
                      <th scope="col" className="operation-column">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {query.data.items.map((item) => (
                      <tr key={item.id}>
                        {columns.map((column) => (
                          <td key={column.title}>{column.render(item)}</td>
                        ))}
                        <td>
                          <div className="actions">
                            <Link
                              className="button icon-button"
                              aria-label={`编辑 ${name(item)}`}
                              to={`/${resource}/${item.id}`}
                            >
                              <Pencil size={16} />
                            </Link>
                            <button
                              className="icon-button"
                              aria-label={`删除 ${name(item)}`}
                              onClick={() => {
                                remove.reset();
                                setDeleting(item);
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination
              page={page}
              total={query.data.total}
              totalPages={query.data.totalPages}
              onChange={setPage}
            />
          </>
        )}
      </section>
      {deleting && (
        <ConfirmDialog
          title={`删除“${name(deleting)}”？`}
          message={deleteMessage ?? '此操作会删除该业务记录，已上传图片仍保留在媒体库。'}
          onCancel={() => setDeleting(null)}
          onConfirm={() => remove.mutate(deleting.id)}
          busy={remove.isPending}
          error={remove.error}
        />
      )}
      {sorting && <SortDialog resource={resource} onClose={() => setSorting(false)} />}
    </>
  );
}

interface SortItem {
  id: number;
  sortOrder: number;
  title?: string;
  label?: string;
  name?: string;
}
export function reorderPayload(items: readonly { id: number }[]) {
  if (items.length === 0 || items.length > 500) throw new Error('每次排序需包含 1～500 条记录。');
  if (new Set(items.map((item) => item.id)).size !== items.length)
    throw new Error('记录编号不能重复。');
  return { items: items.map((item, sortOrder) => ({ id: item.id, sortOrder })) };
}
function SortDialog({ resource, onClose }: { resource: string; onClose: () => void }) {
  const query = useQuery({
    queryKey: ['admin', resource, 'sort'],
    queryFn: ({ signal }) => allPages<SortItem>(`/admin/${resource}`, signal),
    staleTime: 0,
  });
  const [draft, setDraft] = useState<SortItem[] | null>(null);
  const items = draft ?? query.data ?? [];
  const save = useMutation({
    mutationFn: () =>
      request<void>(`/admin/${resource}/reorder`, { method: 'PATCH', json: reorderPayload(items) }),
    onSuccess: async () => {
      await refreshContent();
      onClose();
    },
    onError: () => {
      setDraft(null);
      void query.refetch();
    },
  });
  function move(index: number, delta: number) {
    const next = [...items];
    const item = next[index];
    const neighbor = next[index + delta];
    if (!item || !neighbor) return;
    next[index] = neighbor;
    next[index + delta] = item;
    setDraft(next);
  }
  return (
    <Modal title="调整全局顺序" onClose={onClose} busy={save.isPending}>
      <p>加载所有分页和隐藏记录，使用上移 / 下移调整后统一保存。失败会重新加载服务端顺序。</p>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorNotice
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        />
      ) : items.length > 500 ? (
        <p className="notice">完整集合超过单次 500 项限制，请返回编辑页逐条调整排序值。</p>
      ) : (
        <ol className="sort-list">
          {items.map((item, index) => (
            <li key={item.id}>
              <span>
                {index + 1}. {item.title ?? item.label ?? item.name ?? `#${item.id}`}
              </span>
              <div className="actions">
                <button
                  type="button"
                  aria-label={`上移 ${item.id}`}
                  disabled={index === 0 || save.isPending}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  type="button"
                  aria-label={`下移 ${item.id}`}
                  disabled={index === items.length - 1 || save.isPending}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown size={16} />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
      {save.isError && <ErrorNotice error={save.error} />}
      <div className="actions">
        <button disabled={save.isPending} onClick={onClose}>
          取消
        </button>
        <button
          className="primary"
          disabled={!draft || items.length > 500 || save.isPending || query.isFetching}
          onClick={() => save.mutate()}
        >
          {save.isPending ? '保存中…' : '保存顺序'}
        </button>
      </div>
    </Modal>
  );
}
export function ResourceEditor<T>({
  resource,
  children,
}: {
  resource: string;
  children: (item: T | undefined) => ReactNode;
}) {
  const { id } = useParams();
  const isNew = id === 'new';
  const valid = isNew || (id !== undefined && /^[1-9]\d*$/.test(id));
  const query = useQuery({
    queryKey: ['admin', resource, 'detail', id],
    queryFn: ({ signal }) => request<T>(`/admin/${resource}/${id}`, { signal }),
    enabled: !isNew && valid,
  });
  if (!valid) return <Empty text="无效的记录编号" />;
  if (isNew) return children(undefined);
  if (query.isPending) return <Loading />;
  if (query.isError)
    return (
      <ErrorNotice
        error={query.error}
        retry={() => {
          void query.refetch();
        }}
      />
    );
  return children(query.data);
}
export function Visibility({ visible }: { visible: boolean }) {
  return (
    <span className={`badge ${visible ? 'green' : ''}`}>
      <span className="status-dot" />
      {visible ? '公开展示' : '已隐藏'}
    </span>
  );
}
export function TitleCell({
  title,
  subtitle,
  image,
}: {
  title: string;
  subtitle?: string;
  image?: string;
}) {
  return (
    <div className="title-cell">
      {image && <img loading="lazy" src={image} alt="" />}
      <div>
        <strong>{title}</strong>
        {subtitle && <small>{subtitle}</small>}
      </div>
    </div>
  );
}
