import express from 'express'

import { audit } from '../../utils'
import { saveData } from '../../models/influxdb'
import Logger from '../../logger'

const router = express.Router()
const console = new Logger('[APP Collect Endpoint]: ')

export const collect = router.post(
  '/',
  async (req: express.Request, res: express.Response) => {
    const { body = {} } = req
    const { url } = body
    if (!url) return res.status(400).send('/collect missing `url` data')
    try {
      console.log(`Audit for ${url}.`)
      const { dbPayload } = await audit(url)
      // Response filled, try to save in DB, fail silently
      saveData(url, dbPayload)

      return res.status(201).send(dbPayload)
    } catch (err) {
      console.log(
        `Failed to get or save data for ${url} ${JSON.stringify(err)}`
      )
      return res.sendStatus(500)
    }
  }
)
