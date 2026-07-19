import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { ThemeProvider } from '../../features/theme/ThemeProvider'
import { AppLayout } from './AppLayout'

test('提供跳至主内容链接，并可通过 Escape 关闭移动端导航', () => {
  render(
    <MemoryRouter>
      <ThemeProvider>
        <AppLayout />
      </ThemeProvider>
    </MemoryRouter>,
  )

  expect(screen.getByRole('link', { name: '跳到主要内容' })).toHaveAttribute('href', '#main-content')

  const openMenu = screen.getByRole('button', { name: '打开菜单' })
  fireEvent.click(openMenu)
  expect(screen.getByRole('dialog', { name: '主导航' })).toHaveAttribute('aria-modal', 'true')

  fireEvent.keyDown(window, { key: 'Escape' })
  expect(screen.queryByRole('dialog', { name: '主导航' })).not.toBeInTheDocument()
  expect(openMenu).toHaveFocus()
})
