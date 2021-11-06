import {
  pagespeedonline,
  pagespeedonline_v5,
} from '@googleapis/pagespeedonline'
import { pathOr } from 'ramda'

import { saveData } from '../influxdb'
import { scoresToMeasure, devices } from '../utils/constants'

const filterResults = ({
  lighthouseResult,
}: Partial<pagespeedonline_v5.Schema$PagespeedApiPagespeedResponseV5>) => {
  const {
    categories,
    audits,
  }: Partial<pagespeedonline_v5.Schema$LighthouseResultV5> =
    lighthouseResult ?? {}
  const report: any = {}

  if (categories) {
    // Get Categories Scores
    for (const categoryKey of Object.keys(categories)) {
      if (!Object.prototype.hasOwnProperty.call(categories, categoryKey))
        continue
      // @ts-ignore
      report[`${categoryKey}-score`] = categories[categoryKey].score
    }
  }

  if (audits) {
    // Get Audits Scores
    for (const auditKey of Object.keys(audits)) {
      if (scoresToMeasure.includes(auditKey)) {
        if (!Object.prototype.hasOwnProperty.call(audits, auditKey)) continue
        report[auditKey] = audits[auditKey].score
      }
    }
  }

  report['network-requests'] = parseFloat(
    pathOr('', ['network-requests', 'details', 'items', 'length'], audits)
  )

  const resources = pathOr([], ['resource-summary', 'details', 'items'], audits)

  for (const resource of resources) {
    const { resourceType, transferSize, requestCount } = resource
    report[`resource-summary-size-${resourceType}`] = parseFloat(transferSize)
    report[`resource-summary-request-${resourceType}`] =
      parseFloat(requestCount)
  }

  return report
}

const audit = async (url: string, device: string): Promise<any> => {
  console.log(`Getting data for ${url}`)
  const { pagespeedapi } = await pagespeedonline({
    version: 'v5',
    auth: 'AIzaSyD5jwRzVJDiQeDPvXEOISqAKUk_WrZoeSM',
  })

  const { data } = await pagespeedapi.runpagespeed({
    url,
    strategy: device,
    locale: 'es',
    category: ['accessibility', 'best-practices', 'performance', 'pwa', 'seo'],
  })

  console.log(`Successfully got data for ${url}`)

  return filterResults(data)
}

export const auditAll = async (urls: string[]): Promise<void> => {
  for await (const device of devices) {
    for await (const url of urls) {
      console.log(`Analyzing ${url}...`)
      const report = await audit(url, device)
      await saveData(url, report, device)
    }
  }
}
