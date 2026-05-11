import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { playVoice, playSuccessSound, playErrorSound } from '../../lib/audio';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function BalanceGame({ profile, onBack, onScoreUpdate }: { profile: UserProfile, onBack: () => void, onScoreUpdate: (points: number, gameId?: string) => void }) {
  const [target, setTarget] = useState(10);
  const [current, setCurrent] = useState(6);
  const [options, setOptions] = useState<number[]>([]);
  const [selectedWeight, setSelectedWeight] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    playVoice("Équilibre la balance !", "fr");
    generateLevel();
  }, [profile.age]);

  const generateLevel = () => {
    const age = profile.age || 6;
    let minTarget = 5;
    let maxTarget = 15;

    if (age >= 10) {
      minTarget = 50;
      maxTarget = 100;
    } else if (age >= 8) {
      minTarget = 20;
      maxTarget = 50;
    }

    const newTarget = Math.floor(Math.random() * (maxTarget - minTarget + 1)) + minTarget;
    const newCurrent = Math.floor(Math.random() * (newTarget - 1)) + 1;
    const needed = newTarget - newCurrent;
    
    let opts = [needed];
    while(opts.length < 4) {
      const rand = Math.floor(Math.random() * (maxTarget - 1)) + 1;
      if (!opts.includes(rand) && rand !== needed) opts.push(rand);
    }
    setTarget(newTarget);
    setCurrent(newCurrent);
    setOptions(opts.sort(() => Math.random() - 0.5));
    setSelectedWeight(null);
    setIsAnimating(false);
  };

  const handleSelect = async (weight: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSelectedWeight(weight);

    // Bruit lourd externe
    const audio = new Audio('https://actions.google.com/sounds/v1/impacts/crash_impact_sweetener.ogg');
    audio.play().catch(() => {});

    const total = current + weight;

    if (total === target) {
      playSuccessSound();
      playVoice("C'est parfait !", "fr");
      
      // Local score update
      onScoreUpdate(5, 'balance');

      setTimeout(generateLevel, 2000);
    } else {
      playErrorSound();
      
      // Local score update (penalty)
      onScoreUpdate(-2);

      setTimeout(() => {
        setSelectedWeight(null);
        setIsAnimating(false);
      }, 1500);
    }
  };

  // Calculate rotation based on weights
  const leftWeight = target;
  const rightWeight = current + (selectedWeight || 0);
  
  // Max rotation angle
  const maxAngle = 20;
  
  // Calculate difference ratio
  let diffRatio = 0;
  if (leftWeight > rightWeight) {
    diffRatio = -Math.min((leftWeight - rightWeight) / leftWeight, 1);
  } else if (rightWeight > leftWeight) {
    diffRatio = Math.min((rightWeight - leftWeight) / rightWeight, 1);
  }
  
  const rotationAngle = diffRatio * maxAngle;

  return (
    <div className="min-h-screen bg-orange-50 p-4 font-sans">
      <button onClick={onBack} className="mb-4 flex items-center gap-2 text-orange-700 font-bold bg-white px-4 py-3 rounded-2xl btn-tactile">
        <ArrowLeft size={20} /> Retour
      </button>
      
      <div className="max-w-md mx-auto bg-white rounded-[32px] p-6 shadow-sm card-tactile text-center">
        <h2 className="text-2xl font-black text-orange-600 mb-6 text-tight-heading">La Balance Magique ⚖️</h2>
        
        <div className="relative h-64 flex flex-col items-center justify-end mb-8 mt-12">
          {/* Balance Beam */}
          <motion.div 
            className="w-64 h-4 bg-orange-400 rounded-full relative z-10 origin-center"
            animate={{ rotate: rotationAngle }}
            transition={{ type: "spring", stiffness: 100, damping: 10 }}
          >
            {/* Left Pan */}
            <div className="absolute -left-8 -top-16 flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-800 text-white flex items-center justify-center text-3xl font-black rounded-2xl shadow-sm">
                {target}
              </div>
              <div className="w-1 h-16 bg-orange-300" />
            </div>

            {/* Right Pan */}
            <div className="absolute -right-8 -top-16 flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-600 text-white flex items-center justify-center text-3xl font-black rounded-2xl shadow-sm relative">
                {current}
                {/* Added weight */}
                {selectedWeight !== null && (
                  <motion.div 
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: -40, opacity: 1 }}
                    className="absolute w-12 h-12 bg-success-500 text-white flex items-center justify-center text-xl font-black rounded-xl shadow-sm"
                  >
                    +{selectedWeight}
                  </motion.div>
                )}
              </div>
              <div className="w-1 h-16 bg-orange-300" />
            </div>
          </motion.div>

          {/* Base */}
          <div className="w-8 h-32 bg-orange-500 rounded-t-full z-0" />
          <div className="w-32 h-4 bg-orange-600 rounded-full mt-[-4px] z-20" />
        </div>

        <p className="text-slate-400 font-bold mb-4 text-sm uppercase tracking-wider">Ajoute le bon poids :</p>
        <div className="flex justify-center gap-3 flex-wrap">
          {options.map((w, i) => (
            <button 
              key={i} 
              onClick={() => handleSelect(w)} 
              disabled={isAnimating}
              className={`w-16 h-16 text-2xl font-black rounded-2xl btn-tactile flex items-center justify-center ${
                selectedWeight === w 
                  ? (current + w === target ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700')
                  : 'bg-orange-100 text-orange-700'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
