/* eslint-disable @typescript-eslint/ban-ts-ignore */
/* eslint-disable no-console */

import * as chromeLauncher from 'chrome-launcher'
import { pathOr } from 'ramda'
// @ts-ignore
import lighthouse from 'lighthouse'

import { saveData } from '../models/influxdb'

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

interface AuditsInterface {
  description: string
  score: number | null | undefined
  numericValue: number | null | undefined
}

const Audits = {
  // Performance Metrics
  'first-contentful-paint': {} as AuditsInterface,
  'speed-index': {} as AuditsInterface,
  'largest-contentful-paint': {} as AuditsInterface,
  interactive: {} as AuditsInterface,
  'total-blocking-time': {} as AuditsInterface,
  'cumulative-layout-shift': {} as AuditsInterface,
  // Others
  'dom-size': {} as AuditsInterface,
  'network-requests': {} as AuditsInterface,
  'resource-summary': {} as AuditsInterface,
}

interface CatergoryScore {
  score: number
}

const Categories = {
  performance: {} as CatergoryScore,
  'best-practices': {} as CatergoryScore,
  pwa: {} as CatergoryScore,
  accessibility: {} as CatergoryScore,
  seo: {} as CatergoryScore,
}

interface LighthouseRespose {
  audits: typeof Audits
  categories: typeof Categories
}

const launchChromeAndRunLighthouse = async (
  url: string,
  config: any
): Promise<LighthouseRespose> => {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-zygote', '--no-sandbox'],
  })
  const flags = { port: chrome.port, output: 'json' }
  const result = await lighthouse(url, flags, config)
  await chrome.kill()
  return result.lhr
}

const filterResults = (data: LighthouseRespose): DBPayload => {
  const { categories, audits } = data
  const report = {} as DBPayload
  // Main Categories
  for (const categoryKey in Categories) {
    if (!Object.prototype.hasOwnProperty.call(categories, categoryKey)) continue
    // @ts-ignore
    report[`${categoryKey}-score`] = categories[categoryKey].score
  }
  // performance audits
  for (const auditKey in Audits) {
    if (!Object.prototype.hasOwnProperty.call(audits, auditKey)) continue
    // @ts-ignore
    const { numericValue, score } = audits[auditKey]
    numericValue !== undefined && (report[auditKey] = numericValue)
    score !== undefined && (report[`${auditKey}-score`] = score)
  }
  // others
  // @ts-ignore
  report['network-requests'] = parseFloat(
    pathOr('', ['network-requests', 'details', 'items', 'length'], audits)
  )

  const resources = pathOr([], ['resource-summary', 'details', 'items'], audits)

  for (const resource of resources) {
    const { resourceType, transferSize, requestCount } = resource
    report[`resource-summary-size-${resourceType}`] = parseFloat(transferSize)
    report[`resource-summary-request-${resourceType}`] = parseFloat(
      requestCount
    )
  }

  return report
}

export const auditRaw = async (url: string): Promise<any> => {
  console.log(`Getting data for ${url}`)
  const lighthouseResponse = await launchChromeAndRunLighthouse(url, {
    extends: 'lighthouse:default',
  })
  console.log(`Successfully got data for ${url}`)

  return lighthouseResponse
}

export const audit = async (url: string): Promise<DBPayload> => {
  console.log(`Getting data for ${url}`)
  const lighthouseResponse = await launchChromeAndRunLighthouse(url, {
    extends: 'lighthouse:default',
  })
  console.log(`Successfully got data for ${url}`)

  return filterResults(lighthouseResponse)
}

export const auditAll = async (urls: string[]): Promise<void> => {
  for await (const url of urls) {
    console.log(`Analyzing ${url}...`)
    const report = await audit(url)
    await saveData(url, report)
  }
}
