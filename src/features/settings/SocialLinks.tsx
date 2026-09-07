import type { SocialInput, SocialLink } from '../../api/types';
import { CollectionPage, ResourceEditor, Visibility } from '../../components/CollectionPage';
import { Editor } from '../../components/editor';
import { NumberField, Section, TextField, Toggle } from '../../components/fields';
import { UploadedIcon } from '../../components/icons';
import { MediaPicker } from '../media/MediaPicker';
import { socialSchema } from './model';
export function SocialLinksPage() {
  return (
    <CollectionPage<SocialLink>
      resource="social-links"
      title="社交链接"
      description="保持连接，管理你的公开主页。"
      name={(item) => item.name}
      sortable
      columns={[
        {
          title: '名称',
          render: (item) => (
            <div className="title-cell">
              <UploadedIcon icon={item.icon} darkIcon={item.darkIcon} />
              <strong>{item.name}</strong>
            </div>
          ),
        },
        { title: '链接', render: (item) => <span className="truncate">{item.url}</span> },
        { title: '平台', render: (item) => item.platform },
        { title: '可见性', render: (item) => <Visibility visible={item.isVisible} /> },
      ]}
    />
  );
}
export function SocialEditor() {
  return (
    <ResourceEditor<SocialLink> resource="social-links">
      {(item) => {
        const initial: SocialInput = {
          name: item?.name ?? '',
          platform: item?.platform ?? '',
          url: item?.url ?? '',
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
            schema={socialSchema}
            title={item ? '编辑社交链接' : '新建社交链接'}
            endpoint={item ? `/admin/social-links/${item.id}` : '/admin/social-links'}
            isNew={!item}
            back="/social-links"
          >
            {({ value, set }) => (
              <Section title="社交信息">
                <TextField
                  label="名称"
                  required
                  value={value.name}
                  onChange={(v) => set('name', v)}
                  maxLength={200}
                />
                <TextField
                  label="平台标识"
                  required
                  value={value.platform}
                  onChange={(v) => set('platform', v)}
                  maxLength={100}
                />
                <TextField
                  label="链接地址"
                  type="url"
                  required
                  value={value.url}
                  onChange={(v) => set('url', v)}
                  maxLength={2048}
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
