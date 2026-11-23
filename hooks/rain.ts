// The falling rain, played on the GPU over a still grid of glyphs.
//
// The Svg under it is a fixed grid of characters at a fifth of their strength,
// with nothing animated: the app never has to repaint it. This shader only
// re-weighs what is already there. For each pixel it finds the glyph cell it
// sits in, works out how far that cell is from its column's head, and draws
// the scene's own pixel stronger or weaker against the background. Heads step
// down one row at a time over fixed characters, each with a fading trail.
// A cell brightens once a pass (every few seconds) and then fades: no flashing.
//
// The layout below must match tools/gen-scene.mjs: a 1600x1000 viewBox,
// sliced to fill the window, columns COL wide, rows FS tall.
import {
  exp, floor, fract, max, min, mix, mod, picture, scene, shader, sin, size, time, vec2, vec4,
} from 'claude-code/shader'

const VW = 1600
const VH = 1000
const COL = 20
const FS = 18
const ROWS = 57
// The Svg draws glyphs at this strength; this file scales them back up.
const BASE = 0.2
// A cell at rest, as a share of a glyph's full strength.
const REST = 0.06

const hash = (n: number) => fract(sin(n * 12.9898 + 4.1414) * 43758.5453)

const rain = picture(p => {
  // From the window to the viewBox: `slice` scales to cover, centred.
  const s = max(size.x / VW, size.y / VH)
  const off = vec2((size.x - VW * s) / 2, (size.y - VH * s) / 2)
  const vx = (p.point.x - off.x) / s
  // y points up in a shader; the viewBox's rows count down from the top.
  const vy = (size.y - p.point.y - off.y) / s
  const col = floor(vx / COL)
  const row = floor(vy / FS)

  const here = scene.sample(p.uv)
  // The background beside this glyph: the empty strip at the column's right.
  const bgUv = vec2(((col * COL + 17) * s + off.x) / size.x, p.uv.y)
  const bg = scene.sample(bgUv)

  // Each column's beat, from its index: seconds a row, one head or two, how
  // many rows before it comes round, and a short wait before the first.
  const stepSec = 0.2 + floor(hash(col) * 3) * 0.1
  const heads = hash(col + 101) < 0.3 ? 2 : 1
  const tile = floor((ROWS + 4 + floor(hash(col + 211) * 27)) / heads)
  const wait = hash(col + 307) * 3.5

  const t = time - wait
  const moved = floor(max(t, 0) / stepSec)
  // Rows above the head, along this column's repeating heads.
  const above = mod(moved - row, tile)
  // A row the first head has not reached yet stays at rest.
  const reached = t >= 0 && moved >= row
  let strength = REST
  if (reached) {
    strength = max(REST, exp(-above / (0.17 * tile)))
  }

  // Now and then a resting cell blinks on for a moment.
  const cell = col * 97 + row
  if (hash(cell + 0.5) < 0.015) {
    const period = 4 + floor(hash(cell + 9.5) * 6)
    const phase = fract(time / period + hash(cell + 3.5))
    if (phase >= 0.7 && phase < 0.8) {
      strength = max(strength, 0.5)
    }
  }

  const k = min(strength / BASE, 1 / BASE)
  return vec4(mix(bg, here, k).rgb, 1)
})

export default shader({ fps: 30, passes: [rain] })
