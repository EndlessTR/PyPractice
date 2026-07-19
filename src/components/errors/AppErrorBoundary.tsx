import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'

type Props = { children: ReactNode; resetKey: string }
type State = { failed: boolean }

class AppErrorBoundaryImpl extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application rendering failed', error, info)
  }

  componentDidUpdate(previousProps: Props) {
    if (this.state.failed && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ failed: false })
    }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="mx-auto grid min-h-screen max-w-2xl place-items-center p-6">
        <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h1 className="text-xl font-bold">页面暂时无法显示</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            这通常是一次临时加载或渲染问题。你的本地学习记录和代码草稿不会被清除。
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              onClick={() => this.setState({ failed: false })}
            >
              重试当前页面
            </button>
            <Link
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
              to="/"
            >
              返回首页
            </Link>
          </div>
        </section>
      </main>
    )
  }
}

export function AppErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation()
  return (
    <AppErrorBoundaryImpl resetKey={`${location.pathname}${location.search}`}>
      {children}
    </AppErrorBoundaryImpl>
  )
}
