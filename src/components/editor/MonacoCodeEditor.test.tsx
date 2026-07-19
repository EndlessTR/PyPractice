import { render } from '@testing-library/react'

import MonacoCodeEditor from './MonacoCodeEditor'

const editorProps = vi.hoisted(() => ({
  current: undefined as Record<string, unknown> | undefined,
}))

vi.mock('monaco-editor', () => ({}))
vi.mock('monaco-editor/esm/vs/editor/editor.api.js', () => ({}))
vi.mock('monaco-editor/esm/vs/basic-languages/python/python.contribution.js', () => ({}))
vi.mock('monaco-editor/esm/vs/editor/editor.worker?worker', () => ({
  default: class EditorWorkerMock {},
}))
vi.mock('@monaco-editor/react', () => ({
  loader: { config: vi.fn() },
  default: (props: Record<string, unknown>) => {
    editorProps.current = props
    return <div data-testid="monaco-mock" />
  },
}))

describe('MonacoCodeEditor', () => {
  test('注册保存、运行和提交快捷键，并转发对应回调', () => {
    const onSave = vi.fn()
    const onRun = vi.fn()
    const onSubmit = vi.fn()
    render(
      <MonacoCodeEditor
        questionId="question-a"
        code="print(1)"
        theme="light"
        fontSize={14}
        onChange={vi.fn()}
        onSave={onSave}
        onRun={onRun}
        onSubmit={onSubmit}
      />,
    )

    const addAction = vi.fn()
    const focus = vi.fn()
    const fakeMonaco = {
      KeyMod: { CtrlCmd: 1, Shift: 2 },
      KeyCode: { KeyS: 4, Enter: 8 },
    }
    const onMount = editorProps.current?.onMount as (
      editor: { addAction: typeof addAction; focus: typeof focus },
      monacoApi: typeof fakeMonaco,
    ) => void
    onMount({ addAction, focus }, fakeMonaco)

    expect(addAction).toHaveBeenCalledTimes(3)
    expect(addAction.mock.calls.map(([action]) => action.id)).toEqual([
      'pypractice-save',
      'pypractice-run',
      'pypractice-submit',
    ])
    expect(addAction.mock.calls.map(([action]) => action.keybindings[0])).toEqual([5, 9, 11])

    for (const [action] of addAction.mock.calls) action.run()
    expect(onSave).toHaveBeenCalledOnce()
    expect(onRun).toHaveBeenCalledOnce()
    expect(onSubmit).toHaveBeenCalledOnce()
    expect(focus).toHaveBeenCalledOnce()
  })
})
