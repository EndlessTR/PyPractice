import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, test, vi } from 'vitest'

import { AppErrorBoundary } from './AppErrorBoundary'

function BrokenPage(): never {
  throw new Error('render failure')
}

describe('AppErrorBoundary', () => {
  test('显示可恢复的全局错误页和返回首页入口', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(
      <MemoryRouter>
        <AppErrorBoundary><BrokenPage /></AppErrorBoundary>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '页面暂时无法显示' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重试当前页面' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '返回首页' })).toHaveAttribute('href', '/')
  })
})
