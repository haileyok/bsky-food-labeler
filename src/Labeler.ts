import {createCdnUri, log, parsePath} from './util'
import {
  ComAtprotoSyncSubscribeRepos,
  subscribeRepos,
  SubscribeReposMessage,
  XrpcEventStreamClient,
} from 'atproto-firehose'
import BeeQueue from 'bee-queue'
import DetectFood from './DetectFood'
import {DetectJob, Params} from './types'
import {AppBskyEmbedImages, AppBskyFeedPost} from '@atproto/api'

export default class Labeler {
  firehose: XrpcEventStreamClient
  queue: BeeQueue
  constructor(private params: Params) {
    this.firehose = subscribeRepos('wss://bsky.network', {
      decodeRepoOps: true,
    })
    this.queue = new BeeQueue('labeler', {
      redis: {
        host: params.redisHost,
        port: params.redisPort,
      },
      removeOnSuccess: true,
      removeOnFailure: false,
    })
    this.start()
  }

  start = async () => {
    log('Waiting for the pipeline to be ready')
    await DetectFood.getInstance()
    log('Pipeline is ready')
    this.queue.process(1, this.processJob)
    this.firehose.on('message', this.handleMessage)
  }

  handleMessage = (message: SubscribeReposMessage) => {
    if (!ComAtprotoSyncSubscribeRepos.isCommit(message)) return
    for (const op of message.ops) {
      if (op.action !== 'create') continue
      if (!op.cid) continue

      const payload = op.payload
      if (!AppBskyFeedPost.isRecord(payload)) continue

      if (!payload.embed) continue
      if (!AppBskyEmbedImages.isMain(payload.embed)) continue

      const rkey = parsePath(op.path)?.rkey
      if (!rkey) continue

      const images: string[] = []

      for (const image of payload.embed.images) {
        const cdnUri = createCdnUri(message.repo, image.image.ref.toString())
        images.push(cdnUri)
      }

      if (images.length === 0) continue

      this.queue
        .createJob({
          rkey,
          cid: op.cid.toString(),
          images,
        })
        .save()
    }
  }

  processJob = async (
    job: BeeQueue.Job<DetectJob>,
    done: BeeQueue.DoneCallback<any>,
  ) => {
    const detectJob = new DetectFood({
      job: job.data,
      done,
    })
    await detectJob.detect()
  }

  run() {
    log('Starting the labeler')
  }
}
