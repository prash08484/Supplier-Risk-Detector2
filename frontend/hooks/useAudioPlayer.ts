import { useState, useEffect } from 'react';

export const useAudioPlayer = () => {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
      }
    };
  }, [audio]);

  const playAudio = (url: string) => {
    // Stop any currently playing audio
    if (audio) {
      audio.pause();
    }

    const newAudio = new Audio(url);
    setAudio(newAudio);
    newAudio.play().catch(err => console.error('Audio playback failed:', err));
  };

  const stopAudio = () => {
    if (audio) {
      audio.pause();
      setAudio(null);
    }
  };

  return { playAudio, stopAudio };
};