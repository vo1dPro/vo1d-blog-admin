import { BookOpen, Braces, Code2, Folder, Globe, Layers, Server, Shapes } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Field } from './fields';
import { useQuery } from '@tanstack/react-query';
import { loadIconRegistry } from '../api/icon-registry';
import { ErrorNotice } from './feedback';

function useIconRegistry(enabled = true) {
  return useQuery({
    queryKey: ['admin', 'icon-registry'],
    queryFn: ({ signal }) => loadIconRegistry(signal),
    enabled,
  });
}
const categoryIcons: Record<string, LucideIcon> = {
  LayoutGrid: Layers,
  Code: Code2,
  Code2,
  Server,
  BookOpen,
  Globe,
  Braces,
  Folder,
};
export function BusinessIcon({ iconKey }: { iconKey: string | null }) {
  const query = useIconRegistry(Boolean(iconKey && !categoryIcons[iconKey]));
  const pair = iconKey ? query.data?.[iconKey] : undefined;
  const Icon = (iconKey ? categoryIcons[iconKey] : undefined) ?? Shapes;
  if (pair) return <UploadedIcon icon={pair.icon} darkIcon={pair.darkIcon} />;
  if (query.isError && iconKey && !categoryIcons[iconKey]) {
    return <span title="图标加载失败"><Icon size={20} aria-hidden="true" /></span>;
  }
  return <Icon size={20} aria-hidden="true" />;
}
export function IconField({
  value,
  onChange,
  nullable = false,
}: {
  value: string | null;
  onChange: (value: string) => void;
  nullable?: boolean;
}) {
  const query = useIconRegistry();
  return (
    <Field label="图标标识" hint="支持内置分类图标，以及已配置的技能和社交图标；未知标识显示默认图标。">
      <div className="icon-field">
        <BusinessIcon iconKey={value} />
        <input
          aria-label="图标标识"
          value={value ?? ''}
          list="business-icon-keys"
          required={!nullable}
          maxLength={100}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <datalist id="business-icon-keys">
        {[...new Set([...Object.keys(query.data ?? {}), ...Object.keys(categoryIcons)])].map((key) => (
          <option value={key} key={key} />
        ))}
      </datalist>
      {query.isPending && <small>正在加载图标…</small>}
      {query.isError && <ErrorNotice error={query.error} retry={() => void query.refetch()} />}
    </Field>
  );
}

export function UploadedIcon({
  icon,
  darkIcon,
}: {
  icon: { url: string } | null;
  darkIcon: { url: string } | null;
}) {
  const light = icon?.url ?? darkIcon?.url;
  const dark = darkIcon?.url ?? light;
  if (!light) return <Shapes size={20} aria-hidden="true" />;
  return (
    <span className="icon-pair" aria-hidden="true">
      <img className="business-icon icon-light" src={light} alt="" />
      <img className="business-icon icon-dark" src={dark} alt="" />
    </span>
  );
}
