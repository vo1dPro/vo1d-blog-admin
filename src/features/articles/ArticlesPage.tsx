import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { allPages } from '../../api/client';
import type { Article, Category, Tag } from '../../api/types';
import { CollectionPage, TitleCell } from '../../components/CollectionPage';
import { ErrorNotice } from '../../components/feedback';
import { formatDate } from '../../lib/values';
import { articleStatus } from './model';
export function useArticleOptions() {
  const categories = useQuery({
    queryKey: ['admin', 'categories', 'all'],
    queryFn: ({ signal }) => allPages<Category>('/admin/categories', signal),
  });
  const tags = useQuery({
    queryKey: ['admin', 'tags', 'all'],
    queryFn: ({ signal }) => allPages<Tag>('/admin/tags', signal),
  });
  return { categories, tags };
}
export function ArticlesPage() {
  const { categories, tags } = useArticleOptions();
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState({ q: '', category: '', tag: '' });
  return (
    <CollectionPage<Article>
      key={JSON.stringify(filters)}
      resource="articles"
      title="文章"
      description="记录想法，分享所学。按最近修改时间排列。"
      name={(item) => item.title}
      filters={filters}
      columns={[
        {
          title: '文章',
          render: (item) => (
            <TitleCell title={item.title} subtitle={`/${item.slug}`} image={item.cover.url} />
          ),
        },
        { title: '分类', render: (item) => item.category.label },
        {
          title: '状态',
          render: (item) => (
            <span className={`badge ${articleStatus(item) === '已发布' ? 'green' : ''}`}>
              {articleStatus(item)}
            </span>
          ),
        },
        { title: '发布时间', render: (item) => formatDate(item.publishedAt) },
      ]}
      filterBar={
        <>
          <form
            className="filter-bar"
            onSubmit={(e) => {
              e.preventDefault();
              setFilters((current) => ({ ...current, q }));
            }}
          >
            <label>
              <span className="sr-only">搜索文章</span>
              <input
                value={q}
                maxLength={200}
                onChange={(e) => setQ(e.target.value)}
                placeholder="搜索标题或摘要…"
              />
            </label>
            <button type="submit">搜索</button>
            <label>
              <span className="sr-only">筛选分类</span>
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters((current) => ({ ...current, category: e.target.value }))
                }
              >
                <option value="">全部分类</option>
                {categories.data?.map((item) => (
                  <option value={item.key} key={item.id}>
                    {item.label}
                    {item.isVisible ? '' : '（隐藏）'}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">筛选标签</span>
              <select
                value={filters.tag}
                onChange={(e) => setFilters((current) => ({ ...current, tag: e.target.value }))}
              >
                <option value="">全部标签</option>
                {tags.data?.map((item) => (
                  <option value={item.slug} key={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </form>
          {categories.isError && (
            <ErrorNotice
              error={categories.error}
              retry={() => {
                void categories.refetch();
              }}
            />
          )}
          {tags.isError && (
            <ErrorNotice
              error={tags.error}
              retry={() => {
                void tags.refetch();
              }}
            />
          )}
        </>
      }
    />
  );
}
