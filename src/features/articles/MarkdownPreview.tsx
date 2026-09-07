import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
export function MarkdownPreview({ source }: { source: string }) {
  return (
    <div className="markdown-preview">
      <p className="notice">编辑预览 · 原始 HTML 已关闭，最终公开排版以博客展示端为准。</p>
      <article className="prose" data-testid="markdown-preview">
        <Markdown
          skipHtml
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ children, href }) => (
              <a href={href} target="_blank" rel="noreferrer noopener">
                {children}
              </a>
            ),
            img: ({ src, alt }) => <img src={src} alt={alt ?? ''} loading="lazy" />,
          }}
        >
          {source}
        </Markdown>
      </article>
    </div>
  );
}
