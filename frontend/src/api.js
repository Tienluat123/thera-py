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
export async function chat(audioBlob, text) {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.wav');
  formData.append('text', text);

  const response = await apiClient.post('/chat', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

export default apiClient;


