import { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { generateMarketItem } from '../../lib/gemini';
import { playVoice, playSuccessSound, playErrorSound, playCoinSound } from '../../lib/audio';
import { motion } from 'motion/react';
import { ArrowLeft, Volume2, Coins, Trash2 } from 'lucide-react';

const COINS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];

export default function MarketGame({ profile, onBack, onScoreUpdate }: { profile: UserProfile, onBack: () => void, onScoreUpdate: (points: number, gameId?: string) => void }) {
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTotal, setCurrentTotal] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [usedItems, setUsedItems] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<string>(profile.gradeLevel || 'CP');

  const loadItem = async (customDifficulty?: string) => {
    setLoading(true);
    const targetDifficulty = customDifficulty || difficulty;
    setCurrentTotal(0);
    setIsCorrect(null);
    try {
      const i = await generateMarketItem(targetDifficulty, usedItems);
      setItem(i);
      // Add to used items (limit to last 20)
      setUsedItems(prev => [...prev, i.itemName].slice(-20));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDifficultyChange = (newDiff: string) => {
    if (loading) return;
    setDifficulty(newDiff);
    loadItem(newDiff);
  };

  useEffect(() => {
    loadItem();
  }, []);

  const handleAddCoin = (amount: number) => {
    if (isCorrect !== null) return;
    playCoinSound();
    setCurrentTotal(prev => parseFloat((prev + amount).toFixed(2)));
  };

  const handleClear = () => {
    if (isCorrect !== null) return;
    setCurrentTotal(0);
  };

  const handlePay = async () => {
    if (isCorrect !== null) return;
    
    if (currentTotal === item.price) {
      setIsCorrect(true);
      playSuccessSound();
      playVoice(`Bravo ! Tu as acheté ${item.itemName} pour ${item.price} Dirhams.`);
      
      // Local score update
      onScoreUpdate(15, 'market');
    } else {
      setIsCorrect(false);
      playErrorSound();
      setTimeout(() => setIsCorrect(null), 1500); // Reset after error
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 font-sans">
      <header className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 font-bold bg-white px-4 py-3 rounded-2xl btn-tactile">
          <ArrowLeft size={24} /> Retour
        </button>
        <div className="bg-amber-100 px-6 py-3 rounded-2xl border-2 border-amber-200">
          <span className="text-xl font-black text-amber-700">Score: {profile.totalScore}</span>
        </div>
      </header>

      <div className="bg-white rounded-[32px] shadow-sm p-8 card-tactile text-center">
        <div className="w-full h-40 md:h-56 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[24px] mb-8 flex items-center justify-center relative overflow-hidden group shadow-inner">
          <div className="absolute inset-0 opacity-20 pointer-events-none text-white flex flex-wrap gap-12 items-center justify-center -rotate-12 translate-x-4">
            <span className="text-6xl">🍊</span>
            <span className="text-6xl">🕌</span>
            <span className="text-6xl">🌶️</span>
            <span className="text-6xl">🧶</span>
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="text-7xl md:text-9xl transform group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl grayscale-0">🛒</div>
          </div>
        </div>

        <div className="flex justify-center gap-2 bg-slate-50 p-1.5 rounded-2xl mb-8">
          {["CP", "CM1", "1ère Année Collège"].map((level) => (
            <button
              key={level}
              onClick={() => handleDifficultyChange(level)}
              disabled={loading}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                difficulty === level 
                  ? 'bg-white text-amber-600 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {level === "CP" ? "Niveau 1" : level === "CM1" ? "Niveau 2" : "Niveau 3"}
            </button>
          ))}
        </div>
        <div className="text-6xl mb-6">🛒</div>
        <h2 className="text-3xl font-black text-amber-600 mb-8 text-tight-heading">Le Marché de l'Atlas</h2>

        {loading ? (
          <div className="animate-pulse flex flex-col items-center gap-4 py-12">
            <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-amber-500 font-bold uppercase tracking-wider text-sm">Le marchand prépare son étal...</p>
          </div>
        ) : (
          <>
            <div className="bg-slate-50 rounded-3xl p-8 mb-8 border-2 border-slate-100 relative flex flex-col items-center">
              <button 
                onClick={() => playVoice(item.itemName)}
                className="absolute top-4 right-4 p-3 bg-sky-100 text-sky-500 rounded-2xl btn-tactile"
              >
                <Volume2 size={24} />
              </button>
              <h3 className="text-3xl font-black text-slate-700 mb-2 text-tight-heading">{item.itemName}</h3>
              <div className="text-5xl font-black text-emerald-500 bg-emerald-50 px-6 py-4 rounded-2xl border-4 border-emerald-200 mt-4">
                {item.price} DH
              </div>
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Ton Porte-monnaie :</span>
                <span className={`text-4xl font-black ${currentTotal > item.price ? 'text-danger-500' : 'text-sky-600'}`}>
                  {currentTotal} DH
                </span>
              </div>
              
              <div className="flex flex-wrap justify-center gap-3 mb-6">
                {COINS.map(coin => (
                  <motion.button
                    key={coin}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAddCoin(coin)}
                    className={`h-16 rounded-2xl font-black text-xl btn-tactile flex items-center justify-center
                      ${coin >= 20 ? 'bg-emerald-100 text-emerald-700 w-24' : 'bg-amber-100 text-amber-700 w-16 rounded-full'}`}
                  >
                    {coin}
                  </motion.button>
                ))}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleClear}
                  className="flex-1 bg-slate-100 text-slate-600 font-black py-4 rounded-2xl btn-tactile flex items-center justify-center gap-2"
                >
                  <Trash2 size={20} /> Vider
                </button>
                <button 
                  onClick={handlePay}
                  className="flex-[2] bg-success-500 text-white font-black py-4 rounded-2xl btn-tactile flex items-center justify-center gap-2 text-xl"
                >
                  <Coins size={24} /> Payer
                </button>
              </div>
            </div>

            {isCorrect && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={loadItem}
                className="w-full bg-warning-400 text-warning-900 font-black text-xl py-4 px-8 rounded-2xl btn-tactile flex items-center justify-center gap-2"
              >
                Acheter autre chose 🛍️
              </motion.button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
