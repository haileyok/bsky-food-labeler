import {log} from './util'
import {DetectJobParams} from './types'

// Labels that are extremely inaccurate
const IGNORED_LABELS = ['macarons']
const REQUIRES_HIGHER_CONFIDENCE = [
  {label: 'cup_cakes', score: 0.35},
  {label: 'chocolate_cake', score: 0.4},
  {label: 'chocolate_mousse', score: 0.3},
  {label: 'donuts', score: 0.3},
  {label: 'ice_cream', score: 0.7},
]

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

      const higherConfidenceLabel = REQUIRES_HIGHER_CONFIDENCE.find(
        ({label}) => label === topLabel.label,
      )

      if (
        higherConfidenceLabel &&
        topLabel.score < higherConfidenceLabel.score
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
        higherConfidenceLabel && topLabel.score < higherConfidenceLabel.score
          ? 'food-low-conf'
          : 'food'
      this.params.addLabelJob(label, context)
    }
  }
}
