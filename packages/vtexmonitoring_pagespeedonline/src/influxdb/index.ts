/* eslint-disable no-console */
import { InfluxDB, Point } from '@influxdata/influxdb-client'

// You can generate a Token from the "Tokens Tab" in the UI
const token = 'toad@Y#uSK62WU0LG6I^'
const org = 'VTEX'
const bucket = 'lighthouse'

const client = new InfluxDB({ url: 'http://localhost:8086', token })

interface DBPayload {
  [index: string]: number
  // general
  'accessibility-score': number
  'best-practices-score': number
  'performance-score': number
  'pwa-score': number
  'seo-score': number
  // performance audits
  'estimated-input-latency': number
  'first-contentful-paint': number
  'first-cpu-idle': number
  'first-meaningful-paint': number
  interactive: number
  'speed-index': number
  'dom-size': number
  'errors-in-console': number
  'offscreen-images': number
  redirects: number
  'time-to-first-byte': number
  'total-byte-weight': number
  'unminified-css': number
  'unminified-javascript': number
  'uses-passive-event-listeners': number
  'uses-text-compression': number
  // performance audits scores
  'estimated-input-latency-score': number
  'first-contentful-paint-score': number
  'first-cpu-idle-score': number
  'first-meaningful-paint-score': number
  'interactive-score': number
  'speed-index-score': number
  'dom-size-score': number
  'errors-in-console-score': number
  'offscreen-images-score': number
  'redirects-score': number
  'time-to-first-byte-score': number
  'total-byte-weight-score': number
  'unminified-css-score': number
  'unminified-javascript-score': number
  'uses-passive-event-listeners-score': number
  'uses-text-compression-score': number
  // others
  'dom-max-child-elements': number
  'dom-max-depth': number
  'network-requests': number
}

export const saveData = (url: string, data: DBPayload, device: string) => {
  const writeApi = client.getWriteApi(org, bucket)
  writeApi.useDefaultTags({ host: 'host1' })

  const points: any = Object.keys(data)
    .map((key: string) =>
      data[key]
        ? new Point(key)
            .measurement(key)
            .tag('url', url)
            .tag('device', device)
            .floatField(key, data[key])
        : null
    )
    .filter(point => point)

  writeApi.writePoints(points)
  writeApi.close().catch(e => {
    console.error(e)
  })
}

export const fluxQuery = () => {
  const queryApi = client.getQueryApi(org)

  const query = `from(bucket: ${bucket}) |> range(start: -1h)`
  queryApi.queryRows(query, {
    next(row, tableMeta) {
      const o = tableMeta.toObject(row)
      console.log(
        `${o._time} ${o._measurement} in '${o.location}' (${o.example}): ${o._field}=${o._value}`
      )
    },
    error(error) {
      console.error(error)
      console.log('\\nFinished ERROR')
    },
    complete() {
      console.log('\\nFinished SUCCESS')
    },
  })
}
