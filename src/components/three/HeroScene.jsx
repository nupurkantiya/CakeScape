import { Canvas, useThree, useFrame } from "@react-three/fiber";
import CakeBase from "./CakeBase";

function CameraController({ scrollProgress }) {
  useFrame((state) => {
    // state.camera.position.z = 6 - scrollProgress * 3;
    console.log("scrollProgress:", scrollProgress);
  });

  return null;
}

function SceneContent({ scrollProgress }) {
  const melt =
    scrollProgress < 0.15
      ? 0
      : Math.min((scrollProgress - 0.15) * 2, 1);

  return <CakeBase melt={melt} />;
}



function HeroScene({ scrollProgress }) {
  return (
    <Canvas camera={{ position: [0, 2, 6], fov: 50 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1} />

      <CameraController scrollProgress={scrollProgress} />
      <SceneContent scrollProgress={scrollProgress} />
    </Canvas>
  );
}

export default HeroScene;