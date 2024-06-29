import dotenv from 'dotenv'
import Labeler from './Labeler'
dotenv.config()

const labeler = new Labeler({
  bskyIdentifier: process.env.BSKY_IDENTIFIER!,
  bskyPassword: process.env.BSKY_PASSWORD!,
  includeExternalEmbeds: process.env.INCLUDE_EXTERNAL_EMBEDS === 'true',
  redisHost: process.env.REDIS_HOST!,
  redisPort: Number(process.env.REDIS_PORT),
  interval: Number(process.env.INTERVAL),
  maxPerBatch: Number(process.env.MAX_PER_BATCH),
})

labeler.run()
