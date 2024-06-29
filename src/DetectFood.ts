import {log} from './util'
import {DetectJobParams} from './types'

// Labels that are extremely inaccurate
const IGNORED_LABELS = ['macarons', 'ice_cream']
const REQUIRES_HIGHER_CONFIDENCE = ['cup_cakes']

export default class DetectFood {
  static instance: Promise<any>

  constructor(private params: DetectJobParams) {}

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
    for (const image of this.params.data.images) {
      const pipeline = await DetectFood.getInstance()
      const res = (await pipeline(image, {
        topk: 4,
      })) as any

      const topLabel = res[0] as {label: string; score: number}

      if (IGNORED_LABELS.includes(topLabel.label)) {
        log('Ignoring label:', topLabel.label)
        continue
      }

      if (
        REQUIRES_HIGHER_CONFIDENCE.includes(topLabel.label) &&
        topLabel.score < 0.35
      ) {
        log(
          'Label requires higher confidence:',
          JSON.stringify(
            {label: topLabel.label, score: topLabel.score, image},
            null,
            2,
          ),
        )
        continue
      }

      if (topLabel.score < 0.175) continue

      const context = JSON.stringify(
        {label: topLabel.label, score: topLabel.score, image},
        null,
        2,
      )
      log('Detected food:', context)

      const label =
        REQUIRES_HIGHER_CONFIDENCE.includes(topLabel.label) ||
        topLabel.score < 0.25
          ? 'food-low-conf'
          : 'food'
      this.params.addLabelJob(label, context)
    }
  }
}
