import { useQueries, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { ArrowRight, BookOpen, FileText, Gamepad2, Image, Plus, RefreshCw } from 'lucide-react';
import { request, listPath, type Page } from '../../api/client';
import type { CreationRow } from '../creations/row';
import { Loading, ErrorNotice, Empty } from '../../components/feedback';
import { TitleCell } from '../../components/CollectionPage';
import { formatDate } from '../../lib/values';
import { useSteamStatus } from '../steam/SteamPage';
const counts = [
  {
    resource: 'creations',
    title: '创作动态',
    icon: FileText,
    note: '想法与知识的积累',
    color: 'blue',
  },
  { resource: 'books', title: '书籍', icon: BookOpen, note: '阅读是另一种旅行', color: 'amber' },
  { resource: 'games', title: '游戏', icon: Gamepad2, note: '收藏每一段冒险', color: 'violet' },
  { resource: 'photos', title: '照片', icon: Image, note: '留住生活的切片', color: 'green' },
];
export function OverviewPage() {
  const queries = useQueries({
    queries: counts.map((item) => ({
      queryKey: ['admin', item.resource, 'count'],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        request<Page<{ id: number }>>(listPath(`/admin/${item.resource}`, 1, 1), { signal }),
    })),
  });
  const creations = useQuery({
    queryKey: ['admin', 'creations', 'recent'],
    queryFn: ({ signal }) =>
      request<Page<CreationRow>>(listPath('/admin/creations', 1, 5), { signal }),
  });
  const steam = useSteamStatus();
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">A PLACE FOR EVERYTHING</p>
          <h1>概览</h1>
          <p>欢迎回来。每一份记录，都在构成你的个人空间。</p>
        </div>
        <Link className="button primary" to="/creations">
          <Plus size={18} />
          导入推文
        </Link>
      </div>
      <div className="welcome-banner">
        <div>
          <span className="badge">YOUR CREATIVE SPACE</span>
          <h2>
            把想法写下来，
            <br />
            让热爱有迹可循。
          </h2>
          <p>从一条动态、一本书，或一个值得记住的瞬间开始。</p>
          <Link to="/site-profile">
            整理我的站点 <ArrowRight size={16} />
          </Link>
        </div>
        <div className="banner-art" aria-hidden="true">
          <div className="art-card">
            <FileText size={34} />
            <i />
            <i />
            <i />
          </div>
          <div className="art-icon">
            <BookOpen size={26} />
          </div>
          <div className="art-dot" />
        </div>
      </div>
      <div className="stat-grid">
        {counts.map((item, index) => {
          const query = queries[index];
          return (
            <section className="panel stat-card" key={item.resource}>
              <div className="stat-top">
                <span>{item.title}</span>
                <div className={`stat-icon ${item.color}`}>
                  <item.icon size={20} />
                </div>
              </div>
              {query?.isError ? (
                <ErrorNotice
                  error={query.error}
                  retry={() => {
                    void query.refetch();
                  }}
                />
              ) : (
                <strong className="stat-number">{query?.data?.total ?? '—'}</strong>
              )}
              <div className="stat-bottom">
                <small>{item.note}</small>
                <Link to={`/${item.resource}`} aria-label={`管理${item.title}`}>
                  <ArrowRight size={17} />
                </Link>
              </div>
            </section>
          );
        })}
      </div>
      <div className="overview-grid">
        <section className="panel table-panel">
          <div className="section-title inline">
            <div>
              <h2>最近动态</h2>
              <p>查看已导入的创作动态</p>
            </div>
            <Link to="/creations">
              全部动态 <ArrowRight size={15} />
            </Link>
          </div>
          {creations.isPending ? (
            <Loading />
          ) : creations.isError ? (
            <ErrorNotice
              error={creations.error}
              retry={() => {
                void creations.refetch();
              }}
            />
          ) : creations.data.items.length === 0 ? (
            <Empty text="从导入第一条推文开始" />
          ) : (
            <div className="recent-list">
              {creations.data.items.map((item) => (
                <Link to="/creations" key={item.id}>
                  <TitleCell
                    title={
                      item.payload.title ||
                      item.payload.body
                        .map((part) => part.text)
                        .join('')
                        .slice(0, 100) ||
                      item.payload.author.name
                    }
                    subtitle={formatDate(item.publishedAt)}
                  />
                  <span className="badge">
                    {{ x: 'X', douyin: '抖音', bilibili: '哔哩哔哩' }[item.platform]}
                  </span>
                  <ArrowRight size={16} />
                </Link>
              ))}
            </div>
          )}
        </section>
        <div className="overview-side">
          <section className="panel steam-card">
            <div className="section-title inline">
              <h2>
                <Gamepad2 size={20} />
                Steam 同步
              </h2>
              <RefreshCw size={17} />
            </div>
            {steam.isPending ? (
              <Loading />
            ) : steam.isError ? (
              <ErrorNotice
                error={steam.error}
                retry={() => {
                  void steam.refetch();
                }}
              />
            ) : (
              <>
                <span
                  className={`badge ${steam.data.lastErrorCode ? 'warm' : steam.data.enabled ? 'green' : ''}`}
                >
                  {steam.data.lastErrorCode
                    ? '同步异常'
                    : !steam.data.enabled
                      ? '未启用'
                      : steam.data.syncing
                        ? '同步中'
                        : '已启用'}
                </span>
                <dl>
                  <div>
                    <dt>游戏库</dt>
                    <dd>{steam.data.gameCount} 个游戏</dd>
                  </div>
                  <div>
                    <dt>上次成功</dt>
                    <dd>{formatDate(steam.data.lastSuccessAt)}</dd>
                  </div>
                </dl>
                <small>定时更新快照，每 {steam.data.intervalSeconds} 秒同步。</small>
              </>
            )}
            <Link className="button" to="/steam">
              管理同步 <ArrowRight size={16} />
            </Link>
          </section>
          <section className="panel quick-links">
            <h2>快捷入口</h2>
            <Link to="/media">
              上传和管理素材
              <ArrowRight size={16} />
            </Link>
            <Link to="/creations">
              管理创作动态
              <ArrowRight size={16} />
            </Link>
            <Link to="/site-profile">
              更新站点资料
              <ArrowRight size={16} />
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
