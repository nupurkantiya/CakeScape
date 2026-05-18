import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useBuilder } from '../../context/BuilderContext';

const BuilderCanvas = () => {
  const mountRef = useRef(null);
  const { state } = useBuilder();

  // We use refs to store our Three.js objects so we can access them in other useEffects
  const cakeGroupRef = useRef(null);
  const layerGeometryRef = useRef(null);
  const layerMaterialRef = useRef(null);

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
    cakeGroupRef.current = new THREE.Group();
    scene.add(cakeGroupRef.current);

    // 4. Create reusable Geometry and Material
    layerGeometryRef.current = new THREE.CylinderGeometry(2, 2, 1, 32);
    layerMaterialRef.current = new THREE.MeshStandardMaterial({ 
      color: 0x8b4513, // Chocolate brown
      roughness: 0.8 
    });

    // Note: We don't build the layers here anymore! We will do it in a second useEffect.

    // 5. Animation Loop
    let animationFrameId;
    const animate = () => {
      // Slowly rotate the entire cake group!
      if (cakeGroupRef.current) {
        cakeGroupRef.current.rotation.y += 0.005;
      }
      
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
      if (layerGeometryRef.current) layerGeometryRef.current.dispose();
      if (layerMaterialRef.current) layerMaterialRef.current.dispose();
      renderer.dispose();
    };
  }, []); // Empty dependency array = runs ONCE on mount

  // 7. Sync React State to Three.js Imperatively
  useEffect(() => {
    // Make sure our Three.js objects exist before trying to update them
    if (!cakeGroupRef.current || !layerGeometryRef.current || !layerMaterialRef.current) return;

    const group = cakeGroupRef.current;
    
    // First, remove all existing layers from the group
    while(group.children.length > 0){ 
      group.remove(group.children[0]); 
    }

    // Then, rebuild them based on the React state!
    for (let i = 0; i < state.layers; i++) {
      const mesh = new THREE.Mesh(layerGeometryRef.current, layerMaterialRef.current);
      // Stack them: 0.5, 1.5, 2.5...
      mesh.position.y = 0.5 + (i * 1);
      group.add(mesh);
    }
  }, [state.layers]); // This hook runs ONLY when state.layers changes!

  return <div ref={mountRef} className="builder-canvas" aria-hidden="true" />;
};

export default BuilderCanvas;
