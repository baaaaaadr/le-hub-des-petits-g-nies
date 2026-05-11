import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../../types';
import { playVoice, playSuccessSound, playErrorSound, playBipSound } from '../../lib/audio';
import { ArrowLeft, Volume2 } from 'lucide-react';
import { motion } from 'motion/react';

const ANIMAL_POOL = [
  { name: 'Lion 🦁' }, { name: 'Singe 🐒' }, { name: 'Éléphant 🐘' },
  { name: 'Girafe 🦒' }, { name: 'Pingouin 🐧' }, { name: 'Ours 🐻' },
  { name: 'Tigre 🐯' }, { name: 'Zèbre 🦓' }, { name: 'Panda 🐼' },
  { name: 'Koala 🐨' }, { name: 'Renard 🦊' }, { name: 'Lapin 🐰' },
];

const timeToText = (h: number, m: number, age: number) => {
  if (age >= 10 && m === 45) {
    const nextH = h === 23 ? 0 : h + 1;
    const nextHText = nextH === 1 || nextH === 0 ? (nextH === 0 ? 'minuit' : '1 heure') : `${nextH} heures`;
    return `${nextHText} moins le quart`;
  }
  
  let hText = h === 0 ? 'minuit' : h === 12 ? 'midi' : `${h} heure${h > 1 ? 's' : ''}`;
  if (m === 0) return `${hText} pile`;
  if (m === 15) return `${hText} et quart`;
  if (m === 30) return `${hText} et demi`;
  return `${hText} ${m}`;
};

const AnalogClock = ({ 
  hour, 
  minute, 
  onChange, 
  disabled 
}: { 
  hour: number, 
  minute: number, 
  onChange: (h: number, m: number) => void,
  disabled: boolean 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<'hour' | 'minute' | null>(null);

  const getAngle = (clientX: number, clientY: number) => {
    if (!svgRef.current) return 0;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    angle = (angle + 90 + 360) % 360;
    return angle;
  };

  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!dragging || disabled) return;
      const angle = getAngle(e.clientX, e.clientY);
      
      if (dragging === 'minute') {
        let m = Math.round(angle / 6);
        m = Math.round(m / 5) * 5;
        if (m === 60) m = 0;
        onChange(hour, m);
      } else if (dragging === 'hour') {
        let baseAngle = angle - (minute / 60) * 30;
        baseAngle = (baseAngle + 360) % 360;
        let h = Math.round(baseAngle / 30);
        if (h === 0) h = 12;
        let isPM = hour >= 12;
        let finalH = h;
        if (isPM && h !== 12) finalH += 12;
        if (!isPM && h === 12) finalH = 0;
        onChange(finalH, minute);
      }
    };

    const handleGlobalPointerUp = () => {
      setDragging(null);
    };

    if (dragging) {
      window.addEventListener('pointermove', handleGlobalPointerMove);
      window.addEventListener('pointerup', handleGlobalPointerUp);
      window.addEventListener('pointercancel', handleGlobalPointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [dragging, disabled, hour, minute, onChange]);

  const minuteAngle = minute * 6;
  const hourAngle = ((hour % 12) + minute / 60) * 30;

  return (
    <div className="relative w-56 h-56 mx-auto mb-4">
      <svg 
        ref={svgRef}
        viewBox="0 0 100 100" 
        className="w-full h-full drop-shadow-lg touch-none"
      >
        {/* Clock face */}
        <circle cx="50" cy="50" r="48" fill="white" stroke="#c7d2fe" strokeWidth="4" />
        
        {/* Hour markers */}
        {[...Array(12)].map((_, i) => (
          <line 
            key={i} 
            x1="50" y1="6" x2="50" y2="12" 
            transform={`rotate(${i * 30} 50 50)`}
            stroke={i % 3 === 0 ? "#4f46e5" : "#94a3b8"} 
            strokeWidth={i % 3 === 0 ? "3" : "2"} 
            strokeLinecap="round" 
          />
        ))}

        {/* Hour hand group */}
        <g transform={`rotate(${hourAngle} 50 50)`}>
          <line x1="50" y1="50" x2="50" y2="28" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" />
          <line 
            x1="50" y1="50" x2="50" y2="20" 
            stroke="transparent" 
            strokeWidth="15" 
            strokeLinecap="round" 
            onPointerDown={(e) => {
              if (!disabled) {
                e.preventDefault();
                setDragging('hour');
              }
            }}
            className={disabled ? '' : 'cursor-pointer'} 
          />
        </g>

        {/* Minute hand group */}
        <g transform={`rotate(${minuteAngle} 50 50)`}>
          <line x1="50" y1="50" x2="50" y2="15" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
          <line 
            x1="50" y1="50" x2="50" y2="10" 
            stroke="transparent" 
            strokeWidth="15" 
            strokeLinecap="round" 
            onPointerDown={(e) => {
              if (!disabled) {
                e.preventDefault();
                setDragging('minute');
              }
            }}
            className={disabled ? '' : 'cursor-pointer'} 
          />
        </g>
        
        {/* Center dot */}
        <circle cx="50" cy="50" r="4" fill="#ef4444" />
      </svg>
    </div>
  );
};

