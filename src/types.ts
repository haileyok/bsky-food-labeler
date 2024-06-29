import BeeQueue from 'bee-queue'

export interface Params {
  bskyUsername: string
  bskyPassword: string
  redisHost: string
  redisPort: number
  interval: number
  maxPerBatch: number
}

export interface DetectJob {
  rkey: string
  cid: string
  images: string[]
}

export interface DetectJobParams {
  job: DetectJob
  done: BeeQueue.DoneCallback<any>
}
