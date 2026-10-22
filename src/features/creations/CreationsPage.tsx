import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request, listPath, type Page } from '../../api/client';
import { ConfirmDialog, Empty, ErrorNotice, Loading } from '../../components/feedback';
import { Pagination } from '../../components/pagination';
import { formatDate } from '../../lib/values';

interface CreationRow {
  id: number;
  platform: 'x' | 'douyin' | 'bilibili';
  sourceUrl: string;
  publishedAt: string;
  payload: { author: { name: string }; body: { text: string }[]; title?: string };
}

export function CreationsPage() {
  const [page, setPage] = useState(1);
  const [url, setUrl] = useState('');
  const [deleting, setDeleting] = useState<CreationRow | null>(null);
  const client = useQueryClient();
  const posts = useQuery({
    queryKey: ['admin', 'creations', page],
    queryFn: ({ signal }) => request<Page<CreationRow>>(listPath('/admin/creations', page, 20), { signal }),
  });
  const status = useQuery({
    queryKey: ['admin', 'creations', 'status'],
    queryFn: ({ signal }) => request<{ owner: string; automaticSync: boolean }>('/admin/creations/status', { signal }),
  });
  const refresh = () => client.invalidateQueries({ queryKey: ['admin', 'creations'] });
  const importing = useMutation({
    mutationFn: () => request<CreationRow>('/admin/creations/import-x', { method: 'POST', json: { url: url.trim() } }),
    onSuccess: async () => { setUrl(''); setPage(1); await refresh(); },
  });
  const remove = useMutation({
    mutationFn: (id: number) => request<void>(`/admin/creations/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      setDeleting(null);
      if (posts.data?.items.length === 1 && page > 1) setPage(page - 1);
      await refresh();
    },
  });
  return <>
    <div className="page-heading"><div><h1>创作动态</h1><p>管理首页 Blog 中展示的内容。</p></div></div>
    <section className="panel">
      <h2>X · @{status.data?.owner ?? 'vo1dZzz'}</h2>
      <p className="muted">当前支持粘贴本人推文链接导入。账号自动同步尚未启用。</p>
      <form onSubmit={event => { event.preventDefault(); importing.mutate(); }}>
        <label htmlFor="creation-source">推文链接</label>
        <div className="actions">
          <input id="creation-source" type="url" required maxLength={500} value={url} onChange={event => setUrl(event.target.value)}
            placeholder="https://x.com/vo1dZzz/status/…" disabled={importing.isPending} style={{ flex: 1, minWidth: 180 }} />
          <button type="submit" disabled={importing.isPending || !url.trim()}>{importing.isPending ? '导入中…' : '导入推文'}</button>
        </div>
      </form>
      {importing.error && <ErrorNotice error={importing.error} />}
      {importing.isSuccess && <p role="status">已导入，首页将展示这条动态。</p>}
      {status.error && <ErrorNotice error={status.error} />}
    </section>
    {posts.isPending ? <Loading /> : posts.error ? <ErrorNotice error={posts.error} /> : posts.data && <>
      {!posts.data.items.length ? <Empty /> : <div className="table-scroll"><table>
        <thead><tr><th>内容</th><th>平台</th><th>发布时间</th><th>操作</th></tr></thead>
        <tbody>{posts.data.items.map(post => <tr key={post.id}>
          <td style={{ whiteSpace: 'normal', overflowWrap: 'anywhere' }}><strong>{post.payload.title ?? post.payload.author.name}</strong><p className="muted" style={{ maxWidth: 520 }}>{post.payload.body.map(part => part.text).join('').slice(0, 160)}</p></td>
          <td>{{ x: 'X', douyin: '抖音', bilibili: '哔哩哔哩' }[post.platform]}</td>
          <td>{formatDate(post.publishedAt)}</td>
          <td><div className="actions"><a href={post.sourceUrl} target="_blank" rel="noopener noreferrer">查看原文</a>
            <button className="danger" type="button" onClick={() => { remove.reset(); setDeleting(post); }}>删除</button></div></td>
        </tr>)}</tbody>
      </table></div>}
      <Pagination page={page} totalPages={posts.data.totalPages} total={posts.data.total} onChange={setPage} />
    </>}
    {deleting && <ConfirmDialog title="删除动态" message="删除后将从个人网页移除，并阻止后续重复导入。这不会删除 X 上的原推文。"
      busy={remove.isPending} error={remove.error} onCancel={() => setDeleting(null)} onConfirm={() => remove.mutate(deleting.id)} />}
  </>;
}
