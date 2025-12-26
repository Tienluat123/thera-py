import React from 'react';
import { Volume2, AlertCircle } from 'lucide-react';
import { EMOTION_CONFIG } from '../config';

export function ChatBox({ messages, transcript, isRecording, micError, messagesEndRef, currentEmotion }) {
  const radialGrad = currentEmotion && EMOTION_CONFIG[currentEmotion] ? EMOTION_CONFIG[currentEmotion].radialGradient : 'radial-gradient(800px at 50% 60%, #F3E8FF 0%, #FAF8FB 40%, white 100%)';

  return (
    <section className="relative bg-white flex flex-col w-full h-full overflow-hidden" style={{ background: radialGrad }}>
      {/* Default radial for no emotion */}
      {!currentEmotion && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(800px at 50% 60%, rgba(243, 232, 255, 0.6) 0%, rgba(250, 248, 251, 0.3) 40%, white 100%)',
          }}
        />
      )}

      {/* faint emoji top-right when have messages */}
      {messages.length > 0 && currentEmotion && EMOTION_CONFIG[currentEmotion] && (
        <div className="pointer-events-none absolute top-6 right-8 text-6xl opacity-20 z-0">
          {EMOTION_CONFIG[currentEmotion].icon}
        </div>
      )}

      {/* header only when conversation has messages */}
      {messages.length > 0 && (
        <div className="relative z-10 flex items-center justify-between mb-3 text-xs text-gray-600">
          <span className="flex items-center gap-2">
            <Volume2 size={16} />
            {isRecording ? 'Đang ghi âm...' : 'Sẵn sàng nghe bạn nói'}
          </span>
          {micError && (
            <span className="flex items-center gap-1 text-red-600">
              <AlertCircle size={14} />
              {micError}
            </span>
          )}
        </div>
      )}

      <div className="relative z-10 flex-1 rounded-2xl p-4 overflow-y-auto space-y-4 flex flex-col">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-gray-700 leading-tight">
              Chào buổi sáng, hôm nay bạn thế nào ?
            </h2>
            <p className="mt-8 text-sm text-gray-600">Nhấn giữ mic để nói — hệ thống sẽ nhận dạng & phân tích cảm xúc.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-md ${
                msg.type === 'user' ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {msg.type === 'user' && msg.emotion && EMOTION_CONFIG[msg.emotion] && (
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                  <span>{EMOTION_CONFIG[msg.emotion].icon}</span>
                  <span>{EMOTION_CONFIG[msg.emotion].label}</span>
                </div>
              )}
              <p className="leading-relaxed text-sm">{msg.text}</p>
              <p className="text-[11px] text-gray-500 mt-2">{msg.timestamp}</p>
            </div>
          </div>
        ))}

        {transcript && isRecording && (
          <div className="flex justify-end">
            <div className="max-w-[70%] rounded-2xl px-4 py-3 bg-gray-100 text-gray-800 border border-gray-300 animate-pulse">
              <p className="text-xs uppercase tracking-wide text-gray-600 mb-1">Đang nghe...</p>
              <p className="text-sm italic">{transcript}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </section>
  );
}
