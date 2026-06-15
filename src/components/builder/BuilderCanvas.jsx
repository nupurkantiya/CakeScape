import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useBuilder } from '../../context/BuilderContext';

/**
 * Builds a watertight frosting mesh from scratch using ring-by-ring construction.
 * This guarantees no gaps or tears because every quad is explicitly connected.
 *
 * Strategy:
 *  - Ring 0 (top): flat disc at y=0, radius = cakeRadius + overhang
 *  - Rings 1..N (sides): descend from y=0 downward, with the drip profile
 *    applied only to the bottom-most ring so it never tears midway
 *  - Bottom ring: open (no bottom cap needed — frosting sits on the cake)
 */
function buildFrostingGeometry(cakeRadius, overhang, dripDepth, segments) {
  // ---------- drip profile function ----------
  // Returns a value in [0,1] that describes how far a given angle drips down.
  // Uses smooth, low-frequency sine waves so adjacent vertices never diverge wildly.
  function dripProfile(angle) {
    const d = (Math.sin(angle * 5) * 0.5 + 0.5) * 0.5   // 5 bumps
            + (Math.sin(angle * 3 + 1.2) * 0.5 + 0.5) * 0.3  // 3 bumps
            + (Math.sin(angle * 8 - 0.7) * 0.5 + 0.5) * 0.2; // 8 bumps
    return d / 1.0; // already in [0,1] range
  }

  const SIDE_RINGS = 6;  // number of rings on the side (more = smoother)
  const r = cakeRadius + overhang;
  const positions = [];
  const normals   = [];
  const uvs       = [];
  const indices   = [];

  // ---------- Build rings ----------
  // Ring rows: row 0 = top edge, rows 1..SIDE_RINGS = side, descending
  const ringVertStart = []; // start index of each ring in positions array

  for (let row = 0; row <= SIDE_RINGS; row++) {
    ringVertStart.push(positions.length / 3);
    const t = row / SIDE_RINGS; // 0 at top, 1 at bottom

    for (let s = 0; s <= segments; s++) {
      const angle = (s / segments) * Math.PI * 2;
      const drip  = dripProfile(angle);

      // Y descends. At row=0 we are at y=0. At row=SIDE_RINGS we are at the
      // drip tip. We taper: rows close to top descend uniformly; bottom row
      // gets the extra drip length.
      const baseY  = -t * 0.18;            // band thickness (uniform part)
      const dripY  = -(t * t) * drip * dripDepth; // drip only kicks in near bottom
      const y = baseY + dripY;

      // Radius stays constant (no inward/outward taper needed for clean look)
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      positions.push(x, y, z);
      uvs.push(s / segments, 1 - t);
      normals.push(Math.cos(angle), 0.1, Math.sin(angle)); // approximate; recomputed below
    }
  }

  // ---------- Build top disc (cap) ----------
  // Center vertex
  const capCenterIdx = positions.length / 3;
  positions.push(0, 0, 0);
  normals.push(0, 1, 0);
  uvs.push(0.5, 0.5);

  // Top-rim vertices (row=0) already exist at ringVertStart[0]
  // Connect center to row-0 ring
  for (let s = 0; s < segments; s++) {
    const a = ringVertStart[0] + s;
    const b = ringVertStart[0] + s + 1;
    indices.push(capCenterIdx, b, a);
  }

  // ---------- Build side quads between consecutive rings ----------
  for (let row = 0; row < SIDE_RINGS; row++) {
    for (let s = 0; s < segments; s++) {
      const a = ringVertStart[row]     + s;
      const b = ringVertStart[row]     + s + 1;
      const c = ringVertStart[row + 1] + s + 1;
      const d = ringVertStart[row + 1] + s;
      // Two triangles per quad (winding: counter-clockwise when viewed from outside)
      indices.push(a, b, c);
      indices.push(a, c, d);
    }
  }

  // ---------- Assemble BufferGeometry ----------
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal',   new THREE.Float32BufferAttribute(normals,   3));
  geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs,       2));
  geo.setIndex(indices);
  geo.computeVertexNormals(); // override our rough normals with proper smooth ones

  return geo;
}

// ─────────────────────────────────────────────────────────────────────────────

