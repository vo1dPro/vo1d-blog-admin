import { useEffect, useRef, useState } from 'react';
import type { PointerEvent, SetStateAction } from 'react';
import type { Creation } from './model';
import type { CreationRow } from './row';
import type { LayoutConfig, LayoutEntry } from './layout';
import { request as api, listPath, type Page } from '../../api/client';
import { parseCreationFeed } from './parse';
import { useBlocker } from 'react-router';
import { EditorCard } from './EditorCard';
import { useQueryClient } from '@tanstack/react-query';
import './cards.css';
import './workbench.css';

const keyOf = (post: Creation) => `${post.platform}:${post.id}`;
const defaults = (post: Creation): LayoutEntry => ({
  id: keyOf(post),
  span: post.article ? 2 : 1,
  height: null,
  categoryIds: [],
});
async function readFeed() {
  const first = await api<Page<CreationRow>>(listPath('/admin/creations', 1, 50));
  const rows = [...first.items];
  for (let page = 2; page <= first.totalPages; page++) {
    const next = await api<Page<CreationRow>>(listPath('/admin/creations', page, 50));
    if (next.total !== first.total) throw new Error('动态发生变化，请重新加载');
    rows.push(...next.items);
  }
  const feed = parseCreationFeed({
    version: 1,
    mode: 'live',
    updatedAt: new Date().toISOString(),
    items: rows.map((row) => row.payload),
  });
  return { items: feed.items, rows };
}
const errorText = (error: unknown) => (error instanceof Error ? error.message : '操作失败');
export function CreationsPage() {
  const queryClient = useQueryClient();
  const [posts, setPosts] = useState<Creation[]>([]),
    [draft, setDraft] = useState<LayoutConfig>({ revision: 0, categories: [], entries: [] }),
    [saved, setSaved] = useState<LayoutConfig>({ revision: 0, categories: [], entries: [] });
  const [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [saving, setSaving] = useState(false);
  const [name, setName] = useState(''),
    [filter, setFilter] = useState('all'),
    [selected, setSelected] = useState('');
  const [preview, setPreview] = useState(false),
    [phone, setPhone] = useState(false),
    [dropTarget, setDropTarget] = useState('');
  const [loaded, setLoaded] = useState(false),
    [url, setUrl] = useState(''),
    [importing, setImporting] = useState(false);
  const [rows, setRows] = useState<CreationRow[]>([]);
  const board = useRef<HTMLDivElement>(null),
    gesture = useRef<{
      type: 'drag' | 'resize';
      id: string;
      target?: string;
      x: number;
      y: number;
      span?: number;
      height?: number;
      unit?: number;
    } | null>(null);
  const dirty = draft && saved && JSON.stringify(draft) !== JSON.stringify(saved);
  const blocker = useBlocker(Boolean(dirty));
  async function importPost() {
    setImporting(true);
    setError('');
    try {
      const row = await api<CreationRow>('/admin/creations/import-x', {
        method: 'POST',
        json: { url: url.trim() },
      });
      const post = parseCreationFeed({
        version: 1,
        mode: 'live',
        updatedAt: new Date().toISOString(),
        items: [row.payload],
      }).items[0];
      if (!post) throw new Error('推文格式无效');
      setPosts((items) => [post, ...items.filter((p) => keyOf(p) !== keyOf(post))]);
      setRows((items) => [row, ...items.filter((p) => p.id !== row.id)]);
      setDraft((d) => ({
        ...d,
        entries: d.entries.some((e) => e.id === keyOf(post))
          ? d.entries
          : [defaults(post), ...d.entries],
      }));
      setSelected(keyOf(post));
      setFilter('all');
      setUrl('');
      setNotice('推文已导入。分类和布局调整后请点击保存布局。');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'creations'] });
    } catch (error) {
      setError(errorText(error));
    } finally {
      setImporting(false);
    }
  }
  async function deletePost() {
    const row = rows.find((r) => `${r.platform}:${r.payload.id}` === selected);
    if (!row || !confirm('从网站删除这条动态？不会删除 X 原文，但将阻止再次导入。')) return;
    setImporting(true);
    setError('');
    try {
      await api(`/admin/creations/${row.id}`, { method: 'DELETE' });
      setPosts((p) => p.filter((v) => keyOf(v) !== selected));
      setRows((r) => r.filter((v) => v.id !== row.id));
      setDraft((d) => ({ ...d, entries: d.entries.filter((e) => e.id !== selected) }));
      setSaved((d) => ({ ...d, entries: d.entries.filter((e) => e.id !== selected) }));
      setSelected('');
      setNotice('动态已删除');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'creations'] });
    } catch (error) {
      setError(errorText(error));
    } finally {
      setImporting(false);
    }
  }
  async function load() {
    try {
      setError('');
      const [feed, layout] = await Promise.all([
        readFeed(),
        api<LayoutConfig>('/admin/creations/layout'),
      ]);
      const current = new Set(feed.items.map(keyOf));
      const entries = layout.entries.filter((entry) => current.has(entry.id));
      const known = new Set(entries.map((entry) => entry.id));
      entries.push(...feed.items.filter((post) => !known.has(keyOf(post))).map(defaults));
      const merged = { ...layout, entries };
      setPosts(feed.items);
      setRows(feed.rows);
      setLoaded(true);
      setDraft(merged);
      setSaved(merged);
      setSelected(entries[0]?.id ?? '');
    } catch (error) {
      setError(errorText(error));
    }
  }
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  function change(fn: SetStateAction<LayoutConfig>) {
    setDraft(fn);
    setNotice('');
  }
  function update(id: string, values: Partial<LayoutEntry>) {
    change((d) => ({
      ...d,
      entries: d.entries.map((entry) => (entry.id === id ? { ...entry, ...values } : entry)),
    }));
  }
  function reorder(id: string, target?: string) {
    if (!target || id === target) return;
    change((d) => {
      const entries = [...d.entries],
        from = entries.findIndex((e) => e.id === id),
        to = entries.findIndex((e) => e.id === target);
      if (from < 0 || to < 0) return d;
      const moved = entries.splice(from, 1)[0];
      if (moved) entries.splice(to, 0, moved);
      return { ...d, entries };
    });
    setNotice('顺序已调整，保存后生效');
  }
  function drag(event: PointerEvent<HTMLButtonElement>, id: string) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelected(id);
    gesture.current = { type: 'drag', id, target: '', x: event.clientX, y: event.clientY };
  }
  function resize(event: PointerEvent<HTMLButtonElement>, id: string, node: HTMLElement | null) {
    if (!node || !board.current) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelected(id);
    gesture.current = {
      type: 'resize',
      id,
      x: event.clientX,
      y: event.clientY,
      height: node.clientHeight,
      span: draft.entries.find((e) => e.id === id)?.span ?? 1,
      unit: (board.current.clientWidth + 16) / 3,
    };
  }
  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (!g) return;
    if (g.type === 'resize')
      update(g.id, {
        span: Math.max(
          1,
          Math.min(3, (g.span ?? 1) + Math.round((event.clientX - g.x) / (g.unit ?? 1))),
        ),
        height: Math.max(180, Math.min(1000, Math.round((g.height ?? 400) + event.clientY - g.y))),
      });
    else {
      const target = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>('[data-cardid]')?.dataset.cardid;
      g.target = target && target !== g.id ? target : '';
      setDropTarget(g.target);
      if (event.clientY > innerHeight - 70) window.scrollBy(0, 18);
      if (event.clientY < 90) window.scrollBy(0, -18);
    }
  }
  function pointerEnd() {
    const g = gesture.current;
    if (g?.type === 'drag') reorder(g.id, g.target);
    gesture.current = null;
    setDropTarget('');
  }
  async function save() {
    setSaving(true);
    setError('');
    try {
      const result = await api<LayoutConfig>('/admin/creations/layout', {
        method: 'PUT',
        json: draft,
      });
      setDraft(result);
      setSaved(result);
      setNotice('已保存，访客页面刷新后生效');
    } catch (error) {
      setError(errorText(error));
    } finally {
      setSaving(false);
    }
  }
  function categoryNameValid(value: string, except?: string) {
    if (!value.trim() || value.trim().length > 30) {
      setError('分类名称需为 1–30 个字符');
      return false;
    }
    if (
      draft.categories.some(
        (c) => c.id !== except && c.name.toLowerCase() === value.trim().toLowerCase(),
      )
    ) {
      setError('这个分类已经存在');
      return false;
    }
    setError('');
    return true;
  }
  const entry = draft?.entries.find((e) => e.id === selected);
  const selectedPost = posts.find((p) => keyOf(p) === selected);
  const visible =
    draft?.entries.filter(
      (e) =>
        filter === 'all' ||
        (filter === 'none' ? !e.categoryIds.length : e.categoryIds.includes(filter)),
    ) ?? [];
  return (
    <div className="creation-workbench">
      <div
        className="ce-workspace"
        onPointerMove={pointerMove}
        onPointerUp={pointerEnd}
        onPointerCancel={() => {
          gesture.current = null;
          setDropTarget('');
        }}
      >
        <header className="topbar">
          <div>
            <h1>
              创作动态 <span>布局工作台</span>
            </h1>
          </div>
          <div className="top-actions">
            <span className="save-state">{dirty ? '有未保存的修改' : '已保存'}</span>
            <button onClick={() => setPreview(!preview)}>
              {preview ? '返回编辑' : '预览布局'}
            </button>
            <button className="primary" disabled={!dirty || saving || importing} onClick={save}>
              {saving ? '保存中…' : '保存布局'}
            </button>
          </div>
        </header>
        <form
          className="import-form"
          onSubmit={(event) => {
            event.preventDefault();
            void importPost();
          }}
        >
          <label htmlFor="creation-source">推文链接</label>
          <div className="form-row">
            <input
              id="creation-source"
              type="url"
              required
              maxLength={500}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://x.com/vo1dZzz/status/…"
              disabled={importing || saving}
            />
            <button className="primary" disabled={importing || saving || !loaded}>
              {importing ? '导入中…' : '导入推文'}
            </button>
          </div>
          <p>粘贴本人推文链接，在这里导入、分类和调整布局。</p>
        </form>
        {blocker.state === 'blocked' && (
          <div className="message error" role="alert">
            布局尚未保存，确定离开？<button onClick={() => blocker.proceed()}>放弃并离开</button>
            <button onClick={() => blocker.reset()}>继续编辑</button>
          </div>
        )}
        {error && (
          <div className="message error" role="alert">
            {error}
            {!loaded && <button onClick={load}>重新加载</button>}
          </div>
        )}
        {notice && (
          <div className="message" role="status">
            {notice}
          </div>
        )}
        {!loaded ? (
          <p className="loading">
            {error ? '请确认本地接口服务已启动。' : '正在读取动态与已保存布局…'}
          </p>
        ) : (
          <fieldset disabled={saving || importing} className="workspace-body">
            {!preview && (
              <aside>
                <section className="panel">
                  <div className="section-label">01 / 内容分类</div>
                  <h2>先建分类，再归类</h2>
                  <p className="hint">一条推文可以属于多个分类。</p>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (!categoryNameValid(name)) return;
                      change((d) => ({
                        ...d,
                        categories: [
                          ...d.categories,
                          { id: crypto.randomUUID(), name: name.trim() },
                        ],
                      }));
                      setName('');
                    }}
                  >
                    <label htmlFor="new-category">新分类名称</label>
                    <div className="form-row">
                      <input
                        id="new-category"
                        value={name}
                        maxLength={30}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="例如：技术 / 生活"
                      />
                      <button type="submit" className="primary">
                        添加
                      </button>
                    </div>
                  </form>
                  {!draft.categories.length && (
                    <p className="empty-hint">还没有分类，先添加一个吧。</p>
                  )}
                  <div className="category-list">
                    {draft.categories.map((category) => (
                      <div className="category-row" key={category.id}>
                        <span>{category.name}</span>
                        <small>
                          {draft.entries.filter((e) => e.categoryIds.includes(category.id)).length}
                        </small>
                        <button
                          aria-label={`重命名 ${category.name}`}
                          onClick={() => {
                            const value = prompt('分类名称', category.name);
                            if (value !== null && categoryNameValid(value, category.id))
                              change((d) => ({
                                ...d,
                                categories: d.categories.map((c) =>
                                  c.id === category.id ? { ...c, name: value.trim() } : c,
                                ),
                              }));
                          }}
                        >
                          改名
                        </button>
                        <button
                          aria-label={`删除分类 ${category.name}`}
                          onClick={() => {
                            if (!confirm(`删除“${category.name}”？推文会保留，只解除该分类关系。`))
                              return;
                            change((d) => ({
                              ...d,
                              categories: d.categories.filter((c) => c.id !== category.id),
                              entries: d.entries.map((e) => ({
                                ...e,
                                categoryIds: e.categoryIds.filter((id) => id !== category.id),
                              })),
                            }));
                            if (filter === category.id) setFilter('all');
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="panel">
                  <div className="section-label">02 / 当前卡片</div>
                  <h2>尺寸与归属</h2>
                  {entry && selectedPost ? (
                    <>
                      <p className="selection-excerpt">
                        {selectedPost.body
                          .map((p) => p.text)
                          .join('')
                          .slice(0, 90)}
                      </p>
                      <label>卡片宽度</label>
                      <div className="segmented">
                        {[1, 2, 3].map((span) => (
                          <button
                            key={span}
                            aria-pressed={entry.span === span}
                            onClick={() => update(entry.id, { span })}
                          >
                            {['标准', '宽幅', '通栏'][span - 1]}
                          </button>
                        ))}
                      </div>
                      <label htmlFor="card-height">
                        卡片高度 {entry.height ? `${entry.height}px` : '自适应'}
                      </label>
                      <input
                        id="card-height"
                        type="range"
                        min="180"
                        max="1000"
                        step="10"
                        value={entry.height ?? 400}
                        onChange={(e) => update(entry.id, { height: Number(e.target.value) })}
                      />
                      <button
                        className="text-button"
                        onClick={() => update(entry.id, { height: null })}
                      >
                        恢复自适应高度
                      </button>
                      <button className="text-button" onClick={() => void deletePost()}>
                        删除这条动态
                      </button>
                      <label>所属分类</label>
                      {draft.categories.length ? (
                        <div className="assignment">
                          {draft.categories.map((c) => (
                            <label key={c.id}>
                              <input
                                type="checkbox"
                                checked={entry.categoryIds.includes(c.id)}
                                onChange={(e) =>
                                  update(entry.id, {
                                    categoryIds: e.target.checked
                                      ? [...entry.categoryIds, c.id]
                                      : entry.categoryIds.filter((id) => id !== c.id),
                                  })
                                }
                              />
                              {c.name}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="empty-hint">请先在上方创建分类。</p>
                      )}
                    </>
                  ) : (
                    <p>选择一张卡片开始编辑。</p>
                  )}
                </section>
                <button
                  className="discard"
                  disabled={!dirty}
                  onClick={() => {
                    if (confirm('放弃所有未保存的修改？')) {
                      setDraft(structuredClone(saved));
                      setFilter('all');
                      setError('');
                      setNotice('已恢复上次保存');
                    }
                  }}
                >
                  放弃未保存修改
                </button>
              </aside>
            )}
            <main>
              <div className="canvas-heading">
                <div>
                  <h2>{preview ? '访客布局预览' : '把内容摆到合适的位置'}</h2>
                  <p>
                    {preview
                      ? '分类共享一套顺序和尺寸；手机端自动单列。'
                      : '拖动 ⠿ 排序，拖右下角 ↘ 调整大小。也可用箭头按钮和方向键。'}
                  </p>
                </div>
                <button aria-pressed={phone} onClick={() => setPhone(!phone)}>
                  {phone ? '切回桌面' : '手机预览'}
                </button>
              </div>
              <nav className="filters" aria-label="分类筛选">
                {[
                  { id: 'all', name: '全部' },
                  { id: 'none', name: '未分类' },
                  ...draft.categories,
                ].map((c) => (
                  <button key={c.id} aria-pressed={filter === c.id} onClick={() => setFilter(c.id)}>
                    {c.name}
                  </button>
                ))}
                <span>{visible.length} 条动态</span>
              </nav>
              {!visible.length && (
                <div className="empty-canvas">
                  {posts.length
                    ? '此分类下还没有推文。选择「全部」后给卡片分配分类。'
                    : '本地还没有动态，请先在正式后台导入。'}
                </div>
              )}
              <div
                ref={board}
                className={`layout-board ${phone ? 'phone' : ''} ${preview ? 'preview' : ''}`}
              >
                {visible.map((item, index) => (
                  <EditorCard
                    key={item.id}
                    post={posts.find((p) => keyOf(p) === item.id)!}
                    entry={item}
                    editing={!preview}
                    selected={item.id === selected}
                    select={setSelected}
                    dropTarget={dropTarget === item.id}
                    drag={drag}
                    resize={resize}
                    update={update}
                    first={index === 0}
                    last={index === visible.length - 1}
                    move={(id, delta) => reorder(id, visible[index + delta]?.id)}
                  />
                ))}
              </div>
            </main>
          </fieldset>
        )}
      </div>
    </div>
  );
}
