import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { playVoice, playSuccessSound, playErrorSound, playBipSound } from '../../lib/audio';
import { generateArabicWord } from '../../lib/gemini';
import { ArrowLeft, Volume2, Check, RotateCcw } from 'lucide-react';

const STATIC_WORDS = [
  { fr: 'Porte', ar: 'باب', emoji: '🚪' },
  { fr: 'Chat', ar: 'قطة', emoji: '🐱' },
  { fr: 'Maison', ar: 'منزل', emoji: '🏠' },
];

export default function TrainGame({ profile, onBack, onScoreUpdate }: { profile: UserProfile, onBack: () => void, onScoreUpdate: (points: number, gameId?: string) => void }) {
  const [currentWord, setCurrentWord] = useState(STATIC_WORDS[0]);
  const [shuffledLetters, setShuffledLetters] = useState<{id: number, char: string}[]>([]);
  const [selectedLetters, setSelectedLetters] = useState<{id: number, char: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [usedWords, setUsedWords] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<string>(profile.gradeLevel || 'CP');

  const nextWord = async (customDifficulty?: string) => {
    setLoading(true);
    const targetDifficulty = customDifficulty || difficulty;
    try {
      const word = await generateArabicWord(targetDifficulty, usedWords);
      
      if (word && word.ar && word.fr) {
        setCurrentWord(word);
        setupLetters(word.ar);
        // Add to used words (limit to last 20)
        setUsedWords(prev => [...prev, word.ar].slice(-20));
      } else {
        // Fallback
        const random = STATIC_WORDS[Math.floor(Math.random() * STATIC_WORDS.length)];
        setCurrentWord(random);
        setupLetters(random.ar);
      }
    } catch (e) {
      console.error(e);
      const random = STATIC_WORDS[Math.floor(Math.random() * STATIC_WORDS.length)];
      setCurrentWord(random);
      setupLetters(random.ar);
    } finally {
      setLoading(false);
    }
  };

  const handleDifficultyChange = (newDiff: string) => {
    if (loading) return;
    setDifficulty(newDiff);
    nextWord(newDiff);
  };

  useEffect(() => {
    nextWord();
  }, []);

  const setupLetters = (arabicWord: string) => {
    const chars = arabicWord.split('');
    const letterObjs = chars.map((char, index) => ({ id: index, char }));
    setShuffledLetters(letterObjs.sort(() => Math.random() - 0.5));
    setSelectedLetters([]);
  };

  const handleListen = () => {
    playVoice(currentWord.ar, 'ar');
  };

  const handleSelect = (letterObj: {id: number, char: string}) => {
    playBipSound();
    setSelectedLetters([...selectedLetters, letterObj]);
    setShuffledLetters(shuffledLetters.filter(l => l.id !== letterObj.id));
  };

  const handleReset = () => {
    playBipSound();
    setupLetters(currentWord.ar);
  };

  const checkWin = async () => {
    const builtWord = selectedLetters.map(l => l.char).join('');
    
    if (builtWord === currentWord.ar) {
      playSuccessSound();
      playVoice("Excellent ! Tu as bien écrit le mot.", "fr");
      
      // Local score update
      onScoreUpdate(10, 'train');

      setTimeout(nextWord, 1500);
    } else {
      playErrorSound();
      playVoice("Ce n'est pas tout à fait ça. Réessaie !", "fr");
      
      // Local score update (penalty)
      onScoreUpdate(-2);

      // Reset for another try
      setTimeout(handleReset, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 p-4 font-sans">
      <button onClick={onBack} className="mb-4 flex items-center gap-2 text-amber-700 font-bold bg-white px-4 py-3 rounded-2xl btn-tactile">
        <ArrowLeft size={20} /> Retour
      </button>
      
      <div className="max-w-md mx-auto bg-white rounded-[32px] p-6 shadow-sm card-tactile text-center">
        <div className="flex justify-between items-center bg-slate-50 p-1.5 rounded-2xl mb-4">
          {["CP", "CM1", "1ère Année Collège"].map((level) => (
            <button
              key={level}
              onClick={() => handleDifficultyChange(level)}
              disabled={loading}
              className={`flex-1 px-2 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                difficulty === level 
                  ? 'bg-white text-amber-600 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {level === "CP" ? "Niveau 1" : level === "CM1" ? "Niveau 2" : "Niveau 3"}
            </button>
          ))}
        </div>
        <h2 className="text-2xl font-black text-amber-600 mb-6 text-tight-heading">Le Train de l'Arabe 🚂</h2>
        
        {loading ? (
          <div className="py-12 animate-pulse">
            <div className="w-16 h-16 bg-amber-100 rounded-full mx-auto mb-4 animate-spin border-4 border-amber-400 border-t-transparent"></div>
            <p className="text-amber-600 font-bold uppercase tracking-wider text-sm">L'IA prépare un nouveau mot...</p>
          </div>
        ) : (
          <>
            <div className="text-6xl mb-2">{currentWord.emoji}</div>
            <div className="text-2xl font-bold text-slate-700 mb-4 text-tight-heading">{currentWord.fr}</div>

            <button onClick={handleListen} className="mx-auto mb-6 bg-sky-400 text-white font-bold py-3 px-6 rounded-2xl btn-tactile flex items-center gap-2">
              <Volume2 size={24} /> ÉCOUTER
            </button>

            {/* Built word container - Single string for correct Arabic shaping */}
            <div className="relative mb-8">
              <div className="flex justify-center gap-2 flex-row-reverse mb-2">
                {currentWord.ar.split('').map((_, i) => (
                  <div key={i} className="w-12 h-12 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl" />
                ))}
              </div>
              
              {/* Overlay the actual word to ensure letters attach */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" dir="rtl">
                <span className="text-4xl font-bold text-amber-600 tracking-wider">
                  {selectedLetters.map(l => l.char).join('')}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-4">
              <p className="text-slate-400 font-bold text-sm uppercase tracking-wider">Construis le mot :</p>
              <button onClick={handleReset} className="text-amber-600 p-2 hover:bg-amber-50 rounded-full transition-colors" title="Recommencer">
                <RotateCcw size={20} />
              </button>
            </div>
            
            {/* Available letters to click */}
            <div className="flex justify-center gap-3 flex-wrap flex-row-reverse mb-8">
              {shuffledLetters.map((letterObj) => (
                <button
                  key={letterObj.id}
                  onClick={() => handleSelect(letterObj)}
                  className="w-14 h-14 text-2xl font-bold bg-amber-100 text-amber-700 rounded-2xl btn-tactile"
                >
                  {letterObj.char}
                </button>
              ))}
            </div>

            <button 
              onClick={checkWin} 
              disabled={selectedLetters.length === 0}
              className={`w-full font-black text-xl py-4 rounded-2xl btn-tactile flex items-center justify-center gap-2 ${
                selectedLetters.length === currentWord.ar.length 
                  ? 'bg-emerald-400 text-white' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Check size={24} /> VÉRIFIER
            </button>
          </>
        )}
      </div>
    </div>
  );
}
