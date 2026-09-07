import type { Tag } from '../../api/types';
import { CollectionPage, ResourceEditor } from '../../components/CollectionPage';
import { Editor } from '../../components/editor';
import { Section, TextField } from '../../components/fields';
import { tagSchema } from './model';
export function TagsPage() {
  return (
    <CollectionPage<Tag>
      resource="tags"
      title="标签"
      description="连接相关主题，按名称排列。"
      name={(item) => item.name}
      deleteMessage="删除标签会移除它与所有文章的关联，文章本身仍保留。确认删除？"
      columns={[
        { title: '标签名称', render: (item) => <strong>{item.name}</strong> },
        { title: 'slug', render: (item) => <code>{item.slug}</code> },
      ]}
    />
  );
}
export function TagEditor() {
  return (
    <ResourceEditor<Tag> resource="tags">
      {(item) => (
        <Editor
          key={item?.id ?? 'new'}
          initial={{ name: item?.name ?? '', slug: item?.slug ?? '' }}
          schema={tagSchema}
          title={item ? '编辑标签' : '新建标签'}
          endpoint={item ? `/admin/tags/${item.id}` : '/admin/tags'}
          isNew={!item}
          back="/tags"
        >
          {({ value, set }) => (
            <Section title="标签信息">
              <TextField
                label="标签名称"
                required
                value={value.name}
                onChange={(v) => set('name', v)}
                maxLength={100}
              />
              <TextField
                label="slug"
                required
                value={value.slug}
                onChange={(v) => set('slug', v)}
                maxLength={100}
              />
            </Section>
          )}
        </Editor>
      )}
    </ResourceEditor>
  );
}
