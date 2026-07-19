import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'

const distDirectory = resolve('dist')
const html = await readFile(resolve(distDirectory, 'index.html'), 'utf8')
const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((match) => match[1])
const styles = [...html.matchAll(/<link[^>]+href="([^"]+\.css)"/g)].map((match) => match[1])

async function assertBudget(files, budgetInKiB, label) {
  const sizes = await Promise.all(
    files.map(async (file) => ({ file, bytes: (await stat(resolve(distDirectory, file.replace(/^\//, '').replace(/^PyPractice\//, '')))).size })),
  )
  const total = sizes.reduce((sum, item) => sum + item.bytes, 0)
  if (total > budgetInKiB * 1024) {
    throw new Error(`${label} is ${(total / 1024).toFixed(1)} KiB, over the ${budgetInKiB} KiB budget.`)
  }
  console.log(`${label}: ${(total / 1024).toFixed(1)} KiB / ${budgetInKiB} KiB`)
}

await assertBudget(scripts, 450, 'Initial JavaScript')
await assertBudget(styles, 45, 'Initial CSS')
