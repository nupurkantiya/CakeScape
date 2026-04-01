import { useScroll } from "@react-three/drei"
import { CakeBase } from "./CakeBase"

export function HeroScene() {
  const scroll = useScroll()

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} />

      <CakeBase scrollProgress={scroll.offset} />
      <CakeBase />
    </>
  )
}