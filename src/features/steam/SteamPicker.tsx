import { SteamBreakdown } from './SteamPage';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { request, listPath, type Page } from '../../api/client';
import type { SteamGame } from '../../api/types';
import { Empty, ErrorNotice, Loading, Modal } from '../../components/feedback';
import { Pagination } from '../../components/pagination';
export function SteamPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (id: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['admin', 'steam', 'library', page],
    queryFn: ({ signal }) =>
      request<Page<SteamGame>>(listPath('/admin/steam/library', page, 50), { signal }),
    enabled: open,
  });
  return (
    <div className="field">
      <span className="field-label">Steam 关联</span>
      <div className="actions">
        <span className="badge">{value === null ? '未关联' : `已关联 · App ID ${value}`}</span>
        <button type="button" onClick={() => setOpen(true)}>
          选择 Steam 游戏
        </button>
        {value !== null && (
          <button type="button" onClick={() => onChange(null)}>
            解除关联
          </button>
        )}
      </div>
      <small>关联或解除后需保存。个人评分、封面、评论与自定义时长独立保留。</small>
      {open && (
        <Modal title="选择 Steam 游戏" onClose={() => setOpen(false)}>
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
              <div className="steam-options">
                {query.data.items.map((item) => (
                  <button
                    type="button"
                    aria-pressed={value === item.appId}
                    key={item.appId}
                    onClick={() => {
                      onChange(item.appId);
                      setOpen(false);
                    }}
                  >
                    <strong>{item.name}</strong>
                    <small>
                      App ID {item.appId} · {item.playtimeMinutes} 分钟
                      {item.stale ? ' · 包含旧快照或不完整数据' : ''}
                    </small>
                    <SteamBreakdown game={item} />
                  </button>
                ))}
              </div>
              {query.data.items.length === 0 && <Empty text="这一页没有 Steam 游戏" />}
              <Pagination
                page={page}
                total={query.data.total}
                totalPages={query.data.totalPages}
                onChange={setPage}
              />
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
