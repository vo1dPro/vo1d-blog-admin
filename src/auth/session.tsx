import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { request, ApiError, setUnauthorizedHandler } from '../api/client';
import { clearPrivateData } from '../api/query';
import { ErrorNotice, Loading } from '../components/feedback';

export interface Admin {
  id: number;
  email: string;
}
type Session =
  | { state: 'loading' }
  | { state: 'anonymous' }
  | { state: 'ready'; admin: Admin }
  | { state: 'error'; error: unknown };
const SessionContext = createContext<{
  session: Session;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  check: () => Promise<void>;
} | null>(null);
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>({ state: 'loading' });
  async function check() {
    try {
      const admin = await request<Admin>('/auth/me');
      setSession({ state: 'ready', admin });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearPrivateData();
        setSession({ state: 'anonymous' });
      } else setSession({ state: 'error', error });
    }
  }
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearPrivateData();
      setSession({ state: 'anonymous' });
    });
    void check();
    return () => setUnauthorizedHandler(() => {});
  }, []);
  async function login(email: string, password: string) {
    const result = await request<{ admin: Admin }>('/auth/login', {
      method: 'POST',
      json: { email, password },
    });
    clearPrivateData();
    setSession({ state: 'ready', admin: result.admin });
  }
  async function logout() {
    try {
      await request<void>('/auth/logout', { method: 'POST' });
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) throw error;
    }
    clearPrivateData();
    setSession({ state: 'anonymous' });
  }
  return (
    <SessionContext.Provider value={{ session, login, logout, check }}>
      {children}
    </SessionContext.Provider>
  );
}
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('SessionProvider missing');
  return context;
}
export function RequireSession() {
  const { session, check } = useSession();
  const location = useLocation();
  if (session.state === 'loading') return <Loading text="正在确认登录状态…" />;
  if (session.state === 'error')
    return (
      <div className="center-page">
        <ErrorNotice
          error={session.error}
          retry={() => {
            void check();
          }}
        />
      </div>
    );
  if (session.state === 'anonymous')
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  return <Outlet />;
}
