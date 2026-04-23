import * as THREE from "three"

export class Renderer {
  constructor(container, options = {}) {
    this.container = container

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(options.background ?? 0x05060b)

    this.camera = new THREE.PerspectiveCamera(
      options.fov ?? 45,
      1,
      options.near ?? 0.1,
      options.far ?? 200
    )
    this.camera.position.set(0, 0.35, 8)

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    })

    this.maxPixelRatio = options.maxPixelRatio ?? 2
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.maxPixelRatio))

    container.appendChild(this.renderer.domElement)

    this.baseCameraPosition = this.camera.position.clone()
    this.cameraTarget = new THREE.Vector3(0, 0, 0)
    this.idleMotion = {
      amplitudeX: options.idleAmplitudeX ?? 0.2,
      amplitudeY: options.idleAmplitudeY ?? 0.1,
      amplitudeZ: options.idleAmplitudeZ ?? 0.18,
      speedX: options.idleSpeedX ?? 0.2,
      speedY: options.idleSpeedY ?? 0.13,
      speedZ: options.idleSpeedZ ?? 0.1,
    }

    this.clock = new THREE.Clock()
    this.running = false
    this.rafId = null
    this.onFrame = null

    this.handleResize = this.handleResize.bind(this)
    window.addEventListener("resize", this.handleResize)

    this.resizeObserver = null
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(this.handleResize)
      this.resizeObserver.observe(this.container)
    }

    this.handleResize()
  }

  handleResize() {
    const width = Math.max(this.container.clientWidth, 1)
    const height = Math.max(this.container.clientHeight, 1)

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.maxPixelRatio))
    this.renderer.setSize(width, height, false)
  }

  updateIdleCameraMotion(elapsed) {
    const { amplitudeX, amplitudeY, amplitudeZ, speedX, speedY, speedZ } = this.idleMotion

    this.camera.position.x = this.baseCameraPosition.x + Math.sin(elapsed * speedX) * amplitudeX
    this.camera.position.y = this.baseCameraPosition.y + Math.cos(elapsed * speedY) * amplitudeY
    this.camera.position.z = this.baseCameraPosition.z + Math.sin(elapsed * speedZ) * amplitudeZ
    this.camera.lookAt(this.cameraTarget)
  }

  start(onFrame) {
    if (this.running) return

    this.running = true
    this.onFrame = onFrame
    this.clock = new THREE.Clock()

    const frame = () => {
      if (!this.running) return

      const delta = Math.min(this.clock.getDelta(), 0.1)
      const elapsed = this.clock.elapsedTime

      if (this.onFrame) {
        this.onFrame({ delta, elapsed })
      }

      this.updateIdleCameraMotion(elapsed)
      this.renderer.render(this.scene, this.camera)

      this.rafId = requestAnimationFrame(frame)
    }

    this.rafId = requestAnimationFrame(frame)
  }

  stop() {
    if (!this.running) return

    this.running = false
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  dispose() {
    this.stop()
    window.removeEventListener("resize", this.handleResize)

    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }

    this.renderer.dispose()

    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement)
    }
  }
}
