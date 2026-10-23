import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Play,
  MessageCircle,
  Repeat2,
  Heart,
  ChartNoAxesColumn,
  Upload,
} from 'lucide-react';
import type { Creation, CreationAuthor, CreationMedia, CreationPlatform } from './model';
import { creationPlatforms } from './model';

export function PlatformIcon({ platform }: { platform: CreationPlatform }) {
  if (platform !== 'x')
    return <span className="creation-platform-word">{creationPlatforms[platform].label}</span>;
  return (
    <svg className="creation-x" viewBox="0 0 24 24" aria-label="X" role="img" fill="currentColor">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.64 7.584H.47l8.6-9.835L0 1.154h7.594l5.243 6.932 6.064-6.933Zm-1.29 19.461h2.039L6.487 3.24H4.3l13.312 17.374Z" />
    </svg>
  );
}

function Avatar({ author }: { author: CreationAuthor }) {
  const [failed, setFailed] = useState(false);
  return author.avatarUrl && !failed ? (
    <img
      className="creation-avatar"
      src={author.avatarUrl}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  ) : (
    <span className="creation-avatar creation-avatar-fallback" aria-hidden="true">
      {author.name.slice(0, 1)}
    </span>
  );
}

function relativeTime(value: string, now: number) {
  const seconds = Math.max(0, Math.floor((now - Date.parse(value)) / 1000));
  if (seconds < 60) return '刚刚';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时`;
  const date = new Date(value);
  return new Intl.DateTimeFormat('zh-CN', {
    ...(date.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' as const } : {}),
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function profileUrl(author: CreationAuthor, platform: CreationPlatform) {
  const handle = author.handle?.replace(/^@/, '');
  return platform === 'x' && handle && /^[A-Za-z0-9_]{1,15}$/.test(handle)
    ? `https://x.com/${handle}`
    : undefined;
}

function ProfileLink({
  href,
  children,
  avatar = false,
}: {
  href?: string;
  children: ReactNode;
  avatar?: boolean;
}) {
  return href ? (
    <a
      className={`creation-profile-link ${avatar ? 'creation-avatar-link' : ''}`}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={avatar ? '查看个人主页' : undefined}
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </a>
  ) : (
    <>{children}</>
  );
}

export function Author({
  author,
  publishedAt,
  href,
}: {
  author: CreationAuthor;
  publishedAt?: string;
  href?: string;
}) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!publishedAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, [publishedAt]);
  return (
    <div className="creation-author">
      <ProfileLink href={href} avatar>
        <Avatar author={author} />
      </ProfileLink>
      <div className="creation-identity">
        <ProfileLink href={href}>
          <span className="creation-name">
            {author.name}
            {author.verified && (
              <svg viewBox="0 0 24 24" className="creation-verified" role="img" aria-label="已认证">
                <path
                  fill="currentColor"
                  d="m22.25 12-2.1-2.4.3-3.2-3.1-.7L15.7 3l-2.9 1.3L10 3 8.3 5.7l-3.1.7.3 3.2L3.4 12l2.1 2.4-.3 3.2 3.1.7L10 21l2.8-1.3 2.9 1.3 1.65-2.7 3.1-.7-.3-3.2Z"
                />
                <path
                  d="m8.5 12 2.4 2.4 5-5"
                  fill="none"
                  stroke="var(--background)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
        </ProfileLink>
        {author.handle && (
          <ProfileLink href={href}>
            <span className="creation-handle">@{author.handle.replace(/^@/, '')}</span>
          </ProfileLink>
        )}
        {publishedAt && (
          <time
            className="creation-time"
            dateTime={publishedAt}
            title={new Date(publishedAt).toLocaleString('zh-CN')}
          >
            · {relativeTime(publishedAt, now)}
          </time>
        )}
      </div>
    </div>
  );
}

function MediaItem({ media, expanded }: { media: CreationMedia; expanded: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed && media.kind === 'video')
    return (
      <div className="creation-video-error">
        {media.posterUrl && (
          <img
            src={media.posterUrl}
            alt={media.alt || '视频封面'}
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        )}
        <div role="status">
          视频暂时无法加载{' '}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setFailed(false);
            }}
          >
            重试
          </button>
        </div>
      </div>
    );
  if (failed) return <div className="creation-media-fallback">媒体暂不可用</div>;
  if (media.kind === 'video' && expanded && media.url) {
    return (
      <video
        src={media.url}
        controls
        playsInline
        preload="metadata"
        poster={media.posterUrl}
        aria-label={media.alt || '视频'}
        onError={() => setFailed(true)}
      />
    );
  }
  const url = media.kind === 'image' ? media.url : media.posterUrl;
  return (
    <div className="creation-media-item">
      {url ? (
        <img
          src={url}
          width={media.width}
          height={media.height}
          alt={media.alt}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="creation-media-fallback">{expanded ? '请前往原推文观看视频' : '视频'}</div>
      )}
      {media.kind === 'video' && !expanded && (
        <span className="creation-play" aria-hidden="true">
          <Play size={22} fill="currentColor" />
        </span>
      )}
    </div>
  );
}

