import React from 'react';
import { Mic, MicOff, Send } from 'lucide-react';

export function Controls({ isRecording, isProcessing, audioBlob, onStartRecording, onStopRecording, onSend }) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={isRecording ? onStopRecording : onStartRecording}
        disabled={isProcessing}
        className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl font-medium transition-all sm:hidden ${
          isRecording
            ? 'bg-red-500 text-white'
            : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
        } ${isProcessing ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
        <span className="text-sm">{isRecording ? 'Dừng' : 'Nói'}</span>
      </button>

      <button
        onClick={onSend}
        disabled={isProcessing}
        className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
          !isProcessing
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'bg-gray-300 text-gray-600 cursor-not-allowed'
        }`}
      >
        <Send size={18} />
        <span className="hidden sm:inline">{isProcessing ? 'Đang xử lý...' : 'Gửi'}</span>
      </button>
    </div>
  );
}
