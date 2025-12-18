
export interface GestureData {
  isPinching: boolean;
  flickIntensity: number;
  handDetected: boolean;
  pinchCount: number;
  handPosition: [number, number, number]; // Normalized [x, y, z]
  handScale: number; // Normalized hand size for zooming
}

export enum ShapeType {
  EARTH = 0,
  HEART = 1,
  GADA = 2,
  HANUMAN_FIGURE = 3,
  DIVINE_AURA = 4
}

export const PARTICLE_COUNT = 4096;
