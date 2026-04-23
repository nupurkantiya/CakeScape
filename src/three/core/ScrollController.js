export class ScrollController {
  constructor(options = {}) {
    this.smoothing = options.smoothing ?? 9
    this.current = 0
    this.target = 0

    this.handleScroll = this.handleScroll.bind(this)
    this.handleResize = this.handleResize.bind(this)

    window.addEventListener("scroll", this.handleScroll, { passive: true })
    window.addEventListener("resize", this.handleResize)

    this.handleScroll()
  }

  getRawProgress() {
    const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1)
    const raw = window.scrollY / scrollable
    return Math.min(Math.max(raw, 0), 1)
  }

  handleScroll() {
    this.target = this.getRawProgress()
  }

  handleResize() {
    this.target = this.getRawProgress()
    this.current = Math.min(this.current, 1)
  }

  update(delta) {
    const alpha = 1 - Math.exp(-this.smoothing * delta)
    this.current += (this.target - this.current) * alpha
    this.current = Math.min(Math.max(this.current, 0), 1)
    return this.current
  }

  getProgress() {
    return this.current
  }

  dispose() {
    window.removeEventListener("scroll", this.handleScroll)
    window.removeEventListener("resize", this.handleResize)
  }
}
