import { SteamBreakdown } from '../steam/SteamPage';
import type { Game } from '../../api/types';
import { allPages } from '../../api/client';
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
import { SteamPicker } from '../steam/SteamPicker';
import { gameInitial, gameSchema } from './model';

async function loadGamesByPlaytime(signal: AbortSignal): Promise<Game[]> {
  // Sort the complete collection before slicing; Steam display hours may differ from manual hours.
  const games = await allPages<Game>('/admin/games', signal);
  games.sort(
    (a, b) => b.playtimeHours - a.playtimeHours || a.sortOrder - b.sortOrder || a.id - b.id,
  );
  return games;
}

export function GamesPage() {
  return (
    <CollectionPage<Game>
      resource="games"
      title="游戏"
      description="按游戏时长从高到低展示，相同时长沿用手动顺序。"
      loadCollection={loadGamesByPlaytime}
      name={(item) => item.title}
      sortable
      columns={[
        {
          title: '游戏',
          render: (item) => (
            <TitleCell
              title={item.title}
              subtitle={item.platform ?? '未设置平台'}
              image={item.cover.url}
            />
          ),
        },
        {
          title: '个人评分',
          render: (item) => (
            <strong>
              {item.rating.toFixed(1)}
              <small> / 10</small>
            </strong>
          ),
        },
        {
          title: '时长',
          render: (item) => (
            <div>
              {item.playtimeHours} 小时
              <small className="block">自定义 {item.manualPlaytimeHours} 小时</small>
            </div>
          ),
        },
        {
          title: 'Steam',
          render: (item) => (
            <span className={`badge ${item.steamAppId !== null ? 'blue' : ''}`}>
              {item.steamAppId === null
                ? '未关联'
                : item.steam?.stale
                  ? '已关联 · 失效'
                  : item.steam === null
                    ? '已关联 · 无快照'
                    : '已关联'}
            </span>
          ),
        },
        { title: '可见性', render: (item) => <Visibility visible={item.isVisible} /> },
      ]}
    />
  );
}
export function GameEditor() {
  return (
    <ResourceEditor<Game> resource="games">
      {(item) => (
        <Editor
          key={item?.id ?? 'new'}
          initial={gameInitial(item)}
          schema={gameSchema}
          title={item ? '编辑游戏' : '新建游戏'}
          endpoint={item ? `/admin/games/${item.id}` : '/admin/games'}
          isNew={!item}
          back="/games"
        >
          {({ value, set }) => (
            <>
              <Section title="游戏信息">
                <TextField
                  label="游戏标题"
                  required
                  value={value.title}
                  onChange={(v) => set('title', v)}
                  maxLength={200}
                />
                <TextField
                  label="平台"
                  value={value.platform}
                  onChange={(v) => set('platform', v)}
                  maxLength={100}
                />
                <MediaPicker
                  label="封面"
                  value={value.coverMediaId}
                  onChange={(v) => set('coverMediaId', v ?? 0)}
                />
              </Section>
              <Section title="个人体验" description="这些编辑字段不会被 Steam 同步覆盖。">
                <NumberField
                  label="个人评分（0～10）"
                  value={value.rating}
                  onChange={(v) => set('rating', v)}
                  max={10}
                  step={0.1}
                />
                <NumberField
                  label="自定义时长（小时）"
                  hint="大于 0 时覆盖 Steam 时长；填 0 使用 Steam 时长。两者不会相加。"
                  value={value.playtimeHours}
                  onChange={(v) => set('playtimeHours', v)}
                />
                <NumberField
                  label="喜爱等级（0～5）"
                  value={value.likeLevel}
                  onChange={(v) => set('likeLevel', v)}
                  max={5}
                />
                <div className="full-width">
                  <TextField
                    label="评论"
                    multiline
                    value={value.comment}
                    onChange={(v) => set('comment', v)}
                    maxLength={5000}
                  />
                </div>
              </Section>
              <Section title="Steam 关联与快照">
                <div className="full-width">
                  <SteamPicker value={value.steamAppId} onChange={(v) => set('steamAppId', v)} />
                  {item?.steam && (
                    <dl className="detail-grid">
                      <div>
                        <dt>Steam 游戏</dt>
                        <dd>{item.steam.name}</dd>
                      </div>
                      <div>
                        <dt>Steam 累计时长</dt>
                        <dd>
                          {item.steam.playtimeMinutes} 分钟（
                          {Math.floor(item.steam.playtimeMinutes / 60)} 小时）
                          <SteamBreakdown game={item.steam} />
                        </dd>
                      </div>
                      <div>
                        <dt>近两周时长</dt>
                        <dd>
                          {item.steam.playtimeTwoWeeksMinutes === null
                            ? '—'
                            : `${item.steam.playtimeTwoWeeksMinutes} 分钟`}
                        </dd>
                      </div>
                      <div>
                        <dt>最近游玩</dt>
                        <dd>{formatDate(item.steam.lastPlayedAt)}</dd>
                      </div>
                      <div>
                        <dt>最近同步</dt>
                        <dd>{formatDate(item.steam.syncedAt)}</dd>
                      </div>
                      <div>
                        <dt>数据状态</dt>
                        <dd>{item.steam.stale ? '数据已失效，请检查同步状态' : '最近有效快照'}</dd>
                      </div>
                    </dl>
                  )}
                  {item && item.steamAppId !== null && !item.steam && (
                    <p className="notice">
                      已关联，但暂无可用快照。当前使用自定义时长；自定义为 0 时显示 0 小时。
                    </p>
                  )}
                </div>
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
