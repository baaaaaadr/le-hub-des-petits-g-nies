import { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { generateDetectiveQuestion } from '../../lib/gemini';
import { playVoice, playSuccessSound, playErrorSound, playBipSound } from '../../lib/audio';
import { motion } from 'motion/react';
import { ArrowLeft, Volume2 } from 'lucide-react';

export default function DetectiveGame({ profile, onBack, onScoreUpdate }: { profile: UserProfile, onBack: () => void, onScoreUpdate: (points: number, gameId?: string) => void }) {
  const [question, setQuestion] = useState<any>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [usedWords, setUsedWords] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<string>(profile.gradeLevel || 'CP');
  const [language, setLanguage] = useState<'fr' | 'ar'>('fr');

  const loadQuestion = async (customDifficulty?: string, customLanguage?: 'fr' | 'ar') => {
    setLoading(true);
    const targetDifficulty = customDifficulty || difficulty;
    const targetLanguage = customLanguage || language;
    setSelected(null);
    setIsCorrect(null);
    try {
      const q = await generateDetectiveQuestion(targetDifficulty, targetLanguage, usedWords);
      setQuestion(q);
      // Shuffle options
      const allOptions = [q.correctAnswer, ...q.wrongAnswers].sort(() => Math.random() - 0.5);
      setOptions(allOptions);
      
      // Add to used words (limit to last 20 to keep prompt size reasonable)
      setUsedWords(prev => [...prev, q.correctAnswer].slice(-20));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDifficultyChange = (newDiff: string) => {
    if (loading) return;
    setDifficulty(newDiff);
    loadQuestion(newDiff, language);
  };

  const handleLanguageChange = (newLang: 'fr' | 'ar') => {
    if (loading) return;
    setLanguage(newLang);
    loadQuestion(difficulty, newLang);
  };

  useEffect(() => {
    loadQuestion();
  }, []);

  const handleSelect = async (option: string) => {
    if (selected) return; // Prevent multiple clicks
    playBipSound(); // Bip sonore au clic sur la case de la grille
    setSelected(option);
    
    if (option === question.correctAnswer) {
      setIsCorrect(true);
      playSuccessSound();
      if (language === 'ar') {
        playVoice("أَحْسَنْتِ ! لَقَدْ وَجَدْتِ الْكَلِمَةَ الصَّحِيحَةَ.", 'ar');
        setTimeout(() => {
          playVoice(question.sentence.replace('____', option), 'ar');
        }, 2200);
      } else {
        playVoice(question.sentence.replace('____', option), 'fr');
      }
      
      // Update score locally
      onScoreUpdate(10, 'detective');
    } else {
      setIsCorrect(false);
      playErrorSound();
      if (language === 'ar') {
        playVoice("حَاوِلِي مَرَّةً أُخْرَى !", 'ar');
      } else {
        playVoice("Essaie encore !", 'fr');
      }
    }
  };

  const getLevelLabel = (level: string) => {
    if (language === 'ar') {
      if (level === 'CP') return 'Très Facile (N1)';
      if (level === 'CM1') return 'Facile (N2)';
      return 'Moyen (N3)';
    } else {
      if (level === 'CP') return 'Niveau 1 (CP)';
      if (level === 'CM1') return 'Niveau 2 (CM1)';
      return 'Niveau 3 (Collège)';
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 font-sans">
      <header className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 font-bold bg-white px-4 py-3 rounded-2xl btn-tactile">
          <ArrowLeft size={24} /> Retour
        </button>
        <div className="bg-emerald-100 px-6 py-3 rounded-2xl border-2 border-emerald-200">
          <span className="text-xl font-black text-emerald-700">Score: {profile.totalScore}</span>
        </div>
      </header>

      <div className="bg-white rounded-[32px] shadow-sm p-8 card-tactile text-center">
        {/* Language Selection */}
        <div className="flex justify-center gap-4 mb-6">
          <button 
            type="button"
            onClick={() => handleLanguageChange('fr')}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${
              language === 'fr' 
                ? 'bg-sky-50 border-sky-300 text-sky-700 shadow-sm' 
                : 'bg-white border-slate-100 text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>🇫🇷 Français</span>
          </button>
          <button 
            type="button"
            onClick={() => handleLanguageChange('ar')}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${
              language === 'ar' 
                ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm' 
                : 'bg-white border-slate-100 text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>🇲🇦 العربية</span>
          </button>
        </div>

        {/* Difficulty Selection */}
        <div className="flex justify-center gap-2 bg-slate-50 p-1.5 rounded-2xl mb-6">
          {["CP", "CM1", "1ère Année Collège"].map((level) => (
            <button
              key={level}
              onClick={() => handleDifficultyChange(level)}
              disabled={loading}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                difficulty === level 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {getLevelLabel(level)}
            </button>
          ))}
        </div>
        
        <div className="text-6xl mb-6">🕵️‍♂️</div>
        <h2 className={`font-black text-emerald-600 mb-8 text-tight-heading ${language === 'ar' ? 'text-4xl md:text-5xl font-sans leading-normal' : 'text-3xl'}`}>
          {language === 'ar' ? 'مُحَقِّقُ الْكَلِمَاتِ' : 'Le Détective des Mots'}
        </h2>

        {loading ? (
          <div className="animate-pulse flex flex-col items-center gap-4 py-12">
            <div className="w-16 h-16 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-emerald-500 font-bold uppercase tracking-wider text-sm">
              {language === 'ar' ? 'جَارٍ تَحْضِيرُ اللُّغْزِ...' : "L'IA prépare une enquête..."}
            </p>
          </div>
        ) : (
          <>
            <div className={`bg-slate-50 rounded-3xl p-8 mb-8 border-2 border-slate-100 relative ${language === 'ar' ? 'pt-12' : ''}`}>
              <button 
                onClick={() => playVoice(question.sentence, language)}
                className={`absolute top-4 p-3 bg-sky-100 text-sky-500 rounded-2xl btn-tactile z-10 ${
                  language === 'ar' ? 'left-4' : 'right-4'
                }`}
              >
                <Volume2 size={24} />
              </button>
              <p 
                className={`font-black text-slate-700 ${
                  language === 'ar' 
                    ? 'text-right px-12 font-sans text-3xl md:text-5xl leading-[1.8] md:leading-[2]' 
                    : 'text-center text-2xl md:text-4xl leading-relaxed mt-4 font-bold'
                }`}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              >
                {question.sentence}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              {options.map((opt, i) => {
                let btnClass = "bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50";
                if (selected === opt) {
                  btnClass = isCorrect ? "bg-success-500 border-success-600 text-white" : "bg-danger-500 border-danger-600 text-white";
                } else if (selected && opt === question.correctAnswer) {
                  btnClass = "bg-success-100 border-success-300 text-success-800"; // Show correct answer
                }

                return (
                  <motion.button
                    key={i}
                    whileHover={!selected ? { scale: 1.02 } : {}}
                    whileTap={!selected ? { scale: 0.98 } : {}}
                    onClick={() => handleSelect(opt)}
                    disabled={!!selected}
                    className={`rounded-2xl font-black shadow-sm transition-all ${btnClass} ${
                      language === 'ar' 
                        ? 'p-8 font-sans text-3xl md:text-4xl leading-relaxed' 
                        : 'p-6 text-xl md:text-2xl'
                    }`}
                  >
                    {opt}
                  </motion.button>
                );
              })}
            </div>

            {selected && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => loadQuestion()}
                className="bg-warning-400 text-warning-900 font-black text-xl py-4 px-8 rounded-2xl btn-tactile w-full md:w-auto mx-auto flex items-center justify-center gap-2"
              >
                {language === 'ar' ? 'لُغْزٌ جَدِيدٌ 🔍' : 'Nouvelle Enquête 🔍'}
              </motion.button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
