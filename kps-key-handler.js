const fetch = require('node-fetch')
const _ = require('lodash')
const css = String.raw
const html = String.raw
const timeframe = 5e3
const thresholdKps = 4

module.exports = state => {
  if (!state.keyTimes) {
    state.keyTimes = []
  }
  if (!state.throttled) {
    state.throttled = _.throttle(f => f(), 250)
  }

  const doUpdateUi = () => {
    const kps = state.keyTimes.length / (timeframe / 1000)
    const kpsString = kps.toFixed(1)
    const stateKey = kpsString

    if (stateKey === state.lastState) {
      return
    }
    state.lastState = stateKey

    fetch(
      'http://localhost:29292/overlayer/' +
        require(process.env.HOME + '/.overlayerrc.json').key,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overlays: {
            kps: {
              template: html`
                <div v-if="data.show" :class="{ highlighted: data.highlight }">
                  <div
                    class="text"
                    :style="{ transform: 'scale(' + data.scale + ')' }"
                  >
                    {{ data.kpsString }} kps
                  </div>
                </div>
              `,
              css: css`
                #kps {
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  white-space: nowrap;
                  font: bold 200px sans-serif;
                  color: red;
                  -webkit-text-stroke: 3px #fff;
                }
                #kps .text {
                  transition: transform 0.25s linear;
                }
                #kps .highlighted .text {
                  color: white;
                  background: red;
                }
              `,
              data: {
                show: kps >= thresholdKps - 1,
                highlight: kps >= thresholdKps + 1,
                kps,
                kpsString,
                scale: Math.max(
                  Math.log(Math.max(0, kps - thresholdKps) * 2 + 1),
                  0.0001,
                ),
              },
            },
          },
        }),
      },
    )
  }
  const updateUi = () => state.throttled(() => doUpdateUi())

  state.keyTimes.push(Date.now())
  updateUi()

  state.intervalHandler = () => {
    state.keyTimes = state.keyTimes.filter(r => r >= Date.now() - timeframe)
    updateUi()
  }

  if (!state.interval) {
    state.interval = setInterval(() => {
      state.intervalHandler()
    }, 100)
  }
}
