import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode; onRetry: () => void }
type State = { failed: boolean }

export class EditorErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Monaco editor failed to load', error, info)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="grid min-h-80 place-items-center rounded-xl bg-slate-100 p-6 text-center dark:bg-slate-950">
        <div>
          <p className="font-semibold">代码编辑器加载失败</p>
          <p className="mt-2 text-sm text-slate-500">
            请检查浏览器环境后重试，草稿不会因此被清除。
          </p>
          <button
            className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            onClick={() => {
              this.setState({ failed: false })
              this.props.onRetry()
            }}
          >
            重新加载编辑器
          </button>
        </div>
      </div>
    )
  }
}
