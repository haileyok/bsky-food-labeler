export function log(...messages: string[]) {
  const date = new Date().toISOString()
  console.log(`[LOG: ${date}]`, ...messages)
}

export function parsePath(path: string) {
  const parts = path.split('/').filter(Boolean)
  if (parts.length !== 2) return
  return {
    type: parts[0],
    rkey: parts[1],
  }
}

export function createCdnUri(did: string, cid: string) {
  return `https://cdn.bsky.app/img/feed_thumbnail/plain/${did}/${cid}@jpeg`
}
