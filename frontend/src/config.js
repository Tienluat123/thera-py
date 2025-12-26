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
    mic: 'ring-amber-300/40 bg-amber-50 text-amber-700',
    radialGradient: 'radial-gradient(800px at 50% 60%, #FFD6E0 0%, #FFF5F5 40%, white 100%)'
  },
  sad: { 
    color: 'bg-sky-100 border-sky-400 text-sky-800', 
    icon: '😢', 
    label: 'Buồn',
    mic: 'ring-sky-300/40 bg-sky-50 text-sky-700',
    radialGradient: 'radial-gradient(800px at 50% 60%, #CFE8FF 0%, #EBF5FF 40%, white 100%)'
  },
  angry: { 
    color: 'bg-rose-100 border-rose-400 text-rose-800', 
    icon: '😠', 
    label: 'Tức giận',
    mic: 'ring-rose-300/40 bg-rose-50 text-rose-700',
    radialGradient: 'radial-gradient(800px at 50% 60%, #FFD6D6 0%, #FFF0F0 40%, white 100%)'
  },
  neutral: { 
    color: 'bg-slate-100 border-slate-300 text-slate-700', 
    icon: '😐', 
    label: 'Bình thường',
    mic: 'ring-slate-300/30 bg-white text-slate-800',
    radialGradient: 'radial-gradient(800px at 50% 60%, #F0F8F7 0%, #F8FCFB 40%, white 100%)'
  },
};

// Audio Configuration
export const AUDIO_CONFIG = {
  SAMPLE_RATE: 16000,
  CHUNK_SIZE: 4096,
};
