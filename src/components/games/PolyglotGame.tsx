import { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { generatePolyglotWord } from '../../lib/gemini';
import { playVoice, playSuccessSound, playErrorSound, playBipSound } from '../../lib/audio';
import { motion } from 'motion/react';
import { ArrowLeft, Volume2, Check } from 'lucide-react';

interface PolyglotWord {
  fr: string;
  en: string;
  ar: string;
  wrongEn: string[];
  wrongAr: string[];
}

export default function PolyglotGame({ profile, onBack, onScoreUpdate }: { profile: UserProfile, onBack: () => void, onScoreUpdate: (points: number, gameId?: string) => void }) {
  const [word, setWord] = useState<PolyglotWord | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEn, setSelectedEn] = useState<string | null>(null);
  const [selectedAr, setSelectedAr] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [usedWords, setUsedWords] = useState<string[]>([]);
  const [optionsEn, setOptionsEn] = useState<string[]>([]);
  const [optionsAr, setOptionsAr] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<string>(profile.gradeLevel || 'CP');

  const loadWord = async (customDifficulty?: string) => {
    setLoading(true);
    const targetDifficulty = customDifficulty || difficulty;
    setSelectedEn(null);
    setSelectedAr(null);
    setIsCorrect(null);
    try {
      const data = await generatePolyglotWord(targetDifficulty, usedWords);
      setWord(data);
      setUsedWords(prev => [...prev, data.fr].slice(-20));
      
      // Shuffle options
      setOptionsEn([...data.wrongEn, data.en].sort(() => Math.random() - 0.5));
      setOptionsAr([...data.wrongAr, data.ar].sort(() => Math.random() - 0.5));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDifficultyChange = (newDiff: string) => {
    if (loading) return;
    setDifficulty(newDiff);
    loadWord(newDiff);
  };

  useEffect(() => {
    loadWord();
  }, []);

  const handleCheck = async () => {
    if (!word || !selectedEn || !selectedAr) return;

    if (selectedEn === word.en && selectedAr === word.ar) {
      setIsCorrect(true);
      playSuccessSound();
      
      // Local score update
      onScoreUpdate(15, 'polyglot');

      setTimeout(loadWord, 2000);
    } else {
      setIsCorrect(false);
      playErrorSound();
      setTimeout(() => setIsCorrect(null), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-50 p-3 md:p-6 font-sans flex flex-col items-center">
      <button onClick={onBack} className="self-start mb-4 flex items-center gap-2 text-indigo-700 font-bold bg-white px-4 py-3 rounded-2xl btn-tactile text-sm">
        <ArrowLeft size={18} /> Retour
      </button>

      <div className="w-full max-w-md bg-white rounded-[32px] p-5 shadow-sm card-tactile text-center flex flex-col gap-4">
        <div className="flex justify-between items-center bg-slate-50 p-1.5 rounded-2xl mb-2">
          {["CP", "CM1", "1ère Année Collège"].map((level) => (
            <button
              key={level}
              onClick={() => handleDifficultyChange(level)}
              disabled={loading}
              className={`flex-1 px-2 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                difficulty === level 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {level === "CP" ? "Niveau 1" : level === "CM1" ? "Niveau 2" : "Niveau 3"}
            </button>
          ))}
        </div>
        
        <h2 className="text-xl font-black text-indigo-600 text-tight-heading">Le Polyglotte 🌍</h2>

        {loading ? (
          <div className="py-10 animate-pulse flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-indigo-500 font-bold text-sm uppercase tracking-wider">L'IA cherche un mot...</p>
          </div>
        ) : word && (
          <>
            <div className="bg-indigo-50 rounded-2xl p-4 border-2 border-indigo-100">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Mot en Français</p>
              <h3 className="text-3xl font-black text-slate-800 text-tight-heading">{word.fr}</h3>
            </div>

            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => playVoice(word.en, 'en')}
                className="flex-1 bg-sky-100 text-sky-600 p-3 rounded-2xl btn-tactile flex flex-col items-center gap-1"
              >
                <Volume2 size={20} />
                <span className="text-[10px] font-bold uppercase tracking-wider">English</span>
              </button>
              <button 
                onClick={() => playVoice(word.ar, 'ar')}
                className="flex-1 bg-emerald-100 text-emerald-600 p-3 rounded-2xl btn-tactile flex flex-col items-center gap-1"
              >
                <Volume2 size={20} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Arabe</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* English Options */}
              <div className="space-y-2">
                <p className="text-sky-600 font-black text-xs uppercase tracking-wider">English</p>
                {optionsEn.map(opt => (
                  <button
                    key={opt}
                    onClick={() => { playBipSound(); setSelectedEn(opt); }}
                    className={`w-full p-3 rounded-2xl text-sm font-black btn-tactile ${
                      selectedEn === opt 
                        ? 'bg-sky-500 text-white' 
                        : 'bg-slate-50 text-slate-600 border-2 border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {/* Arabic Options */}
              <div className="space-y-2">
                <p className="text-emerald-600 font-black text-xs uppercase tracking-wider">Arabe</p>
                {optionsAr.map(opt => (
                  <button
                    key={opt}
                    onClick={() => { playBipSound(); setSelectedAr(opt); }}
                    className={`w-full p-3 rounded-2xl text-sm font-black btn-tactile ${
                      selectedAr === opt 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-slate-50 text-slate-600 border-2 border-slate-100 hover:bg-slate-100'
                    }`}
                    dir="rtl"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCheck}
              disabled={!selectedEn || !selectedAr}
              className={`w-full py-4 rounded-2xl font-black text-lg btn-tactile flex items-center justify-center gap-2 ${
                !selectedEn || !selectedAr
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : isCorrect === false
                  ? 'bg-danger-500 text-white'
                  : isCorrect === true
                  ? 'bg-success-500 text-white'
                  : 'bg-indigo-500 text-white'
              }`}
            >
              <Check size={20} /> VÉRIFIER
            </button>
          </>
        )}
      </div>
    </div>
  );
}
