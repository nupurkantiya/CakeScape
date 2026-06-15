import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useBuilder } from '../../context/BuilderContext';

/* ── Flavor → hex ──────────────────────────────────────────── */
const FLAVOR_COLORS = {
  chocolate: 0x6b3421, vanilla: 0xf0d9a0, strawberry: 0xf4a0b0,
  red_velvet: 0x8b1a1a, lemon: 0xf5f570, blueberry: 0x6a5acd, matcha: 0x7db36a,
};
const FROSTING_COLORS = {
  buttercream: 0xfff8dc, chocolate: 0x3d1c02, strawberry: 0xff85b3,
  cream_cheese: 0xfff5e1, caramel: 0xc68642,
};

function getLayerColor(layer) {
  if (layer.customColor) return new THREE.Color(layer.customColor);
  return new THREE.Color(FLAVOR_COLORS[layer.flavor] ?? 0x6b3421);
}

/* ── Watertight frosting geometry ──────────────────────────── */
function buildFrostingGeometry(radius, dripDepth = 0.35, segments = 128) {
  const SIDE_RINGS = 6, thickness = 0.22, r = radius + 0.04;
  const positions = [], normals = [], uvs = [], indices = [], ringStart = [];
  const dripProfile = (a) =>
    (Math.sin(a * 5) * 0.5 + 0.5) * 0.5 + (Math.sin(a * 3 + 1.2) * 0.5 + 0.5) * 0.3
    + (Math.sin(a * 8 - 0.7) * 0.5 + 0.5) * 0.2;
  for (let row = 0; row <= SIDE_RINGS; row++) {
    ringStart.push(positions.length / 3);
    const t = row / SIDE_RINGS;
    for (let s = 0; s <= segments; s++) {
      const a = (s / segments) * Math.PI * 2, drip = dripProfile(a);
      const y = -t * thickness - t * t * drip * dripDepth;
      positions.push(Math.cos(a) * r, y, Math.sin(a) * r);
      uvs.push(s / segments, 1 - t);
      normals.push(Math.cos(a), 0.1, Math.sin(a));
    }
  }
  const capIdx = positions.length / 3;
  positions.push(0, 0, 0); normals.push(0, 1, 0); uvs.push(0.5, 0.5);
  for (let s = 0; s < segments; s++) indices.push(capIdx, ringStart[0] + s + 1, ringStart[0] + s);
  for (let row = 0; row < SIDE_RINGS; row++) {
    for (let s = 0; s < segments; s++) {
      const a = ringStart[row] + s, b = ringStart[row] + s + 1;
      const c = ringStart[row + 1] + s + 1, d = ringStart[row + 1] + s;
      indices.push(a, b, c, a, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/* ── Topping config ────────────────────────────────────────── */
const TOPPING_DEFS = {
  strawberry_t: { count: 14, color: 0xd62020, makeGeo: () => new THREE.ConeGeometry(0.09, 0.18, 8) },
  kiwi: { count: 10, color: 0x5a9e30, makeGeo: () => new THREE.CylinderGeometry(0.11, 0.11, 0.04, 20) },
  blueberry: { count: 28, color: 0x2e1f6e, makeGeo: () => new THREE.SphereGeometry(0.07, 10, 8) },
  mango: { count: 22, color: 0xffa020, makeGeo: () => new THREE.BoxGeometry(0.1, 0.07, 0.1) },
  choco_chips: { count: 45, color: 0x2d1200, makeGeo: () => new THREE.ConeGeometry(0.06, 0.09, 6) },
  white_choco: { count: 38, color: 0xfff8f0, makeGeo: () => new THREE.CapsuleGeometry(0.025, 0.1, 4, 8) },
  almonds: { count: 18, color: 0xc8a97a, makeGeo: () => new THREE.CapsuleGeometry(0.04, 0.1, 4, 8) },
  pistachios: { count: 22, color: 0x8fb870, makeGeo: () => new THREE.CapsuleGeometry(0.035, 0.08, 4, 8) },
  sprinkles: { count: 110, color: null, makeGeo: () => new THREE.CapsuleGeometry(0.03, 0.12, 4, 8) },
  marshmallows: { count: 16, color: 0xfff0f5, makeGeo: () => new THREE.CylinderGeometry(0.07, 0.07, 0.09, 10) },
};

/* ── Surface helpers ───────────────────────────────────────── */
function getExposedSurfaces(layers) {
  const surfaces = [];
  const top = layers[layers.length - 1];
  surfaces.push({ y: layers.length, inner: 0, outer: top.size });
  for (let i = layers.length - 2; i >= 0; i--) {
    if (layers[i].size > layers[i + 1].size + 0.05)
      surfaces.push({ y: i + 1, inner: layers[i + 1].size, outer: layers[i].size });
  }
  return surfaces;
}
function generatePositions(count, surfaces) {
  const areas = surfaces.map(s => Math.PI * (s.outer ** 2 - s.inner ** 2));
  const total = areas.reduce((a, b) => a + b, 0);
  return Array.from({ length: count }, () => {
    let r = Math.random() * total; let si = surfaces.length - 1;
    for (let j = 0; j < areas.length; j++) { r -= areas[j]; if (r <= 0) { si = j; break; } }
    const surf = surfaces[si];
    const angle = Math.random() * Math.PI * 2;
    const rad = Math.sqrt(Math.random() * (surf.outer ** 2 - surf.inner ** 2) + surf.inner ** 2);
    return new THREE.Vector3(Math.cos(angle) * rad, surf.y, Math.sin(angle) * rad);
  });
}

/* ── Chef hand ─────────────────────────────────────────────── */
function buildChefHand(scene) {
  const S = 3.8;
  const group = new THREE.Group();
  const wristGroup = new THREE.Group();
  const fingerGroups = [];

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf0c098, roughness: 0.68 });
  const nailMat = new THREE.MeshStandardMaterial({ color: 0xf8dcc8, roughness: 0.5 });
  const sleeveMat = new THREE.MeshStandardMaterial({ color: 0xf8f8f8, roughness: 0.88 });

  // Sleeve along X
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.125 * S, 0.105 * S, 0.9 * S, 14), sleeveMat);
  sleeve.rotation.z = Math.PI / 2;
  sleeve.position.x = 0.48 * S;
  group.add(sleeve);

  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.108 * S, 0.105 * S, 0.12 * S, 14), skinMat);
  cuff.rotation.z = Math.PI / 2;
  cuff.position.x = 0.06 * S;
  group.add(cuff);

  // Wrist joint sphere
  const wristJoint = new THREE.Mesh(new THREE.SphereGeometry(0.09 * S, 12, 12), skinMat);
  wristJoint.position.set(0, 0, 0);
  wristGroup.add(wristJoint);

  group.add(wristGroup);

  // Palm base — oriented palm-down (faces -Y)
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.26 * S, 0.10 * S, 0.30 * S), skinMat);
  palm.position.set(-0.08 * S, -0.05 * S, 0.01 * S);
  wristGroup.add(palm);

  // Back of hand (smooth curved dome)
  const backOfHand = new THREE.Mesh(new THREE.SphereGeometry(0.17 * S, 16, 12), skinMat);
  backOfHand.scale.set(1.1, 0.48, 0.88);
  backOfHand.position.set(-0.06 * S, -0.02 * S, 0.01 * S);
  wristGroup.add(backOfHand);

  // Rounded palm edges
  [-0.14 * S, 0.14 * S].forEach(zOff => {
    const edge = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * S, 0.05 * S, 0.26 * S, 10), skinMat);
    edge.rotation.z = Math.PI / 2;
    edge.position.set(-0.08 * S, -0.05 * S, zOff);
    wristGroup.add(edge);
  });

  // Four fingers — 3 segments each, connected by knuckle spheres
  const fingerSpecs = [
    // Index
    { x: -0.21 * S, z: -0.10 * S, r: 0.027 * S, s: [0.10 * S, 0.08 * S, 0.06 * S], c: [0.4, 0.6, 0.4] },
    // Middle
    { x: -0.23 * S, z: -0.03 * S, r: 0.030 * S, s: [0.11 * S, 0.09 * S, 0.07 * S], c: [0.3, 0.55, 0.4] },
    // Ring
    { x: -0.21 * S, z: 0.03 * S, r: 0.028 * S, s: [0.10 * S, 0.085 * S, 0.065 * S], c: [0.35, 0.55, 0.4] },
    // Pinky
    { x: -0.18 * S, z: 0.10 * S, r: 0.023 * S, s: [0.085 * S, 0.07 * S, 0.05 * S], c: [0.45, 0.6, 0.4] },
  ];

  fingerSpecs.forEach(({ x, z, r, s, c }) => {
    const root = new THREE.Group();
    root.position.set(x, -0.06 * S, z);
    root.rotation.z = -0.25; // base angle pointing forward/down

    // Knuckle sphere
    const knuckle = new THREE.Mesh(new THREE.SphereGeometry(r * 1.15, 8, 8), skinMat);
    root.add(knuckle);

    const seg0 = new THREE.Mesh(new THREE.CapsuleGeometry(r, s[0], 4, 8), skinMat);
    seg0.position.y = -s[0] * 0.5;
    root.add(seg0);

    const mid = new THREE.Group();
    mid.position.y = -s[0];
    mid.rotation.z = c[1];

    const midJoint = new THREE.Mesh(new THREE.SphereGeometry(r * 1.0, 8, 8), skinMat);
    mid.add(midJoint);

    const seg1 = new THREE.Mesh(new THREE.CapsuleGeometry(r * 0.88, s[1], 4, 8), skinMat);
    seg1.position.y = -s[1] * 0.5;
    mid.add(seg1);

    const tipG = new THREE.Group();
    tipG.position.y = -s[1];
    tipG.rotation.z = c[2];

    const tipJoint = new THREE.Mesh(new THREE.SphereGeometry(r * 0.85, 8, 8), skinMat);
    tipG.add(tipJoint);

    const seg2 = new THREE.Mesh(new THREE.CapsuleGeometry(r * 0.72, s[2], 4, 8), skinMat);
    seg2.position.y = -s[2] * 0.5;
    tipG.add(seg2);

    const nail = new THREE.Mesh(new THREE.BoxGeometry(r * 1.1, r * 0.25, s[2] * 0.5), nailMat);
    nail.position.set(r * 0.55, -s[2] * 0.48, 0);
    tipG.add(nail);

    mid.add(tipG);
    root.add(mid);

    wristGroup.add(root);
    root.userData.baseCurl = -0.25; // store so animation can restore it
    fingerGroups.push(root);
  });

  // Thumb
  const tRoot = new THREE.Group();
  tRoot.position.set(-0.06 * S, -0.06 * S, -0.16 * S);
  tRoot.rotation.set(0.2, 0.6, -0.5);

  const tKnuckle = new THREE.Mesh(new THREE.SphereGeometry(0.04 * S, 8, 8), skinMat);
  tRoot.add(tKnuckle);

  const ts1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.036 * S, 0.12 * S, 4, 8), skinMat);
  ts1.position.y = -0.06 * S;
  tRoot.add(ts1);

  const tMid = new THREE.Group();
  tMid.position.y = -0.12 * S;
  tMid.rotation.x = 0.4;

  const tJoint = new THREE.Mesh(new THREE.SphereGeometry(0.03 * S, 8, 8), skinMat);
  tMid.add(tJoint);

  const ts2 = new THREE.Mesh(new THREE.CapsuleGeometry(0.028 * S, 0.09 * S, 4, 8), skinMat);
  ts2.position.y = -0.045 * S;
  tMid.add(ts2);
  tRoot.add(tMid);
  wristGroup.add(tRoot);

  // Orientation
  group.rotation.set(-0.25, 0.15, 0.6);
  group.position.set(12, 5, 0);
  group.visible = false;
  scene.add(group);

  return { group, wristGroup, fingerGroups };
}

