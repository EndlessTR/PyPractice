import {
  DEFAULT_RUN_TIMEOUT_MS,
  DEFAULT_LOAD_TIMEOUT_MS,
  isRunnerResponse,
  PYODIDE_INDEX_URL,
  type RunnerRequest,
  type RunnerResponse,
  type RunResult,
} from './protocol'

type WorkerFactory = () => Worker

type PendingRequest = {
  resolve: (response: RunnerResponse) => void
  reject: (reason: Error) => void
  timer?: number
}

export class RunnerTimeoutError extends Error {
  constructor() {
    super('代码运行超过 3 秒，已终止并重启 Python 运行环境。')
    this.name = 'RunnerTimeoutError'
  }
}

export class RunnerCancelledError extends Error {
  constructor(message = '本次运行已取消。') {
    super(message)
    this.name = 'RunnerCancelledError'
  }
}

const defaultWorkerFactory: WorkerFactory = () =>
  new Worker(new URL('../../workers/pythonRunner.worker.ts', import.meta.url), { type: 'module' })

export class PythonRunnerClient {
  private worker?: Worker
  private generation = 0
  private requestSequence = 0
  private pending = new Map<string, PendingRequest>()
  private readyPromise?: Promise<void>
  private disposed = false

  constructor(private readonly createWorker: WorkerFactory = defaultWorkerFactory) {}

  initialize(): Promise<void> {
    if (this.disposed) return Promise.reject(new Error('Python 运行器已被释放。'))
    if (this.readyPromise) return this.readyPromise
    this.readyPromise = this.startWorker().catch((error: unknown) => {
      this.readyPromise = undefined
      throw error
    })
    return this.readyPromise
  }

  async run(
    code: string,
    stdin: string,
    timeoutMs = DEFAULT_RUN_TIMEOUT_MS,
    virtualFiles: { path: string; content: string }[] = [],
  ): Promise<RunResult> {
    await this.initialize()
    if (this.disposed) throw new Error('Python 运行器已被释放。')
    if (!this.worker) throw new RunnerCancelledError()

    if (this.hasPendingRun()) {
      this.replaceWorker(new RunnerCancelledError('新的运行请求已替代上一次请求。'))
      await this.initialize()
    }
    const requestId = this.nextId('run')
    const responsePromise = this.request(
      { type: 'run', requestId, code, stdin, virtualFiles },
      timeoutMs,
      () => {
        const timeoutError = new RunnerTimeoutError()
        this.rejectPending(requestId, timeoutError)
        this.replaceWorker(timeoutError)
      },
    )
    const response = await responsePromise
    if (response.type !== 'run') throw new Error('Python 运行器返回了无效响应。')
    return {
      stdout: response.stdout,
      stderr: response.stderr,
      truncated: response.truncated,
      durationMs: response.durationMs,
      ...(response.phase === 'error' ? { error: response.error } : {}),
    }
  }

  cancel(): void {
    if (!this.worker) return
    const requestId = this.nextId('cancel')
    this.worker.postMessage({ type: 'cancel', requestId } satisfies RunnerRequest)
    this.cancelPendingRuns(new RunnerCancelledError())
    this.replaceWorker(new RunnerCancelledError())
  }

  restart(): Promise<void> {
    if (this.worker) {
      const requestId = this.nextId('restart')
      this.worker.postMessage({ type: 'restart', requestId } satisfies RunnerRequest)
    }
    this.replaceWorker(new RunnerCancelledError('Python 运行环境正在重启。'))
    return this.initialize()
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.rejectAll(new RunnerCancelledError('Python 运行器已关闭。'))
    this.worker?.terminate()
    this.worker = undefined
    this.readyPromise = undefined
  }

  private async startWorker(): Promise<void> {
    const worker = this.createWorker()
    this.worker = worker
    const generation = ++this.generation
    worker.addEventListener('message', (event: MessageEvent<unknown>) => {
      if (generation !== this.generation || worker !== this.worker) return
      this.handleMessage(event.data)
    })
    worker.addEventListener('error', () => {
      if (generation !== this.generation || worker !== this.worker) return
      const error = new Error('Python 运行环境加载失败，请检查网络后重试。')
      this.rejectAll(error)
      this.readyPromise = undefined
    })

    const initId = this.nextId('init')
    await this.request({ type: 'init', requestId: initId })
    const loadId = this.nextId('load')
    await this.request(
      { type: 'load', requestId: loadId, indexURL: PYODIDE_INDEX_URL },
      DEFAULT_LOAD_TIMEOUT_MS,
      () => {
        const error = new Error('Python 运行环境加载超时，请检查网络后重试。')
        this.rejectPending(loadId, error)
        this.replaceWorker(error)
      },
    )
  }

  private request(
    request: RunnerRequest,
    timeoutMs?: number,
    onTimeout?: () => void,
  ): Promise<RunnerResponse> {
    if (!this.worker) return Promise.reject(new Error('Python 运行环境尚未创建。'))
    return new Promise((resolve, reject) => {
      const pending: PendingRequest = { resolve, reject }
      if (timeoutMs !== undefined) {
        pending.timer = window.setTimeout(() => onTimeout?.(), timeoutMs)
      }
      this.pending.set(request.requestId, pending)
      this.worker?.postMessage(request)
    })
  }

  private handleMessage(value: unknown): void {
    if (!isRunnerResponse(value)) return
    if (value.type === 'load' && value.phase === 'loading') return
    const pending = this.pending.get(value.requestId)
    if (!pending) return
    this.pending.delete(value.requestId)
    if (pending.timer !== undefined) window.clearTimeout(pending.timer)
    if (value.type === 'load' && value.phase === 'error') pending.reject(new Error(value.error))
    else pending.resolve(value)
  }

  private replaceWorker(reason: Error): void {
    this.rejectAll(reason)
    this.worker?.terminate()
    this.worker = undefined
    this.readyPromise = undefined
    this.generation += 1
  }

  private cancelPendingRuns(reason: Error): void {
    for (const [requestId, pending] of this.pending) {
      if (!requestId.includes('-run-')) continue
      if (pending.timer !== undefined) window.clearTimeout(pending.timer)
      pending.reject(reason)
      this.pending.delete(requestId)
    }
  }

  private hasPendingRun(): boolean {
    return [...this.pending.keys()].some((requestId) => requestId.includes('-run-'))
  }

  private rejectPending(requestId: string, reason: Error): void {
    const pending = this.pending.get(requestId)
    if (!pending) return
    if (pending.timer !== undefined) window.clearTimeout(pending.timer)
    pending.reject(reason)
    this.pending.delete(requestId)
  }

  private rejectAll(reason: Error): void {
    for (const pending of this.pending.values()) {
      if (pending.timer !== undefined) window.clearTimeout(pending.timer)
      pending.reject(reason)
    }
    this.pending.clear()
  }

  private nextId(kind: RunnerRequest['type']): string {
    this.requestSequence += 1
    return `${this.generation}-${kind}-${this.requestSequence}`
  }
}
