
import React, { useState, useCallback, Suspense } from 'react';
import { Scene } from './components/Scene';
import { HandLandmarkerComponent } from './components/HandLandmarker';
import { Overlay } from './components/Overlay';
import { GestureData, ShapeType } from './types';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [gestureData, setGestureData] = useState<GestureData>({
    isPinching: false,
    flickIntensity: 0,
    handDetected: false,
    pinchCount: 0,
    handPosition: [0.5, 0.5, 0],
    handScale: 0.5
  });

  const [currentShape, setCurrentShape] = useState<ShapeType>(ShapeType.GADA);
  const [divineImageUrl, setDivineImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRotationActive, setIsRotationActive] = useState(false);

  const generateDivineImage = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `A spiritual manifestation of Lord Hanuman, entirely rendered as a dense cluster of glowing golden particles and shimmering stardust. The figure is made of millions of tiny luminous points of light, creating a transparent and ethereal silhouette. He is holding a Gada (mace) that is also dissolving into swirling fire particles. No solid skin or fabric, only a constellation of orange and saffron embers. Background is a dark deep-space void filled with a subtle cosmic nebula. Cinematic lighting, 8k, divine energy, magical particle physics style, high-resolution digital art.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            setDivineImageUrl(`data:image/png;base64,${part.inlineData.data}`);
            break;
          }
        }
      }
    } catch (error) {
      console.error("Divine Manifestation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGestureUpdate = useCallback((data: GestureData) => {
    setGestureData(data);
  }, []);

  const handleShapeChange = useCallback((shape: ShapeType) => {
    setCurrentShape(shape);
    if (shape === ShapeType.DIVINE_AURA) {
      generateDivineImage();
    }
  }, [isGenerating]);

  const toggleRotation = useCallback(() => {
    setIsRotationActive(prev => !prev);
  }, []);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none">
      <Suspense fallback={<div className="bg-black w-full h-full" />}>
        <Scene 
          gestureData={gestureData} 
          onShapeChange={handleShapeChange}
          divineImageUrl={divineImageUrl}
          currentShape={currentShape}
          isRotationActive={isRotationActive}
        />
      </Suspense>

      <HandLandmarkerComponent onGestureUpdate={handleGestureUpdate} />

      <Overlay 
        gestureData={gestureData} 
        isGenerating={isGenerating} 
        hasDivineImage={!!divineImageUrl}
        currentShape={currentShape}
        isRotationActive={isRotationActive}
        onToggleRotation={toggleRotation}
      />
    </div>
  );
};

export default App;
