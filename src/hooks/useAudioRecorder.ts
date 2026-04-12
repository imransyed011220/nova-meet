/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { AppErrorType, mapBrowserErrorToAppError } from '../utils/ErrorHandler';

export type RecordingStatus = 'idle' | 'listening' | 'recording' | 'paused' | 'processing' | 'completed' | 'error';
export type RecordingMode = 'microphone' | 'system' | 'meeting';

interface UseAudioRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  onDataAvailable?: (blob: Blob) => void;
  onError: (errorType: AppErrorType) => void;
}

export const useAudioRecorder = ({ onRecordingComplete, onDataAvailable, onError }: UseAudioRecorderProps) => {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [volume, setVolume] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const volumeIntervalRef = useRef<number | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      stopTimer();
      setStatus('paused');
      if (recognitionRef.current) recognitionRef.current.stop();
    }
  }, [stopTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setStatus('recording');
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      if (recognitionRef.current) recognitionRef.current.start();
    }
  }, []);

  const cleanupAudio = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (volumeIntervalRef.current) {
      cancelAnimationFrame(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const startRecording = useCallback(async (mode: RecordingMode = 'microphone') => {
    try {
      setStatus('listening');
      setLiveTranscript('');
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        if (mode === 'system' || mode === 'meeting') {
          throw new Error('System audio is not supported in this browser. Please use Chrome.');
        }
      }

      let audioOnlyStream: MediaStream;
      let allTracks: MediaStreamTrack[] = [];

      try {
        if (mode === 'microphone') {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
          });
          allTracks = [...micStream.getTracks()];
          audioOnlyStream = new MediaStream(
            allTracks.filter(track => track.kind === 'audio')
          );
        }
        else if (mode === 'system') {
          const displayStream = await navigator.mediaDevices.getDisplayMedia({
            audio: true,
            video: true
          });

          // Stop video tracks immediately - we only need audio
          displayStream.getVideoTracks().forEach(track => track.stop());

          if (!displayStream.getAudioTracks().length) {
            displayStream.getTracks().forEach(t => t.stop());
            throw new Error('No audio detected. Make sure to check Share tab audio in the popup.');
          }

          allTracks = [...displayStream.getTracks()];
          audioOnlyStream = new MediaStream(
            displayStream.getAudioTracks()
          );
        }
        else if (mode === 'meeting') {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
          });
          const displayStream = await navigator.mediaDevices.getDisplayMedia({
            audio: true,
            video: true
          });

          // Stop video tracks immediately - we only need audio
          displayStream.getVideoTracks().forEach(track => track.stop());

          if (!displayStream.getAudioTracks().length) {
            micStream.getTracks().forEach(t => t.stop());
            displayStream.getTracks().forEach(t => t.stop());
            throw new Error('No audio detected. Make sure to check "Share tab audio" in the popup.');
          }

          // CRITICAL: Merge both audio streams into ONE track via AudioContext
          // MediaRecorder only records the first track in a MediaStream,
          // so we must mix them into a single combined track.
          const mergeCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const destination = mergeCtx.createMediaStreamDestination();

          const micSource = mergeCtx.createMediaStreamSource(micStream);
          const systemSource = mergeCtx.createMediaStreamSource(
            new MediaStream(displayStream.getAudioTracks())
          );

          micSource.connect(destination);
          systemSource.connect(destination);

          // Store the merge context so we can close it on cleanup
          audioContextRef.current = mergeCtx;

          allTracks = [...micStream.getTracks(), ...displayStream.getTracks()];
          // The destination.stream has a SINGLE audio track with both sources mixed
          audioOnlyStream = destination.stream;
        } else {
          throw new Error('Invalid recording mode');
        }
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          throw new Error('Recording cancelled. Please try again and select a tab to share.');
        }
        throw new Error(err.message || 'Recording failed to start');
      }

      // Store all tracks for cleanup later
      streamRef.current = new MediaStream(allTracks);

      // Setup Web Speech API for live transcription
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          setLiveTranscript(prev => prev + finalTranscript + interimTranscript);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
        };

        try {
          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {
          console.warn('Speech recognition failed to start:', e);
        }
      }

      // Setup Web Audio API for visualizer and volume
      const audioContext = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(audioOnlyStream);
      source.connect(analyser);
      analyser.fftSize = 256;

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Volume detection
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        if (status === 'completed' || status === 'error') return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const normalizedVolume = Math.min(100, Math.round((average / 128) * 100));
        setVolume(normalizedVolume);
        setIsSpeaking(normalizedVolume > 10);
        volumeIntervalRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

      // Small delay to ensure stream is fully stabilized
      await new Promise(resolve => setTimeout(resolve, 200));

      // Verify audio tracks are live before starting recorder
      const audioTracks = audioOnlyStream.getAudioTracks();
      if (!audioTracks.length) {
        throw new Error('No audio track found. Please enable Share tab audio when prompted.');
      }

      if (!audioTracks.every(track => track.readyState === 'live')) {
        throw new Error('Audio stream is not active. Please check your permissions.');
      }

      try {
        // Pick best supported mimeType
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '';

        // Use audio only stream for MediaRecorder
        const mediaRecorder = new MediaRecorder(
          audioOnlyStream,
          mimeType ? { mimeType } : {}
        );

        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
            if (onDataAvailable) {
              const currentBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
              onDataAvailable(currentBlob);
            }
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);

          if (audioBlob.size < 1000) {
            onError(AppErrorType.REC_TOO_SHORT);
            setStatus('error');
          } else {
            onRecordingComplete(audioBlob, recordingTime);
            setStatus('completed');
          }
          cleanupAudio();
          setVolume(0);
          setIsSpeaking(false);
        };

        mediaRecorder.onerror = (event: any) => {
          console.error('MediaRecorder error:', event.error);
          onError(AppErrorType.REC_DEVICE_ERROR);
          setStatus('error');
        };

        // Handle tracks ending (e.g. user stops sharing)
        audioOnlyStream.getTracks().forEach(track => {
          track.onended = () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              stopRecording();
            }
          };
        });

        mediaRecorder.start(1000);
        setStatus('recording');
        setRecordingTime(0);

        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);

      } catch (recorderErr) {
        console.error('Failed to start MediaRecorder:', recorderErr);
        throw recorderErr;
      }

    } catch (err: any) {
      console.error('Recording start error:', err);
      const errorType = mapBrowserErrorToAppError(err);
      onError(errorType);
      setStatus('error');
      cleanupAudio();
    }
  }, [onRecordingComplete, onDataAvailable, onError, cleanupAudio, audioUrl]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      stopTimer();
      setStatus('processing');
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  }, [stopTimer]);

  const convertToWav = async (audioBlob: Blob): Promise<Blob> => {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1;
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const buffer = new ArrayBuffer(44 + audioBuffer.length * blockAlign);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + audioBuffer.length * blockAlign, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, audioBuffer.length * blockAlign, true);

    const offset = 44;
    const channelData = [];
    for (let i = 0; i < numChannels; i++) {
      channelData.push(audioBuffer.getChannelData(i));
    }

    let index = 0;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
        view.setInt16(offset + index * bytesPerSample, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        index++;
      }
    }

    return new Blob([buffer], { type: 'audio/wav' });
  };

  function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  const requestData = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.requestData();
    }
  }, []);

  useEffect(() => {
    return () => {
      stopTimer();
      cleanupAudio();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [stopTimer, cleanupAudio, audioUrl]);

  return {
    status,
    setStatus,
    recordingTime,
    volume,
    isSpeaking,
    audioUrl,
    liveTranscript,
    startRecording,
    stopRecording,
    resumeRecording,
    pauseRecording,
    requestData,
    convertToWav,
    analyser: analyserRef.current
  };
};