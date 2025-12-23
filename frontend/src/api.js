const API_URL = 'http://localhost:8000';

export async function detectEmotion(audioBlob) {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.wav');

  const response = await fetch(`${API_URL}/emotion`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Lỗi kết nối API emotion');
  }

  return response.json();
}

export async function chatWithAudio(audioBlob) {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.wav');

  const response = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Lỗi kết nối API chat');
  }

  return response.json();
}
