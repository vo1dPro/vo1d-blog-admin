import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import type { UploadResult } from '../../api/types';
import { refreshContent } from '../../api/query';
import { uploadImage } from './upload-image';
import { ErrorNotice } from '../../components/feedback';

export function Upload({
  purpose,
  onUploaded,
}: {
  purpose: 'IMAGE' | 'PHOTO' | 'ICON';
  onUploaded?: (result: UploadResult) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const lock = useRef(false);
  async function upload() {
    if (!file || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const uploaded = await uploadImage(file, purpose, alt);
      setResult(uploaded);
      onUploaded?.(uploaded);
      await refreshContent();
    } catch (failure) {
      setError(failure);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="upload-box">
      <div className="upload-label">
        <UploadCloud size={24} />
        <strong>{purpose === 'PHOTO' ? '上传照片，自动生成展示图与缩略图' : '上传新图片'}</strong>
        <small>JPEG、PNG、WebP · 最大 10 MiB</small>
      </div>
      <label className="field">
        <span>选择图片文件</span>
        <input
          type="file"
          accept={
            purpose === 'ICON'
              ? 'image/jpeg,image/png,image/webp,image/svg+xml'
              : 'image/jpeg,image/png,image/webp'
          }
          disabled={busy}
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setResult(null);
            setError(null);
          }}
        />
      </label>
      <label className="field">
        <span>素材替代文本（可选）</span>
        <input
          value={alt}
          maxLength={500}
          disabled={busy}
          onChange={(e) => setAlt(e.target.value)}
        />
      </label>
      <button
        type="button"
        disabled={!file || busy || result !== null}
        onClick={() => {
          void upload();
        }}
      >
        {busy ? '上传中，请稍候…' : error ? '重试上传' : '开始上传'}
      </button>
      {error != null && <ErrorNotice error={error} />}
      {result && (
        <p role="status" className="notice success">
          上传成功：
          {'asset' in result
            ? `素材 #${result.asset.id}`
            : `展示图 #${result.original.id} · 缩略图 #${result.thumbnail.id}`}
          。素材已保留在媒体库；取消编辑后仍可复用或手动删除。
        </p>
      )}
    </div>
  );
}
