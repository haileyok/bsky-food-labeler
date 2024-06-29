import {BskyAgent} from '@atproto/api'

// Whatever labels you set in Ozone
export type FoodLabel = 'food' | 'food-low-conf'

export interface Params {
  bskyIdentifier: string
  bskyPassword: string
  includeExternalEmbeds: boolean
  redisHost: string
  redisPort: number
  interval: number
  maxPerBatch: number
}

export interface JobData {
  did: string
  rkey: string
  cid: string
  images: string[]
}
export type LabelJobData = JobData & {label: FoodLabel; context: string}

export interface DetectJobParams {
  data: JobData
  addLabelJob: (label: FoodLabel, context: string) => void
}

export interface LabelJobParams {
  data: LabelJobData
  agent: BskyAgent
}
