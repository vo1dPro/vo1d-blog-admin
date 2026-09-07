import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useBlocker, useNavigate } from 'react-router';
import type { z } from 'zod';
import { Save, ArrowLeft } from 'lucide-react';
import { changedFields } from '../lib/values';
import { ApiError, request } from '../api/client';
import { refreshContent } from '../api/query';
import { ConfirmDialog, ErrorNotice } from './feedback';

export interface EditorFields<T> {
  value: T;
  set: <K extends keyof T>(key: K, value: T[K]) => void;
}
export function Editor<T extends object>({
  initial,
  schema,
  endpoint,
  isNew = false,
  title,
  back,
  children,
}: {
  initial: T;
  schema: z.ZodType<T, T>;
  endpoint: string;
  isNew?: boolean;
  title: string;
  back: string;
  children: (fields: EditorFields<T>) => ReactNode;
}) {
  const [value, setValue] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const submitting = useRef(false);
  const [issues, setIssues] = useState<string[]>([]);
  const navigate = useNavigate();
  const dirty = JSON.stringify(value) !== JSON.stringify(baseline);
  const blocker = useBlocker(dirty || busy);
  useEffect(() => {
    if (!dirty && !busy) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty, busy]);
  const set: EditorFields<T>['set'] = (key, next) => {
    setValue((current) => ({ ...current, [key]: next }));
    setSaved(false);
  };
  async function save() {
    if (submitting.current) return;
    const result = schema.safeParse(value);
    if (!result.success) {
      setIssues(result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`));
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError(null);
    setIssues([]);
    try {
      const before = schema.safeParse(baseline);
      const body = isNew || !before.success ? result.data : changedFields(before.data, result.data);
      const response = await request<{ id: number }>(endpoint, {
        method: isNew ? 'POST' : 'PATCH',
        json: body,
      });
      await refreshContent();
      setBaseline(value);
      setSaved(true);
      if (isNew) {
        /* Navigation waits for dirty state to commit, without disabling its guard prematurely. */
        setCreatedId(response.id);
      }
    } catch (failure) {
      setError(failure);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  const [createdId, setCreatedId] = useState<number | null>(null);
  useEffect(() => {
    if (createdId !== null && !dirty && !busy)
      void navigate(`${back}/${createdId}`, { replace: true });
  }, [createdId, dirty, busy, back, navigate]);
  return (
    <div className="editor">
      <div className="page-heading">
        <div>
          <button
            className="text-button"
            type="button"
            onClick={() => {
              void navigate(back);
            }}
          >
            <ArrowLeft size={16} />
            返回列表
          </button>
          <h1>{title}</h1>
          <p>整理内容，保存你的下一次更新。</p>
        </div>
        <span className={`badge ${dirty ? 'warm' : ''}`}>
          {busy ? '正在保存' : dirty ? '有未保存更改' : '已与服务端同步'}
        </span>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <fieldset disabled={busy}>{children({ value, set })}</fieldset>
        {issues.length > 0 && (
          <div className="notice error" role="alert">
            <div>
              请检查以下字段：
              <ul>
                {issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {error != null && (
          <>
            <ErrorNotice error={error} />
            {error instanceof ApiError && error.status === 409 && (
              <p className="notice">
                请检查 slug、名称或关联是否重复；输入已保留，修改后可再次保存。
              </p>
            )}
          </>
        )}
        {saved && (
          <p role="status" className="notice success">
            保存成功，管理数据已更新。
          </p>
        )}
        <footer className="save-bar">
          <span>{dirty ? '离开前记得保存更改' : '所有更改已保存'}</span>
          <div className="actions">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                void navigate(back);
              }}
            >
              取消
            </button>
            <button className="primary" type="submit" disabled={busy || (!isNew && !dirty)}>
              <Save size={17} />
              {busy ? '保存中…' : isNew ? '创建并保存' : '保存更改'}
            </button>
          </div>
        </footer>
      </form>
      {blocker.state === 'blocked' && (
        <ConfirmDialog
          title="离开编辑页面？"
          message={
            busy
              ? '正在保存，请等待完成后离开。'
              : '尚有未保存更改，离开后会丢失输入。已上传素材仍保留在媒体库，可复用或手动删除。'
          }
          onCancel={() => blocker.reset()}
          onConfirm={() => blocker.proceed()}
          busy={busy}
        />
      )}
    </div>
  );
}
