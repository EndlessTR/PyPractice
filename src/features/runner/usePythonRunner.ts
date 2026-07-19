import { useCallback, useEffect, useMemo, useState } from 'react'

import { PythonRunnerClient, RunnerCancelledError, RunnerTimeoutError } from './PythonRunnerClient'
import type { RunnerStatus, RunResult } from './protocol'

export interface PythonRunnerState {
  status: RunnerStatus
  result?: RunResult
  message?: string
}

export function usePythonRunner() {
  const client = useMemo(() => new PythonRunnerClient(), [])
  const [state, setState] = useState<PythonRunnerState>({ status: 'loading' })

  const load = useCallback(async () => {
    setState((current) => ({ ...current, status: 'loading', message: undefined }))
    try {
      await client.initialize()
      setState((current) => ({ ...current, status: 'ready', message: undefined }))
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Python 运行环境加载失败。',
      })
    }
  }, [client])

  useEffect(() => {
    let active = true
    void client
      .initialize()
      .then(() => {
        if (active) setState({ status: 'ready' })
      })
      .catch((error: unknown) => {
        if (!active) return
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Python 运行环境加载失败。',
        })
      })
    return () => {
      active = false
      client.dispose()
    }
  }, [client])

  const run = useCallback(
    async (
      code: string,
      stdin: string,
      virtualFiles: { path: string; content: string }[] = [],
    ) => {
      setState({ status: 'running' })
      try {
        const result = await client.run(code, stdin, undefined, virtualFiles)
        setState({
          status: result.error ? 'error' : 'ready',
          result,
          message: result.error,
        })
      } catch (error) {
        if (error instanceof RunnerCancelledError) return
        setState({
          status: error instanceof RunnerTimeoutError ? 'timeout' : 'error',
          message: error instanceof Error ? error.message : '代码运行失败。',
        })
      }
    },
    [client],
  )

  const cancel = useCallback(() => {
    client.cancel()
    setState({ status: 'loading', message: '本次运行已取消，正在重建 Python 环境。' })
    void load()
  }, [client, load])

  const restart = useCallback(() => {
    setState({ status: 'loading', message: '正在重启 Python 运行环境。' })
    void client
      .restart()
      .then(() => setState({ status: 'ready' }))
      .catch((error: unknown) =>
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Python 运行环境重启失败。',
        }),
      )
  }, [client])

  return { ...state, run, cancel, restart }
}
