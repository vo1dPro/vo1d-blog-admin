import { ChevronLeft, ChevronRight } from 'lucide-react';
export function Pagination({
  page,
  totalPages,
  total,
  onChange,
  disabled = false,
}: {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
  disabled?: boolean;
}) {
  return (
    <nav className="pagination" aria-label="分页">
      <span>
        共 {total} 条 · 第 {page} / {Math.max(1, totalPages)} 页
      </span>
      <div className="actions">
        <button
          type="button"
          aria-label="上一页"
          disabled={disabled || page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={16} />
          上一页
        </button>
        <button
          type="button"
          aria-label="下一页"
          disabled={disabled || page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          下一页
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}
