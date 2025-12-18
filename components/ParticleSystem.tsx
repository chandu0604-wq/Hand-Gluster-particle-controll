
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PARTICLE_COUNT, GestureData, ShapeType } from '../types';
import { vertexShader, fragmentShader } from '../shaders/particleShaders';

export const ParticleSystem: React.FC<{ 
  gestureData: GestureData; 
  onShapeChange?: (shape: ShapeType) => void;
  isRotationActive: boolean;
}> = ({ gestureData, onShapeChange, isRotationActive }) => {
  const meshRef = useRef<THREE.Points>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  
  const [currentShape, setCurrentShape] = useState<ShapeType>(ShapeType.EARTH);
  const [prevShape, setPrevShape] = useState<ShapeType>(ShapeType.EARTH);
  const [morphProgress, setMorphProgress] = useState(1.0);
  
  // Use a ref to track the smoothed rotation value persistently
  const rotationRef = useRef(0);
  const prevPinchCount = useRef(0);

  const { earthPositions, heartPositions, gadaPositions, hanumanPositions, auraPositions, sizes } = useMemo(() => {
    const earth = new Float32Array(PARTICLE_COUNT * 3);
    const heart = new Float32Array(PARTICLE_COUNT * 3);
    const gada = new Float32Array(PARTICLE_COUNT * 3);
    const hanuman = new Float32Array(PARTICLE_COUNT * 3);
    const aura = new Float32Array(PARTICLE_COUNT * 3);
    const sizeArr = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      sizeArr[i] = Math.random() * 0.12 + 0.05;

      const u = Math.random(), v = Math.random();
      const theta = 2 * Math.PI * u, phi = Math.acos(2 * v - 1);
      const er = 5.0 + (Math.random() - 0.5) * 0.2;
      earth[i * 3] = er * Math.sin(phi) * Math.cos(theta);
      earth[i * 3 + 1] = er * Math.sin(phi) * Math.sin(theta);
      earth[i * 3 + 2] = er * Math.cos(phi);

      const ht = (i / PARTICLE_COUNT) * Math.PI * 2, hs = 0.35;
      heart[i * 3] = 16 * Math.pow(Math.sin(ht), 3) * hs;
      heart[i * 3 + 1] = (13 * Math.cos(ht) - 5 * Math.cos(2 * ht) - 2 * Math.cos(3 * ht) - Math.cos(4 * ht)) * hs + 1.0;
      heart[i * 3 + 2] = (Math.random() - 0.5) * 2.0;

      const gPart = i % 5;
      if (gPart === 0) {
        gada[i * 3] = (Math.random() - 0.5) * 0.6; gada[i * 3 + 1] = (Math.random() - 0.5) * 10.0 - 2.0; gada[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
      } else {
        const r = 3.2, gt = Math.random() * Math.PI * 2, gp = Math.acos(2 * Math.random() - 1);
        gada[i * 3] = r * Math.sin(gp) * Math.cos(gt); gada[i * 3 + 1] = r * Math.cos(gp) + 5.0; gada[i * 3 + 2] = r * Math.sin(gp) * Math.sin(gt);
      }

      const hSection = i % 10;
      if (hSection < 2) {
        const t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1), r = 1.6;
        hanuman[i * 3] = r * Math.sin(p) * Math.cos(t); hanuman[i * 3 + 1] = r * Math.cos(p) + 6.0; hanuman[i * 3 + 2] = r * Math.sin(p) * Math.sin(t);
      } else if (hSection < 7) {
        const y = (Math.random() - 0.5) * 6.0, w = 2.8 - (y * 0.3), a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * w;
        hanuman[i * 3] = d * Math.cos(a); hanuman[i * 3 + 1] = y + 2.0; hanuman[i * 3 + 2] = d * Math.sin(a) * 0.6;
      } else {
        const tailT = Math.random();
        hanuman[i * 3] = -2.5 - tailT * 5.0 + Math.sin(tailT * 4.0); hanuman[i * 3 + 1] = -1.5 + Math.cos(tailT * 3.0) * 3.0; hanuman[i * 3 + 2] = Math.sin(tailT * 6.0);
      }

      const aAng = (i / PARTICLE_COUNT) * Math.PI * 2, aRad = 8.5 + (Math.random() - 0.5) * 2.0;
      aura[i * 3] = aRad * Math.cos(aAng); aura[i * 3 + 1] = aRad * Math.sin(aAng); aura[i * 3 + 2] = (Math.random() - 0.5) * 3.0;
    }
    return { earthPositions: earth, heartPositions: heart, gadaPositions: gada, hanumanPositions: hanuman, auraPositions: aura, sizes: sizeArr };
  }, []);

  useEffect(() => {
    if (gestureData.pinchCount > prevPinchCount.current) {
      setPrevShape(currentShape);
      const nextShape = (currentShape + 1) % 5;
      setCurrentShape(nextShape);
      setMorphProgress(0);
      prevPinchCount.current = gestureData.pinchCount;
      if (onShapeChange) onShapeChange(nextShape);
    }
  }, [gestureData.pinchCount, currentShape, onShapeChange]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 }, uMorphProgress: { value: 1.0 }, uTargetShape: { value: 0 },
    uPreviousShape: { value: 0 }, uExplosion: { value: 0 }, uHandPos: { value: new THREE.Vector3() },
    uRotation: { value: 0 }
  }), []);

  useFrame((state) => {
    if (materialRef.current) {
      const t = state.clock.getElapsedTime();
      materialRef.current.uniforms.uTime.value = t;
      
      const nextP = Math.min(1, morphProgress + 0.05);
      setMorphProgress(nextP);
      materialRef.current.uniforms.uMorphProgress.value = nextP;
      materialRef.current.uniforms.uTargetShape.value = currentShape;
      materialRef.current.uniforms.uPreviousShape.value = prevShape;
      materialRef.current.uniforms.uExplosion.value = gestureData.flickIntensity;
      materialRef.current.uniforms.uHandPos.value.set(
        (gestureData.handPosition[0] - 0.5) * 20, 
        -(gestureData.handPosition[1] - 0.5) * 15, 
        (gestureData.handPosition[2] - 0.5) * 10
      );

      // Enhanced Smooth Rotation Logic
      if (isRotationActive && gestureData.handDetected) {
        // Smoothly transition to hand-controlled rotation
        const targetRot = (gestureData.handPosition[0] - 0.5) * Math.PI * 4;
        rotationRef.current = THREE.MathUtils.lerp(rotationRef.current, targetRot, 0.06);
      } else {
        // Continuous neutral rotation: just increment the current value to avoid jumps
        // This ensures the transition from hand-control back to auto is seamless
        rotationRef.current += 0.006; 
      }
      materialRef.current.uniforms.uRotation.value = rotationRef.current;

      meshRef.current.scale.setScalar(0.6 + gestureData.handScale * 1.2);
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={earthPositions} itemSize={3} />
        <bufferAttribute attach="attributes-aPosEarth" count={PARTICLE_COUNT} array={earthPositions} itemSize={3} />
        <bufferAttribute attach="attributes-aPosHeart" count={PARTICLE_COUNT} array={heartPositions} itemSize={3} />
        <bufferAttribute attach="attributes-aPosGada" count={PARTICLE_COUNT} array={gadaPositions} itemSize={3} />
        <bufferAttribute attach="attributes-aPosHanuman" count={PARTICLE_COUNT} array={hanumanPositions} itemSize={3} />
        <bufferAttribute attach="attributes-aPosAura" count={PARTICLE_COUNT} array={auraPositions} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={PARTICLE_COUNT} array={sizes} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial ref={materialRef} vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};
