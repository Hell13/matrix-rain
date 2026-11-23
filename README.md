# matrix-rain

A Claude Code mod: slow green digital rain behind the conversation in the Claude desktop app while Claude works. When Claude waits, the rain dims to a faint still grid of characters.

- The rain runs on the GPU (`hooks/rain.ts`) over a still vector grid of glyphs (`hooks/scene.ts`), so it keeps falling while Claude writes a reply.
- Follows the app's light or dark mode.
- On mobile, and with Reduce Motion on, the grid shows without animation.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install matrix-rain --marketplace Hell13/matrix-rain
```

Answer `y` to add the marketplace, then pick a scope (user scope is first).

From a shell:

```bash
claude plugin install matrix-rain --marketplace Hell13/matrix-rain
```

In the desktop app, where `/plugin` does not run: click **+** next to the prompt box, then **Plugins**, **Add marketplace** with `Hell13/matrix-rain`, then **Add plugin**.

## Changing the grid

`hooks/scene.ts` is generated. After editing `tools/gen-scene.mjs`, run:

```bash
node tools/gen-scene.mjs hooks/scene.ts
```

The layout constants in `tools/gen-scene.mjs` and `hooks/rain.ts` must match.
