import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Image, Trash2, UploadCloud } from 'lucide-react';
import { listPath, request, type Page } from '../../api/client';
import { refreshContent } from '../../api/query';
import type { Media } from '../../api/types';
import { ConfirmDialog, Empty, ErrorNotice, Loading, Modal } from '../../components/feedback';
import { Pagination } from '../../components/pagination';
import { Upload } from './Upload';

const PAGE_SIZE = 50;

export function MediaPage() {
  const [page, setPage] = useState(1);
  const [upload, setUpload] = useState(false);
  const [purpose, setPurpose] = useState<'IMAGE' | 'PHOTO'>('IMAGE');
  const [deleting, setDeleting] = useState<Media | null>(null);
  const media = useQuery({
    queryKey: ['admin', 'media', page, PAGE_SIZE],
    queryFn: ({ signal }) => request<Page<Media>>(listPath('/admin/media', page, PAGE_SIZE), { signal }),
  });
  const deletion = useMutation({
    mutationFn: (id: number) => request<void>(`/admin/media/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      setDeleting(null);
      if (media.data?.items.length === 1 && page > 1) setPage(page - 1);
      await refreshContent();
    },
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ASSET LIBRARY</p>
          <h1>媒体库</h1>
          <p>统一管理封面与照片，让每一张图片各得其所。</p>
        </div>
        <button className="primary" onClick={() => setUpload(true)}>
          <UploadCloud size={18} />
          上传素材
        </button>
      </div>
      <div className="notice">
        <Image size={18} />
        删除内容不会删除素材。被引用素材无法删除，请先解除业务引用；当前接口不提供引用数量。
      </div>
      {media.isPending ? (
        <Loading />
      ) : media.isError ? (
        <ErrorNotice
          error={media.error}
          retry={() => {
            void media.refetch();
          }}
        />
      ) : (
        <>
          <div className="media-grid">
            {media.data.items.map((item) => (
              <article className="panel media-card" key={item.id}>
                <a href={item.url} target="_blank" rel="noreferrer">
                  <img loading="lazy" src={item.url} alt={item.altText ?? `素材 ${item.id}`} />
                </a>
                <div>
                  <strong>素材 #{item.id}</strong>
                  <span className="badge">
                    {item.kind === 'IMAGE'
                      ? '普通图片'
                      : item.kind === 'PHOTO_ORIGINAL'
                        ? '照片展示图'
                        : '照片缩略图'}
                  </span>
                  <p title={item.altText ?? undefined}>{item.altText ?? '未设置替代文本'}</p>
                  <small>
                    {item.width ?? '—'} × {item.height ?? '—'} ·{' '}
                    {(item.sizeBytes / 1024).toFixed(1)} KiB
                  </small>
                  <button
                    aria-label={`删除素材 ${item.id}`}
                    onClick={() => {
                      deletion.reset();
                      setDeleting(item);
                    }}
                  >
                    <Trash2 size={15} />
                    删除
                  </button>
                </div>
              </article>
            ))}
          </div>
          {media.data.items.length === 0 && <Empty />}
          <Pagination
            page={page}
            total={media.data.total}
            totalPages={media.data.totalPages}
            onChange={setPage}
          />
        </>
      )}
      {upload && (
        <Modal title="上传素材" onClose={() => setUpload(false)}>
          <label className="field">
            <span>图片用途</span>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value === 'PHOTO' ? 'PHOTO' : 'IMAGE')}
            >
              <option value="IMAGE">普通图片（封面 / 头像）</option>
              <option value="PHOTO">照片（展示图 + 缩略图）</option>
            </select>
          </label>
          <Upload key={purpose} purpose={purpose} />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog
          title={`删除素材 #${deleting.id}？`}
          message="这将删除图片文件。若素材仍被文章、头像、书籍、游戏或照片引用，服务端会拒绝删除，请先解除引用。"
          onCancel={() => setDeleting(null)}
          onConfirm={() => deletion.mutate(deleting.id)}
          busy={deletion.isPending}
          error={deletion.error}
        />
      )}
    </>
  );
}
