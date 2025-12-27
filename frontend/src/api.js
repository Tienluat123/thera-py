import axios from 'axios';
import { API_CONFIG } from './config';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Main chat endpoint - Single request
 * Sends audio + text, backend returns reply + emotion
 * 
 * @param {Blob} audioBlob - Audio file blob
 * @param {string} text - User's transcribed text (from frontend STT)
 * @returns {Promise} - { user_text, reply_text, emotion, confidence }
 */
export async function chat(audioBlob, text, token = null) {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.wav');
  formData.append('text', text);

  const headers = {
    'Content-Type': 'multipart/form-data',
  };
  if (token) headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

  const response = await apiClient.post('/chat', formData, { headers });

  return response.data;
}

/**
 * Get emotion statistics for a specific date
 * 
 * @param {string} date - Date in format YYYY-MM-DD
 * @param {string} token - Authorization token
 * @returns {Promise} - { happy: int, neutral: int, sad: int, angry: int }
 */
export async function getEmotionStats(date, token) {
  const response = await apiClient.get('/emotion-stats', {
    params: { date_param: date },
    headers: {
      'Authorization': token,
    },
  });

  return response.data;
}

export default apiClient;