function PhotoStrip({ items }: { items: CreationMedia[] }) {
  const track = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ x: number; y: number; scroll: number; id: number } | null>(null);
  const dragged = useRef(false);
  const [edges, setEdges] = useState({ start: true, end: false });
  const ratios = items.map((item) => (item.width && item.height ? item.width / item.height : 1));
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const update = () =>
      setEdges({
        start: element.scrollLeft < 2,
        end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 2,
      });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener('scroll', update, { passive: true });
    update();
    return () => {
      observer.disconnect();
      element.removeEventListener('scroll', update);
    };
  }, []);
  function move(direction: number) {
    const element = track.current;
    if (!element) return;
    element.scrollBy({
      left: direction * element.clientWidth * 0.8,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }
  return (
    <div
      className="creation-media creation-photo-strip"
      style={{ '--photo-ratio': Math.max(...ratios) } as CSSProperties}
      onDragStart={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        dragged.current = false;
        if (!event.isPrimary || event.button !== 0 || (event.target as Element).closest('button'))
          return;
        pointer.current = {
          x: event.clientX,
          y: event.clientY,
          scroll: track.current?.scrollLeft ?? 0,
          id: event.pointerId,
        };
      }}
      onPointerMove={(event) => {
        const start = pointer.current;
        const element = track.current;
        if (!start || start.id !== event.pointerId || !element) return;
        if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8)
          dragged.current = true;
        // Touch keeps native scrolling and momentum; mouse dragging scrolls explicitly.
        if (event.pointerType === 'mouse' && dragged.current) {
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          element.style.scrollSnapType = 'none';
          element.scrollLeft = start.scroll - (event.clientX - start.x);
        }
      }}
      onPointerUp={(event) => {
        pointer.current = null;
        if (track.current) track.current.style.scrollSnapType = '';
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => {
        pointer.current = null;
        dragged.current = true;
        if (track.current) track.current.style.scrollSnapType = '';
      }}
      onLostPointerCapture={() => {
        pointer.current = null;
        if (track.current) track.current.style.scrollSnapType = '';
      }}
      onPointerLeave={() => {
        if (!dragged.current) pointer.current = null;
      }}
      onClickCapture={(event) => {
        if (dragged.current) {
          event.preventDefault();
          event.stopPropagation();
          dragged.current = false;
        }
      }}
    >
      <div
        className="creation-photo-track"
        ref={track}
        role="region"
        aria-label={`${items.length} 张照片，可左右滚动`}
        tabIndex={0}
        data-lenis-prevent
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            event.stopPropagation();
            move(event.key === 'ArrowLeft' ? -1 : 1);
          }
        }}
      >
        {items.map((media, index) => (
          <div
            className="creation-photo-slide"
            key={media.kind === 'image' ? media.url : index}
            style={{ aspectRatio: ratios[index] }}
          >
            <MediaItem media={media} expanded={false} />
          </div>
        ))}
      </div>
      <button
        type="button"
        className="creation-photo-arrow is-previous"
        aria-label="上一张照片"
        disabled={edges.start}
        onClick={(event) => {
          event.stopPropagation();
          move(-1);
        }}
      >
        <ArrowLeft size={20} />
      </button>
      <button
        type="button"
        className="creation-photo-arrow is-next"
        aria-label="下一张照片"
        disabled={edges.end}
        onClick={(event) => {
          event.stopPropagation();
          move(1);
        }}
      >
        <ArrowRight size={20} />
      </button>
    </div>
  );
}

export function Media({ items, expanded = false }: { items: CreationMedia[]; expanded?: boolean }) {
  if (!items.length) return null;
  if (items.length > 1 && items.every((item) => item.kind === 'image'))
    return <PhotoStrip items={items} />;
  return (
    <div
      className={`creation-media ${expanded ? 'is-expanded' : ''} ${items.length > 1 ? 'is-multiple' : ''}`}
    >
      {(expanded ? items : items.slice(0, 1)).map((media, index) => (
        <MediaItem key={`${media.kind}-${index}`} media={media} expanded={expanded} />
      ))}
      {!expanded && items.length > 1 && (
        <span className="creation-media-count">1 / {items.length}</span>
      )}
    </div>
  );
}

