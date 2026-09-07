import type { Skill, SkillInput } from '../../api/types';
import { CollectionPage, ResourceEditor, Visibility } from '../../components/CollectionPage';
import { Editor } from '../../components/editor';
import { NumberField, Section, TextField, Toggle } from '../../components/fields';
import { UploadedIcon } from '../../components/icons';
import { MediaPicker } from '../media/MediaPicker';
import { skillSchema } from './model';
export function SkillsPage() {
  return (
    <CollectionPage<Skill>
      resource="skills"
      title="技能"
      description="展示正在使用与持续学习的技术。"
      name={(item) => item.name}
      sortable
      columns={[
        {
          title: '技能',
          render: (item) => (
            <div className="title-cell">
              <UploadedIcon icon={item.icon} darkIcon={item.darkIcon} />
              <strong>{item.name}</strong>
            </div>
          ),
        },
        { title: '图标来源', render: (item) => (item.icon || item.darkIcon ? '媒体库' : '未设置') },
        { title: '排序', render: (item) => item.sortOrder },
        { title: '可见性', render: (item) => <Visibility visible={item.isVisible} /> },
      ]}
    />
  );
}
export function SkillEditor() {
  return (
    <ResourceEditor<Skill> resource="skills">
      {(item) => {
        const initial: SkillInput = {
          name: item?.name ?? '',
          iconKey: item?.iconKey ?? 'custom',
          iconMediaId: item?.iconMediaId ?? null,
          darkIconMediaId: item?.darkIconMediaId ?? null,
          sortOrder: item?.sortOrder ?? 0,
          isVisible: item?.isVisible ?? true,
        };
        return (
          <Editor
            key={item?.id ?? 'new'}
            initial={initial}
            schema={skillSchema}
            title={item ? '编辑技能' : '新建技能'}
            endpoint={item ? `/admin/skills/${item.id}` : '/admin/skills'}
            isNew={!item}
            back="/skills"
          >
            {({ value, set }) => (
              <Section title="技能信息">
                <TextField
                  label="技能名称"
                  required
                  value={value.name}
                  onChange={(v) => set('name', v)}
                  maxLength={200}
                />
                <MediaPicker
                  label="浅色背景图标 / 通用"
                  value={value.iconMediaId ?? null}
                  onChange={(v) => set('iconMediaId', v)}
                  nullable
                  iconUpload
                  previewBackground="light"
                />
                <MediaPicker
                  label="深色背景图标（可选）"
                  value={value.darkIconMediaId ?? null}
                  onChange={(v) => set('darkIconMediaId', v)}
                  nullable
                  iconUpload
                  previewBackground="dark"
                />
                <p className="muted full-width">
                  浅色、深色指展示区域的背景，不是图案本身的颜色。深色背景图标未设置时复用通用图标；清空两张图后显示默认图形。支持
                  PNG、WebP、JPEG 和 SVG，上传后保存为图片。
                </p>
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
            )}
          </Editor>
        );
      }}
    </ResourceEditor>
  );
}
