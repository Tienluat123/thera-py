import React from 'react';
import { Mic, MicOff } from 'lucide-react';

export function Controls({ isRecording, isProcessing, onToggleRecording }) {
  return (
    <div className="mt-4 w-full flex items-center justify-center">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleRecording}
          disabled={isProcessing}
          className={`flex items-center gap-3 px-6 py-3 rounded-full font-semibold shadow-md transition-transform transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isRecording
              ? 'bg-gradient-to-br from-rose-500 to-rose-400 text-white ring-rose-300'
              : 'bg-gradient-to-br from-emerald-500 to-emerald-400 text-white ring-emerald-300'
          } ${isProcessing ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          <span className="hidden sm:inline">{isRecording ? 'Dừng & Gửi' : 'Nhấn để nói'}</span>
        </button>
      </div>
    </div>
  );
}
