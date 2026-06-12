import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useBuilder } from '../../context/BuilderContext';

// Helper to create a beautiful, STATIC 3D dripping frosting geometry
// Origin (0,0,0) will be perfectly aligned with the top cap.
function createDrippingFrostingGeometry(radius, thickness, dripLength) {
  const geo = new THREE.CylinderGeometry(radius, radius, thickness, 128, 16, false);
  
  // Shift geometry so the origin (y=0) is exactly at the top cap.
  geo.translate(0, -thickness / 2, 0);
  
  const posAttribute = geo.attributes.position;
  const vertex = new THREE.Vector3();
  
  for (let i = 0; i < posAttribute.count; i++) {
    vertex.fromBufferAttribute(posAttribute, i);
    
    // Top cap is now at y = 0. Bottom edge is at y = -thickness.
    // Only deform vertices below the top cap to prevent any tearing.
    if (vertex.y < -0.01) {
      const angle = Math.atan2(vertex.z, vertex.x);
      
      // Organic noise for drips using combined sine waves
      let drip = Math.sin(angle * 6) * 0.45 
               + Math.sin(angle * 11) * 0.3 
               + Math.sin(angle * 19) * 0.15 
               + Math.sin(angle * 29) * 0.1;
               
      drip = Math.max(0, drip); // Only drip downwards
      
      // Normalized depth from 0 (top rim) to 1 (bottom rim)
      const normalizedY = -vertex.y / thickness;
      
      // Stretch downward based on depth
      vertex.y -= drip * dripLength * normalizedY;
      
      // Slightly puff outwards at the drips to give delicious volume
      const bulge = Math.sin(normalizedY * Math.PI) * drip * 0.08;
      vertex.x += (vertex.x / radius) * bulge;
      vertex.z += (vertex.z / radius) * bulge;
      
      posAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
  }
  
  geo.computeVertexNormals();
  return geo;
}

const BuilderCanvas = () => {
  const mountRef = useRef(null);
  const { state } = useBuilder();

  // We use refs to store our Three.js objects so we can access them in other useEffects
  const cakeGroupRef = useRef(null);
  const layerGeometryRef = useRef(null);
  const layerMaterialRef = useRef(null);
  
  // Frosting Refs
  const frostingMeshRef = useRef(null);
  const frostingMaterialRef = useRef(null);
  const frostingGeometryRef = useRef(null);

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

    // 2. Add Lighting (Crucial for the frosting to look good)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xfffae6, 4.0); // Warm spotlight
    spotLight.position.set(6, 12, 8);
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.5;
    scene.add(spotLight);
    
    const fillLight = new THREE.DirectionalLight(0xaaccff, 1.5); // Cool fill light
    fillLight.position.set(-5, 3, -5);
    scene.add(fillLight);

    // 3. Create the Cake Group
    cakeGroupRef.current = new THREE.Group();
    scene.add(cakeGroupRef.current);

    // 4. Create reusable Geometry and Material for Layers
    layerGeometryRef.current = new THREE.CylinderGeometry(2, 2, 1, 64);
    layerMaterialRef.current = new THREE.MeshStandardMaterial({
      color: 0x8b4513, // Chocolate brown
      roughness: 0.9,
      metalness: 0.0
    });

    // 5. Create Procedural Frosting Geometry and Material
    // Radius: 2.02 (hugs cake), Thickness: 0.4 (top half), DripLength: 0.3
    // Origin is exactly at the top surface.
    frostingGeometryRef.current = createDrippingFrostingGeometry(2.02, 0.4, 0.3);
    frostingMaterialRef.current = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.15, // High gloss for frosting!
      metalness: 0.0,
      transparent: true,
      opacity: 1.0
    });
    
    frostingMeshRef.current = new THREE.Mesh(frostingGeometryRef.current, frostingMaterialRef.current);
    frostingMeshRef.current.visible = false;
    scene.add(frostingMeshRef.current);

    // 6. Animation Loop
    let animationFrameId;
    const animate = () => {
      // Slowly rotate the entire cake group and frosting together!
      if (cakeGroupRef.current) {
        cakeGroupRef.current.rotation.y += 0.005;
      }
      if (frostingMeshRef.current) {
        frostingMeshRef.current.rotation.y = cakeGroupRef.current.rotation.y;
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    // 7. Handle Window Resize
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
      if (frostingGeometryRef.current) frostingGeometryRef.current.dispose();
      if (frostingMaterialRef.current) frostingMaterialRef.current.dispose();
      renderer.dispose();
    };
  }, []); // Empty dependency array = runs ONCE on mount

  // 8. Sync React State (Layers) to Three.js Imperatively
  useEffect(() => {
    if (!cakeGroupRef.current || !layerGeometryRef.current || !layerMaterialRef.current) return;

    const group = cakeGroupRef.current;

    // First, remove all existing layers from the group
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    // Then, rebuild them based on the React state!
    for (let i = 0; i < state.layers; i++) {
      const mesh = new THREE.Mesh(layerGeometryRef.current, layerMaterialRef.current);
      // Stack them: 0.5, 1.5, 2.5...
      mesh.position.y = 0.5 + (i * 1);
      group.add(mesh);
    }
    
    // Reposition the frosting mesh to sit EXACTLY on the top edge of the cake
    if (frostingMeshRef.current) {
      // Cake layer height is 1. Top of highest layer is at y = state.layers
      // Because our geometry origin is perfectly at its top cap, we just set y to state.layers!
      frostingMeshRef.current.position.y = state.layers;
    }
  }, [state.layers]);

  // 9. Sync Flavor State to Three.js Material Color
  useEffect(() => {
    if (!layerMaterialRef.current) return;

    let colorHex = 0x8b4513; // default chocolate
    if (state.flavor === 'vanilla') colorHex = 0xf3e5ab;
    else if (state.flavor === 'strawberry') colorHex = 0xffb6c1;

    layerMaterialRef.current.color.setHex(colorHex);
  }, [state.flavor]);

  // 10. Sync Frosting State
  useEffect(() => {
    if (!frostingMeshRef.current || !frostingMaterialRef.current) return;

    if (state.frosting === 'none') {
      frostingMeshRef.current.visible = false;
    } else {
      frostingMeshRef.current.visible = true;
      
      // Update frosting colors based on selection
      const mat = frostingMaterialRef.current;
      if (state.frosting === 'vanilla') {
        mat.color.setHex(0xffffff);
      } else if (state.frosting === 'chocolate') {
        mat.color.setHex(0x3a1501);
      } else if (state.frosting === 'strawberry') {
        mat.color.setHex(0xff93c0);
      }
      
      // Animate the frosting pouring down using scale.y
      // Because the origin is at the top cap, scaling Y makes it grow downwards seamlessly!
      let startTime = performance.now();
      let rafId;
      const animatePour = (time) => {
        const elapsed = (time - startTime) / 800; // 800ms smooth pour
        if (elapsed < 1.0) {
          // Smooth easing
          const t = elapsed * (2 - elapsed);
          frostingMeshRef.current.scale.set(1, t, 1);
          rafId = requestAnimationFrame(animatePour);
        } else {
          frostingMeshRef.current.scale.set(1, 1, 1);
        }
      };
      rafId = requestAnimationFrame(animatePour);
      
      return () => cancelAnimationFrame(rafId);
    }
  }, [state.frosting]);

  return <div ref={mountRef} className="builder-canvas" aria-hidden="true" />;
};

export default BuilderCanvas;
