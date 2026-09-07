import { lazy, Suspense, useState } from 'react';
import type { Article, ArticleInput } from '../../api/types';
import { Editor, type EditorFields } from '../../components/editor';
import { ResourceEditor } from '../../components/CollectionPage';
import { Field, NumberField, Section, TextField } from '../../components/fields';
import { ErrorNotice, Loading } from '../../components/feedback';
import { MediaPicker } from '../media/MediaPicker';
import { useArticleOptions } from './ArticlesPage';
import { articleInitial, articleSchema } from './model';
const MarkdownPreview = lazy(() =>
  import('./MarkdownPreview').then((module) => ({ default: module.MarkdownPreview })),
);
function ArticleFields({ value, set }: EditorFields<ArticleInput>) {
  const { categories, tags } = useArticleOptions();
  const [preview, setPreview] = useState(false);
  const hidden = categories.data?.find((item) => item.id === value.categoryId)?.isVisible === false;
  return (
    <>
      <Section title="文章信息">
        <TextField
          label="标题"
          required
          value={value.title}
          onChange={(v) => set('title', v)}
          maxLength={300}
        />
        <TextField
          label="slug"
          required
          value={value.slug}
          onChange={(v) => set('slug', v)}
          maxLength={200}
          hint="小写英文、数字和连字符，至少包含一个英文字母。"
        />
        <div className="full-width">
          <TextField
            label="摘要"
            required
            multiline
            value={value.summary}
            onChange={(v) => set('summary', v)}
            maxLength={1000}
          />
        </div>
        <MediaPicker
          label="封面"
          value={value.coverMediaId}
          onChange={(v) => set('coverMediaId', v ?? 0)}
        />
        <div>
          {categories.isPending ? (
            <Loading text="正在加载全部分类…" />
          ) : categories.isError ? (
            <ErrorNotice
              error={categories.error}
              retry={() => {
                void categories.refetch();
              }}
            />
          ) : (
            <Field label="分类">
              <select
                required
                value={value.categoryId || ''}
                onChange={(e) => set('categoryId', Number(e.target.value))}
              >
                <option value="">选择分类</option>
                {categories.data.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                    {item.isVisible ? '' : '（隐藏）'}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {hidden && <p className="notice">该分类已隐藏，文章即使发布也不会公开。</p>}
        </div>
        <div className="full-width">
          {tags.isPending ? (
            <Loading text="正在加载全部标签…" />
          ) : tags.isError ? (
            <ErrorNotice
              error={tags.error}
              retry={() => {
                void tags.refetch();
              }}
            />
          ) : (
            <fieldset className="tag-options">
              <legend>标签（可多选）</legend>
              {tags.data.map((item) => (
                <label key={item.id}>
                  <input
                    type="checkbox"
                    checked={value.tagIds.includes(item.id)}
                    onChange={(e) =>
                      set(
                        'tagIds',
                        e.target.checked
                          ? [...value.tagIds, item.id]
                          : value.tagIds.filter((id) => id !== item.id),
                      )
                    }
                  />
                  {item.name}
                </label>
              ))}
              {tags.data.length === 0 && <p className="muted">尚无标签，可先在标签管理中创建。</p>}
            </fieldset>
          )}
        </div>
      </Section>
      <Section title="正文" description="Markdown 是文章源格式。">
        <div className="full-width">
          <div className="segmented">
            <button type="button" aria-pressed={!preview} onClick={() => setPreview(false)}>
              编辑
            </button>
            <button type="button" aria-pressed={preview} onClick={() => setPreview(true)}>
              安全预览
            </button>
          </div>
          {preview ? (
            <Suspense fallback={<Loading text="加载预览…" />}>
              <MarkdownPreview source={value.bodyMarkdown} />
            </Suspense>
          ) : (
            <label className="field">
              <span className="sr-only">Markdown 正文</span>
              <textarea
                className="markdown-input"
                required
                maxLength={1000000}
                value={value.bodyMarkdown}
                onChange={(e) => set('bodyMarkdown', e.target.value)}
                placeholder="# 写下你的想法"
              />
            </label>
          )}
        </div>
      </Section>
      <Section title="发布设置">
        <Field label="文章状态">
          <select
            value={value.status}
            onChange={(e) => {
              const status = e.target.value;
              if (status === 'DRAFT' || status === 'PUBLISHED' || status === 'ARCHIVED')
                set('status', status);
            }}
          >
            <option value="DRAFT">草稿</option>
            <option value="PUBLISHED">发布</option>
            <option value="ARCHIVED">归档</option>
          </select>
        </Field>
        <TextField
          label="发布时间"
          type="datetime-local"
          value={value.publishedAt}
          onChange={(v) => set('publishedAt', v)}
          hint="按本机时区输入；未来时间表示定时公开。"
        />
        <NumberField
          label="阅读时间（分钟）"
          min={1}
          max={1440}
          value={value.readingTimeMinutes}
          onChange={(v) => set('readingTimeMinutes', v)}
        />
        {value.status === 'PUBLISHED' &&
          value.publishedAt &&
          new Date(value.publishedAt).getTime() > Date.now() && (
            <p className="notice">定时公开：到达发布时间且分类可见时公开。</p>
          )}
      </Section>
      <Section title="搜索引擎优化">
        <TextField
          label="SEO 标题"
          value={value.seoTitle}
          onChange={(v) => set('seoTitle', v)}
          maxLength={300}
        />
        <TextField
          label="SEO 描述"
          multiline
          value={value.seoDescription}
          onChange={(v) => set('seoDescription', v)}
          maxLength={1000}
        />
      </Section>
    </>
  );
}
export function ArticleEditor() {
  return (
    <ResourceEditor<Article> resource="articles">
      {(item) => (
        <Editor
          key={item?.id ?? 'new'}
          initial={articleInitial(item)}
          schema={articleSchema}
          title={item ? '编辑文章' : '新建文章'}
          endpoint={item ? `/admin/articles/${item.id}` : '/admin/articles'}
          isNew={!item}
          back="/articles"
        >
          {(fields) => <ArticleFields {...fields} />}
        </Editor>
      )}
    </ResourceEditor>
  );
}
