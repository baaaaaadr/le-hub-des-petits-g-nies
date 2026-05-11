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

  const loadQuestion = async (customDifficulty?: string) => {
    setLoading(true);
    const targetDifficulty = customDifficulty || difficulty;
    setSelected(null);
    setIsCorrect(null);
    try {
      const q = await generateDetectiveQuestion(targetDifficulty, usedWords);
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
    loadQuestion(newDiff);
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
      playVoice(question.sentence.replace('____', option));
      
      // Update score locally
      onScoreUpdate(10, 'detective');
    } else {
      setIsCorrect(false);
      playErrorSound();
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
              {level === "CP" ? "Niveau 1" : level === "CM1" ? "Niveau 2" : "Niveau 3"}
            </button>
          ))}
        </div>
        <div className="text-6xl mb-6">🕵️‍♂️</div>
        <h2 className="text-3xl font-black text-emerald-600 mb-8 text-tight-heading">Le Détective des Mots</h2>

        {loading ? (
          <div className="animate-pulse flex flex-col items-center gap-4 py-12">
            <div className="w-16 h-16 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-emerald-500 font-bold uppercase tracking-wider text-sm">L'IA prépare une enquête...</p>
          </div>
        ) : (
          <>
            <div className="bg-slate-50 rounded-3xl p-8 mb-8 border-2 border-slate-100 relative">
              <button 
                onClick={() => playVoice(question.sentence)}
                className="absolute top-4 right-4 p-3 bg-sky-100 text-sky-500 rounded-2xl btn-tactile"
              >
                <Volume2 size={24} />
              </button>
              <p className="text-2xl md:text-4xl font-bold text-slate-700 leading-relaxed mt-4">
                {question.sentence}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
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
                    className={`p-6 rounded-2xl text-xl md:text-2xl font-black shadow-sm transition-colors ${btnClass}`}
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
                onClick={loadQuestion}
                className="bg-warning-400 text-warning-900 font-black text-xl py-4 px-8 rounded-2xl btn-tactile w-full md:w-auto mx-auto flex items-center justify-center gap-2"
              >
                Nouvelle Enquête 🔍
              </motion.button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
