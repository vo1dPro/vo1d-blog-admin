import type { Book } from '../../api/types';
import {
  CollectionPage,
  ResourceEditor,
  TitleCell,
  Visibility,
} from '../../components/CollectionPage';
import { Editor } from '../../components/editor';
import { NumberField, Section, TextField, Toggle } from '../../components/fields';
import { MediaPicker } from '../media/MediaPicker';
import { bookInitial, bookSchema } from './model';
export function BooksPage() {
  return (
    <CollectionPage<Book>
      resource="books"
      title="书籍"
      description="阅读中的思考，书架上的积累。"
      name={(item) => item.title}
      sortable
      columns={[
        {
          title: '书籍',
          render: (item) => (
            <TitleCell title={item.title} subtitle={item.author} image={item.cover.url} />
          ),
        },
        {
          title: '阅读进度',
          render: (item) => (
            <div className="progress-cell">
              <progress value={item.progress} max={100} />
              {item.progress}%
            </div>
          ),
        },
        { title: '阅读顺序', render: (item) => item.readingOrder },
        { title: '可见性', render: (item) => <Visibility visible={item.isVisible} /> },
      ]}
    />
  );
}
export function BookEditor() {
  return (
    <ResourceEditor<Book> resource="books">
      {(item) => (
        <Editor
          key={item?.id ?? 'new'}
          initial={bookInitial(item)}
          schema={bookSchema}
          title={item ? '编辑书籍' : '新建书籍'}
          endpoint={item ? `/admin/books/${item.id}` : '/admin/books'}
          isNew={!item}
          back="/books"
        >
          {({ value, set }) => (
            <>
              <Section title="书籍信息">
                <TextField
                  label="书名"
                  required
                  value={value.title}
                  onChange={(v) => set('title', v)}
                  maxLength={200}
                />
                <TextField
                  label="作者"
                  required
                  value={value.author}
                  onChange={(v) => set('author', v)}
                  maxLength={200}
                />
                <MediaPicker
                  label="封面"
                  value={value.coverMediaId}
                  onChange={(v) => set('coverMediaId', v ?? 0)}
                />
                <TextField
                  label="强调色"
                  value={value.accent}
                  onChange={(v) => set('accent', v)}
                  hint="例如 #007aff"
                />
                <TextField
                  label="来源名称"
                  value={value.sourceName}
                  onChange={(v) => set('sourceName', v)}
                  maxLength={100}
                />
                <TextField
                  label="来源地址"
                  type="url"
                  value={value.sourceUrl}
                  onChange={(v) => set('sourceUrl', v)}
                  hint="没有来源时留空，不填 xx 或 #。"
                />
              </Section>
              <Section title="阅读记录">
                <NumberField
                  label="阅读进度（%）"
                  value={value.progress}
                  onChange={(v) => set('progress', v)}
                  max={100}
                />
                <NumberField
                  label="阅读顺序"
                  value={value.readingOrder}
                  onChange={(v) => set('readingOrder', v)}
                  min={1}
                />
                <TextField
                  label="开始阅读"
                  type="datetime-local"
                  value={value.startedAt}
                  onChange={(v) => set('startedAt', v)}
                />
                <TextField
                  label="最近阅读"
                  type="datetime-local"
                  value={value.lastReadAt}
                  onChange={(v) => set('lastReadAt', v)}
                />
                <TextField
                  label="完成阅读"
                  type="datetime-local"
                  value={value.finishedAt}
                  onChange={(v) => set('finishedAt', v)}
                />
              </Section>
              <Section title="展示设置">
                <NumberField
                  label="排序值"
                  value={value.sortOrder}
                  onChange={(v) => set('sortOrder', v)}
                />
                <Toggle
                  label="公开展示"
                  checked={value.isVisible}
                  onChange={(v) => set('isVisible', v)}
                />
              </Section>
            </>
          )}
        </Editor>
      )}
    </ResourceEditor>
  );
}
