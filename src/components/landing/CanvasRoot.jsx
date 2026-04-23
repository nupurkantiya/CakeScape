import { useEffect, useRef } from "react"
import { Renderer } from "../../three/core/Renderer"
import { ScrollController } from "../../three/core/ScrollController"
import { SceneManager } from "../../three/core/SceneManager"
import { createScenes } from "../../three/scenes"

function CanvasRoot() {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return undefined

    const rendererCore = new Renderer(mount)
    const scrollController = new ScrollController({ smoothing: 8.5 })
    const sceneManager = new SceneManager({
      scene: rendererCore.scene,
      camera: rendererCore.camera,
      renderer: rendererCore.renderer,
      engine: rendererCore,
    })

    const sceneDefinitions = createScenes()
    sceneDefinitions.forEach(({ scene, range }) => {
      sceneManager.register(scene, range)
    })
    sceneManager.init()

    rendererCore.start(({ delta, elapsed }) => {
      const smoothedProgress = scrollController.update(delta)
      sceneManager.update(smoothedProgress, { delta, elapsed })
    })

    return () => {
      rendererCore.stop()
      sceneManager.dispose()
      scrollController.dispose()
      rendererCore.dispose()
    }
  }, [])

  return <div ref={mountRef} className="landing-canvas" aria-hidden="true" />
}

export default CanvasRoot
