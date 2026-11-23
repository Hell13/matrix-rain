export type Working = boolean

declare module 'claude-code' {
  interface PluginState {
    'matrix-rain': { isWorking: Working }
  }
}
