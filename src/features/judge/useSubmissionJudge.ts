import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { questions } from '../../data/questions'
import { PythonRunnerClient } from '../runner/PythonRunnerClient'
import { submissionRepository } from './createSubmissionRepository'
import { judgeSubmission } from './judgeSubmission'
import type { SubmissionRecord, SubmissionResult } from './types'

type State = {
  running: boolean
  result?: SubmissionResult
  error?: string
}

export function useSubmissionJudge(
  questionId: string,
  onSubmission?: (result: SubmissionResult) => void,
) {
  const client = useMemo(() => new PythonRunnerClient(), [])
  const [state, setState] = useState<State>({ running: false })
  const activeController = useRef<AbortController | undefined>(undefined)

  useEffect(() => () => client.dispose(), [client])

  const submit = useCallback(
    async (userCode: string) => {
      if (activeController.current) return
      const question = questions.find(
        (item) => item.id === questionId && item.status === 'approved',
      )
      if (!question) {
        setState({ running: false, error: '题目不存在或尚未通过审核。' })
        return
      }
      const controller = new AbortController()
      activeController.current = controller
      setState({ running: true })
      try {
        const result = await judgeSubmission(
          {
            run: (code, stdin, options) =>
              client.run(code, stdin, undefined, options?.virtualFiles),
            reset: () => client.restart(),
          },
          question,
          userCode,
          { signal: controller.signal },
        )
        if (controller.signal.aborted) return
        const record: SubmissionRecord = {
          id: globalThis.crypto?.randomUUID?.() ?? `${question.id}-${Date.now()}`,
          questionId: question.id,
          questionVersion: question.version,
          userCode,
          submittedAt: new Date().toISOString(),
          result,
        }
        await submissionRepository.save(record)
        onSubmission?.(result)
        setState({ running: false, result })
      } catch (error) {
        if (controller.signal.aborted) return
        setState({
          running: false,
          error: error instanceof Error ? error.message : '提交判定失败。',
        })
      } finally {
        if (activeController.current === controller) activeController.current = undefined
      }
    },
    [client, onSubmission, questionId],
  )

  const cancel = useCallback(() => {
    activeController.current?.abort()
    client.cancel()
    setState({ running: false, error: '本次提交已取消。' })
  }, [client])

  return { ...state, submit, cancel }
}