const BuilderCanvas = () => {
  const mountRef = useRef(null);
  const { state } = useBuilder();

  const cakeGroupRef       = useRef(null);
  const layerGeometryRef   = useRef(null);
  const layerMaterialRef   = useRef(null);
  const frostingMeshRef    = useRef(null);
  const frostingMaterialRef= useRef(null);
  const frostingGeometryRef= useRef(null);

  useEffect(() => {
    // ── Scene ──
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f0f14);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 5, 12);
    camera.lookAt(0, 1.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // ── Lighting ──
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));

    const key = new THREE.SpotLight(0xfff5e0, 5.0);
    key.position.set(6, 14, 8);
    key.angle = Math.PI / 5;
    key.penumbra = 0.6;
    key.castShadow = true;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xc8d8ff, 1.8);
    fill.position.set(-6, 4, -4);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffd0a0, 1.2);
    rim.position.set(0, -2, -8);
    scene.add(rim);

    // ── Cake group ──
    cakeGroupRef.current = new THREE.Group();
    scene.add(cakeGroupRef.current);

    // ── Layer geometry ──
    layerGeometryRef.current = new THREE.CylinderGeometry(2, 2, 1, 64, 1);
    layerMaterialRef.current = new THREE.MeshStandardMaterial({
      color: 0x6b3421,
      roughness: 0.85,
      metalness: 0.0,
    });

    // ── Frosting geometry & material ──
    // cakeRadius=2, overhang=0.05, dripDepth=0.35, segments=128
    frostingGeometryRef.current = buildFrostingGeometry(2, 0.05, 0.35, 128);
    frostingMaterialRef.current = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.12,
      metalness: 0.0,
    });
    frostingMeshRef.current = new THREE.Mesh(
      frostingGeometryRef.current,
      frostingMaterialRef.current
    );
    frostingMeshRef.current.visible = false;
    frostingMeshRef.current.receiveShadow = true;
    frostingMeshRef.current.castShadow    = true;
    scene.add(frostingMeshRef.current);

    // ── Animate (rotation only — frosting never wiggles) ──
    let raf;
    const tick = () => {
      cakeGroupRef.current.rotation.y  += 0.004;
      frostingMeshRef.current.rotation.y = cakeGroupRef.current.rotation.y;
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
      layerGeometryRef.current?.dispose();
      layerMaterialRef.current?.dispose();
      frostingGeometryRef.current?.dispose();
      frostingMaterialRef.current?.dispose();
      renderer.dispose();
    };
  }, []);

  // ── Layers ──
  useEffect(() => {
    if (!cakeGroupRef.current) return;
    const group = cakeGroupRef.current;
    while (group.children.length > 0) group.remove(group.children[0]);

    for (let i = 0; i < state.layers; i++) {
      const mesh = new THREE.Mesh(layerGeometryRef.current, layerMaterialRef.current);
      mesh.position.y = 0.5 + i;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    // Frosting sits exactly on top of the highest layer.
    // The geometry's y=0 is the top surface, so position = top of cake.
    if (frostingMeshRef.current) {
      frostingMeshRef.current.position.y = state.layers + 0.005;
    }
  }, [state.layers]);

  // ── Flavor ──
  useEffect(() => {
    if (!layerMaterialRef.current) return;
    const colors = { chocolate: 0x6b3421, vanilla: 0xf0d9a0, strawberry: 0xf4a0b0 };
    layerMaterialRef.current.color.setHex(colors[state.flavor] ?? 0x6b3421);
  }, [state.flavor]);

  // ── Frosting ──
  useEffect(() => {
    if (!frostingMeshRef.current || !frostingMaterialRef.current) return;

    if (state.frosting === 'none') {
      frostingMeshRef.current.visible = false;
      return;
    }

    // Set color
    const frostColors = { vanilla: 0xfffaf0, chocolate: 0x2e1400, strawberry: 0xff85b3 };
    frostingMaterialRef.current.color.setHex(frostColors[state.frosting] ?? 0xffffff);
    frostingMeshRef.current.visible = true;

    // One-shot pour animation: scale from 0→1 on Y only.
    // Because origin is at the TOP, this makes the frosting grow downward.
    frostingMeshRef.current.scale.set(1, 0, 1);
    const startTime = performance.now();
    let rafId;
    const pour = (now) => {
      const t = Math.min((now - startTime) / 900, 1.0);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      frostingMeshRef.current.scale.set(1, eased, 1);
      if (t < 1) rafId = requestAnimationFrame(pour);
    };
    rafId = requestAnimationFrame(pour);
    return () => cancelAnimationFrame(rafId);
  }, [state.frosting]);

  return <div ref={mountRef} className="builder-canvas" aria-hidden="true" />;
};

export default BuilderCanvas;
