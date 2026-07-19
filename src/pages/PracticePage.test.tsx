import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { practiceSessionStore } from '../features/practice'
import { PracticePage } from './index'

afterEach(() => practiceSessionStore.clear())

function renderQuestion(questionId: string) {
  return render(
    <MemoryRouter initialEntries={[`/practice/${questionId}`]}>
      <Routes>
        <Route path="/practice/:questionId" element={<PracticePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PracticePage', () => {
  test('输出题只展示待分析代码，不通过公开示例泄露正确输出', async () => {
    renderQuestion('ch02-q001')

    expect(screen.getByText("print('red', 'green', 'blue', sep=' - ')")).toBeInTheDocument()
    expect(screen.queryByText('red - green - blue')).not.toBeInTheDocument()
    expect(screen.getByText('提交后显示')).toBeInTheDocument()
    expect(screen.queryByText('Python 代码编辑器')).not.toBeInTheDocument()
    expect(screen.getByLabelText('本次练习会话')).toHaveTextContent('练习进行中')
    expect(screen.getByLabelText('本次练习会话')).toHaveTextContent('已提交 0 次')
    expect(screen.getByRole('button', { name: '收藏' })).toBeInTheDocument()
    expect(screen.getByLabelText('掌握度')).toHaveValue('0')
    expect(await screen.findByLabelText('题目笔记')).toBeInTheDocument()
  })
})
