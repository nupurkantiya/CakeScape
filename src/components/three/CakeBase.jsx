import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function CakeBase({ melt }) {
  const frostingRef = useRef();
  const originalPositions = useRef(null);
  console.log("melt:", melt);

useFrame((state) => {
  if (!frostingRef.current) return;

  const geometry = frostingRef.current.geometry;
  const position = geometry.attributes.position;

  if (!originalPositions.current) {
    originalPositions.current = position.array.slice();
  }

  const time = state.clock.getElapsedTime();

  for (let i = 0; i < position.count; i++) {
    const ix = i * 3;
    const iy = i * 3 + 1;
    const iz = i * 3 + 2;

    const originalX = originalPositions.current[ix];
    const originalY = originalPositions.current[iy];
    const originalZ = originalPositions.current[iz];

    // Height factor (bottom melts more)
    const heightFactor = (originalY + 0.35) / 0.7;

    // Stronger melt amount
    const meltStrength = melt * 3 * (1 - heightFactor);

    // Downward sag
    position.array[iy] = originalY - meltStrength;

    // Slight outward bulge while melting
    const radial = Math.sqrt(originalX * originalX + originalZ * originalZ);
    const bulge = melt * 0.3 * radial;

    position.array[ix] = originalX * (1 + bulge * 0.05);
    position.array[iz] = originalZ * (1 + bulge * 0.05);

    // Extra wobble for realism
    position.array[iy] +=
      Math.sin(time * 4 + originalX * 5) * melt * 0.05;
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals(); // THIS is critical
});


  return (
    <group>
      {/* Cake base */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[2, 2, 1.5, 32]} />
        <meshStandardMaterial color="#6b3e26" />
      </mesh>

      {/* Frosting */}
      <mesh ref={frostingRef} position={[0, 1, 0]}>
        <cylinderGeometry args={[2.1, 2.1, 0.7, 64, 32]} />
        <meshStandardMaterial
          color="#ff69b4"
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}