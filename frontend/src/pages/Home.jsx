import React from 'react';
import { Link } from 'react-router-dom';

export function Home() {
  return (
    <div className="flex h-screen w-full bg-[#fdfcfd] overflow-hidden">
      {/* Sidebar bên trái */}
      <aside className="w-64 border-r border-gray-100 flex flex-col justify-between p-10 z-10 bg-white/50 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>Thera.py</h1>
        </div>
        <Link 
          to="/visualize" 
          className="text-gray-600 text-lg leading-relaxed hover:underline"
        >
          Visualize your mood
        </Link>
      </aside>

      {/* Vùng nội dung chính */}
      <main className="relative flex-1 flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-100 via-purple-100 to-blue-50">
        {/* Các đốm màu loang (Mesh Gradient Background) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-white/20 blur-[100px]" />
          <div className="absolute bottom-[-5%] left-[20%] w-[400px] h-[400px] rounded-full bg-white/10 blur-[120px]" />
        </div>

        <div className="z-10 w-full max-w-3xl flex flex-col items-center text-center space-y-12">
          {/* Title & Description */}
          <div className="space-y-4">
            <h2 className="text-5xl font-bold text-gray-800" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
              Thera.py
            </h2>
            <p className="text-xl text-gray-700">
              Chatbot AI nhận diện cảm xúc bằng giọng nói
            </p>
            <p className="text-sm text-gray-600">
              Công nghệ STT/TTS + Emotion Detection + LLM
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-3 gap-6 w-full max-w-2xl">
            <div className="bg-white/70 rounded-3xl p-6 backdrop-blur-sm shadow-lg">
              <p className="text-4xl mb-3">🎤</p>
              <p className="text-sm font-medium text-gray-800">Nhận diện giọng nói</p>
            </div>
            <div className="bg-white/70 rounded-3xl p-6 backdrop-blur-sm shadow-lg">
              <p className="text-4xl mb-3">😊</p>
              <p className="text-sm font-medium text-gray-800">Phân tích cảm xúc</p>
            </div>
            <div className="bg-white/70 rounded-3xl p-6 backdrop-blur-sm shadow-lg">
              <p className="text-4xl mb-3">💬</p>
              <p className="text-sm font-medium text-gray-800">AI trả lời thông minh</p>
            </div>
          </div>

          {/* CTA Button */}
          <Link
            to="/chat"
            className="px-10 py-4 rounded-full bg-green-500 hover:bg-green-600 text-white font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            Bắt đầu trò chuyện
          </Link>
        </div>
      </main>
    </div>
  );
}