export default function ClockGame({ profile, onBack, onScoreUpdate }: { profile: UserProfile, onBack: () => void, onScoreUpdate: (points: number, gameId?: string) => void }) {
  const [targetAnimal, setTargetAnimal] = useState({ name: 'Lion 🦁', hour: 12, minute: 0, text: "midi pile" });
  const [currentHour, setCurrentHour] = useState(12);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [difficulty, setDifficulty] = useState<string>(profile.gradeLevel || 'CP');

  useEffect(() => {
    generateTime();
  }, []);

  const generateTime = (customDifficulty?: string) => {
    const targetDifficulty = customDifficulty || difficulty;
    
    let hour = Math.floor(Math.random() * 12) + 1;
    let minute = 0;

    if (targetDifficulty === "1ère Année Collège") {
      hour = Math.floor(Math.random() * 24);
      minute = Math.floor(Math.random() * 60);
    } else if (targetDifficulty === "CM1") {
      hour = Math.floor(Math.random() * 12) + 1;
      minute = Math.floor(Math.random() * 12) * 5;
    } else {
      hour = Math.floor(Math.random() * 12) + 1;
      minute = Math.floor(Math.random() * 4) * 15;
    }

    const animal = ANIMAL_POOL[Math.floor(Math.random() * ANIMAL_POOL.length)];
    const age = targetDifficulty === "CP" ? 6 : targetDifficulty === "CM1" ? 9 : 12;
    const newTarget = {
      ...animal,
      hour,
      minute,
      text: timeToText(hour, minute, age)
    };
    
    setTargetAnimal(newTarget);
    setCurrentHour(12);
    setCurrentMinute(0);
    setIsSuccess(false);

    playVoice(`Quelle heure est-il pour le ${newTarget.name.split(' ')[0]} ? Il est ${newTarget.text}.`, 'fr');
  };

  const handleDifficultyChange = (newDiff: string) => {
    if (isSuccess) return;
    setDifficulty(newDiff);
    generateTime(newDiff);
  };

  const handleListen = () => {
    playVoice(`Il est ${targetAnimal.text}.`, 'fr');
  };

  const handleClockChange = (newH: number, newM: number) => {
    if (isSuccess) return;
    
    // Auto-correct AM/PM if the face matches the target to help kids
    if (newH % 12 === targetAnimal.hour % 12) {
      newH = targetAnimal.hour;
    }
    
    setCurrentHour(newH);
    setCurrentMinute(newM);
  };

  const changeTime = (type: 'h' | 'm', amount: number) => {
    if (isSuccess) return;
    playBipSound();
    const age = profile.age || 6;
    const maxH = age >= 10 ? 23 : 12;
    const minH = age >= 10 ? 0 : 1;

    if (type === 'h') {
      setCurrentHour(prev => {
        let next = prev + amount;
        if (next > maxH) next = minH;
        if (next < minH) next = maxH;
        return next;
      });
    } else {
      setCurrentMinute(prev => {
        let next = prev + amount;
        if (next >= 60) next = 0;
        if (next < 0) next = 55;
        return next;
      });
    }
  };

  const checkWin = async () => {
    if (isSuccess) return;
    
    if (currentHour === targetAnimal.hour && currentMinute === targetAnimal.minute) {
      setIsSuccess(true);
      playSuccessSound();
      playVoice(`Bravo ! C'est bien l'heure du ${targetAnimal.name.split(' ')[0]}.`, "fr");
      
      // Local score update
      onScoreUpdate(5, 'clock');

      setTimeout(generateTime, 3000);
    } else {
      playErrorSound();
      playVoice("Ce n'est pas encore ça, essaie encore !", "fr");
    }
  };

  return (
    <div className="min-h-screen bg-indigo-50 p-4 font-sans">
      <button onClick={onBack} className="mb-4 flex items-center gap-2 text-indigo-700 font-bold bg-white px-4 py-3 rounded-2xl btn-tactile">
        <ArrowLeft size={20} /> Retour
      </button>
      
      <div className="max-w-md mx-auto bg-white rounded-[32px] p-6 shadow-sm card-tactile text-center">
        <div className="flex justify-between items-center bg-slate-50 p-1.5 rounded-2xl mb-4">
          {["CP", "CM1", "1ère Année Collège"].map((level) => (
            <button
              key={level}
              onClick={() => handleDifficultyChange(level)}
              disabled={isSuccess}
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
        <h2 className="text-2xl font-black text-indigo-600 mb-6 text-tight-heading">L'Horloge des Animaux ⏰</h2>
        
        <div className="bg-indigo-50 rounded-3xl p-6 mb-6 border-2 border-indigo-100">
          <p className="text-sm font-bold text-indigo-400 mb-2 uppercase tracking-wider">Trouve l'heure pour :</p>
          <p className="text-3xl font-black text-indigo-900 mb-4 text-tight-heading">{targetAnimal.name}</p>
          <p className="text-xl font-bold text-indigo-700 bg-white inline-block px-4 py-2 rounded-2xl shadow-sm">
            {targetAnimal.text}
          </p>
        </div>

        <button onClick={handleListen} className="mx-auto mb-6 bg-sky-500 text-white font-bold py-3 px-6 rounded-2xl btn-tactile flex items-center gap-2">
          <Volume2 size={24} /> ÉCOUTER
        </button>

        <motion.div 
          animate={isSuccess ? { 
            scale: [1, 1.1, 0.95, 1.05, 1],
            rotate: [0, -5, 5, -5, 0]
          } : {}}
          transition={{ duration: 0.6 }}
          className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 mb-8"
        >
          <p className="text-xs font-bold text-indigo-400 mb-4 uppercase tracking-wider">
            Tourne les aiguilles avec ton doigt !
          </p>
          
          {/* Interactive Analog Clock */}
          <AnalogClock 
            hour={currentHour} 
            minute={currentMinute} 
            onChange={handleClockChange} 
            disabled={isSuccess} 
          />

          {/* Digital Clock */}
          <div className="text-5xl font-black text-slate-800 font-mono bg-white py-3 px-6 rounded-2xl inline-block border-2 border-slate-100 shadow-inner">
            {currentHour}:{currentMinute.toString().padStart(2, '0')}
          </div>
        </motion.div>

        <div className="flex justify-center gap-8 mb-8">
          <div className="flex flex-col gap-2">
            <p className="font-bold text-slate-400 text-sm uppercase tracking-wider">Heures</p>
            <div className="flex gap-3">
              <button onClick={() => changeTime('h', -1)} disabled={isSuccess} className="bg-indigo-100 text-indigo-700 w-14 h-14 rounded-2xl font-black text-2xl btn-tactile flex items-center justify-center">-</button>
              <button onClick={() => changeTime('h', 1)} disabled={isSuccess} className="bg-indigo-100 text-indigo-700 w-14 h-14 rounded-2xl font-black text-2xl btn-tactile flex items-center justify-center">+</button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-bold text-slate-400 text-sm uppercase tracking-wider">Minutes</p>
            <div className="flex gap-3">
              <button onClick={() => changeTime('m', -5)} disabled={isSuccess} className="bg-purple-100 text-purple-700 w-14 h-14 rounded-2xl font-black text-xl btn-tactile flex items-center justify-center">-5</button>
              <button onClick={() => changeTime('m', 5)} disabled={isSuccess} className="bg-purple-100 text-purple-700 w-14 h-14 rounded-2xl font-black text-xl btn-tactile flex items-center justify-center">+5</button>
            </div>
          </div>
        </div>

        <button onClick={checkWin} disabled={isSuccess} className="w-full bg-success-500 text-white font-black text-xl py-4 rounded-2xl btn-tactile flex justify-center items-center">
          C'EST L'HEURE !
        </button>
      </div>
    </div>
  );
}
