/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Mic, FileText, Image as ImageIcon, Pause } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
    }
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / (audio.duration || 1)) * 100);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && audio.duration !== Infinity) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current && audioRef.current && duration > 0) {
      const rect = progressRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newProgress = (clickX / rect.width);
      const newTime = newProgress * duration;
      
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setProgress(newProgress * 100);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-[56px] w-full bg-white border border-gray-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex items-center px-4 gap-4">
      <audio ref={audioRef} className="hidden" />
      
      <div className="flex items-center gap-2 shrink-0">
        <button 
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center transition-all duration-150 ease-in-out hover:bg-indigo-700 active:scale-95"
          disabled={!audioUrl}
        >
          {isPlaying ? <Pause size={14} className="fill-current" /> : <Play size={14} className="ml-0.5 fill-current" />}
        </button>
        <button 
          onClick={handleStop}
          className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center transition-all duration-150 ease-in-out hover:bg-gray-200 active:scale-95"
          disabled={!audioUrl || (!isPlaying && progress === 0)}
        >
          <Square size={12} className="fill-current" />
        </button>
      </div>

      <div 
        ref={progressRef}
        className="flex-1 h-3 flex items-center cursor-pointer group relative"
        onClick={handleProgressClick}
        onMouseEnter={() => setIsHoveringProgress(true)}
        onMouseLeave={() => setIsHoveringProgress(false)}
      >
        <div className="w-full h-[3px] bg-gray-200 rounded-full relative">
          <div 
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
            style={{ width: `${progress}%` }}
          />
          <div 
            className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-600 transition-opacity duration-150 ease-in-out -ml-1 pointer-events-none ${isHoveringProgress ? 'opacity-100' : 'opacity-0'}`}
            style={{ left: `${progress}%` }}
          />
        </div>
      </div>

      <div className="shrink-0 font-mono text-[13px] text-gray-500 min-w-[36px]">
        {formatTime(currentTime)}
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-2">
        <button className="text-gray-400 hover:text-indigo-600 transition-colors duration-150 ease-in-out" title="Audio">
          <Mic size={20} />
        </button>
        <button className="text-gray-400 hover:text-indigo-600 transition-colors duration-150 ease-in-out" title="Transcript">
          <FileText size={20} />
        </button>
        <button className="text-gray-400 hover:text-indigo-600 transition-colors duration-150 ease-in-out" title="Visuals">
          <ImageIcon size={20} />
        </button>
      </div>
    </div>
  );
};
