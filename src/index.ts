interface Params {
  modelName: string
}

class Index {
  constructor({}) {}

  run() {}
}

function log(message: string) {
  const date = new Date().toISOString()
  console.log(`[LOG: ${date}] ${message}`)
}
