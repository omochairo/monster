
/**
 * Web Speech API Service for Reading Aloud (読み上げ)
 */

export const isSpeechSupported = (): boolean => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

let currentUtterance: SpeechSynthesisUtterance | null = null;

export const speakText = (text: string, onEnd?: () => void) => {
  if (!isSpeechSupported()) return;

  try {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Clean text (remove emojis and formatting for smooth speech)
    const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ja-JP';
    utterance.rate = 1.0; // Normal friendly speed
    utterance.pitch = 1.1; // Slightly higher, friendly pitch for kids

    utterance.onend = () => {
      currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (err) => {
      console.warn("Speech error", err);
      currentUtterance = null;
      if (onEnd) onEnd();
    };

    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.error("Speech synthesis failed", e);
    if (onEnd) onEnd();
  }
};

export const stopSpeech = () => {
  if (!isSpeechSupported()) return;
  try {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  } catch (e) {
    console.error("Stop speech failed", e);
  }
};
