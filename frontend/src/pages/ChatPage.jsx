import React, { useState, useRef, useEffect } from 'react';
import { Header, ChatBox, Controls } from '../components';
import { useAudioRecorder, useSpeechRecognition, useSpeechSynthesis } from '../hooks';
import { chat } from '../api';

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

  // Auto scroll
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
    // 1️⃣ Stop recording if still recording
    let currentBlob = audioBlob;
    if (audioRecorder.isRecording) {
      speechRecognition.stop();
      currentBlob = audioRecorder.stopRecording();
      await new Promise((res) => setTimeout(res, 300));
    }

    const finalText = speechRecognition.getFinalTranscript()?.trim() || '';

    // 2️⃣ Validate
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
      // SINGLE REQUEST: Send audio + text to backend
      const chatResult = await chat(currentBlob, finalText);

      const timestamp = new Date().toLocaleTimeString('vi-VN');

      // Update emotion from response
      setCurrentEmotion(chatResult.emotion);

      // ➕ Add messages to chat
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

      // 🔊 Frontend TTS: Speak bot response
      speechSynthesis.speak(chatResult.reply_text);

      // 🔄 Reset
      setAudioBlob(null);
      speechRecognition.reset();
    } catch (error) {
      console.error(error);
      setMicError('Lỗi kết nối backend: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearMessages = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ hội thoại?')) {
      setMessages([]);
      setCurrentEmotion(null);
      setAudioBlob(null);
      speechRecognition.reset();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-slate-50 px-4 py-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <Header currentEmotion={currentEmotion} onClearMessages={handleClearMessages} />

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          <div className="lg:col-span-2">
            <ChatBox
              messages={messages}
              transcript={speechRecognition.transcript}
              isRecording={audioRecorder.isRecording}
              micError={micError}
              messagesEndRef={messagesEndRef}
            />

            <Controls
              isRecording={audioRecorder.isRecording}
              isProcessing={isProcessing}
              audioBlob={audioBlob}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              onSend={handleSend}
            />
          </div>

          <aside className="bg-white/5 border border-white/10 rounded-3xl p-4 lg:p-6 shadow-2xl backdrop-blur flex flex-col gap-4">
            <div className="text-sm text-slate-300 space-y-2">
              <h3 className="font-semibold text-emerald-200">Hướng dẫn sử dụng</h3>
              <ul className="text-xs space-y-2">
                <li>✓ Nhấn "Nhấn để nói" để bắt đầu ghi âm</li>
                <li>✓ Nói gì đó bằng tiếng Việt</li>
                <li>✓ Nhấn "Dừng ghi âm" khi xong</li>
                <li>✓ Nhấn "Gửi" để gửi lên AI</li>
                <li>✓ AI sẽ nhận diện cảm xúc & trả lời</li>
              </ul>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
