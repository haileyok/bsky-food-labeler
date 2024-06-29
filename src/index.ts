import dotenv from 'dotenv'
import Labeler from './Labeler'
dotenv.config()

function run() {
  const labeler = new Labeler({
    bskyUsername: process.env.BSKY_USERNAME!,
    bskyPassword: process.env.BSKY_PASSWORD!,
    redisHost: process.env.REDIS_HOST!,
    redisPort: Number(process.env.REDIS_PORT),
    interval: Number(process.env.INTERVAL),
    maxPerBatch: Number(process.env.MAX_PER_BATCH),
  })

  labeler.run()
}

run()
