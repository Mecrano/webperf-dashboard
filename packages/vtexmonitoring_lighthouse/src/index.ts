import { CronJob } from 'cron'
import express from 'express'

import { cron, urls } from './config'
import { auditAll } from './utils'

const app = express()

app.use(express.json())
app.listen(3000, async () => {
  try {
    if (!cron) return
    new CronJob(
      cron,
      () => auditAll(urls),
      null,
      true,
      'Europe/London',
      null,
      true
    )
  } catch (err) {
    console.error(err)
  }
})

module.exports = app
