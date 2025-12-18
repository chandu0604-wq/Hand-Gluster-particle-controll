
import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { GestureData } from '../types';

interface HandLandmarkerProps {
  onGestureUpdate: (data: GestureData) => void;
}

const MP_VERSION = "0.10.20";

export const HandLandmarkerComponent: React.FC<HandLandmarkerProps> = ({ onGestureUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'permission-denied'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  
  const pinchDetectedRef = useRef(false);
  const pinchCountRef = useRef(0);
  const lastHandPosRef = useRef<[number, number, number]>([0,0,0]);

  const initTracker = async () => {
    try {
      setStatus('loading');
      setErrorMessage('');

      const vision = await FilesetResolver.forVisionTasks(
        `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`
      );
      
      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
      });
      handLandmarkerRef.current = handLandmarker;

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 640 }, 
              height: { ideal: 480 },
              facingMode: 'user'
            } 
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().catch(e => {
                setStatus('error');
                setErrorMessage('Video play failed.');
              });
              setStatus('ready');
            };
          }
        } catch (err: any) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.message?.toLowerCase().includes('denied')) {
            setStatus('permission-denied');
          } else {
            setStatus('error');
            setErrorMessage(`Camera error: ${err.message || 'Unknown error'}`);
          }
        }
      } else {
        setStatus('error');
        setErrorMessage('Webcam access not supported.');
      }
    } catch (err: any) {
      setStatus('error');
      const detailedMsg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Tracker setup failed: ${detailedMsg}`);
    }
  };

  useEffect(() => {
    initTracker();
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
      handLandmarkerRef.current?.close();
    };
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const predict = () => {
      if (status === 'ready' && handLandmarkerRef.current && videoRef.current && videoRef.current.readyState === 4) {
        try {
          const results = handLandmarkerRef.current.detectForVideo(videoRef.current, performance.now());
          
          if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];
            
            // Pinch Detection
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            const dist = Math.sqrt(
              Math.pow(thumbTip.x - indexTip.x, 2) + 
              Math.pow(thumbTip.y - indexTip.y, 2) + 
              Math.pow(thumbTip.z - indexTip.z, 2)
            );

            const isPinching = dist < 0.05;
            if (isPinching && !pinchDetectedRef.current) {
              pinchCountRef.current += 1;
              pinchDetectedRef.current = true;
            } else if (!isPinching) {
              pinchDetectedRef.current = false;
            }

            // Hand Scale Calculation (Wrist to Middle MCP distance)
            const wrist = landmarks[0];
            const middleMcp = landmarks[9];
            const handSize = Math.sqrt(
              Math.pow(wrist.x - middleMcp.x, 2) + 
              Math.pow(wrist.y - middleMcp.y, 2)
            );
            // Normalizing hand size: typical range is 0.1 to 0.4
            const handScale = Math.min(Math.max((handSize - 0.1) / 0.3, 0), 1);

            // Flick Detection
            const palmBase = landmarks[0];
            const currentPos: [number, number, number] = [palmBase.x, palmBase.y, palmBase.z];
            const dx = currentPos[0] - lastHandPosRef.current[0];
            const dy = currentPos[1] - lastHandPosRef.current[1];
            const velocity = Math.sqrt(dx * dx + dy * dy);
            
            const flickIntensity = velocity > 0.04 ? velocity * 15 : 0;
            lastHandPosRef.current = currentPos;

            onGestureUpdate({
              isPinching,
              flickIntensity,
              handDetected: true,
              pinchCount: pinchCountRef.current,
              handPosition: currentPos,
              handScale
            });
          } else {
            onGestureUpdate({
              isPinching: false,
              flickIntensity: 0,
              handDetected: false,
              pinchCount: pinchCountRef.current,
              handPosition: [0.5, 0.5, 0],
              handScale: 0.5
            });
          }
        } catch (err) {}
      }
      animationFrameId = requestAnimationFrame(predict);
    };

    if (status === 'ready') predict();
    return () => cancelAnimationFrame(animationFrameId);
  }, [status, onGestureUpdate]);

  return (
    <div className="absolute bottom-6 right-6 w-52 h-40 border-2 border-white/20 rounded-2xl overflow-hidden shadow-2xl bg-black group transition-all hover:border-blue-500/50">
      <video ref={videoRef} className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-700 ${status === 'ready' ? 'opacity-80' : 'opacity-0'}`} muted playsInline />
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] text-blue-400 font-mono animate-pulse uppercase tracking-widest">Initialising Tracker...</span>
        </div>
      )}
      {status === 'permission-denied' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/95 p-6 text-center">
          <span className="text-[10px] text-white font-bold uppercase mb-2">Access Denied</span>
          <button onClick={() => window.location.reload()} className="text-[9px] bg-white text-black px-3 py-1.5 rounded-full font-bold font-mono">REFRESH</button>
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95 p-6 text-center overflow-auto">
          <span className="text-[8px] text-white/50 font-mono mb-4">{errorMessage}</span>
          <button onClick={() => initTracker()} className="text-[9px] border border-white/20 text-white px-3 py-1.5 rounded-full font-mono">RETRY</button>
        </div>
      )}
      {status === 'ready' && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
          <span className="text-[9px] text-white font-mono uppercase tracking-widest bg-black/60 px-2 py-0.5 rounded-md">LIVE</span>
        </div>
      )}
    </div>
  );
};
