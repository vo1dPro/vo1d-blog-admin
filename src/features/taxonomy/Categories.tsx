import type { Category, CategoryInput } from '../../api/types';
import { CollectionPage, ResourceEditor, Visibility } from '../../components/CollectionPage';
import { Editor } from '../../components/editor';
import { NumberField, Section, TextField, Toggle } from '../../components/fields';
import { BusinessIcon, IconField } from '../../components/icons';
import { categorySchema } from './model';
export function CategoriesPage() {
  return (
    <CollectionPage<Category>
      resource="categories"
      title="分类"
      description="为内容建立清晰的分类。隐藏分类也会隐藏其文章。"
      name={(item) => item.label}
      sortable
      deleteMessage="若分类仍被文章引用，删除会失败；请先将关联文章迁移到其他分类。"
      columns={[
        {
          title: '分类名称',
          render: (item) => (
            <div className="title-cell">
              <BusinessIcon iconKey={item.iconKey} />
              <strong>{item.label}</strong>
            </div>
          ),
        },
        { title: '标识', render: (item) => <code>{item.key}</code> },
        { title: '排序', render: (item) => item.sortOrder },
        { title: '可见性', render: (item) => <Visibility visible={item.isVisible} /> },
      ]}
    />
  );
}
export function CategoryEditor() {
  return (
    <ResourceEditor<Category> resource="categories">
      {(item) => {
        const initial: CategoryInput = {
          key: item?.key ?? '',
          label: item?.label ?? '',
          iconKey: item?.iconKey ?? null,
          sortOrder: item?.sortOrder ?? 0,
          isVisible: item?.isVisible ?? true,
        };
        return (
          <Editor
            key={item?.id ?? 'new'}
            initial={initial}
            schema={categorySchema}
            title={item ? '编辑分类' : '新建分类'}
            endpoint={item ? `/admin/categories/${item.id}` : '/admin/categories'}
            isNew={!item}
            back="/categories"
          >
            {({ value, set }) => (
              <Section title="分类设置">
                <TextField
                  label="分类名称"
                  required
                  value={value.label}
                  onChange={(v) => set('label', v)}
                  maxLength={200}
                />
                <TextField
                  label="分类标识"
                  required
                  value={value.key}
                  onChange={(v) => set('key', v)}
                  maxLength={100}
                />
                <IconField nullable value={value.iconKey} onChange={(v) => set('iconKey', v)} />
                <NumberField
                  label="排序值"
                  value={value.sortOrder}
                  onChange={(v) => set('sortOrder', v)}
                />
                <Toggle
                  label="公开展示分类及其已发布文章"
                  checked={value.isVisible}
                  onChange={(v) => set('isVisible', v)}
                />
                {!value.isVisible && (
                  <p className="notice">隐藏分类后，该分类下所有文章均不会公开。</p>
                )}
              </Section>
            )}
          </Editor>
        );
      }}
    </ResourceEditor>
  );
}
