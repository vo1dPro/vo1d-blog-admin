export interface LayoutEntry {
  id: string;
  span: number;
  height: number | null;
  categoryIds: string[];
}
export interface LayoutConfig {
  revision: number;
  categories: { id: string; name: string }[];
  entries: LayoutEntry[];
}
