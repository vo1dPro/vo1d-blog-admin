export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3100').replace(
  /\/+$/,
  '',
);

const messages: Record<number, string> = {
  400: '输入不符合要求，请检查表单。',
  401: '登录已过期，请重新登录。',
  403: '请求来源不被允许，请检查后端 FRONTEND_ORIGINS 配置。',
  404: '记录不存在或已被删除。',
  409: '存在唯一字段冲突，或记录仍被引用。',
  413: '文件或请求过大，请缩小后重试。',
  429: '操作过于频繁，请等待冷却结束。',
  503: '服务暂时不可用，请稍后重试。',
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
    public readonly retryAfter: string | null = null,
  ) {
    super(`${messages[status] ?? '请求失败，请稍后重试。'}${detail ? ` ${detail}` : ''}`);
    this.name = 'ApiError';
  }
}

let onUnauthorized: () => void = () => {};
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

function errorDetail(value: unknown): string {
  if (typeof value !== 'object' || value === null || !('message' in value)) return '';
  const message = value.message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message))
    return message.filter((item): item is string => typeof item === 'string').join('；');
  return '';
}

type RequestOptions = Omit<RequestInit, 'body' | 'credentials'> & {
  json?: unknown;
  body?: FormData;
};
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { json, body, signal, ...init } = options;
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (json !== undefined) headers.set('Content-Type', 'application/json');
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      body: json === undefined ? body : JSON.stringify(json),
      credentials: 'include',
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(45000)])
        : AbortSignal.timeout(45000),
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error('无法连接服务或请求超时，请检查网络、后端运行状态和允许来源配置。', {
      cause: error,
    });
  }
  if (!response.ok) {
    const detail = errorDetail(await response.json().catch(() => null));
    if (response.status === 401 && path !== '/auth/login') onUnauthorized();
    throw new ApiError(response.status, detail, response.headers.get('Retry-After'));
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
export function listPath(
  path: string,
  page = 1,
  pageSize = 10,
  filters: Record<string, string> = {},
) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  for (const [key, value] of Object.entries(filters)) if (value !== '') params.set(key, value);
  return `${path}?${params}`;
}

export async function allPages<T>(path: string, signal?: AbortSignal): Promise<T[]> {
  const first = await request<Page<T>>(listPath(path, 1, 50), { signal });
  const items = [...first.items];
  for (let page = 2; page <= first.totalPages; page++) {
    const next = await request<Page<T>>(listPath(path, page, 50), { signal });
    items.push(...next.items);
  }
  return items;
}

export const describeError = (error: unknown) =>
  error instanceof Error ? error.message : '操作失败，请重试。';
