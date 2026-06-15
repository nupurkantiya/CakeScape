import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useBuilder } from '../../context/BuilderContext';

/* ── Flavor → hex color ────────────────────────────────────── */
const FLAVOR_COLORS = {
  chocolate:  0x6b3421,
  vanilla:    0xf0d9a0,
  strawberry: 0xf4a0b0,
  red_velvet: 0x8b1a1a,
  lemon:      0xf5f570,
  blueberry:  0x6a5acd,
  matcha:     0x7db36a,
};

/* ── Frosting → hex color ───────────────────────────────────── */
const FROSTING_COLORS = {
  buttercream:  0xfff8dc,
  chocolate:    0x3d1c02,
  strawberry:   0xff85b3,
  cream_cheese: 0xfff5e1,
  caramel:      0xc68642,
};

/* ── Watertight drip frosting geometry ─────────────────────── */
function buildFrostingGeometry(radius, dripDepth = 0.35, segments = 128) {
  const SIDE_RINGS = 6;
  const thickness = 0.22;
  const r = radius + 0.04;
  const positions = [], normals = [], uvs = [], indices = [];
  const ringStart = [];

  function dripProfile(angle) {
    return (Math.sin(angle * 5) * 0.5 + 0.5) * 0.5
         + (Math.sin(angle * 3 + 1.2) * 0.5 + 0.5) * 0.3
         + (Math.sin(angle * 8 - 0.7) * 0.5 + 0.5) * 0.2;
  }

  for (let row = 0; row <= SIDE_RINGS; row++) {
    ringStart.push(positions.length / 3);
    const t = row / SIDE_RINGS;
    for (let s = 0; s <= segments; s++) {
      const angle = (s / segments) * Math.PI * 2;
      const drip  = dripProfile(angle);
      const y = -t * thickness - (t * t) * drip * dripDepth;
      positions.push(Math.cos(angle) * r, y, Math.sin(angle) * r);
      uvs.push(s / segments, 1 - t);
      normals.push(Math.cos(angle), 0.1, Math.sin(angle));
    }
  }

  // Top cap
  const capIdx = positions.length / 3;
  positions.push(0, 0, 0); normals.push(0, 1, 0); uvs.push(0.5, 0.5);
  for (let s = 0; s < segments; s++) {
    indices.push(capIdx, ringStart[0] + s + 1, ringStart[0] + s);
  }

  // Side quads
  for (let row = 0; row < SIDE_RINGS; row++) {
    for (let s = 0; s < segments; s++) {
      const a = ringStart[row] + s, b = ringStart[row] + s + 1;
      const c = ringStart[row + 1] + s + 1, d = ringStart[row + 1] + s;
      indices.push(a, b, c, a, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal',   new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/* ── Topping config ────────────────────────────────────────── */
const TOPPING_DEFS = {
  strawberry_t: { count: 14, color: 0xd62020,  makeGeo: () => new THREE.ConeGeometry(0.09, 0.18, 8) },
  kiwi:         { count: 10, color: 0x5a9e30,  makeGeo: () => new THREE.CylinderGeometry(0.11, 0.11, 0.04, 20) },
  blueberry:    { count: 28, color: 0x2e1f6e,  makeGeo: () => new THREE.SphereGeometry(0.07, 10, 8) },
  mango:        { count: 22, color: 0xffa020,  makeGeo: () => new THREE.BoxGeometry(0.1, 0.07, 0.1) },
  choco_chips:  { count: 45, color: 0x2d1200,  makeGeo: () => new THREE.ConeGeometry(0.06, 0.09, 6) },
  white_choco:  { count: 38, color: 0xfff8f0,  makeGeo: () => new THREE.CapsuleGeometry(0.025, 0.1, 4, 8) },
  almonds:      { count: 18, color: 0xc8a97a,  makeGeo: () => new THREE.CapsuleGeometry(0.04, 0.1, 4, 8) },
  pistachios:   { count: 22, color: 0x8fb870,  makeGeo: () => new THREE.CapsuleGeometry(0.035, 0.08, 4, 8) },
  sprinkles:    { count: 110,color: null,       makeGeo: () => new THREE.CapsuleGeometry(0.03, 0.12, 4, 8) },
  marshmallows: { count: 16, color: 0xfff0f5,  makeGeo: () => new THREE.CylinderGeometry(0.07, 0.07, 0.09, 10) },
};

/* ── Exposed surfaces for topping placement ─────────────────── */
function getExposedSurfaces(layers) {
  const surfaces = [];
  const top = layers[layers.length - 1];
  surfaces.push({ y: layers.length, inner: 0, outer: top.size });
  for (let i = layers.length - 2; i >= 0; i--) {
    const thisSize  = layers[i].size;
    const aboveSize = layers[i + 1].size;
    if (thisSize > aboveSize + 0.05) {
      surfaces.push({ y: i + 1, inner: aboveSize, outer: thisSize });
    }
  }
  return surfaces;
}

function generatePositions(count, surfaces) {
  const areas = surfaces.map(s => Math.PI * (s.outer ** 2 - s.inner ** 2));
  const total = areas.reduce((a, b) => a + b, 0);
  return Array.from({ length: count }, () => {
    let r = Math.random() * total;
    let si = surfaces.length - 1;
    for (let j = 0; j < areas.length; j++) { r -= areas[j]; if (r <= 0) { si = j; break; } }
    const surf = surfaces[si];
    const angle = Math.random() * Math.PI * 2;
    const rad = Math.sqrt(Math.random() * (surf.outer ** 2 - surf.inner ** 2) + surf.inner ** 2);
    return new THREE.Vector3(Math.cos(angle) * rad, surf.y, Math.sin(angle) * rad);
  });
}

/* ── Easing ─────────────────────────────────────────────────── */
function easeOutCubic(t) { return 1 - (1 - Math.min(t, 1)) ** 3; }

/* ── Component ──────────────────────────────────────────────── */
const BuilderCanvas = () => {
  const { state } = useBuilder();
  const mountRef = useRef(null);

  const sceneRef        = useRef(null);
  const masterGroupRef  = useRef(null);
  const layerMeshesRef  = useRef([]);
  const frostingMeshesRef = useRef([]); // one entry per layer: { mesh, geo, mat } | null
  const toppingMeshes   = useRef({});
  const toppingGeos     = useRef({});
  const toppingMats     = useRef({});
  const prevToppings    = useRef([]);
  const dummy           = useRef(new THREE.Object3D());
  const prevLayerFrostings = useRef([]); // track previous frosting ids to detect changes

  /* ── Scene init (once) ──────────────────────────────────── */
  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f0f14);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 5, 14);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const key = new THREE.SpotLight(0xfff5e0, 5);
    key.position.set(6, 16, 10); key.angle = Math.PI / 5; key.penumbra = 0.6;
    key.castShadow = true; scene.add(key);
    const fill = new THREE.DirectionalLight(0xc8d8ff, 1.8);
    fill.position.set(-6, 4, -4); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffd0a0, 1.0);
    rim.position.set(0, -2, -8); scene.add(rim);

    // Master group — everything sits in here so rotation is unified
    const master = new THREE.Group();
    scene.add(master);
    masterGroupRef.current = master;

    // Pre-create all InstancedMesh objects (hidden)
    const sprinklePalette = [0xff7ba3, 0xffd56c, 0x7ef5ff, 0xffb27d, 0xb2ff95, 0xff8ae2];
    Object.entries(TOPPING_DEFS).forEach(([id, def]) => {
      const geo = def.makeGeo();
      const mat = new THREE.MeshStandardMaterial({
        color: def.color ?? 0xffffff,
        roughness: 0.45, metalness: 0.1,
        vertexColors: (id === 'sprinkles'),
      });
      const mesh = new THREE.InstancedMesh(geo, mat, def.count);
      mesh.visible = false;
      mesh.castShadow = true;

      if (id === 'sprinkles') {
        for (let i = 0; i < def.count; i++) {
          const c = new THREE.Color(sprinklePalette[Math.floor(Math.random() * sprinklePalette.length)]);
          mesh.setColorAt(i, c);
        }
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }

      dummy.current.scale.setScalar(0);
      dummy.current.updateMatrix();
      for (let i = 0; i < def.count; i++) mesh.setMatrixAt(i, dummy.current.matrix);
      mesh.instanceMatrix.needsUpdate = true;

      master.add(mesh);
      toppingMeshes.current[id] = mesh;
      toppingGeos.current[id]   = geo;
      toppingMats.current[id]   = mat;
    });

    // Animation loop
    let raf;
    const tick = () => {
      master.rotation.y += 0.004;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
      mountRef.current?.removeChild(renderer.domElement);
      Object.values(toppingGeos.current).forEach(g => g.dispose());
      Object.values(toppingMats.current).forEach(m => m.dispose());
      frostingMeshesRef.current.forEach(f => { f?.geo?.dispose(); f?.mat?.dispose(); });
      layerMeshesRef.current.forEach(m => { m.geometry.dispose(); m.material.dispose(); });
      renderer.dispose();
    };
  }, []);

  /* ── Rebuild layers + per-layer frostings when layers change ─── */
  useEffect(() => {
    const master = masterGroupRef.current;
    if (!master) return;

    // Remove old layer meshes
    layerMeshesRef.current.forEach(m => {
      master.remove(m);
      m.geometry.dispose();
      m.material.dispose();
    });
    layerMeshesRef.current = [];

    // Remove old frosting meshes
    frostingMeshesRef.current.forEach(f => {
      if (!f) return;
      master.remove(f.mesh);
      f.geo.dispose();
      f.mat.dispose();
    });
    frostingMeshesRef.current = [];

    // Build new layer meshes and frosting meshes
    const prevFrostings = prevLayerFrostings.current;

    state.layers.forEach((layer, i) => {
      // Cake layer
      const geo = new THREE.CylinderGeometry(layer.size, layer.size, 1.0, 64, 1);
      const mat = new THREE.MeshStandardMaterial({
        color: FLAVOR_COLORS[layer.flavor] ?? 0x6b3421,
        roughness: 0.85, metalness: 0,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = 0.5 + i;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      master.add(mesh);
      layerMeshesRef.current.push(mesh);

      // Per-layer frosting
      if (layer.frosting !== 'none') {
        const fGeo = buildFrostingGeometry(layer.size);
        const fMat = new THREE.MeshStandardMaterial({
          color: FROSTING_COLORS[layer.frosting] ?? 0xffffff,
          roughness: 0.12, metalness: 0,
        });
        const fMesh = new THREE.Mesh(fGeo, fMat);
        fMesh.position.y = (i + 1) + 0.005; // top of this layer
        fMesh.castShadow = true;
        master.add(fMesh);
        frostingMeshesRef.current.push({ mesh: fMesh, geo: fGeo, mat: fMat });

        // Animate only if frosting was just turned ON (changed from 'none')
        const wasNone = !prevFrostings[i] || prevFrostings[i] === 'none';
        if (wasNone) {
          fMesh.scale.set(1, 0, 1);
          const t0 = performance.now();
          let raf;
          const pour = (now) => {
            const t = easeOutCubic((now - t0) / 900);
            fMesh.scale.set(1, t, 1);
            if (t < 1) raf = requestAnimationFrame(pour);
          };
          raf = requestAnimationFrame(pour);
        }
      } else {
        frostingMeshesRef.current.push(null);
      }
    });

    // Store current frosting state for next comparison
    prevLayerFrostings.current = state.layers.map(l => l.frosting);

    // Reposition active toppings instantly to new layer heights
    const surfaces = getExposedSurfaces(state.layers);
    prevToppings.current.forEach(id => {
      const imesh = toppingMeshes.current[id];
      if (!imesh || !imesh.visible) return;
      const def = TOPPING_DEFS[id];
      const positions = generatePositions(def.count, surfaces);
      positions.forEach((pos, idx) => {
        dummy.current.position.copy(pos);
        dummy.current.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        dummy.current.scale.setScalar(0.9 + Math.random() * 0.2);
        dummy.current.updateMatrix();
        imesh.setMatrixAt(idx, dummy.current.matrix);
      });
      imesh.instanceMatrix.needsUpdate = true;
    });
  }, [state.layers]);


  /* ── Toppings ─────────────────────────────────────────── */
  useEffect(() => {
    const prev = prevToppings.current;
    const curr = state.toppings;

    // Added toppings
    const added   = curr.filter(id => !prev.includes(id));
    // Removed toppings
    const removed = prev.filter(id => !curr.includes(id));

    const surfaces = getExposedSurfaces(state.layers);

    // Show new toppings with fall animation
    added.forEach(id => {
      const imesh = toppingMeshes.current[id];
      const def   = TOPPING_DEFS[id];
      if (!imesh || !def) return;

      const positions = generatePositions(def.count, surfaces);
      const rotations = positions.map(() => ({
        x: Math.random() * Math.PI * 2,
        y: Math.random() * Math.PI * 2,
        z: Math.random() * Math.PI * 2,
      }));
      const delays = positions.map(() => Math.random() * 0.4);

      imesh.visible = true;
      // Start all instances invisible (scale 0)
      dummy.current.scale.setScalar(0);
      dummy.current.updateMatrix();
      for (let i = 0; i < def.count; i++) imesh.setMatrixAt(i, dummy.current.matrix);
      imesh.instanceMatrix.needsUpdate = true;

      const t0 = performance.now();
      let raf;
      const animate = (now) => {
        const elapsed = (now - t0) / 1000;
        let anyRunning = false;

        positions.forEach((target, i) => {
          const localT = Math.max(0, elapsed - delays[i]) / 0.7;
          if (localT >= 1) {
            dummy.current.position.copy(target);
            dummy.current.rotation.set(rotations[i].x, rotations[i].y, rotations[i].z);
            dummy.current.scale.setScalar(0.9 + Math.random() * 0.2);
          } else {
            anyRunning = true;
            const ease = easeOutCubic(localT);
            dummy.current.position.set(
              target.x, target.y + 6 * (1 - ease), target.z
            );
            dummy.current.rotation.set(rotations[i].x, rotations[i].y, rotations[i].z);
            dummy.current.scale.setScalar(ease);
          }
          dummy.current.updateMatrix();
          imesh.setMatrixAt(i, dummy.current.matrix);
        });

        imesh.instanceMatrix.needsUpdate = true;
        if (anyRunning) raf = requestAnimationFrame(animate);
      };
      raf = requestAnimationFrame(animate);
    });

    // Hide removed toppings
    removed.forEach(id => {
      const imesh = toppingMeshes.current[id];
      if (!imesh) return;
      dummy.current.scale.setScalar(0);
      dummy.current.updateMatrix();
      const def = TOPPING_DEFS[id];
      for (let i = 0; i < def.count; i++) imesh.setMatrixAt(i, dummy.current.matrix);
      imesh.instanceMatrix.needsUpdate = true;
      imesh.visible = false;
    });

    prevToppings.current = curr;
  }, [state.toppings]);

  return <div ref={mountRef} className="builder-canvas" aria-hidden="true" />;
};

export default BuilderCanvas;
