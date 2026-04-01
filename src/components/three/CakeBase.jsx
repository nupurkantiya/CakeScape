import { useRef } from "react"
import { useFrame, extend } from "@react-three/fiber"
import { shaderMaterial } from "@react-three/drei"
import * as THREE from "three"

// ✅ Custom Shader Material
const FrostingMaterial = shaderMaterial(
  {
    melt: 0,
  },

  // ✅ Vertex Shader (MUST be inside backticks)
  `
  uniform float melt;
  varying vec2 vUv;

  void main() {
    vUv = uv;

    vec3 pos = position;

    // Height-based influence (top melts more)
    float heightFactor = smoothstep(0.0, 1.0, pos.y);

    // Smooth cubic easing
    float easedMelt = melt * melt * melt;

    float meltAmount = easedMelt * heightFactor;

    // Downward sag
    pos.y -= meltAmount * 0.4;

    // Outward spread
    pos.x *= 1.0 + meltAmount * 0.15;
    pos.z *= 1.0 + meltAmount * 0.15;

    // Organic uneven drips
    float noise = sin(pos.x * 8.0) * sin(pos.z * 8.0);
    pos.y -= meltAmount * noise * 0.08;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
  `,

  // ✅ Fragment Shader
  `
  varying vec2 vUv;

  void main() {
    vec3 frostingColor = vec3(1.0, 0.4, 0.7);
    gl_FragColor = vec4(frostingColor, 1.0);
  }
  `
)

// Required so JSX recognizes <frostingMaterial />
extend({ FrostingMaterial })

export function CakeBase({ scrollProgress }) {
  const frostingRef = useRef()

  useFrame(() => {
    if (!frostingRef.current) return

    const meltStart = 0.1
    const meltEnd = 0.6

    const raw =
      (scrollProgress - meltStart) / (meltEnd - meltStart)

    const clamped = Math.min(Math.max(raw, 0), 1)

    frostingRef.current.material.uniforms.melt.value = clamped
  })

  return (
    <group>
      {/* Cake Base */}
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 1, 64]} />
        <meshStandardMaterial color="#5a1b0c" />
      </mesh>

      {/* Frosting */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[1.25, 1.25, 1, 128]} />
        <frostingMaterial ref={frostingRef} />
      </mesh>
    </group>
  )
}

