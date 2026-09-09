import { useCallback, useEffect, useState } from 'react'

interface AsyncState<T> {
  data: T | null
  error: string | null
  loading: boolean
}

/**
 * 挂载时（以及 deps 变化时）执行一次异步请求。
 * 返回 { data, error, loading, reload }，reload 用于出错后手动重试。
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    loading: true,
  })

  const load = useCallback(() => {
    let alive = true
    setState((s) => ({ ...s, loading: true, error: null }))
    fn()
      .then((data) => {
        if (alive) setState({ data, error: null, loading: false })
      })
      .catch((e) => {
        if (alive)
          setState({ data: null, error: e instanceof Error ? e.message : String(e), loading: false })
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => load(), [load])

  return { ...state, reload: load }
}