import { describe, expect, test, vi } from 'vitest'

import { PythonRunnerClient, RunnerTimeoutError } from './PythonRunnerClient'
import type { RunnerRequest, RunnerResponse } from './protocol'

class FakeWorker {
  readonly requests: RunnerRequest[] = []
  terminated = false
  ignoreRuns = false
  ignoreLoad = false
  runError = false
  private messageListeners: Array<(event: MessageEvent<unknown>) => void> = []
  private errorListeners: Array<() => void> = []

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    if (type === 'message') {
      this.messageListeners.push(listener as (event: MessageEvent<unknown>) => void)
    } else if (type === 'error') {
      this.errorListeners.push(listener as () => void)
    }
  }

  postMessage(request: RunnerRequest) {
    this.requests.push(request)
    if (request.type === 'init') {
      this.emit({ type: 'init', requestId: request.requestId, ok: true })
    } else if (request.type === 'load') {
      if (this.ignoreLoad) return
      this.emit({ type: 'load', requestId: request.requestId, phase: 'loading' })
      this.emit({ type: 'load', requestId: request.requestId, phase: 'ready' })
    } else if (request.type === 'run' && !this.ignoreRuns) {
      this.emit({
        type: 'run',
        requestId: request.requestId,
        ...(this.runError ? { phase: 'error' as const, error: 'ValueError: bad input' } : { phase: 'success' as const }),
        stdout: 'ok\n',
        stderr: '',
        truncated: false,
        durationMs: 4,
      })
    }
  }

  terminate() {
    this.terminated = true
  }

  emit(response: RunnerResponse) {
    const event = { data: response } as MessageEvent<unknown>
    this.messageListeners.forEach((listener) => listener(event))
  }
}

describe('PythonRunnerClient', () => {
  test('初始化后运行代码并返回结构化输出', async () => {
    const worker = new FakeWorker()
    const client = new PythonRunnerClient(() => worker as unknown as Worker)

    const result = await client.run('print("ok")', '')

    expect(worker.requests.map((request) => request.type)).toEqual(['init', 'load', 'run'])
    expect(result).toEqual({
      stdout: 'ok\n',
      stderr: '',
      truncated: false,
      durationMs: 4,
    })
    client.dispose()
    expect(worker.terminated).toBe(true)
  })

  test('超时会终止旧 Worker，且后续初始化创建新 Worker', async () => {
    vi.useFakeTimers()
    const workers: FakeWorker[] = []
    const client = new PythonRunnerClient(() => {
      const worker = new FakeWorker()
      workers.push(worker)
      return worker as unknown as Worker
    })
    await client.initialize()
    workers[0].ignoreRuns = true

    const pending = client.run('while True: pass', '', 25)
    const rejection = expect(pending).rejects.toBeInstanceOf(RunnerTimeoutError)
    await vi.advanceTimersByTimeAsync(25)

    await rejection
    expect(workers[0].terminated).toBe(true)
    await client.initialize()
    expect(workers).toHaveLength(2)
    client.dispose()
    vi.useRealTimers()
  })

  test('Python 异常会作为结构化结果返回', async () => {
    const worker = new FakeWorker()
    worker.runError = true
    const client = new PythonRunnerClient(() => worker as unknown as Worker)

    await expect(client.run('raise ValueError("bad input")', '')).resolves.toMatchObject({
      error: 'ValueError: bad input',
      stderr: '',
    })
    client.dispose()
  })

  test('取消运行会拒绝当前请求、终止 Worker 并允许重新初始化', async () => {
    const workers: FakeWorker[] = []
    const client = new PythonRunnerClient(() => {
      const worker = new FakeWorker()
      workers.push(worker)
      return worker as unknown as Worker
    })
    await client.initialize()
    workers[0].ignoreRuns = true
    const pending = client.run('while True: pass', '')
    const rejection = expect(pending).rejects.toMatchObject({ name: 'RunnerCancelledError' })

    client.cancel()

    await rejection
    expect(workers[0].terminated).toBe(true)
    await client.initialize()
    expect(workers).toHaveLength(2)
    client.dispose()
  })

  test('运行环境加载超时后可使用新 Worker 重试', async () => {
    vi.useFakeTimers()
    const workers: FakeWorker[] = []
    const client = new PythonRunnerClient(() => {
      const worker = new FakeWorker()
      worker.ignoreLoad = workers.length === 0
      workers.push(worker)
      return worker as unknown as Worker
    })
    const initialization = client.initialize()
    const rejection = expect(initialization).rejects.toThrow('加载超时')

    await vi.advanceTimersByTimeAsync(30_000)
    await rejection
    expect(workers[0].terminated).toBe(true)
    await client.initialize()
    expect(workers).toHaveLength(2)
    client.dispose()
    vi.useRealTimers()
  })
})
