export interface CreationRow {
  id: number;
  platform: 'x' | 'douyin' | 'bilibili';
  sourceUrl: string;
  publishedAt: string;
  payload: { id: string; author: { name: string }; body: { text: string }[]; title?: string };
}
