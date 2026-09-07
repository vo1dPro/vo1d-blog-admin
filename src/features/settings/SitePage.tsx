import { useQuery } from '@tanstack/react-query';
import { request } from '../../api/client';
import type { SiteInput, SiteProfile } from '../../api/types';
import { Editor } from '../../components/editor';
import { ErrorNotice, Loading } from '../../components/feedback';
import { Section, TextField } from '../../components/fields';
import { MediaPicker } from '../media/MediaPicker';
import { siteSchema } from './model';
export function SitePage() {
  const query = useQuery({
    queryKey: ['admin', 'site-profile'],
    queryFn: ({ signal }) => request<SiteProfile>('/admin/site-profile', { signal }),
  });
  if (query.isPending) return <Loading />;
  if (query.isError)
    return (
      <ErrorNotice
        error={query.error}
        retry={() => {
          void query.refetch();
        }}
      />
    );
  const item = query.data;
  const initial: SiteInput = {
    displayName: item.displayName,
    role: item.role,
    heroTitlePrefix: item.heroTitlePrefix,
    heroDescription: item.heroDescription,
    learningNote: item.learningNote,
    footerMessage: item.footerMessage,
    avatarMediaId: item.avatarMediaId,
  };
  return (
    <Editor
      initial={initial}
      schema={siteSchema}
      title="站点资料"
      endpoint="/admin/site-profile"
      back="/"
    >
      {({ value, set }) => (
        <>
          <Section title="个人资料">
            <TextField
              label="显示名"
              required
              value={value.displayName}
              onChange={(v) => set('displayName', v)}
              maxLength={120}
            />
            <TextField
              label="角色"
              required
              value={value.role}
              onChange={(v) => set('role', v)}
              maxLength={160}
            />
            <MediaPicker
              nullable
              label="头像"
              value={value.avatarMediaId}
              onChange={(v) => set('avatarMediaId', v)}
            />
          </Section>
          <Section title="首页文案">
            <TextField
              label="Hero 标题前缀"
              required
              value={value.heroTitlePrefix}
              onChange={(v) => set('heroTitlePrefix', v)}
              maxLength={160}
            />
            <TextField
              label="介绍"
              required
              multiline
              value={value.heroDescription}
              onChange={(v) => set('heroDescription', v)}
              maxLength={2000}
            />
            <div className="full-width">
              <TextField
                label="学习说明"
                required
                multiline
                value={value.learningNote}
                onChange={(v) => set('learningNote', v)}
                maxLength={4000}
              />
            </div>
            <div className="full-width">
              <TextField
                label="页脚文案"
                required
                multiline
                value={value.footerMessage}
                onChange={(v) => set('footerMessage', v)}
                maxLength={500}
              />
            </div>
          </Section>
        </>
      )}
    </Editor>
  );
}
