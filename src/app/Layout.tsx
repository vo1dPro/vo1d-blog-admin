import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { LogOut, Menu, Moon, Sun, ChevronRight, PanelLeftClose } from 'lucide-react';
import { useSession } from '../auth/session';
import { ConfirmDialog } from '../components/feedback';
import { navigation } from './navigation';
export function Layout() {
  const { session, logout } = useSession();
  const location = useLocation();
  const [mobile, setMobile] = useState(false);
  const [dark, setDark] = useState(document.documentElement.dataset.theme === 'dark');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    try {
      localStorage.setItem('admin-theme', dark ? 'dark' : 'light');
    } catch {
      /* Theme remains usable without storage. */
    }
  }, [dark]);
  useEffect(() => {
    setMobile(false);
    document.getElementById('main-content')?.focus();
  }, [location.pathname]);
  const current =
    navigation.find((item) => item.path !== '/' && location.pathname.startsWith(item.path)) ??
    navigation[0];
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        跳到主要内容
      </a>
      {mobile && (
        <button className="nav-scrim" aria-label="关闭导航" onClick={() => setMobile(false)} />
      )}
      <aside className={`sidebar ${mobile ? 'open' : ''}`} aria-label="工作台导航">
        <Link className="brand" to="/">
          v<span>o1d</span>
          <i>ADMIN</i>
        </Link>
        <button className="mobile-close" aria-label="关闭导航" onClick={() => setMobile(false)}>
          <PanelLeftClose size={20} />
        </button>
        <nav>
          {navigation.map((item, index) => (
            <div key={item.path}>
              {navigation[index - 1]?.group !== item.group && (
                <p className="nav-group">{item.group}</p>
              )}
              <NavLink to={item.path} end={item.path === '/'}>
                <item.icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="workspace-dot" />
          <div>
            <strong>vo1d 的个人空间</strong>
            <small>内容管理工作台</small>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="mobile-menu"
              aria-label="展开导航"
              aria-expanded={mobile}
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={20} />
            </button>
            <span>工作台</span>
            <ChevronRight size={14} />
            <strong>{current?.label}</strong>
          </div>
          <div className="actions">
            <button
              className="icon-button"
              aria-label={dark ? '切换浅色主题' : '切换深色主题'}
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <span className="user-email">
              {session.state === 'ready' ? session.admin.email : ''}
            </span>
            <button
              aria-label="退出登录"
              className="icon-button"
              onClick={() => {
                setError(null);
                setConfirm(true);
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="workspace-footer">
          <span>vo1d · 保持好奇，持续记录。</span>
          <span>内容工作台</span>
        </footer>
      </div>
      {confirm && (
        <ConfirmDialog
          title="退出登录？"
          message="退出后将清除本机内存中的管理数据。请先保存正在编辑的内容。"
          busy={busy}
          error={error}
          onCancel={() => setConfirm(false)}
          onConfirm={() => {
            if (busy) return;
            setBusy(true);
            void logout()
              .catch(setError)
              .finally(() => setBusy(false));
          }}
        />
      )}
    </div>
  );
}
