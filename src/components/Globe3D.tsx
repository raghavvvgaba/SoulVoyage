import { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const GlobeMesh = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0005;
    }
  });

  useEffect(() => {
    if (meshRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        // Sky blue background
        ctx.fillStyle = "#1a5a7a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw continents (simplified)
        ctx.fillStyle = "#2d5016";
        
        // North America
        ctx.fillRect(50, 150, 120, 100);
        // South America
        ctx.fillRect(120, 250, 80, 100);
        // Europe
        ctx.fillRect(350, 100, 100, 80);
        // Africa
        ctx.fillRect(400, 180, 120, 150);
        // Asia
        ctx.fillRect(500, 120, 200, 120);
        // Australia
        ctx.fillRect(700, 300, 80, 60);

        const texture = new THREE.CanvasTexture(canvas);
        if (meshRef.current && meshRef.current.material) {
          (meshRef.current.material as THREE.Material).map = texture;
          (meshRef.current.material as THREE.Material).needsUpdate = true;
        }
      }
    }
  }, []);

  return (
    <mesh ref={meshRef} scale={2.5}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshPhongMaterial color="#ffffff" emissive="#111111" />
    </mesh>
  );
};

export const Globe3D = () => {
  return (
    <div className="w-full h-[500px]">
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <GlobeMesh />
        <OrbitControls
          autoRotate
          autoRotateSpeed={2}
          enableZoom={true}
          enablePan={true}
        />
      </Canvas>
    </div>
  );
};

export default Globe3D;
