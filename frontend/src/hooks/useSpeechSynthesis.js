/**
 * Custom hook for text-to-speech (Vietnamese forced)
 */
export function useSpeechSynthesis() {
  const getVietnameseVoice = () => {
    const voices = window.speechSynthesis.getVoices();

    // Ưu tiên giọng vi-VN
    return voices.find(
      (v) => v.lang === 'vi-VN'
    ) || voices.find(
      (v) => v.lang.startsWith('vi')
    );
  };

  const speak = (text) => {
    if (!window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';

    const viVoice = getVietnameseVoice();
    if (viVoice) {
      utterance.voice = viVoice;
    }

    window.speechSynthesis.cancel(); // ngắt giọng cũ
    window.speechSynthesis.speak(utterance);
  };

  const cancel = () => {
    window.speechSynthesis.cancel();
  };

  return { speak, cancel };
}
