import { atom, read, update } from 'claude-code'
import type { Register, ThemeSetArgs } from 'claude-code'

import { RAIN_GRID, RAIN_REST } from './scene'

// Whether the main loop is in a turn: the rain falls while it is.
const isWorking = atom({ plugin: 'matrix-rain', key: 'isWorking' } as const, false)

// Only the backdrop: the app keeps its own colors and its own light or dark
// mode, the same as everywhere else in the app. The scene follows that mode.
const LOOK: ThemeSetArgs = {
  backdrop: { scene: 'matrix-rain', glass: { blur: 0, opacity: 0.6 } },
}

// Background work Claude left running when its turn ended (a test run, a
// subagent): the session is still busy, so the rain keeps falling until the
// work ends and wakes the session for a turn of its own.
let hasBackground = false
const isLive = (status: string) => status === 'running' || status === 'pending'

export const register: Register = on => {
  // The theme stands for the session, but a reload of this mod takes it away,
  // and a window that attaches later may miss it: set it again at each chance.
  // A set with no window attached yet is normal, so it is not reported.
  on('session.start', async ($, e, next) => {
    // An early version left a line in the status bar; clear it for good.
    $.ui.status(undefined)
    await $.theme.set(LOOK)
    return next(e)
  })

  on('session.attach', async ($, e, next) => {
    const done = await next(e)
    if (e.surface === 'desktop' || e.surface === 'mobile') {
      await $.theme.set(LOOK)
    }
    return done
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      await $.theme.set(LOOK)
      hasBackground = false
      await update($, isWorking, () => true)
    }

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) {
      await update($, isWorking, () => hasBackground)
    }

    return next(e)
  })

  // The main loop's Stop says what background work is still in flight.
  on('classic.Stop', async ($, e, next) => {
    hasBackground = (e.background_tasks ?? []).some(t => isLive(t.status))
    await update($, isWorking, () => hasBackground)

    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.props.plugin !== 'matrix-rain' || (e.surface !== 'desktop' && e.surface !== 'mobile')) {
      return next(e)
    }
    const { Shader, Svg } = $.ui.resolve(e)
    const working = await read($, isWorking)

    // Both Svgs are still: nothing for the app to repaint. They are drawn as
    // vectors (isInteractive), which keeps the glyphs sharp at any size; as a
    // plain image the app scaled a raster and the characters came out soft.
    // While Claude works the rain runs on the GPU over the grid.
    if (!working) {
      return <Svg source={RAIN_REST} alt="A faint grid of green characters while Claude waits" isInteractive />
    }
    return (
      <Shader module="./rain.ts">
        <Svg source={RAIN_GRID} alt="Green characters raining down while Claude works" isInteractive />
      </Shader>
    )
  })
}
