import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { RefreshCw, Link2, Gamepad2 } from 'lucide-react';
import { request, listPath, type Page } from '../../api/client';
import type { SteamGame, SteamLinkResult, SteamStatus } from '../../api/types';
import { refreshContent } from '../../api/query';
import { ConfirmDialog, ErrorNotice, Loading, Empty } from '../../components/feedback';
import { Pagination } from '../../components/pagination';
import { formatDate } from '../../lib/values';

export function SteamBreakdown({ game }: { game: SteamGame }) {
  return (
    <div className="muted">
      {game.accountBreakdown?.map((account) => (
        <div key={account.accountName}>
          {account.accountName}：{Math.floor(account.playtimeMinutes / 60)} 小时{' '}
          {account.playtimeMinutes % 60} 分钟{account.stale ? '（旧快照）' : ''}
        </div>
      ))}
      {game.incomplete && <small>部分账号暂无可见快照，当前为可用账号小计。</small>}
    </div>
  );
}

export function useSteamStatus() {
  return useQuery({
    queryKey: ['admin', 'steam', 'status'],
    queryFn: ({ signal }) => request<SteamStatus>('/admin/steam/status', { signal }),
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  });
}
export function syncUnavailable(status: SteamStatus, now = Date.now()) {
  return (
    !status.enabled ||
    (status.accounts?.length
      ? status.accounts.every(
          (a) => a.syncing || (a.nextSyncAt !== null && new Date(a.nextSyncAt).getTime() > now),
        )
      : status.syncing) ||
    (!status.accounts?.length &&
      status.nextSyncAt !== null &&
      new Date(status.nextSyncAt).getTime() > now)
  );
}
export function SteamSummary({ status }: { status: SteamStatus }) {
  return (
    <dl className="detail-grid">
      <div>
        <dt>同步状态</dt>
        <dd>
          <span className={`badge ${status.enabled ? 'green' : ''}`}>
            {!status.enabled ? '未启用' : status.syncing ? '正在同步' : '已启用'}
          </span>
        </dd>
      </div>
      <div>
        <dt>Steam 账号</dt>
        <dd>
          {status.accounts?.length ? `${status.accounts.length} 个账号` : (status.steamId ?? '—')}
        </dd>
      </div>
      <div>
        <dt>游戏数量</dt>
        <dd>{status.gameCount}</dd>
      </div>
      <div>
        <dt>同步间隔</dt>
        <dd>{status.intervalSeconds} 秒</dd>
      </div>
      <div>
        <dt>上次成功</dt>
        <dd>{formatDate(status.lastSuccessAt)}</dd>
      </div>
      <div>
        <dt>下次允许同步</dt>
        <dd>{formatDate(status.nextSyncAt)}</dd>
      </div>
      <div>
        <dt>游戏库可见性</dt>
        <dd>{status.libraryVisible ? '可见' : '不可见'}</dd>
      </div>
      <div>
        <dt>最近错误码</dt>
        <dd>{status.lastErrorCode ?? '无'}</dd>
      </div>
    </dl>
  );
}
export function SteamPage() {
  const status = useSteamStatus();
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState(false);
  const library = useQuery({
    queryKey: ['admin', 'steam', 'library', page],
    queryFn: ({ signal }) =>
      request<Page<SteamGame>>(listPath('/admin/steam/library', page, 50), { signal }),
  });
  const sync = useMutation({
    mutationFn: () => request<SteamStatus>('/admin/steam/sync', { method: 'POST' }),
    onSettled: async () => {
      await refreshContent();
    },
  });
  const link = useMutation({
    mutationFn: () => request<SteamLinkResult>('/admin/steam/link-matches', { method: 'POST' }),
    onSuccess: async () => {
      setConfirm(false);
      await refreshContent();
    },
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">CONNECTED LIBRARY</p>
          <h1>Steam 同步</h1>
          <p>连接游戏时间与个人收藏，保留你的独立评价。</p>
        </div>
        <div className="actions">
          <button
            disabled={link.isPending || !status.data?.libraryVisible}
            onClick={() => {
              link.reset();
              setConfirm(true);
            }}
          >
            <Link2 size={17} />
            一键同名关联
          </button>
          <button
            className="primary"
            disabled={sync.isPending || !status.data || syncUnavailable(status.data)}
            onClick={() => sync.mutate()}
          >
            <RefreshCw size={17} />
            {sync.isPending ? '正在同步…' : '立即同步'}
          </button>
        </div>
      </div>
      {status.isPending ? (
        <Loading />
      ) : status.isError ? (
        <ErrorNotice
          error={status.error}
          retry={() => {
            void status.refetch();
          }}
        />
      ) : (
        <section className="panel">
          <div className="section-title">
            <h2>
              <Gamepad2 size={20} />
              同步状态
            </h2>
            <p>定时同步快照，非实时在线状态。当前页面每 15 秒刷新本项目状态。</p>
          </div>
          <SteamSummary status={status.data} />
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>账号</th>
                  <th>SteamID64</th>
                  <th>库数量</th>
                  <th>上次成功</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {status.data.accounts?.map((account) => (
                  <tr key={account.steamId}>
                    <td>{account.name}</td>
                    <td>{account.steamId}</td>
                    <td>{account.gameCount}</td>
                    <td>{formatDate(account.lastSuccessAt)}</td>
                    <td>
                      {account.syncing
                        ? '同步中'
                        : (account.lastErrorCode ??
                          (account.libraryVisible ? '可用' : '尚无可见快照'))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted">
            各账号独立同步；游戏库按 App ID
            合并，同一游戏累计所有可用账号的分钟数。账号凭据在后端环境中配置。
          </p>
          {status.data.lastErrorCode && (
            <p className="notice">上次同步失败，旧快照可能已失效：{status.data.lastErrorCode}</p>
          )}
          {syncUnavailable(status.data) && status.data.enabled && (
            <p className="notice">
              同步中或冷却中，请等待至 {formatDate(status.data.nextSyncAt)}。刷新页面无法绕过冷却。
            </p>
          )}
        </section>
      )}
      {sync.isError && <ErrorNotice error={sync.error} />}
      {sync.isSuccess && (
        <p role="status" className="notice success">
          同步请求已完成，请查看各账号的同步结果。
        </p>
      )}
      {link.isSuccess && (
        <p role="status" className="notice success">
          已关联 {link.data.linkedGameIds.length} 个游戏
          {link.data.linkedGameIds.length
            ? `，编号：${link.data.linkedGameIds.join('、')}`
            : '，没有新的唯一同名匹配'}
          。
        </p>
      )}
      <section className="panel table-panel">
        <div className="section-title">
          <h2>Steam 游戏库</h2>
          <p>在游戏编辑页选择或解除关联；游戏库不会自动发布到博客。</p>
        </div>
        {library.isPending ? (
          <Loading />
        ) : library.isError ? (
          <ErrorNotice
            error={library.error}
            retry={() => {
              void library.refetch();
            }}
          />
        ) : (
          <>
            {library.data.items.length === 0 ? (
              <Empty text="暂无可用的 Steam 快照" />
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>游戏名称</th>
                      <th>App ID</th>
                      <th>累计时长</th>
                      <th>近两周</th>
                      <th>最近同步</th>
                    </tr>
                  </thead>
                  <tbody>
                    {library.data.items.map((item) => (
                      <tr key={item.appId}>
                        <td>
                          <strong>{item.name}</strong>
                          {item.stale && <span className="badge warm">已失效</span>}
                        </td>
                        <td>{item.appId}</td>
                        <td>
                          {item.playtimeMinutes} 分钟（{Math.floor(item.playtimeMinutes / 60)}{' '}
                          小时）
                          <SteamBreakdown game={item} />
                        </td>
                        <td>
                          {item.playtimeTwoWeeksMinutes === null
                            ? '—'
                            : `${item.playtimeTwoWeeksMinutes} 分钟`}
                        </td>
                        <td>{formatDate(item.syncedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination
              page={page}
              totalPages={library.data.totalPages}
              total={library.data.total}
              onChange={setPage}
            />
          </>
        )}
      </section>
      {confirm && (
        <ConfirmDialog
          title="执行唯一同名关联？"
          message="仅关联唯一的规范化同名项，不覆盖已有链接，也不会自动发布全部 Steam 游戏。个人评分、评论、封面和手工时长保持独立。"
          onCancel={() => setConfirm(false)}
          onConfirm={() => link.mutate()}
          busy={link.isPending}
          error={link.error}
        />
      )}
    </>
  );
}
