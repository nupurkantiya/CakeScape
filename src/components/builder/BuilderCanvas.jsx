import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const BuilderCanvas = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    // 1. Setup Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111115); // Dark futuristic lab background

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 5, 12);
    camera.lookAt(0, 1.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // 2. Add Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xffaaee, 2.0); // Neon pink tint
    spotLight.position.set(5, 10, 5);
    spotLight.angle = Math.PI / 4;
    scene.add(spotLight);

    // 3. Create the Cake Group
    const cakeGroup = new THREE.Group();
    scene.add(cakeGroup);

    // 4. Create the 3 Layers
    // CylinderGeometry(radiusTop, radiusBottom, height, radialSegments)
    const layerGeometry = new THREE.CylinderGeometry(2, 2, 1, 32);
    const layerMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8b4513, // Chocolate brown
      roughness: 0.8 
    });

    // Bottom Layer (Y = 0.5 because height is 1, so center is 0.5)
    const layer1 = new THREE.Mesh(layerGeometry, layerMaterial);
    layer1.position.y = 0.5;
    cakeGroup.add(layer1);

    // Middle Layer
    const layer2 = new THREE.Mesh(layerGeometry, layerMaterial);
    layer2.position.y = 1.5;
    cakeGroup.add(layer2);

    // Top Layer
    const layer3 = new THREE.Mesh(layerGeometry, layerMaterial);
    layer3.position.y = 2.5;
    cakeGroup.add(layer3);

    // 5. Animation Loop
    let animationFrameId;
    const animate = () => {
      // Slowly rotate the entire cake group!
      cakeGroup.rotation.y += 0.005;
      
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    // 6. Handle Window Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      // Dispose Three.js memory
      layerGeometry.dispose();
      layerMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="builder-canvas" aria-hidden="true" />;
};

export default BuilderCanvas;
