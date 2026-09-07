import { BookOpen, Braces, Code2, Folder, Globe, Layers, Server, Shapes } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Field } from './fields';
const localIcons: Record<string, string> = {
  typescript: 'typescript',
  javascript: 'javascript',
  react: 'react-light',
  vite: 'vite',
  nodejs: 'nodejs',
  html: 'html5',
  html5: 'html5',
  css: 'css-old',
  'css-old': 'css-old',
  python: 'python',
  java: 'java',
  c: 'c',
  'c-plusplus': 'c-plusplus',
  vue: 'vue',
  'three-js': 'three-js-light',
  git: 'git',
  github: 'github-light',
  vscode: 'vscode',
  mysql: 'mysql-light',
  postgresql: 'postgresql',
  redis: 'redis',
  markdown: 'markdown-light',
  'ant-design': 'ant-design-dark-theme',
  'ant-design-dark-theme': 'ant-design-dark-theme',
  codex: 'codex-light',
  claude: 'claude-ai',
  'claude-ai': 'claude-ai',
  chrome: 'chrome',
  'x-formerly-twitter': 'x-formerly-twitter-light',
  tiktok: 'tiktok-light',
};
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
  const asset = iconKey ? localIcons[iconKey] : undefined;
  const Icon = (iconKey ? categoryIcons[iconKey] : undefined) ?? Shapes;
  return asset?.endsWith('-light') ? (
    <span className="icon-pair" aria-hidden="true">
      <img className="business-icon icon-light" src={`/icons/${asset}.svg`} alt="" />
      <img
        className="business-icon icon-dark"
        src={`/icons/${asset.replace(/-light$/, '-dark')}.svg`}
        alt=""
      />
    </span>
  ) : asset ? (
    <img className="business-icon" src={`/icons/${asset}.svg`} alt="" />
  ) : (
    <Icon size={20} aria-hidden="true" />
  );
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
  return (
    <Field label="图标标识" hint="仅使用本地图标注册表；未知标识显示默认图标。">
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
        {[...Object.keys(localIcons), ...Object.keys(categoryIcons)].map((key) => (
          <option value={key} key={key} />
        ))}
      </datalist>
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
