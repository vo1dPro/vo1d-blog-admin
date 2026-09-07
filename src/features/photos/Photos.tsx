import type { Photo } from '../../api/types';
import {
  CollectionPage,
  ResourceEditor,
  TitleCell,
  Visibility,
} from '../../components/CollectionPage';
import { Editor } from '../../components/editor';
import { NumberField, Section, TextField, Toggle } from '../../components/fields';
import { formatDate } from '../../lib/values';
import { MediaPicker } from '../media/MediaPicker';
import { Upload } from '../media/Upload';
import { photoInitial, photoSchema } from './model';
export function PhotosPage() {
  return (
    <CollectionPage<Photo>
      resource="photos"
      title="照片"
      description="定格瞬间，为照片补上故事。"
      name={(item) => item.title}
      sortable
      columns={[
        {
          title: '照片',
          render: (item) => (
            <TitleCell title={item.title} subtitle={item.alt} image={item.thumbnail.url} />
          ),
        },
        { title: '拍摄时间', render: (item) => formatDate(item.capturedAt) },
        { title: '排序', render: (item) => item.sortOrder },
        { title: '可见性', render: (item) => <Visibility visible={item.isVisible} /> },
      ]}
    />
  );
}
export function PhotoEditor() {
  return (
    <ResourceEditor<Photo> resource="photos">
      {(item) => (
        <Editor
          key={item?.id ?? 'new'}
          initial={photoInitial(item)}
          schema={photoSchema}
          title={item ? '编辑照片' : '新建照片'}
          endpoint={item ? `/admin/photos/${item.id}` : '/admin/photos'}
          isNew={!item}
          back="/photos"
        >
          {({ value, set }) => (
            <>
              <Section
                title="照片素材"
                description="专用上传会返回两张不同用途的图片；也可以分别复用媒体库素材。"
              >
                <div className="full-width">
                  <Upload
                    purpose="PHOTO"
                    onUploaded={(result) => {
                      if ('original' in result) {
                        set('originalMediaId', result.original.id);
                        set('thumbnailMediaId', result.thumbnail.id);
                      }
                    }}
                  />
                </div>
                <MediaPicker
                  label="展示图"
                  kind="PHOTO_ORIGINAL"
                  value={value.originalMediaId}
                  onChange={(v) => set('originalMediaId', v ?? 0)}
                />
                <MediaPicker
                  label="缩略图"
                  kind="PHOTO_THUMBNAIL"
                  value={value.thumbnailMediaId}
                  onChange={(v) => set('thumbnailMediaId', v ?? 0)}
                />
              </Section>
              <Section title="照片故事">
                <TextField
                  label="照片标题"
                  required
                  value={value.title}
                  onChange={(v) => set('title', v)}
                  maxLength={200}
                />
                <TextField
                  label="替代文本"
                  required
                  value={value.alt}
                  onChange={(v) => set('alt', v)}
                  maxLength={500}
                  hint="描述画面，供屏幕阅读器和图片加载失败时使用。"
                />
                <div className="full-width">
                  <TextField
                    label="描述"
                    multiline
                    value={value.description}
                    onChange={(v) => set('description', v)}
                    maxLength={2000}
                  />
                </div>
                <TextField
                  label="拍摄时间"
                  type="datetime-local"
                  value={value.capturedAt}
                  onChange={(v) => set('capturedAt', v)}
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
