import {
  BarChart3,
  BookHeart,
  BookOpen,
  BookOpenCheck,
  CalendarCheck,
  FileCode2,
  FileText,
  Footprints,
  Home,
  Menu,
  MoonStar,
  Settings,
  Sun,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

import { useTheme } from '../../features/theme/ThemeProvider'
import { NetworkStatus } from './NetworkStatus'

const navigationItems = [
  ['/', '首页', Home],
  ['/learning-path', '学习路径', Footprints],
  ['/chapter', '章节学习', BookOpen],
  ['/practice', '题目练习', BookOpenCheck],
  ['/free-practice', '自由练习', FileCode2],
  ['/daily-practice', '每日练习', CalendarCheck],
  ['/wrong-book', '错题本', FileText],
  ['/favorites', '收藏夹', BookHeart],
  ['/statistics', '学习统计', BarChart3],
  ['/settings', '设置', Settings],
] as const

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const openButtonRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const { resolvedTheme, theme, setTheme } = useTheme()

  const closeSidebar = () => {
    setIsSidebarOpen(false)
    openButtonRef.current?.focus()
  }

  useEffect(() => {
    if (!isSidebarOpen) return
    closeButtonRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeSidebar()
      if (event.key !== 'Tab') return

      const focusable = document.querySelectorAll<HTMLElement>(
        '#app-navigation a, #app-navigation button:not([disabled])',
      )
      const first = focusable.item(0)
      const last = focusable.item(focusable.length - 1)
      if (!first || !last) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isSidebarOpen])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <NetworkStatus />
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-50 rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white focus:not-sr-only"
      >
        跳到主要内容
      </a>
      <aside
        id="app-navigation"
        aria-label="主导航"
        aria-modal={isSidebarOpen || undefined}
        role={isSidebarOpen ? 'dialog' : undefined}
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white p-4 transition-transform dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-7 flex items-center justify-between px-2">
          <NavLink to="/" className="flex items-center gap-3" onClick={closeSidebar}>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 font-bold text-white">Py</span>
            <span><b className="block text-lg">PyPractice</b><small className="text-slate-500">Python 编程练习</small></span>
          </NavLink>
          <button ref={closeButtonRef} className="lg:hidden" aria-label="关闭菜单" onClick={closeSidebar}><X /></button>
        </div>
        <nav className="space-y-1">
          {navigationItems.map(([to, label, Icon]) => (
            <NavLink end={to === '/'} key={to} to={to} onClick={closeSidebar} className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-sky-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`
            }><Icon size={18} />{label}</NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sm:px-8">
          <button ref={openButtonRef} className="lg:hidden" aria-label="打开菜单" aria-controls="app-navigation" aria-expanded={isSidebarOpen} onClick={() => setIsSidebarOpen(true)}><Menu /></button>
          <span className="hidden text-sm text-slate-500 sm:block">今天也写一点 Python</span>
          <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} className="rounded-xl border border-slate-200 p-2.5 dark:border-slate-700" aria-label={`当前为${theme === 'system' ? '跟随系统' : theme === 'dark' ? '深色' : '浅色'}主题，切换明暗主题`}>
            {resolvedTheme === 'dark' ? <Sun size={18} /> : <MoonStar size={18} />}
          </button>
        </header>
        <main id="main-content" tabIndex={-1} className="mx-auto max-w-7xl p-4 sm:p-8"><Outlet /></main>
      </div>

      {isSidebarOpen && <button aria-label="关闭侧栏遮罩" className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={closeSidebar} />}
    </div>
  )
}
