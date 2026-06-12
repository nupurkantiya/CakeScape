import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useBuilder } from '../../context/BuilderContext';

// Helper to create a beautiful 3D dripping frosting geometry
function createDrippingFrostingGeometry(radius, topThickness, dripLength) {
  // Create a thin cylinder for the top of the cake
  const geo = new THREE.CylinderGeometry(radius, radius, topThickness, 128, 16, false);
  
  const posAttribute = geo.attributes.position;
  const uvAttribute = geo.attributes.uv;
  const normalAttribute = geo.attributes.normal;
  const vertex = new THREE.Vector3();
  
  for (let i = 0; i < posAttribute.count; i++) {
    vertex.fromBufferAttribute(posAttribute, i);
    const u = uvAttribute.getX(i);
    const v = uvAttribute.getY(i);
    const ny = normalAttribute.getY(i);
    
    // Check if it's a vertex on the side of the cylinder (ny is close to 0)
    if (Math.abs(ny) < 0.1) {
      // v goes from 0 (bottom edge) to 1 (top edge)
      // We want to pull the bottom edge down to create drips
      const angle = u * Math.PI * 2;
      
      // Organic noise for drips using combined sine waves
      let drip = Math.sin(angle * 7) * 0.4 
               + Math.sin(angle * 14) * 0.3 
               + Math.sin(angle * 23) * 0.2 
               + Math.sin(angle * 31) * 0.1;
               
      drip = Math.max(0, drip); // Only drip downwards
      
      // We want the drip to affect the bottom vertices (v < 0.5)
      // The closer to the bottom (v=0), the more it stretches down
      const falloff = 1.0 - v; // 1 at bottom, 0 at top
      
      if (falloff > 0) {
        // Stretch downward
        vertex.y -= drip * dripLength * falloff;
        // Slightly puff outwards at the drips to give volume
        vertex.x += (vertex.x / radius) * drip * 0.05 * falloff;
        vertex.z += (vertex.z / radius) * drip * 0.05 * falloff;
      }
    }
    
    posAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xfffae6, 3.5); // Warm spotlight
    spotLight.position.set(6, 12, 8);
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.5;
    scene.add(spotLight);
    
    const fillLight = new THREE.DirectionalLight(0xaaccff, 1.2); // Cool fill light
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
    // Radius: 2.03 (hugs the cake), Thickness: 0.2, DripLength: 0.85
    frostingGeometryRef.current = createDrippingFrostingGeometry(2.03, 0.2, 0.85);
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
      // Frosting thickness is 0.2, so its center should be at y = state.layers
      frostingMeshRef.current.position.y = state.layers;
    }
  }, [state.layers]);

  // 9. Sync Flavor State to Three.js Material Color
  useEffect(() => {
    if (!layerMaterialRef.current) return;

    let colorHex = 0x8b4513; // default chocolate
    if (state.flavor === 'vanilla') colorHex = 0xf3e5ab;
    else if (state.flavor === 'strawberry') colorHex = 0xffb6c1;

    // Smooth transition could be added here, but setHex is instant
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
      
      // Simple drop-in animation
      let startTime = performance.now();
      const targetY = state.layers;
      const startY = targetY + 2.0; // Start high up
      
      // Ensure any previous animation is cancelled
      let rafId;
      const animateDrop = (time) => {
        const elapsed = (time - startTime) / 800; // 800ms drop
        if (elapsed < 1.0) {
          // Bounce ease out
          const n1 = 7.5625;
          const d1 = 2.75;
          let t = elapsed;
          let bounce = 0;
          if (t < 1 / d1) {
            bounce = n1 * t * t;
          } else if (t < 2 / d1) {
            bounce = n1 * (t -= 1.5 / d1) * t + 0.75;
          } else if (t < 2.5 / d1) {
            bounce = n1 * (t -= 2.25 / d1) * t + 0.9375;
          } else {
            bounce = n1 * (t -= 2.625 / d1) * t + 0.984375;
          }
          
          frostingMeshRef.current.position.y = startY - ((startY - targetY) * bounce);
          rafId = requestAnimationFrame(animateDrop);
        } else {
          frostingMeshRef.current.position.y = targetY;
        }
      };
      rafId = requestAnimationFrame(animateDrop);
      
      return () => cancelAnimationFrame(rafId);
    }
  }, [state.frosting, state.layers]);

  return <div ref={mountRef} className="builder-canvas" aria-hidden="true" />;
};

export default BuilderCanvas;
