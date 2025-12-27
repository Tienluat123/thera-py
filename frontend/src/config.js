// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  TIMEOUT: 30000,
};

// Emotion Configuration
export const EMOTION_CONFIG = {
  happy: { 
    color: 'bg-amber-100 border-amber-400 text-amber-800', 
    icon: '😊', 
    label: 'Vui vẻ',
    gradient: 'from-white via-yellow-100 to-[#FFD166]'
  },
  sad: { 
    color: 'bg-sky-100 border-sky-400 text-sky-800', 
    icon: '😢', 
    label: 'Buồn',
    gradient: 'from-blue-300 via-blue-200 to-purple-200'
  },
  angry: { 
    color: 'bg-rose-100 border-rose-400 text-rose-800', 
    icon: '😠', 
    label: 'Tức giận',
    gradient: 'from-white via-red-100 to-[#E67E6E]'
  },
  neutral: { 
    color: 'bg-slate-100 border-slate-300 text-slate-700', 
    icon: '😐', 
    label: 'Bình thường',
    gradient: 'from-white to-[#A8DADC]'
  },
};

// Audio Configuration
export const AUDIO_CONFIG = {
  SAMPLE_RATE: 16000,
  CHUNK_SIZE: 4096,
};
