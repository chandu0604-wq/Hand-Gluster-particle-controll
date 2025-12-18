
export const vertexShader = `
  uniform float uTime;
  uniform float uMorphProgress;
  uniform int uTargetShape;
  uniform int uPreviousShape;
  uniform float uExplosion;
  uniform vec3 uHandPos;
  uniform float uRotation;
  
  attribute vec3 aPosEarth;
  attribute vec3 aPosHeart;
  attribute vec3 aPosGada;
  attribute vec3 aPosHanuman;
  attribute vec3 aPosAura;
  attribute float aSize;

  varying float vDistance;
  varying vec3 vColor;

  float cubicOut(float t) {
    float f = t - 1.0;
    return f * f * f + 1.0;
  }

  vec3 getPos(int shapeIdx) {
    if (shapeIdx == 0) return aPosEarth;
    if (shapeIdx == 1) return aPosHeart;
    if (shapeIdx == 2) return aPosGada;
    if (shapeIdx == 3) return aPosHanuman;
    return aPosAura;
  }

  vec3 getColor(int shapeIdx) {
    if (shapeIdx == 0) return vec3(0.2, 0.5, 1.0); // Earth Blue
    if (shapeIdx == 1) return vec3(1.0, 0.2, 0.4); // Heart Pink/Red
    if (shapeIdx == 2) return vec3(1.0, 0.65, 0.1); // Gold Gada
    if (shapeIdx == 3) return vec3(1.0, 0.35, 0.0); // Saffron Hanuman
    return vec3(1.0, 0.9, 0.5); // Divine Gold Aura
  }

  void main() {
    vec3 posA = getPos(uPreviousShape);
    vec3 posB = getPos(uTargetShape);

    float easedProgress = cubicOut(uMorphProgress);
    vec3 pos = mix(posA, posB, easedProgress);

    // Hanuman Tail/Breathing Logic (Shape 3)
    if (uTargetShape == 3 || uPreviousShape == 3) {
      float tFactor = (uTargetShape == 3) ? easedProgress : (1.0 - easedProgress);
      if (pos.x < -2.0) {
        pos.y += sin(uTime * 2.0 + pos.x * 0.5) * 0.4 * tFactor;
      }
      float breath = 1.0 + sin(uTime * 1.5) * 0.04 * tFactor;
      pos.xy *= breath;
    }

    // Interactive Rotation/Orbit Mood
    float rot = uRotation;
    float s = sin(rot);
    float c = cos(rot);
    pos.xz = mat2(c, -s, s, c) * pos.xz;

    // Hand interaction (Explosion)
    vec3 diff = pos - uHandPos;
    vec3 dir = normalize(diff + 0.0001); 
    float distToHand = length(diff);
    float force = uExplosion * exp(-distToHand * 0.4);
    pos += dir * force * 5.0;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float perspectiveSize = 400.0 / max(1.0, -mvPosition.z);
    gl_PointSize = aSize * perspectiveSize;
    gl_Position = projectionMatrix * mvPosition;

    vDistance = distToHand;
    vColor = mix(getColor(uPreviousShape), getColor(uTargetShape), easedProgress);
    
    // Add Earth variations (Green spots)
    if (uTargetShape == 0 && fract(pos.x * 10.0 + pos.y * 10.0) > 0.6) {
        vColor = mix(vColor, vec3(0.2, 0.8, 0.3), easedProgress);
    }
  }
`;

export const fragmentShader = `
  varying float vDistance;
  varying vec3 vColor;

  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.1, dist);
    float shimmer = 0.7 + 0.5 * sin(vDistance * 10.0 + vDistance * 3.0);
    gl_FragColor = vec4(vColor * shimmer, alpha);
  }
`;
