import type { ReactNode } from 'react'

type PageProps = { title: string; description: string; actions?: ReactNode; children: ReactNode }

export function Page({ title, description, actions, children }: PageProps) {
  return (
    <section className="min-w-0">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="text-safe">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">{description}</p>
        </div>
        {actions}
      </header>
      {children}
    </section>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900 sm:p-6 ${className}`}>{children}</div>
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return <Card className="grid min-h-72 place-items-center text-center"><div className="text-safe"><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15">{icon}</div><h2 className="text-lg font-semibold">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">{description}</p>{action && <div className="mt-5">{action}</div>}</div></Card>
}

export const buttonClass = 'inline-flex max-w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2'
