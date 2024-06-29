import {log} from './util'
import {LabelJobParams} from './types'

export default class ApplyLabel {
  constructor(private params: LabelJobParams) {}

  apply = async () => {
    const {data, agent} = this.params
    const {did, rkey, label, cid} = data

    const uri = `at://${did}/app.bsky.feed.post/${rkey}`
    log(`Applying label to ${uri} with label ${label}`)

    try {
      await agent
        .withProxy('atproto_labeler', agent.session!.did)
        .api.tools.ozone.moderation.emitEvent({
          event: {
            $type: 'tools.ozone.moderation.defs#modEventLabel',
            createLabelVals: [label],
            negateLabelVals: [],
          },
          subject: {
            $type: 'com.atproto.repo.strongRef',
            uri,
            cid,
          },
          createdBy: agent.session?.did ?? '',
          createdAt: new Date().toISOString(),
          subjectBlobCids: [],
        })

      console.log(`Emitted label for ${uri} with ${cid} using label ${label}`)
    } catch (e: any) {
      log('Failed to emit label. Error: ', e.toString())
    }
  }
}
