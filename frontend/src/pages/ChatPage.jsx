import React, { useState, useRef, useEffect } from 'react';
import { ChatBox, Controls } from '../components';
import { useAudioRecorder, useSpeechRecognition, useSpeechSynthesis } from '../hooks';
import { chat } from '../api';
import { EMOTION_CONFIG } from '../config';
import { Mic, MicOff } from 'lucide-react';

export function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [micError, setMicError] = useState('');

  const messagesEndRef = useRef(null);

  const audioRecorder = useAudioRecorder();
  const speechRecognition = useSpeechRecognition();
  const speechSynthesis = useSpeechSynthesis();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStartRecording = async () => {
    try {
      setMicError('');
      speechRecognition.reset();
      await audioRecorder.startRecording();
      speechRecognition.start();
    } catch (error) {
      setMicError(error.message);
    }
  };

  const handleStopRecording = () => {
    speechRecognition.stop();
    const blob = audioRecorder.stopRecording();
    if (blob) {
      setAudioBlob(blob);
    }
  };

  const handleSend = async () => {
    let currentBlob = audioBlob;
    if (audioRecorder.isRecording) {
      speechRecognition.stop();
      currentBlob = audioRecorder.stopRecording();
      await new Promise((res) => setTimeout(res, 300));
    }

    const finalText = speechRecognition.getFinalTranscript()?.trim() || '';

    if (!finalText) {
      setMicError('Không nhận được lời nói. Vui lòng thử lại.');
      return;
    }

    if (!currentBlob) {
      setMicError('Vui lòng ghi âm trước khi gửi.');
      return;
    }

    setIsProcessing(true);
    setMicError('');

    try {
      const chatResult = await chat(currentBlob, finalText);
      const timestamp = new Date().toLocaleTimeString('vi-VN');

      setCurrentEmotion(chatResult.emotion);

      const userMessage = {
        id: Date.now(),
        type: 'user',
        text: chatResult.user_text,
        emotion: chatResult.emotion,
        timestamp,
      };

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: chatResult.reply_text,
        timestamp,
      };

      setMessages((prev) => [...prev, userMessage, botMessage]);
      speechSynthesis.speak(chatResult.reply_text);

      setAudioBlob(null);
      speechRecognition.reset();
    } catch (error) {
      console.error(error);
      setMicError('Lỗi kết nối backend: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // page background is light gray; spotlight lives inside ChatBox

  return (
    <div className="h-screen w-screen flex bg-gray-50 overflow-hidden">
      <div className="w-full flex">
          
        {/* Sidebar */}
        <aside className="hidden sm:flex sm:w-64 md:w-72 lg:w-80 flex-col bg-white border-r border-gray-200 shadow-sm p-6 h-full overflow-y-auto">
          <h2 className="text-2xl italic font-semibold text-gray-900">Thera.py</h2>
          <div className="mt-8 text-sm text-gray-700">
            <button className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-50 text-left">
              <span className="font-medium">Hôm nay</span>
              <span className="text-xs">▾</span>
            </button>
            <ul className="mt-4 text-sm space-y-2">
              <li className="px-3 py-2 rounded-md bg-gray-100 text-gray-700 cursor-pointer hover:bg-gray-200">Làm sao để vui lên</li>
            </ul>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 relative overflow-hidden flex flex-col h-full">
          <ChatBox
            messages={messages}
            currentEmotion={currentEmotion}
            transcript={speechRecognition.transcript}
            isRecording={audioRecorder.isRecording}
            micError={micError}
            messagesEndRef={messagesEndRef}
          />

          {/* Floating central mic button */}
          <div className="absolute inset-x-0 bottom-24 flex justify-center pointer-events-none z-50">
            <button
              onClick={audioRecorder.isRecording ? handleStopRecording : handleStartRecording}
              disabled={isProcessing}
              className={`pointer-events-auto w-20 h-20 rounded-full flex items-center justify-center shadow-2xl border-4 border-white transition-transform active:scale-95 ${
                currentEmotion && EMOTION_CONFIG[currentEmotion] 
                  ? EMOTION_CONFIG[currentEmotion].mic 
                  : 'ring-indigo-200/40 bg-white text-gray-700'
              } ${isProcessing ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-2xl'}`}
            >
              {audioRecorder.isRecording ? <MicOff size={28} /> : <Mic size={28} />}
            </button>
          </div>

          {/* Controls */}
          <div className="p-4 sm:p-6 bg-white/50 backdrop-blur-sm border-t border-gray-200">
            <Controls
              isRecording={audioRecorder.isRecording}
              isProcessing={isProcessing}
              audioBlob={audioBlob}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              onSend={handleSend}
            />
          </div>
        </main>
      </div>
    </div>
  );
}