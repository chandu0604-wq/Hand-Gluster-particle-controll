
import React, { useMemo, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { ParticleSystem } from './ParticleSystem';
import { GestureData, ShapeType } from '../types';

interface SceneProps {
  gestureData: GestureData;
  onShapeChange?: (shape: ShapeType) => void;
  divineImageUrl: string | null;
  currentShape: ShapeType;
  isRotationActive: boolean;
}

const DivinePlane: React.FC<{ 
  imageUrl: string; 
  gestureData: GestureData;
  visible: boolean;
  isRotationActive: boolean;
}> = ({ imageUrl, gestureData, visible, isRotationActive }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const texture = useTexture(imageUrl);
  if (texture) texture.colorSpace = THREE.SRGBColorSpace;

  useFrame((state) => {
    if (!meshRef.current || !visible) return;

    const t = state.clock.getElapsedTime();
    
    // 1. Stable Float
    meshRef.current.position.y = Math.sin(t * 0.4) * 0.2;
    
    // 2. Pure Zoom (Hand Scale + Breath)
    const breath = Math.sin(t * 1.2) * 0.02;
    const zoomFactor = 1.0 + gestureData.handScale * 1.5 + breath;
    meshRef.current.scale.setScalar(zoomFactor);
    
    // 3. Smooth Rotation Transition
    let targetRotY = 0;
    if (isRotationActive) {
        if (gestureData.handDetected) {
            targetRotY = (gestureData.handPosition[0] - 0.5) * 1.5;
        } else {
            targetRotY = Math.sin(t * 0.2) * 0.3;
        }
    }
    // Lerp rotation for "Smooth Rotate" effect
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotY, 0.05);

    // 4. Hand Parallax (Minimal, for depth only)
    if (gestureData.handDetected) {
      const targetX = (gestureData.handPosition[0] - 0.5) * 1.5;
      const targetY = -(gestureData.handPosition[1] - 0.5) * 1.5;
      meshRef.current.position.x += (targetX - meshRef.current.position.x) * 0.05;
      meshRef.current.position.y += (targetY - meshRef.current.position.y) * 0.05;
    }

    if (meshRef.current.material instanceof THREE.MeshBasicMaterial) {
      meshRef.current.material.opacity = 0.8 + Math.sin(t * 2.0) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -6]} visible={visible}>
      <planeGeometry args={[10, 10]} />
      <meshBasicMaterial 
        map={texture} 
        transparent 
        opacity={0.9} 
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
};

export const Scene: React.FC<SceneProps> = ({ gestureData, onShapeChange, divineImageUrl, currentShape, isRotationActive }) => {
  return (
    <div className="absolute inset-0 z-0 bg-black">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        camera={{ position: [0, 0, 15], fov: 60 }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#010101']} />
          <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={60} />
          <ambientLight intensity={0.7} />
          <Stars radius={120} depth={60} count={5000} factor={4} saturation={1} fade speed={1} />
          
          <ParticleSystem gestureData={gestureData} onShapeChange={onShapeChange} isRotationActive={isRotationActive} />

          {divineImageUrl && (
            <Suspense fallback={null}>
              <DivinePlane 
                imageUrl={divineImageUrl} 
                gestureData={gestureData} 
                visible={currentShape === ShapeType.DIVINE_AURA} 
                isRotationActive={isRotationActive}
              />
            </Suspense>
          )}
          
          <OrbitControls 
            enablePan={false} 
            enableZoom={true} 
            enableRotate={isRotationActive}
            enableDamping={true}
            dampingFactor={0.05}
            autoRotate={false}
            maxDistance={25} 
            minDistance={8}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};