function easeOutCubic(t) { return 1 - (1 - Math.min(t, 1)) ** 3; }
function lerp(a, b, t) { return a + (b - a) * t; }

/* ── Component ─────────────────────────────────────────────── */
const BuilderCanvas = () => {
  const { state } = useBuilder();
  const mountRef = useRef(null);

  const masterGroupRef = useRef(null);
  const layerMeshesRef = useRef([]);
  const frostingMeshesRef = useRef([]);
  const toppingMeshes = useRef({});
  const toppingGeos = useRef({});
  const toppingMats = useRef({});
  const prevToppings = useRef([]);
  const prevLayerFrostings = useRef([]);
  const dummy = useRef(new THREE.Object3D());

  // Chef hand refs
  const handGroupRef = useRef(null);
  const wristGroupRef = useRef(null);
  const fingerGroupsRef = useRef([]);
  const handAnimRef = useRef({ active: false, phase: 'idle', startTime: 0, targetY: 4 });

  /* ── Scene init ────────────────────────────────────────── */
  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f0f14);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 5, 14);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // OrbitControls — rotate / zoom / pan
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;
    controls.minDistance = 5;
    controls.maxDistance = 30;
    controls.target.set(0, 2, 0);
    // Pause auto-rotate while user drags
    controls.addEventListener('start', () => { controls.autoRotate = false; });
    controls.addEventListener('end', () => { controls.autoRotate = true; });

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const key = new THREE.SpotLight(0xfff5e0, 5);
    key.position.set(6, 16, 10); key.angle = Math.PI / 5; key.penumbra = 0.6;
    key.castShadow = true; scene.add(key);
    const fill = new THREE.DirectionalLight(0xc8d8ff, 1.8);
    fill.position.set(-6, 4, -4); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffd0a0, 1.0);
    rim.position.set(0, -2, -8);
    scene.add(rim);

    // Master group
    const master = new THREE.Group();
    scene.add(master);
    masterGroupRef.current = master;

    // Topping instanced meshes
    const sprinklePalette = [0xff7ba3, 0xffd56c, 0x7ef5ff, 0xffb27d, 0xb2ff95, 0xff8ae2];
    Object.entries(TOPPING_DEFS).forEach(([id, def]) => {
      const geo = def.makeGeo();
      const mat = new THREE.MeshStandardMaterial({
        color: def.color ?? 0xffffff, roughness: 0.45, metalness: 0.1,
        vertexColors: id === 'sprinkles',
      });
      const mesh = new THREE.InstancedMesh(geo, mat, def.count);
      mesh.visible = false; mesh.castShadow = true;
      if (id === 'sprinkles') {
        for (let i = 0; i < def.count; i++)
          mesh.setColorAt(i, new THREE.Color(sprinklePalette[Math.floor(Math.random() * sprinklePalette.length)]));
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }
      dummy.current.scale.setScalar(0); dummy.current.updateMatrix();
      for (let i = 0; i < def.count; i++) mesh.setMatrixAt(i, dummy.current.matrix);
      mesh.instanceMatrix.needsUpdate = true;
      master.add(mesh);
      toppingMeshes.current[id] = mesh; toppingGeos.current[id] = geo; toppingMats.current[id] = mat;
    });

    // Chef hand (in scene world space, not master group)
    const { group: handGroup, wristGroup, fingerGroups } = buildChefHand(scene);
    handGroupRef.current = handGroup;
    wristGroupRef.current = wristGroup;
    fingerGroupsRef.current = fingerGroups;

    // Animation loop
    let raf;
    const tick = () => {
      controls.update();
      camera.updateMatrixWorld(true);

      // ── Hand animation state machine ──
      const anim = handAnimRef.current;
      if (anim.active) {
        const hg = handGroupRef.current;
        const wg = wristGroupRef.current;
        const fgs = fingerGroupsRef.current;
        const t = (performance.now() - anim.startTime) / 1000;
        const ty = anim.targetY;

        // Calculate horizontal direction and screen-right vector in horizontal plane
        const camX = camera.position.x;
        const camZ = camera.position.z;
        const len = Math.sqrt(camX * camX + camZ * camZ) || 1;
        const rightX = camZ / len;
        const rightZ = -camX / len;
        const right = new THREE.Vector3(rightX, 0, rightZ);

        // Center position above the cake
        const targetCenter = new THREE.Vector3(0, ty, 0);

        // Calculate yaw (horizontal camera angle) so hand rotates around cake to stay on right side.
        // Add static natural slant tilt (sleeve pointing upper-right).
        const yaw = Math.atan2(camX, camZ);
        hg.rotation.set(0.18, yaw, 0.35);

        if (anim.phase === 'entering') {
          // Slide in from right (12 units) to over the cake (0.8 units)
          const ease = easeOutCubic(Math.min(t / 0.7, 1));
          const dist = lerp(12, 0.8, ease);
          hg.position.copy(targetCenter).addScaledVector(right, dist);
          if (t >= 0.7) { anim.phase = 'sprinkling'; anim.startTime = performance.now(); }

        } else if (anim.phase === 'sprinkling') {
          // Wrist tossing motion: rotate side-to-side (local Y) and slight dip (local Z)
          wg.rotation.y = Math.sin(t * Math.PI * 2.0) * 0.22;
          wg.rotation.z = Math.sin(t * Math.PI * 3.5) * 0.10;

          // Hand bounces slightly up-down
          const bounce = Math.sin(t * Math.PI * 3) * 0.15;
          hg.position.copy(targetCenter)
            .addScaledVector(right, 0.8)
            .addScaledVector(new THREE.Vector3(0, 1, 0), bounce);

          // Fingers curl/flick on local Z axis (toward and away from palm)
          fgs.forEach((fg, i) => {
            const phase = i * 0.45;
            const wave = Math.sin(t * Math.PI * 5.5 + phase) * 0.5 + 0.5;
            fg.rotation.z = (fg.userData.baseCurl || -0.25) + wave * 0.5;
          });

          if (t >= 1.5) { anim.phase = 'exiting'; anim.startTime = performance.now(); }

        } else if (anim.phase === 'exiting') {
          // Slide out along the horizontal right vector
          const ease = Math.min(t / 0.55, 1) ** 2;
          const dist = lerp(0.8, 12, ease);
          hg.position.copy(targetCenter).addScaledVector(right, dist);

          fgs.forEach(fg => { fg.rotation.z = lerp(fg.rotation.z, fg.userData.baseCurl || -0.25, 0.15); });
          wg.rotation.set(0, 0, 0);

          if (t >= 0.55) {
            hg.visible = false;
            fgs.forEach(fg => { fg.rotation.z = fg.userData.baseCurl || -0.25; });
            anim.active = false; anim.phase = 'idle';
          }
        }
      }

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
      controls.dispose();
      mountRef.current?.removeChild(renderer.domElement);
      Object.values(toppingGeos.current).forEach(g => g.dispose());
      Object.values(toppingMats.current).forEach(m => m.dispose());
      frostingMeshesRef.current.forEach(f => { f?.geo?.dispose(); f?.mat?.dispose(); });
      layerMeshesRef.current.forEach(m => { m.geometry.dispose(); m.material.dispose(); });
      renderer.dispose();
    };
  }, []);

  /* ── Rebuild layers + per-layer frostings ─────────────── */
  useEffect(() => {
    const master = masterGroupRef.current;
    if (!master) return;

    layerMeshesRef.current.forEach(m => { master.remove(m); m.geometry.dispose(); m.material.dispose(); });
    layerMeshesRef.current = [];
    frostingMeshesRef.current.forEach(f => { if (!f) return; master.remove(f.mesh); f.geo.dispose(); f.mat.dispose(); });
    frostingMeshesRef.current = [];

    const prevFrostings = prevLayerFrostings.current;

    state.layers.forEach((layer, i) => {
      const geo = new THREE.CylinderGeometry(layer.size, layer.size, 1.0, 64, 1);
      const mat = new THREE.MeshStandardMaterial({ color: getLayerColor(layer), roughness: 0.85 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = 0.5 + i;
      mesh.castShadow = mesh.receiveShadow = true;
      master.add(mesh);
      layerMeshesRef.current.push(mesh);

      if (layer.frosting !== 'none') {
        const fGeo = buildFrostingGeometry(layer.size);
        const fMat = new THREE.MeshStandardMaterial({ color: FROSTING_COLORS[layer.frosting] ?? 0xffffff, roughness: 0.12 });
        const fMesh = new THREE.Mesh(fGeo, fMat);
        fMesh.position.y = (i + 1) + 0.005;
        fMesh.castShadow = true;
        master.add(fMesh);
        frostingMeshesRef.current.push({ mesh: fMesh, geo: fGeo, mat: fMat });

        const wasNone = !prevFrostings[i] || prevFrostings[i] === 'none';
        if (wasNone) {
          fMesh.scale.set(1, 0, 1);
          const t0 = performance.now(); let raf;
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

    prevLayerFrostings.current = state.layers.map(l => l.frosting);

    // Update hand target height
    if (handAnimRef.current) handAnimRef.current.targetY = state.layers.length + 2.2;

    // Reposition active toppings
    const surfaces = getExposedSurfaces(state.layers);
    prevToppings.current.forEach(id => {
      const imesh = toppingMeshes.current[id];
      if (!imesh?.visible) return;
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

  /* ── Toppings + chef hand animation ───────────────────── */
  useEffect(() => {
    const prev = prevToppings.current;
    const curr = state.toppings;
    const added = curr.filter(id => !prev.includes(id));
    const removed = prev.filter(id => !curr.includes(id));
    const surfaces = getExposedSurfaces(state.layers);

    added.forEach(id => {
      const imesh = toppingMeshes.current[id];
      const def = TOPPING_DEFS[id];
      if (!imesh || !def) return;

      const positions = generatePositions(def.count, surfaces);
      const rotations = positions.map(() => ({
        x: Math.random() * Math.PI * 2, y: Math.random() * Math.PI * 2, z: Math.random() * Math.PI * 2,
      }));
      const delays = positions.map(() => Math.random() * 0.5);

      imesh.visible = true;
      dummy.current.scale.setScalar(0); dummy.current.updateMatrix();
      for (let i = 0; i < def.count; i++) imesh.setMatrixAt(i, dummy.current.matrix);
      imesh.instanceMatrix.needsUpdate = true;

      // Trigger chef hand animation
      const hg = handGroupRef.current;
      if (hg) {
        const targetY = state.layers.length + 2.2;
        hg.visible = true;
        // Reset wrist + fingers to neutral before animating
        if (wristGroupRef.current) wristGroupRef.current.rotation.set(0, 0, 0);
        fingerGroupsRef.current.forEach(fg => { fg.rotation.z = fg.userData.baseCurl || -0.25; });
        handAnimRef.current = { active: true, phase: 'entering', startTime: performance.now(), targetY };
      }

      // Toppings fall with delay (synced to sprinkling phase ~0.7s in)
      const t0 = performance.now();
      let raf;
      const animate = (now) => {
        const elapsed = (now - t0) / 1000;
        let running = false;
        positions.forEach((target, i) => {
          const localT = Math.max(0, elapsed - 0.7 - delays[i]) / 0.6; // start after hand enters
          if (localT >= 1) {
            dummy.current.position.copy(target);
            dummy.current.rotation.set(rotations[i].x, rotations[i].y, rotations[i].z);
            dummy.current.scale.setScalar(0.9 + Math.random() * 0.2);
          } else if (localT > 0) {
            running = true;
            const ease = easeOutCubic(localT);
            dummy.current.position.set(target.x, target.y + 5 * (1 - ease), target.z);
            dummy.current.rotation.set(rotations[i].x, rotations[i].y, rotations[i].z);
            dummy.current.scale.setScalar(ease);
          } else {
            running = true;
            dummy.current.scale.setScalar(0);
          }
          dummy.current.updateMatrix();
          imesh.setMatrixAt(i, dummy.current.matrix);
        });
        imesh.instanceMatrix.needsUpdate = true;
        if (running || elapsed < 0.7) raf = requestAnimationFrame(animate);
      };
      raf = requestAnimationFrame(animate);
    });

    removed.forEach(id => {
      const imesh = toppingMeshes.current[id];
      if (!imesh) return;
      dummy.current.scale.setScalar(0); dummy.current.updateMatrix();
      for (let i = 0; i < TOPPING_DEFS[id].count; i++) imesh.setMatrixAt(i, dummy.current.matrix);
      imesh.instanceMatrix.needsUpdate = true;
      imesh.visible = false;
    });

    prevToppings.current = curr;
  }, [state.toppings]);

  return <div ref={mountRef} className="builder-canvas" aria-hidden="true" />;
};

export default BuilderCanvas;
