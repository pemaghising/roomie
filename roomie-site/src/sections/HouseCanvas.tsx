"use client";

import { Component, Suspense, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Center, ContactShadows, useGLTF } from "@react-three/drei";
import { Box3, Vector3, type Group } from "three";

type Props = {
  /** 0 → 1 as the hero scrolls; turns and lifts the house. */
  progress: { current: number };
  onReady(): void;
  onFail(): void;
};

class Guard extends Component<{ onFail(): void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFail(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function House({ progress, onReady }: Pick<Props, "progress" | "onReady">) {
  const { scene } = useGLTF("/brand/roomie.glb");
  const ref = useRef<Group>(null);
  const ready = useRef(false);
  // The model's units are arbitrary; fit its largest side to 1.55 scene units.
  const fit = useMemo(() => {
    const size = new Box3().setFromObject(scene).getSize(new Vector3());
    return 1.45 / Math.max(size.x, size.y, size.z);
  }, [scene]);

  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    if (!ready.current) { ready.current = true; onReady(); }
    const t = state.clock.elapsedTime;
    const p = progress.current;
    g.rotation.y = -0.5 + p * 0.9 + Math.sin(t * 0.4) * 0.06;
    g.position.set(0.02, -0.12 + Math.sin(t * 0.9) * 0.04 + p * 0.1, 0);
  });

  return (
    <group ref={ref}>
      <Center scale={fit}><primitive object={scene} /></Center>
    </group>
  );
}

/** The 3D Roomie house. Mounted lazily; reports failure so the PNG mascot can stand in. */
export default function HouseCanvas({ progress, onReady, onFail }: Props) {
  return (
    <Guard onFail={onFail}>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.35, 3.4], fov: 32 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <hemisphereLight args={[0xfcfbff, 0xefe9fd, 1.1]} />
        <directionalLight position={[-3, 4, 4]} intensity={2.2} />
        <directionalLight position={[3, 1, -2]} intensity={0.6} color={0xffb48a} />
        <Suspense fallback={null}>
          <House progress={progress} onReady={onReady} />
          <ContactShadows position={[0, -0.72, 0]} opacity={0.28} scale={4} blur={2.6} far={1.4} color="#3B2470" />
        </Suspense>
      </Canvas>
    </Guard>
  );
}
