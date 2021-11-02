/* eslint-disable no-console */
import express from 'express'

import { audit } from '../utils'
// import { saveData } from '../models/influxdb'

const router = express.Router()

export const collect = router.post(
  '/',
  async (req: express.Request, res: express.Response) => {
    const { body = {} } = req
    const { url } = body
    if (!url) return res.status(400).send('/collect missing `url` data')
    try {
      console.log(`Audit for ${url}.`)
      const result = await audit(url)
      // Response filled, try to save in DB, fail silently
      // saveData(url, result)

      return res.status(201).send(result)
    } catch (err) {
      return res.status(500).send(err)
    }
  }
)
