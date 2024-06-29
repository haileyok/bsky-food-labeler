import {BskyAgent} from '@atproto/api'

export interface Params {
  bskyIdentifier: string
  bskyPassword: string
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
export type LabelJobData = JobData & {label: FoodLabel}

export interface DetectJobParams {
  data: JobData
  addLabelJob: (label: FoodLabel) => void
}

export interface LabelJobParams {
  data: LabelJobData
  agent: BskyAgent
}

export type FoodLabel = 'food' | 'food-low-conf'
