function clamp(value, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max)
}

function mapProgress(globalProgress, start, end) {
  if (globalProgress <= start) return 0
  if (globalProgress >= end) return 1
  return (globalProgress - start) / (end - start)
}

export class SceneManager {
  constructor(context) {
    this.context = context
    this.entries = []
  }

  register(sceneModule, config = {}) {
    const start = clamp(config.start ?? 0)
    const end = clamp(config.end ?? 1)

    if (end <= start) {
      throw new Error(`Scene range invalid: end (${end}) must be > start (${start})`)
    }

    this.entries.push({
      module: sceneModule,
      range: { start, end },
      initialized: false,
    })

    this.entries.sort((a, b) => a.range.start - b.range.start)
  }

  init() {
    this.entries.forEach((entry) => {
      entry.module.init(this.context)
      entry.initialized = true
    })
  }

  update(globalProgress, frameState = {}) {
    for (const entry of this.entries) {
      if (!entry.initialized) continue

      const localProgress = mapProgress(globalProgress, entry.range.start, entry.range.end)
      entry.module.update(localProgress, {
        ...frameState,
        globalProgress,
        rangeStart: entry.range.start,
        rangeEnd: entry.range.end,
      })
    }
  }

  dispose() {
    for (let i = this.entries.length - 1; i >= 0; i -= 1) {
      const entry = this.entries[i]
      if (entry.initialized) {
        entry.module.dispose()
      }
    }

    this.entries = []
  }
}
