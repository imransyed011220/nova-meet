/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

interface ProfessionalWaveformProps {
  isRecording: boolean;
  analyser?: AnalyserNode | null;
}

export const ProfessionalWaveform: React.FC<ProfessionalWaveformProps> = ({ 
  isRecording,
  analyser
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const heightsRef = useRef<number[]>(Array(40).fill(4));
  const targetHeightsRef = useRef<number[]>(Array(40).fill(4));
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const barWidth = 2;
    const gap = 4;
    const barCount = 40;
    const totalWidth = barCount * barWidth + (barCount - 1) * gap;
    
    canvas.width = totalWidth;
    canvas.height = 48; // max height 40px + some padding

    const draw = (timestamp: number) => {
      // Update targets every 100ms
      if (timestamp - lastUpdateRef.current > 100) {
        lastUpdateRef.current = timestamp;
        for (let i = 0; i < barCount; i++) {
          if (isRecording) {
            // Randomly between 4 and 40
             targetHeightsRef.current[i] = Math.random() * 36 + 4;
          } else {
             targetHeightsRef.current[i] = 4;
          }
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#4f46e5'; // indigo-600

      for (let i = 0; i < barCount; i++) {
        // Interpolate smoothly
        heightsRef.current[i] += (targetHeightsRef.current[i] - heightsRef.current[i]) * 0.2;
        
        const h = heightsRef.current[i];
        const x = i * (barWidth + gap);
        const y = (canvas.height - h) / 2;

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, h, 1);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isRecording]);

  return (
    <div className="flex justify-center items-center h-16 w-full">
      <canvas ref={canvasRef} />
    </div>
  );
};
