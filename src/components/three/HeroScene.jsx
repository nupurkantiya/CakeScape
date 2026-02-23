import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import CakeBase from "./CakeBase";

function HeroScene({ scrollProgress }) {
    <div className="hero-3d">
        <HeroScene scrollProgress={scrollProgress} />
    </div>
    
  return (
    <Canvas
      camera={{ position: [0, 2, 6], fov: 50 }}
      style={{ height: "100%", width: "100%" }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1} />

      <CakeBase scrollProgress={scrollProgress} />

      <OrbitControls enableZoom={false} enablePan={false} />
    </Canvas>
  );
}






export default HeroScene;