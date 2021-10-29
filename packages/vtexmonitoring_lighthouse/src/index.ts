import { CronJob } from 'cron'
import express from 'express'

import { cron, urls } from './config'
import { collect } from './views'
import Logger from './logger'
import { auditAll } from './utils'

const app = express()
const console = new Logger('[App]: ')

app.use(express.json())
app.use('/collect', collect)
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
    console.log(err)
  }
})

module.exports = app
