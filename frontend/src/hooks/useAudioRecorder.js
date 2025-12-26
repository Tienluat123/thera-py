import { useRef, useState, useCallback } from 'react';
import { AUDIO_CONFIG } from '../config';

/**
 * Custom hook for audio recording using Web Audio API
 * Returns audio blob in WAV format
 */
export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [level, setLevel] = useState(0);

  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const inputRef = useRef(null);
  const streamRef = useRef(null);
  const audioBufferRef = useRef([]);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const rafRef = useRef(null);

  const updateLevel = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return;
    analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
    const max = Math.max(...dataArrayRef.current);
    setLevel(Math.max(0, max - 128));
    rafRef.current = requestAnimationFrame(updateLevel);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      audioBufferRef.current = [];

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup AudioContext and nodes
      const audioContext = new AudioContext({ sampleRate: AUDIO_CONFIG.SAMPLE_RATE });
      audioContextRef.current = audioContext;

      // Create media stream source
      const input = audioContext.createMediaStreamSource(stream);
      inputRef.current = input;

      // Create script processor for audio data capture
      const processor = audioContext.createScriptProcessor(AUDIO_CONFIG.CHUNK_SIZE, 1, 1);
      processorRef.current = processor;

      // Create analyser for level metering (đo đạt vẽ biểu đồ mức âm thanh)
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      input.connect(analyser);

      // Capture audio data
      processor.onaudioprocess = (e) => {
        audioBufferRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      };

      // Connect nodes
      input.connect(processor);
      processor.connect(audioContext.destination);

      rafRef.current = requestAnimationFrame(updateLevel);
      setIsRecording(true);

      return stream;
    } catch (err) {
      throw new Error('Không thể truy cập microphone: ' + err.message);
    }
  }, [updateLevel]);

  

  const stopRecording = useCallback(() => {
    if (!isRecording) return null;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setLevel(0);

    try {
      processorRef.current?.disconnect();
      inputRef.current?.disconnect();
      analyserRef.current?.disconnect();
    } catch (e) {
      // swallow disconnect errors
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    const sampleRate = audioContextRef.current?.sampleRate || AUDIO_CONFIG.SAMPLE_RATE;
    const wavBlob = encodeWAV(audioBufferRef.current, sampleRate);

    audioContextRef.current?.close();

    setIsRecording(false);
    return wavBlob;
  }, [isRecording]);

  return {
    isRecording,
    level,
    startRecording,
    stopRecording,
  };
}

/**
 * Encode raw PCM audio data to WAV format
 */
function encodeWAV(audioBuffers, sampleRate) {
  const channelData = audioBuffers.reduce((acc, chunk) => acc.concat(Array.from(chunk)), []);
  const length = channelData.length;
  const arrayBuffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(arrayBuffer);

  // RIFF header
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * 2, true);

  let offset = 44;
  for (let i = 0; i < length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}
