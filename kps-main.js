let lastTime = 0
const state = {}

function handleKeyPress() {
  try {
    const modulePath = require.resolve('./kps-key-handler')
    if (Date.now() > lastTime - 1000) {
      delete require.cache[modulePath]
    }
    require(modulePath)(state)
  } catch (e) {
    console.error(e)
  }
}

let bufferedEvents = 1
let workRecorded = false

process.stdin.on('data', buf => {
  if (!workRecorded) {
    workRecorded = true
    console.log(">> Keypress detected! Don't type too fast!")
  }
  bufferedEvents += buf.length

  while (bufferedEvents >= 2) {
    handleKeyPress()
    bufferedEvents -= 2
  }
})

console.log('>> kps is running! Try typing something...')
