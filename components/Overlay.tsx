
import React from 'react';
import { GestureData, ShapeType } from '../types';

interface OverlayProps {
  gestureData: GestureData;
  isGenerating: boolean;
  hasDivineImage: boolean;
  currentShape: ShapeType;
  isRotationActive: boolean;
  onToggleRotation: () => void;
}

export const Overlay: React.FC<OverlayProps> = ({ 
  gestureData, 
  isGenerating, 
  hasDivineImage, 
  currentShape,
  isRotationActive,
  onToggleRotation
}) => {
  const isDivine = currentShape === ShapeType.DIVINE_AURA;
  const isHanuman = currentShape === ShapeType.HANUMAN_FIGURE;

  const modeName = 
    currentShape === ShapeType.EARTH ? 'MOTHER EARTH' : 
    currentShape === ShapeType.HEART ? 'SACRED HEART' : 
    currentShape === ShapeType.GADA ? 'SACRED GADA' : 
    currentShape === ShapeType.HANUMAN_FIGURE ? 'HANUMAN' : 'DIVINE AURA';

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <h1 className={`text-4xl font-black tracking-tighter transition-all duration-1000 ${isDivine || isHanuman ? 'text-orange-500' : 'text-white'}`}>
            HANU<span className="text-yellow-500">MAN</span>
          </h1>
          <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">
            Celestial Manifestation v3.2
          </p>
        </div>
        
        <div className="flex flex-col gap-4 items-end">
            <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-lg flex flex-col gap-2 pointer-events-auto">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${gestureData.handDetected ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 animate-pulse'}`} />
                <span className="text-[10px] font-bold font-mono uppercase">Tracking: {gestureData.handDetected ? 'OK' : 'Searching'}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${isDivine ? 'bg-yellow-500 animate-pulse shadow-[0_0_8px_orange]' : 'bg-white/20'}`} />
                <span className="text-[10px] font-bold font-mono uppercase transition-all duration-500">{modeName}</span>
              </div>
            </div>

            <button 
                onClick={onToggleRotation}
                className={`pointer-events-auto px-6 py-2 rounded-full font-mono text-[10px] font-black tracking-widest transition-all duration-500 border
                    ${isRotationActive 
                        ? 'bg-orange-500/20 border-orange-500 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]' 
                        : 'bg-white/5 border-white/20 text-white/50 hover:border-white/40 hover:text-white'}`}
            >
                ROTATE MOOD: {isRotationActive ? 'ACTIVE' : 'INACTIVE'}
            </button>
        </div>
      </div>

      {isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-50">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <h2 className="text-orange-500 font-bold tracking-[0.4em] uppercase text-xl animate-pulse">Summoning</h2>
          </div>
        </div>
      )}

      <div className="max-w-xs bg-black/20 backdrop-blur-md border border-white/10 p-5 rounded-xl">
        <h3 className="text-yellow-500 font-bold mb-3 uppercase tracking-widest text-[9px] border-b border-white/10 pb-2">Celestial Control</h3>
        <ul className="space-y-2 text-[10px] text-white/70 font-mono">
          <li className="flex gap-2">
            <span className="text-yellow-500">●</span>
            <span><span className="text-white font-bold">Pinch</span> to cycle: Earth → Heart → Gada → Hanuman → Aura.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-yellow-500">●</span>
            <span><span className="text-white font-bold">Rotation Mood</span>: {isRotationActive ? 'Hand X controls orbit' : 'Enable to orbit with hand'}.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-yellow-500">●</span>
            <span><span className="text-white font-bold">Zoom</span>: Hand scale (distance) controls depth.</span>
          </li>
          <li className="text-[8px] text-white/30 mt-4 italic uppercase">Jai Bajrang Bali</li>
        </ul>
      </div>
    </div>
  );
};
