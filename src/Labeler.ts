import {createCdnUri, log, parsePath} from './util'
import {
  ComAtprotoSyncSubscribeRepos,
  subscribeRepos,
  SubscribeReposMessage,
  XrpcEventStreamClient,
} from 'atproto-firehose'
import BeeQueue from 'bee-queue'
import DetectFood from './DetectFood'
import {JobData, FoodLabel, Params, LabelJobData} from './types'
import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedPost,
  BskyAgent,
} from '@atproto/api'
import ApplyLabel from './ApplyLabel'

const QUEUE_SETTINGS = (redisSettings: {host: string; port: number}) => ({
  redis: redisSettings,
  removeOnSuccess: true,
  removeOnFailure: false,
})

export default class Labeler {
  firehose: XrpcEventStreamClient
  agent: BskyAgent | undefined

  detectJobQueue: BeeQueue
  labelJobQueue: BeeQueue

  constructor(private params: Params) {
    this.firehose = subscribeRepos('wss://bsky.network', {
      decodeRepoOps: true,
    })
    this.detectJobQueue = new BeeQueue(
      'detect',
      QUEUE_SETTINGS({
        host: params.redisHost,
        port: params.redisPort,
      }),
    )
    this.labelJobQueue = new BeeQueue(
      'label',
      QUEUE_SETTINGS({
        host: params.redisHost,
        port: params.redisPort,
      }),
    )
    this.start()
  }

  start = async () => {
    log('Authenticating with Bluesky')
    try {
      this.agent = new BskyAgent({
        service: 'https://bsky.social',
      })
      await this.agent.login({
        identifier: this.params.bskyIdentifier,
        password: this.params.bskyPassword,
      })
    } catch (e: any) {
      log('Failed to authenticate with Bluesky', e.toString())
      return
    }

    log('Waiting for the pipeline to be ready')
    await DetectFood.getInstance()
    log('Pipeline is ready')
    this.detectJobQueue.process(this.params.maxPerBatch, this.processDetectJob)
    this.labelJobQueue.process(this.params.maxPerBatch, this.processLabelJob)
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

      const shouldCheck =
        AppBskyEmbedImages.isMain(payload.embed) ||
        AppBskyEmbedRecordWithMedia.isMain(payload.embed) ||
        (this.params.includeExternalEmbeds &&
          AppBskyEmbedExternal.isMain(payload.embed))
      if (!shouldCheck) continue

      const rkey = parsePath(op.path)?.rkey
      if (!rkey) continue

      let images: AppBskyEmbedImages.Image[] = []
      const imageUris: string[] = []

      if (
        AppBskyEmbedExternal.isMain(payload.embed) &&
        payload.embed.external.thumb
      ) {
        imageUris.push(
          createCdnUri(message.repo, payload.embed.external.thumb.ref),
        )
      } else {
        if (AppBskyEmbedImages.isMain(payload.embed)) {
          images = payload.embed.images
        } else if (AppBskyEmbedRecordWithMedia.isMain(payload.embed)) {
          if (Array.isArray(payload.embed.media.images)) {
            images = payload.embed.media.images
          }

          if (
            AppBskyEmbedExternal.isExternal(payload.embed.media.external) &&
            payload.embed.media.external.thumb
          ) {
            imageUris.push(
              createCdnUri(
                message.repo,
                payload.embed.media.external.thumb.ref,
              ),
            )
          }
        }
      }

      for (const image of images) {
        imageUris.push(createCdnUri(message.repo, image.image.ref.toString()))
      }

      if (imageUris.length === 0) continue

      this.detectJobQueue
        .createJob({
          did: message.repo,
          rkey,
          cid: op.cid.toString(),
          images: imageUris,
        })
        .save()
    }
  }

  processDetectJob = async (
    job: BeeQueue.Job<JobData>,
    done: BeeQueue.DoneCallback<any>,
  ) => {
    const addLabelJob = (label: FoodLabel) => {
      this.labelJobQueue
        .createJob({
          ...job.data,
          label,
        })
        .save()
    }
    const detectJob = new DetectFood({
      data: job.data,
      addLabelJob,
    })
    await detectJob.detect()
    done(null, 'done')
  }

  processLabelJob = async (
    job: BeeQueue.Job<LabelJobData>,
    done: BeeQueue.DoneCallback<any>,
  ) => {
    if (!this.agent) {
      throw new Error('Agent not ready')
    }
    // Label the detected food
    const labelJob = new ApplyLabel({
      data: job.data,
      agent: this.agent,
    })
    await labelJob.apply()
    done(null, 'done')
  }

  run() {
    log('Starting the labeler')
  }
}
