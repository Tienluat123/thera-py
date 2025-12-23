import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Trash2 } from 'lucide-react';
import { detectEmotion, chatWithAudio } from './api';


function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);

  // Emotion config
  const emotionConfig = {
    happy: { color: 'bg-yellow-100 border-yellow-400', icon: '😊', label: 'Vui vẻ' },
    sad: { color: 'bg-blue-100 border-blue-400', icon: '😢', label: 'Buồn' },
    angry: { color: 'bg-red-100 border-red-400', icon: '😠', label: 'Tức giận' },
    neutral: { color: 'bg-gray-100 border-gray-400', icon: '😐', label: 'Bình thường' },
  };

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Bắt đầu ghi âm
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      alert('Không thể truy cập microphone!');
      console.error(error);
    }
  };

  // Dừng ghi âm
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Xử lý audio và gửi đến backend
  const processAudio = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);
    try {
      // Gọi API nhận diện cảm xúc
      const emotionResult = await detectEmotion(audioBlob);
      setCurrentEmotion(emotionResult.emotion);

      // Gọi API chat
      const chatResult = await chatWithAudio(audioBlob);

      // Thêm tin nhắn vào danh sách
      const userMessage = {
        id: Date.now(),
        type: 'user',
        text: chatResult.text,
        emotion: emotionResult.emotion,
        timestamp: new Date().toLocaleTimeString('vi-VN'),
      };

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: chatResult.reply,
        timestamp: new Date().toLocaleTimeString('vi-VN'),
      };

      setMessages(prev => [...prev, userMessage, botMessage]);
      setAudioBlob(null);
    } catch (error) {
      alert('❌ Lỗi kết nối backend: ' + error.message);
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Xóa toàn bộ tin nhắn
  const clearMessages = () => {
    if (confirm('Bạn có chắc muốn xóa toàn bộ tin nhắn?')) {
      setMessages([]);
      setCurrentEmotion(null);
      setAudioBlob(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">🎤 Voice Chatbot</h1>
              <p className="text-gray-600 mt-1">Nhận diện cảm xúc qua giọng nói</p>
            </div>
            <button
              onClick={clearMessages}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              <Trash2 size={18} />
              Xóa
            </button>
          </div>

          {/* Hiển thị cảm xúc hiện tại */}
          {currentEmotion && emotionConfig[currentEmotion] && (
            <div className={`mt-4 p-4 rounded-xl border-2 ${emotionConfig[currentEmotion].color}`}>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{emotionConfig[currentEmotion].icon}</span>
                <div>
                  <p className="font-semibold text-gray-800">
                    Cảm xúc: {emotionConfig[currentEmotion].label}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Box */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {/* Messages */}
          <div className="h-96 overflow-y-auto mb-4 space-y-4 bg-gray-50 rounded-xl p-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-20">
                <Mic size={48} className="mx-auto mb-4 opacity-30" />
                <p>Chưa có tin nhắn. Nhấn nút mic để bắt đầu!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    msg.type === 'user' 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-white border-2 border-gray-200 text-gray-800'
                  }`}>
                    {msg.type === 'user' && msg.emotion && emotionConfig[msg.emotion] && (
                      <div className="flex items-center gap-2 mb-2 text-sm opacity-90">
                        <span>{emotionConfig[msg.emotion].icon}</span>
                        <span>{emotionConfig[msg.emotion].label}</span>
                      </div>
                    )}
                    <p className="leading-relaxed">{msg.text}</p>
                    <p className={`text-xs mt-2 ${msg.type === 'user' ? 'text-purple-200' : 'text-gray-400'}`}>
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl font-semibold transition ${
                isRecording 
                  ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse' 
                  : 'bg-purple-500 text-white hover:bg-purple-600'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isRecording ? (
                <>
                  <MicOff size={24} />
                  Dừng ghi âm
                </>
              ) : (
                <>
                  <Mic size={24} />
                  Bắt đầu ghi âm
                </>
              )}
            </button>

            {audioBlob && !isRecording && (
              <button
                onClick={processAudio}
                disabled={isProcessing}
                className={`px-6 py-4 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition flex items-center gap-2 ${
                  isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Send size={20} />
                {isProcessing ? 'Đang xử lý...' : 'Gửi'}
              </button>
            )}
          </div>

          {isProcessing && (
            <div className="mt-4 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
              <p className="mt-2 text-gray-600">Đang kết nối backend...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>🔗 Backend: http://localhost:8000 (FastAPI)</p>
          <p>🎯 Model: Whisper + Emotion Recognition</p>
        </div>
      </div>
    </div>
  );
}

export default App;