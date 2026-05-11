// Audio utilities for the kids app

// 1. Voice Synthesis : SpeechSynthesis API (Native browser TTS)
export const playVoice = (text: string, lang: string = 'fr') => {
  try {
    if (!window.speechSynthesis) {
      console.warn("SpeechSynthesis API non supportée sur ce navigateur.");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Map short lang codes to full BCP 47 tags for better voice selection
    if (lang === 'fr') {
      utterance.lang = 'fr-FR';
    } else if (lang === 'en') {
      utterance.lang = 'en-US';
    } else if (lang === 'ar') {
      utterance.lang = 'ar-SA';
    } else {
      utterance.lang = lang;
    }

    const setVoiceAndSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Try to find a voice that matches the exact language code
        let voice = voices.find(v => v.lang.replace('_', '-').toLowerCase() === utterance.lang.toLowerCase());
        
        // If not found, try to find a voice that starts with the language code (e.g., 'fr' for 'fr-FR')
        if (!voice) {
          voice = voices.find(v => v.lang.replace('_', '-').toLowerCase().startsWith(lang.toLowerCase()));
        }

        if (voice) {
          utterance.voice = voice;
        }
      }
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', setVoiceAndSpeak, { once: true });
      // Fallback in case voiceschanged doesn't fire
      setTimeout(() => {
        if (window.speechSynthesis.getVoices().length === 0) {
          window.speechSynthesis.speak(utterance);
        }
      }, 1000);
    } else {
      setVoiceAndSpeak();
    }
  } catch (error) {
    console.error("Error creating voice audio:", error);
  }
};

// 2. Bruitages (Bravo, Erreur) : Fichiers MP3/OGG Externes via Audio() HTML5
export const playSuccessSound = () => {
  try {
    const audio = new Audio('https://actions.google.com/sounds/v1/cartoon/magic_chime.ogg');
    audio.play().catch(e => console.error("Success sound failed:", e));
  } catch (e) {
    console.error("Error playing success sound:", e);
  }
};

export const playErrorSound = () => {
  try {
    const audio = new Audio('https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg');
    audio.play().catch(e => console.error("Error sound failed:", e));
  } catch (e) {
    console.error("Error playing error sound:", e);
  }
};

// 3. Sons de jeu (Bips, clics) : Web Audio API (Oscillator)
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

export const playBipSound = () => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    console.error("Bip sound failed:", e);
  }
};

export const playPopSound = () => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    console.error("Pop sound failed:", e);
  }
};

export const playCoinSound = () => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    console.error("Coin sound failed:", e);
  }
};