function PostBody({ post, expanded }: { post: Creation; expanded: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [unfolded, setUnfolded] = useState(false);
  const [overflow, setOverflow] = useState(false);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || expanded || unfolded) return;
    const update = () => setOverflow(element.scrollHeight > element.clientHeight + 1);
    const observer = new ResizeObserver(update);
    observer.observe(element);
    update();
    return () => observer.disconnect();
  }, [post.body, expanded, unfolded]);
  const incomplete = post.textStatus === 'truncated' || post.textStatus === 'unavailable';
  return (
    <div className="creation-text-content">
      <div ref={ref} className={`creation-body ${!expanded && !unfolded ? 'is-collapsed' : ''}`}>
        {post.body
          .flatMap((part) =>
            part.kind === 'text'
              ? part.text
                  .split(/(https?:\/\/[^\s]+|[#＃][\p{L}\p{N}_]+|@[A-Za-z0-9_]+)/gu)
                  .filter(Boolean)
                  .map((text) => ({
                    text,
                    kind: /^(https?:\/\/|[#＃@])/.test(text) ? 'link' : 'text',
                  }))
              : [part],
          )
          .filter(
            (part) =>
              !post.article ||
              part.text.replace(/[?#].*$/, '').replace('https://twitter.com/', 'https://x.com/') !==
                post.article.url,
          )
          .map((part, index) => (
            <span key={index} className={part.kind === 'text' ? undefined : 'creation-entity'}>
              {part.text}
            </span>
          ))}
      </div>
      {!expanded && (overflow || unfolded) && (
        <button
          type="button"
          className="creation-read-more"
          aria-expanded={unfolded}
          onClick={(event) => {
            event.stopPropagation();
            setUnfolded((value) => !value);
          }}
        >
          {unfolded ? '收起' : '显示更多'}
        </button>
      )}
      {incomplete && (
        <a
          className="creation-read-more"
          href={post.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
        >
          在 X 查看完整内容 ↗
        </a>
      )}
    </div>
  );
}

export function CreationContent({
  post,
  expanded = false,
}: {
  post: Creation;
  expanded?: boolean;
}) {
  return (
    <div className="creation-post">
      <div className="creation-header">
        <Author
          author={post.author}
          publishedAt={post.publishedAt}
          href={profileUrl(post.author, post.platform)}
        />
        <ProfileLink href={profileUrl(post.author, post.platform)}>
          <PlatformIcon platform={post.platform} />
        </ProfileLink>
      </div>
      {post.title && <h3 className="creation-title">{post.title}</h3>}
      <PostBody post={post} expanded={expanded} />
      {post.article && (
        <a
          className="creation-article creation-article-link"
          href={post.article.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
        >
          {post.article.coverUrl && (
            <div className="creation-article-cover">
              <MediaItem
                key={post.article.coverUrl}
                media={{ kind: 'image', url: post.article.coverUrl, alt: post.article.title }}
                expanded={false}
              />
              <span>X 文章</span>
            </div>
          )}
          <div className="creation-article-copy">
            {!post.article.coverUrl && <span className="creation-article-label">X 文章</span>}
            <h3>{post.article.title}</h3>
            {post.article.excerpt && <p>{post.article.excerpt}</p>}
          </div>
        </a>
      )}
      <Media items={post.media} expanded={expanded} />
      {post.quote && (
        <div className="creation-quote">
          <Author author={post.quote.author} href={profileUrl(post.quote.author, post.platform)} />
          <p>{post.quote.body.map((part) => part.text).join('')}</p>
          {expanded && <Media items={post.quote.media} expanded />}
        </div>
      )}
    </div>
  );
}

export function CreationActions({ post }: { post: Creation }) {
  const [status, setStatus] = useState('');
  const [fallback, setFallback] = useState(false);
  const format = (value: number) =>
    new Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
  const entries = [
    { key: 'replies', label: '评论', Icon: MessageCircle },
    { key: 'reposts', label: '转发', Icon: Repeat2 },
    { key: 'likes', label: '点赞', Icon: Heart },
    { key: 'views', label: '曝光量', Icon: ChartNoAxesColumn },
  ] as const;
  async function share() {
    try {
      if (navigator.share) await navigator.share({ url: post.sourceUrl, title: post.author.name });
      else {
        await navigator.clipboard.writeText(post.sourceUrl);
        setStatus('链接已复制');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setFallback(true);
      setStatus('可选择下方链接复制');
    }
  }
  return (
    <div className="creation-actions-wrap">
      <div className="creation-actions" aria-label="互动数据">
        {entries.map(({ key, label, Icon }) => {
          const value = post.metrics?.[key];
          const quote = key === 'reposts' ? post.metrics?.quotes : undefined;
          const displayValue =
            key === 'reposts' && (value !== undefined || quote !== undefined)
              ? (value ?? 0) + (quote ?? 0)
              : value;
          const description = `${label}：${value === undefined ? '暂未提供' : value}${quote === undefined ? '' : `；引用：${quote}`}`;
          const Tag = key === 'replies' || key === 'likes' ? 'a' : 'span';
          return (
            <Tag
              className={`creation-stat creation-stat-${key}`}
              key={key}
              title={description}
              aria-label={description}
              {...(Tag === 'a'
                ? {
                    href: post.sourceUrl,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    onClick: (event: React.MouseEvent) => event.stopPropagation(),
                  }
                : {})}
            >
              <Icon size={18} strokeWidth={1.7} />
              {displayValue !== 0 && (
                <span>{displayValue === undefined ? '—' : format(displayValue)}</span>
              )}
            </Tag>
          );
        })}
        <button
          type="button"
          className="creation-share"
          aria-label="分享原文链接"
          title="分享原文链接"
          onClick={() => void share()}
        >
          <Upload size={18} strokeWidth={1.7} />
        </button>
      </div>
      {status && (
        <span className="creation-share-status" role="status">
          {status}
        </span>
      )}
      {fallback && (
        <input
          aria-label="可复制的原文链接"
          readOnly
          value={post.sourceUrl}
          onFocus={(event) => event.currentTarget.select()}
        />
      )}
    </div>
  );
}
