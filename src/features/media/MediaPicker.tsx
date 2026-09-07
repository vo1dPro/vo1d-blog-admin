import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { allPages } from '../../api/client';
import type { Media } from '../../api/types';
import { ErrorNotice, Loading, Modal, Empty } from '../../components/feedback';
import { Upload } from './Upload';

export function MediaPicker({
  label,
  value,
  onChange,
  kind = 'IMAGE',
  nullable = false,
  iconUpload = false,
  previewBackground,
}: {
  label: string;
  value: number | null;
  onChange: (id: number | null) => void;
  kind?: Media['kind'];
  nullable?: boolean;
  iconUpload?: boolean;
  previewBackground?: 'light' | 'dark';
}) {
  const [open, setOpen] = useState(false);
  const media = useQuery({
    queryKey: ['admin', 'media', 'all'],
    queryFn: ({ signal }) => allPages<Media>('/admin/media', signal),
  });
  const selected = media.data?.find((item) => item.id === value);
  return (
    <div className="field" data-icon-background={previewBackground}>
      <span className="field-label">{label}</span>
      <div className="media-selection">
        {selected && <img src={selected.url} alt={selected.altText ?? label} />}
        <div>
          <strong>{value == null || value === 0 ? '尚未选择素材' : `素材 #${value}`}</strong>
          <div className="actions">
            <button type="button" onClick={() => setOpen(true)}>
              选择{label}
            </button>
            {nullable && value != null && (
              <button type="button" onClick={() => onChange(null)}>
                清除
              </button>
            )}
          </div>
        </div>
      </div>
      {previewBackground && (
        <small className="muted">
          {previewBackground === 'light'
            ? '白底预览：用于浅色背景，通常选择深色图案。'
            : '黑底预览：用于深色背景，通常选择浅色图案。'}
        </small>
      )}
      {open && (
        <Modal title={`选择${label}`} onClose={() => setOpen(false)}>
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
              <p className="muted">
                已加载完整媒体库，共 {media.data.length} 项；仅显示用途匹配的素材。
              </p>
              <div className="media-picker-grid" data-icon-background={previewBackground}>
                {media.data
                  .filter((item) => item.kind === kind)
                  .map((item) => (
                    <button
                      type="button"
                      className="media-option"
                      key={item.id}
                      aria-label={`选择素材 ${item.id}`}
                      aria-pressed={value === item.id}
                      onClick={() => {
                        onChange(item.id);
                        setOpen(false);
                      }}
                    >
                      <img loading="lazy" src={item.url} alt={item.altText ?? `素材 ${item.id}`} />
                      <span>
                        #{item.id} · {item.width ?? '—'} × {item.height ?? '—'}
                      </span>
                    </button>
                  ))}
              </div>
              {!media.data.some((item) => item.kind === kind) && (
                <Empty text="没有匹配用途的素材" />
              )}
            </>
          )}
          {kind === 'IMAGE' && (
            <Upload
              purpose={iconUpload ? 'ICON' : 'IMAGE'}
              onUploaded={(result) => {
                if ('asset' in result) onChange(result.asset.id);
              }}
            />
          )}
        </Modal>
      )}
    </div>
  );
}
