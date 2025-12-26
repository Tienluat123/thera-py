import { useRef, useEffect, useState } from 'react';

/**
 * Custom hook for browser Speech Recognition (STT)
 */

// eslint-disable-next-line import/prefer-default-export

export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Trình duyệt không hỗ trợ Speech Recognition.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'vi-VN';

    recognition.onstart = () => {
      setIsListening(true);
      setError('');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      let interim = '';
      let finalText = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      finalTranscriptRef.current = finalText;
      setTranscript(interim || finalText);
    };

    recognition.onerror = (event) => {
      setError(`Lỗi: ${event.error}`);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  const start = () => {
    finalTranscriptRef.current = '';
    setTranscript('');
    recognitionRef.current?.start();
  };

  const stop = () => {
    recognitionRef.current?.stop();
  };

  const getFinalTranscript = () => finalTranscriptRef.current;

  const reset = () => {
    finalTranscriptRef.current = '';
    setTranscript('');
  };

  return {
    transcript,
    isListening,
    error,
    start,
    stop,
    getFinalTranscript,
    reset,
  };
}
