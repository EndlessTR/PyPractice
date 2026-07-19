import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { App } from './App'
import { ThemeProvider } from './features/theme/ThemeProvider'

test('渲染首页', () => {
  render(<MemoryRouter><ThemeProvider><App /></ThemeProvider></MemoryRouter>)
  expect(screen.getByRole('heading', { name: '首页' })).toBeInTheDocument()
})
