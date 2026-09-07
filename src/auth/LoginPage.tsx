import { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { useSession } from './session';
import { safeReturnTo } from '../lib/values';
import { ApiError } from '../api/client';
import { ErrorNotice, Loading } from '../components/feedback';

export function LoginPage() {
  const { session, login, check } = useSession();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  if (session.state === 'loading') return <Loading text="正在确认登录状态…" />;
  if (session.state === 'ready')
    return <Navigate to={safeReturnTo(params.get('returnTo'))} replace />;
  return (
    <main className="login-page">
      <div className="login-intro">
        <a className="brand" href="/">
          v<span>o1d</span>
          <i>ADMIN</i>
        </a>
        <div>
          <p className="eyebrow">YOUR PERSONAL SPACE</p>
          <h1>
            让记录，
            <br />
            继续发生。
          </h1>
          <p>
            文章、阅读与生活收藏。
            <br />
            在这里，整理值得留下的每一件事。
          </p>
        </div>
        <small>vo1d · 内容工作台</small>
      </div>
      <section className="login-card">
        <div className="icon-tile">
          <LockKeyhole size={23} />
        </div>
        <p className="eyebrow">WELCOME BACK</p>
        <h2>登录工作台</h2>
        <p className="muted">使用你的管理员账号继续。</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (busy) return;
            setBusy(true);
            setError(null);
            void login(email.trim(), password)
              .catch(setError)
              .finally(() => setBusy(false));
          }}
        >
          <label className="field">
            <span>邮箱</span>
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label className="field">
            <span>密码</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入管理员密码"
            />
          </label>
          {error != null && (
            <ErrorNotice
              error={
                error instanceof ApiError && error.status === 401
                  ? new Error('邮箱或密码错误，请检查后重试。')
                  : error
              }
            />
          )}
          {session.state === 'error' && (
            <ErrorNotice
              error={session.error}
              retry={() => {
                void check();
              }}
            />
          )}
          <button className="primary" disabled={busy} type="submit">
            {busy ? '登录中…' : '进入工作台'}
            <ArrowRight size={17} />
          </button>
        </form>
        <p className="login-note">
          仅供站点管理员使用。没有默认账号，首次使用请在后端交互终端运行{' '}
          <code>pnpm admin:create</code>。
        </p>
      </section>
    </main>
  );
}
