import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

function CakeBase({ scrollProgress }) {
  const meshRef = useRef();

useFrame(() => {
  if (meshRef.current) {
    meshRef.current.rotation.y = scrollProgress * Math.PI * 4;
    meshRef.current.rotation.x = 0.3;
  }
});

  return (
    <mesh ref={meshRef}>
      <cylinderGeometry args={[2, 2, 1.5, 64]} />
      <meshStandardMaterial 
        color="#ff4fd8"
        metalness={0.6}
        roughness={0.2}
      />
    </mesh>
  );
}

export default CakeBase;