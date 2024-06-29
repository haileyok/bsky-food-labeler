import {log} from './util'
import {DetectJob, DetectJobParams} from './types'

// Labels that are extremely inaccurate
const IGNORED_LABELS = ['macarons', 'ice_cream']

export default class DetectFood {
  static instance: Promise<any>
  job: DetectJob

  constructor(private params: DetectJobParams) {
    this.job = params.job
  }

  static getInstance = async () => {
    if (this.instance == null) {
      let {pipeline} = await import('@xenova/transformers')
      this.instance = pipeline(
        'image-classification',
        'william7642/my_awesome_food_model',
      )
    }
    return this.instance
  }

  detect = async () => {
    for (const image of this.job.images) {
      const pipeline = await DetectFood.getInstance()
      const res = (await pipeline(image, {
        topk: 4,
      })) as any

      const topLabel = res[0] as {label: string; score: number}

      if (IGNORED_LABELS.includes(topLabel.label)) {
        log('Ignoring label:', topLabel.label)
        continue
      }

      if (topLabel.score < 0.2) continue

      log(
        'Detected food:',
        JSON.stringify(
          {label: topLabel.label, score: topLabel.score, image},
          null,
          2,
        ),
      )
    }
    this.params.done(null, 'done')
  }
}
