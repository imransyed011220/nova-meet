import React, { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
  analyser: AnalyserNode | null;
  isRecording: boolean;
  barColor?: string;
  barWidth?: number;
  borderRadius?: number;
}

export const WaveformVisualizer = ({ 
  analyser, 
  isRecording, 
  barColor = '#b8552f', 
  barWidth = 3, 
  borderRadius = 2 
}: WaveformVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!analyser || !isRecording) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    // We only care about lower frequencies for voice, but let's use what fits
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = 3;
      const gap = 3;
      const totalBars = 30; // Fixed at 30 bars
      
      // Calculate start x to center the 30 bars
      const totalWidth = totalBars * (barWidth + gap) - gap;
      const startX = (canvas.width - totalWidth) / 2;

      // Use a portion of the frequency spectrum for voice
      const step = Math.floor(bufferLength / 2 / totalBars) || 1;

      for (let i = 0; i < totalBars; i++) {
        const value = dataArray[i * step];
        const percent = value / 255;
        // Height between 4px and 40px
        const barHeight = 4 + (percent * 36);

        const x = startX + i * (barWidth + gap);
        const y = (canvas.height - barHeight) / 2;

        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#b8552f';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, isRecording]);

  if (!isRecording) return null;

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={50}
      className="mx-auto block"
    />
  );
};
