// 统一的 fetch 封装：自动拼 /api 前缀，非 2xx 时把后端 detail 抛成 Error。

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const data = await res.json()
      detail = data.detail ?? data.error ?? detail
    } catch {
      // 响应体不是 JSON 时用 statusText
    }
    throw new Error(detail)
  }
  return res.json() as Promise<T>
}

export function get<T>(path: string): Promise<T> {
  return api<T>(path)
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return api<T>(path, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}