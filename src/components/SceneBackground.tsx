import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Icosahedron, MeshDistortMaterial, Points, PointMaterial, TorusKnot, Stars } from "@react-three/drei";
import { useMemo, useRef, Suspense } from "react";
import * as THREE from "three";

type Variant = "hero" | "features" | "how" | "leaderboard" | "nft" | "cta";

function PoolBalls() {
  const colors = ["#22d3ee", "#a855f7", "#ec4899", "#3b82f6", "#06b6d4"];
  return (
    <>
      {colors.map((c, i) => (
        <Float key={i} speed={1 + i * 0.2} rotationIntensity={1.2} floatIntensity={2}>
          <mesh position={[(i - 2) * 2.2, Math.sin(i) * 1.2, -i * 0.6]}>
            <sphereGeometry args={[0.55, 64, 64]} />
            <MeshDistortMaterial color={c} emissive={c} emissiveIntensity={0.6} distort={0.3} speed={2} roughness={0.15} metalness={0.7} />
          </mesh>
        </Float>
      ))}
    </>
  );
}

function ParticleField({ count = 1500, color = "#22d3ee" }: { count?: number; color?: string }) {
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 12;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    return arr;
  }, [count]);
  useFrame((_, d) => {
    if (ref.current) {
      ref.current.rotation.y += d * 0.05;
      ref.current.rotation.x += d * 0.02;
    }
  });
  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial color={color} size={0.04} sizeAttenuation depthWrite={false} transparent opacity={0.85} />
    </Points>
  );
}

function WireIco() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, d) => {
    if (ref.current) {
      ref.current.rotation.x += d * 0.15;
      ref.current.rotation.y += d * 0.2;
    }
  });
  return (
    <Icosahedron ref={ref} args={[2.4, 1]}>
      <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.5} />
    </Icosahedron>
  );
}

function WireGrid() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((s) => {
    if (ref.current) {
      ref.current.position.z = ((s.clock.elapsedTime * 0.6) % 4) - 2;
    }
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2.4, 0, 0]} position={[0, -2, -2]}>
      <planeGeometry args={[40, 40, 40, 40]} />
      <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.18} />
    </mesh>
  );
}

function OrbitRings() {
  const ref = useRef<THREE.Group>(null!);
  useFrame((_, d) => {
    if (ref.current) ref.current.rotation.y += d * 0.15;
  });
  return (
    <group ref={ref}>
      {[1.8, 2.6, 3.4].map((r, i) => (
        <mesh key={i} rotation={[Math.PI / 2 + i * 0.3, i * 0.5, 0]}>
          <torusGeometry args={[r, 0.012, 16, 120]} />
          <meshBasicMaterial color={i === 1 ? "#a855f7" : "#22d3ee"} transparent opacity={0.45} />
        </mesh>
      ))}
    </group>
  );
}

function NeonKnot() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, d) => {
    if (ref.current) {
      ref.current.rotation.x += d * 0.15;
      ref.current.rotation.y += d * 0.2;
    }
  });
  return (
    <TorusKnot ref={ref} args={[1, 0.28, 180, 28]} position={[0, 0, -2]}>
      <MeshDistortMaterial color="#a855f7" emissive="#ec4899" emissiveIntensity={0.5} distort={0.18} speed={2} metalness={0.9} roughness={0.15} transparent opacity={0.5} />
    </TorusKnot>
  );
}

function SceneFor({ variant }: { variant: Variant }) {
  switch (variant) {
    case "hero":
      return (
        <>
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={2} color="#a855f7" />
          <pointLight position={[-10, -5, 5]} intensity={2} color="#22d3ee" />
          <PoolBalls />
          <ParticleField count={800} color="#a855f7" />
        </>
      );
    case "features":
      return (
        <>
          <ambientLight intensity={0.3} />
          <ParticleField count={2000} color="#22d3ee" />
        </>
      );
    case "how":
      return (
        <>
          <ambientLight intensity={0.5} />
          <pointLight position={[5, 5, 5]} color="#22d3ee" intensity={1} />
          <WireIco />
          <ParticleField count={500} color="#ec4899" />
        </>
      );
    case "leaderboard":
      return (
        <>
          <ambientLight intensity={0.5} />
          <WireGrid />
          <ParticleField count={400} color="#22d3ee" />
        </>
      );
    case "nft":
      return (
        <>
          <ambientLight intensity={0.3} />
          <pointLight position={[8, 5, 5]} intensity={1.5} color="#ec4899" />
          <pointLight position={[-8, -5, 5]} intensity={1.5} color="#22d3ee" />
          <NeonKnot />
          <OrbitRings />
        </>
      );
    case "cta":
      return (
        <>
          <Stars radius={50} depth={30} count={3000} factor={4} saturation={1} fade speed={1} />
        </>
      );
  }
}

export function SceneBackground({ variant, className = "" }: { variant: Variant; className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`}>
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 7], fov: 60 }} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}>
        <Suspense fallback={null}>
          <SceneFor variant={variant} />
        </Suspense>
      </Canvas>
    </div>
  );
}
