import { useEffect, useId, useRef, type ReactNode } from 'react';
import { AlertCircle, LoaderCircle, X, Inbox } from 'lucide-react';
import { describeError } from '../api/client';

export function Loading({ text = '正在加载…' }: { text?: string }) {
  return (
    <div className="state" role="status">
      <LoaderCircle className="spin" size={22} />
      <span>{text}</span>
    </div>
  );
}
export function ErrorNotice({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <div className="notice error" role="alert">
      <AlertCircle size={18} />
      <div>{describeError(error)}</div>
      {retry && (
        <button type="button" onClick={retry}>
          重试
        </button>
      )}
    </div>
  );
}
export function Empty({ text = '还没有内容', children }: { text?: string; children?: ReactNode }) {
  return (
    <div className="state empty">
      <Inbox size={32} />
      <strong>{text}</strong>
      {children}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  busy = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const active = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (active instanceof HTMLElement) active.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <header className="dialog-heading">
        <h2 id={titleId}>{title}</h2>
        <button type="button" aria-label="关闭弹窗" disabled={busy} onClick={onClose}>
          <X size={18} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function ConfirmDialog({
  title,
  message,
  onCancel,
  onConfirm,
  busy,
  error,
}: {
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
  error?: unknown;
}) {
  return (
    <Modal title={title} onClose={onCancel} busy={busy}>
      <p>{message}</p>
      {error != null && <ErrorNotice error={error} />}
      <div className="actions">
        <button type="button" disabled={busy} onClick={onCancel} autoFocus>
          取消
        </button>
        <button type="button" className="danger" disabled={busy} onClick={onConfirm}>
          {busy ? '处理中…' : '确认'}
        </button>
      </div>
    </Modal>
  );
}
