import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { playVoice, playPopSound, playErrorSound } from '../../lib/audio';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft } from 'lucide-react';

interface Bubble {
  id: number;
  a: number;
  b: number;
  x: number;
  status: 'idle' | 'correct' | 'incorrect';
}

export default function BubbleGame({ profile, onBack, onScoreUpdate }: { profile: UserProfile, onBack: () => void, onScoreUpdate: (points: number, gameId?: string) => void }) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [speed, setSpeed] = useState(1);
  const [score, setScore] = useState(profile.totalScore);

  const targetSum = profile.gradeLevel === 'CM1' ? 100 : profile.gradeLevel === '1ère Année Collège' ? 1000 : 10;
  const targetSumName = targetSum === 10 ? 'Dizaines' : targetSum === 100 ? 'Centaines' : 'Milliers';

  useEffect(() => {
    let voiceMsg = "Clique sur les bulles qui font dix !";
    if (profile.gradeLevel === 'CM1') voiceMsg = "Clique sur les bulles qui font cent !";
    else if (profile.gradeLevel === '1ère Année Collège') voiceMsg = "Clique sur les bulles qui font mille !";

    playVoice(voiceMsg, "fr");
    
    const interval = setInterval(() => {
      setBubbles(prev => {
        if (prev.length > 8) return prev;
        const isTarget = Math.random() > 0.4;
        let a, b;
        
        const step = profile.gradeLevel === 'CM1' ? 10 : profile.gradeLevel === '1ère Année Collège' ? 50 : 1;
        const maxSteps = targetSum / step;

        if (isTarget) {
          a = (Math.floor(Math.random() * (maxSteps - 1)) + 1) * step;
          b = targetSum - a;
        } else {
          a = (Math.floor(Math.random() * (maxSteps - 1)) + 1) * step;
          b = (Math.floor(Math.random() * (maxSteps - 1)) + 1) * step;
          if (a + b === targetSum) b = b + step;
        }
        
        return [...prev, {
          id: Date.now() + Math.random(),
          a, b,
          x: Math.random() * 60 + 20, // 20% to 80% to avoid edge clipping
          status: 'idle'
        }];
      });
    }, 2500 / speed);

    return () => clearInterval(interval);
  }, [profile.gradeLevel, speed, targetSum]);

  const handleBubbleClick = async (bubble: Bubble) => {
    if (bubble.status !== 'idle') return;

    const isCorrect = bubble.a + bubble.b === targetSum;

    setBubbles(prev => prev.map(b => 
      b.id === bubble.id ? { ...b, status: isCorrect ? 'correct' : 'incorrect' } : b
    ));

    if (isCorrect) {
      playPopSound();
      setScore(s => s + 5);
      
      // Local score update
      onScoreUpdate(5, 'bubble');
    } else {
      playErrorSound();
      setScore(s => Math.max(0, s - 2));
      
      // Local score update (penalty)
      onScoreUpdate(-2);
    }

    setTimeout(() => {
      setBubbles(prev => prev.filter(b => b.id !== bubble.id));
    }, 500);
  };

  const handleMiss = (bubbleId: number, a: number, b: number) => {
    setBubbles(prev => {
      const currentBubble = prev.find(b => b.id === bubbleId);
      if (currentBubble && currentBubble.status === 'idle') {
        if (a + b === targetSum) {
          playErrorSound();
          setScore(s => Math.max(0, s - 3));
          
          // Local score update (penalty for missing a correct bubble)
          onScoreUpdate(-3);
        }
        return prev.filter(b => b.id !== bubbleId);
      }
      return prev;
    });
  };

  const getBubbleStyle = (status: string) => {
    if (status === 'correct') return "bg-emerald-500/90 border-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.8)] z-50";
    if (status === 'incorrect') return "bg-rose-500/90 border-rose-300 shadow-[0_0_30px_rgba(244,63,94,0.8)] z-50";
    return "bg-white/10 border-white/40 hover:bg-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.3)] backdrop-blur-sm";
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-cyan-900 via-blue-900 to-indigo-950 font-sans overflow-hidden">
      {/* Header UI - Compacted */}
      <div className="z-20 flex justify-between items-center px-2 py-2 md:px-4 bg-slate-900/40 backdrop-blur-md border-b border-white/10 shadow-lg">
        <button onClick={onBack} className="flex items-center gap-1 text-white font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-all text-xs md:text-sm">
          <ArrowLeft size={16} /> <span className="hidden sm:inline">Retour</span>
        </button>
        
        <div className="text-center flex-1 px-2">
          <h2 className="text-base md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300 drop-shadow-sm leading-tight">
            Chasseur de {targetSumName} 🫧
          </h2>
          <p className="text-cyan-100 font-medium text-[10px] md:text-xs leading-tight">
            Trouve les bulles de <span className="font-black text-white">{targetSum}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center bg-white/10 px-2 py-1 rounded-lg border border-white/20">
            <label className="text-cyan-100 font-bold text-[8px] uppercase tracking-wider">Vitesse {speed}x</label>
            <input 
              type="range" 
              min="0.5" 
              max="3" 
              step="0.5" 
              value={speed} 
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-12 md:w-20 h-1 bg-cyan-900/50 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
          <div className="text-center bg-white/10 px-3 py-1 rounded-lg border border-white/20 min-w-[60px]">
            <div className="text-cyan-200 text-[8px] font-bold uppercase tracking-wider">Score</div>
            <motion.div 
              key={score}
              initial={{ scale: 1.5, color: '#67e8f9' }}
              animate={{ scale: 1, color: '#ffffff' }}
              className="text-sm md:text-lg font-black leading-none"
            >
              {score}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Play Area */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence>
          {bubbles.map(bubble => (
            <motion.button
              key={bubble.id}
              initial={{ y: '100vh', opacity: 0, scale: 0.5 }}
              animate={{ 
                y: '-20vh', 
                opacity: 1, 
                scale: bubble.status === 'correct' ? 1.2 : bubble.status === 'incorrect' ? 0.9 : 1,
                rotate: bubble.status === 'incorrect' ? [-10, 10, -10, 10, 0] : 0
              }}
              exit={{ scale: 0, opacity: 0 }}
              onAnimationComplete={() => handleMiss(bubble.id, bubble.a, bubble.b)}
              transition={{ 
                y: { duration: 8 / speed, ease: "linear" },
                scale: { duration: 0.2 },
                rotate: { duration: 0.4 },
                opacity: { duration: 0.3 }
              }}
              onClick={() => handleBubbleClick(bubble)}
              className={`absolute pointer-events-auto w-24 h-24 md:w-28 md:h-28 rounded-full border-2 flex items-center justify-center text-white font-black text-xl md:text-2xl transition-colors duration-200 -translate-x-1/2 ${getBubbleStyle(bubble.status)}`}
              style={{ left: `${bubble.x}%` }}
            >
              {/* Bubble Reflection */}
              <div className="absolute top-3 left-4 w-4 h-1.5 md:w-6 md:h-2 bg-white/50 rounded-full -rotate-45"></div>
              <div className="absolute bottom-3 right-4 w-2 h-2 bg-white/30 rounded-full"></div>
              
              <span className="drop-shadow-md z-10">{bubble.a} + {bubble.b}</span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
