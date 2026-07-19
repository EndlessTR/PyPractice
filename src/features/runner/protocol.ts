export const PYODIDE_VERSION = '314.0.2'
export const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`
export const DEFAULT_RUN_TIMEOUT_MS = 3_000
export const DEFAULT_LOAD_TIMEOUT_MS = 30_000
export const MAX_OUTPUT_CHARACTERS = 20_000

export type RunnerRequest =
  | { type: 'init'; requestId: string }
  | { type: 'load'; requestId: string; indexURL: string }
  | {
      type: 'run'
      requestId: string
      code: string
      stdin: string
      virtualFiles?: { path: string; content: string }[]
    }
  | { type: 'cancel'; requestId: string }
  | { type: 'restart'; requestId: string }

export type RunnerResponse =
  | { type: 'init'; requestId: string; ok: true }
  | { type: 'load'; requestId: string; phase: 'loading' | 'ready' }
  | { type: 'load'; requestId: string; phase: 'error'; error: string }
  | ({
      type: 'run'
      requestId: string
      stdout: string
      stderr: string
      truncated: boolean
      durationMs: number
    } & ({ phase: 'success' } | { phase: 'error'; error: string }))
  | { type: 'cancel' | 'restart'; requestId: string; ok: true }

export type RunnerStatus = 'idle' | 'loading' | 'ready' | 'running' | 'error' | 'timeout'

export interface RunResult {
  stdout: string
  stderr: string
  truncated: boolean
  durationMs: number
  error?: string
}

export function isRunnerResponse(value: unknown): value is RunnerResponse {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.type === 'string' && typeof candidate.requestId === 'string'
}
