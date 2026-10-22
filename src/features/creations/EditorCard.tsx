import { useLayoutEffect, useRef } from 'react';
import type { PointerEvent } from 'react';
import type { Creation } from './model';
import type { LayoutEntry } from './layout';
import { CreationContent, CreationActions } from './Card';
interface CardProps {
  post: Creation;
  entry: LayoutEntry;
  selected: boolean;
  editing: boolean;
  dropTarget: boolean;
  first: boolean;
  last: boolean;
  select: (id: string) => void;
  resize: (event: PointerEvent<HTMLButtonElement>, id: string, node: HTMLElement | null) => void;
  drag: (event: PointerEvent<HTMLButtonElement>, id: string) => void;
  move: (id: string, delta: number) => void;
  update: (id: string, values: Partial<LayoutEntry>) => void;
}
export function EditorCard({
  post,
  entry,
  selected,
  editing,
  dropTarget,
  select,
  resize,
  drag,
  move,
  update,
  first,
  last,
}: CardProps) {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => {
      node.style.gridRowEnd = `span ${Math.ceil(node.getBoundingClientRect().height + 16)}`;
    };
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    measure();
    return () => observer.disconnect();
  }, []);
  return (
    <article
      ref={ref}
      data-cardid={entry.id}
      data-span={entry.span}
      className={`editor-card ${selected && editing ? 'selected' : ''} ${dropTarget ? 'drop-target' : ''}`}
      style={{ gridColumn: `span ${entry.span}`, height: entry.height ?? 'auto' }}
    >
      {editing && (
        <div className="card-tools">
          <button
            className="drag-handle"
            aria-label="拖动排序"
            title="拖动排序"
            onPointerDown={(event) => drag(event, entry.id)}
          >
            ⠿
          </button>
          <button className="select-card" aria-pressed={selected} onClick={() => select(entry.id)}>
            编辑卡片
          </button>
          <button aria-label="前移" disabled={first} onClick={() => move(entry.id, -1)}>
            ↑
          </button>
          <button aria-label="后移" disabled={last} onClick={() => move(entry.id, 1)}>
            ↓
          </button>
        </div>
      )}
      <div className="card-scroll">
        <CreationContent post={post} />
        <CreationActions post={post} />
      </div>
      {editing && (
        <div className="card-bottom">
          <span>
            {entry.span === 1 ? '标准' : entry.span === 2 ? '宽幅' : '通栏'} ·{' '}
            {entry.height ? `${entry.height}px` : '自适应高度'}
          </span>
          <button
            className="resize-handle"
            aria-label="调整卡片大小"
            title="拖动改变大小；键盘方向键调整，双击恢复高度"
            onPointerDown={(event) => resize(event, entry.id, ref.current)}
            onDoubleClick={() => update(entry.id, { height: null })}
            onKeyDown={(event) => {
              if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
              event.preventDefault();
              if (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
                update(entry.id, {
                  span: Math.max(1, Math.min(3, entry.span + (event.key === 'ArrowLeft' ? -1 : 1))),
                });
              else
                update(entry.id, {
                  height: Math.max(
                    180,
                    Math.min(
                      1000,
                      (entry.height ?? ref.current?.clientHeight ?? 400) +
                        (event.key === 'ArrowUp' ? -40 : 40),
                    ),
                  ),
                });
            }}
          >
            ↘
          </button>
        </div>
      )}
    </article>
  );
}

