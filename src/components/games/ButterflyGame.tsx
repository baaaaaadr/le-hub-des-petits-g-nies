import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { playVoice, playSuccessSound, playErrorSound, playBipSound } from '../../lib/audio';
import { generateButterflyPattern } from '../../lib/gemini';
import { motion } from 'motion/react';
import { ArrowLeft, Check, Palette, MoveRight, MoveDown, RefreshCw, LayoutGrid } from 'lucide-react';

const COLORS = ['purple', 'pink', 'blue', 'yellow', 'emerald'];
const COLOR_CLASSES: Record<string, string> = {
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
  blue: 'bg-blue-500',
  yellow: 'bg-yellow-400',
  emerald: 'bg-emerald-500',
  empty: 'bg-slate-200'
};

type SymmetryAxis = 'vertical' | 'horizontal';
type SymmetryType = 'axial' | 'point';

export default function ButterflyGame({ profile, onBack, onScoreUpdate }: { profile: UserProfile, onBack: () => void, onScoreUpdate: (points: number, gameId?: string) => void }) {
  const [gameState, setGameState] = useState<'setup' | 'playing'>('setup');
  const [gridSize, setGridSize] = useState(5);
  const [axis, setAxis] = useState<SymmetryAxis>('vertical');
  const [type, setType] = useState<SymmetryType>('axial');
  
  const [leftGrid, setLeftGrid] = useState<string[]>([]);
  const [rightGrid, setRightGrid] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('purple');
  const [loading, setLoading] = useState(false);

  const startGame = () => {
    setGameState('playing');
    playVoice(
      axis === 'vertical' 
        ? "Reproduis l'aile du papillon en miroir vertical !" 
        : "Reproduis l'aile du papillon en miroir horizontal !", 
      "fr"
    );
    generatePattern();
  };

  const generatePattern = async () => {
    setLoading(true);
    try {
      const totalCells = gridSize * gridSize;
      const pattern = await generateButterflyPattern(gridSize, COLORS);
      
      if (!pattern || pattern.length !== totalCells) {
        const newLeft = Array(totalCells).fill('empty').map(() => Math.random() > 0.6 ? COLORS[Math.floor(Math.random() * COLORS.length)] : 'empty');
        setLeftGrid(newLeft);
      } else {
        setLeftGrid(pattern.map((c: string) => COLORS.includes(c) ? c : 'empty'));
      }
      
      setRightGrid(Array(totalCells).fill('empty'));
    } catch (e) {
      console.error(e);
      const totalCells = gridSize * gridSize;
      const newLeft = Array(totalCells).fill('empty').map(() => Math.random() > 0.6 ? COLORS[Math.floor(Math.random() * COLORS.length)] : 'empty');
      setLeftGrid(newLeft);
      setRightGrid(Array(totalCells).fill('empty'));
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = (index: number) => {
    playBipSound();
    const newRight = [...rightGrid];
    if (newRight[index] === selectedColor) {
      newRight[index] = 'empty';
    } else {
      newRight[index] = selectedColor;
    }
    setRightGrid(newRight);
  };

  const checkWin = async () => {
    let isWin = true;
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const leftIdx = row * gridSize + col;
        let rightIdx = -1;

        if (axis === 'vertical') {
          if (type === 'axial') {
            // Mirror vertical
            rightIdx = row * gridSize + ((gridSize - 1) - col);
          } else {
            // Point vertical (180 deg)
            rightIdx = ((gridSize - 1) - row) * gridSize + ((gridSize - 1) - col);
          }
        } else {
          if (type === 'axial') {
            // Mirror horizontal
            rightIdx = ((gridSize - 1) - row) * gridSize + col;
          } else {
            // Point horizontal (180 deg)
            rightIdx = ((gridSize - 1) - row) * gridSize + ((gridSize - 1) - col);
          }
        }

        if (leftGrid[leftIdx] !== rightGrid[rightIdx]) {
          isWin = false;
        }
      }
    }

    if (isWin) {
      playSuccessSound();
      playVoice("Bravo ! C'est parfaitement symétrique.", "fr");
      
      // Local score update
      onScoreUpdate(5, 'butterfly');

      setTimeout(generatePattern, 2000);
    } else {
      playErrorSound();
      
      // Local score update (penalty)
      onScoreUpdate(-2);
    }
  };

  if (gameState === 'setup') {
    return (
      <div className="min-h-screen bg-purple-50 p-4 font-sans flex flex-col items-center">
        <button onClick={onBack} className="self-start mb-4 flex items-center gap-2 text-purple-700 font-bold bg-white px-4 py-3 rounded-2xl btn-tactile">
          <ArrowLeft size={20} /> Retour
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-[32px] p-8 shadow-sm card-tactile text-center"
        >
          <h2 className="text-3xl font-black text-purple-600 mb-8 text-tight-heading">Configuration 🦋</h2>
          
          <div className="space-y-8">
            {/* Difficulty/Grid Size Selection */}
            <div>
              <p className="text-slate-400 font-bold mb-4 text-sm uppercase tracking-wider">Taille de l'aile (Difficulté) :</p>
              <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl">
                {[3, 5, 7].map((size) => (
                  <button
                    key={size}
                    onClick={() => { playBipSound(); setGridSize(size); }}
                    className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                      gridSize === size 
                        ? 'bg-white text-purple-600 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {size === 3 ? "Petit" : size === 5 ? "Normal" : "Grand"}
                  </button>
                ))}
              </div>
            </div>

            {/* Axis Selection */}
            <div>
              <p className="text-slate-400 font-bold mb-4 text-sm uppercase tracking-wider">Axe de symétrie :</p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setAxis('vertical')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-4 transition-all ${axis === 'vertical' ? 'border-purple-500 bg-purple-50' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'}`}
                >
                  <MoveRight className="text-purple-500 rotate-0" />
                  <span className="font-bold text-slate-700">Vertical</span>
                </button>
                <button 
                  onClick={() => setAxis('horizontal')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-4 transition-all ${axis === 'horizontal' ? 'border-purple-500 bg-purple-50' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'}`}
                >
                  <MoveDown className="text-purple-500" />
                  <span className="font-bold text-slate-700">Horizontal</span>
                </button>
              </div>
            </div>

            {/* Type Selection */}
            <div>
              <p className="text-slate-400 font-bold mb-4 text-sm uppercase tracking-wider">Type de symétrie :</p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setType('axial')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-4 transition-all ${type === 'axial' ? 'border-purple-500 bg-purple-50' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'}`}
                >
                  <RefreshCw className="text-purple-500" />
                  <span className="font-bold text-slate-700">Axiale (Miroir)</span>
                </button>
                <button 
                  onClick={() => setType('point')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-4 transition-all ${type === 'point' ? 'border-purple-500 bg-purple-50' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'}`}
                >
                  <LayoutGrid className="text-purple-500" />
                  <span className="font-bold text-slate-700">Centrale (Point)</span>
                </button>
              </div>
            </div>

            <button 
              onClick={startGame}
              className="w-full bg-purple-500 text-white font-black text-xl py-4 rounded-2xl btn-tactile"
            >
              C'EST PARTI !
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-50 p-4 font-sans">
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-4">
          <button onClick={() => setGameState('setup')} className="flex items-center gap-2 text-purple-700 font-bold bg-white px-4 py-3 rounded-2xl btn-tactile">
            <ArrowLeft size={20} /> Config
          </button>
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border-2 border-purple-100 font-black text-purple-600">
            {axis === 'vertical' ? 'Axe Vertical' : 'Axe Horizontal'} • {type === 'axial' ? 'Miroir' : 'Point'}
          </div>
        </div>
        
        <div className="w-full bg-white rounded-[32px] p-6 shadow-sm card-tactile text-center">
          <h2 className="text-2xl font-black text-purple-600 mb-6 text-tight-heading">Le Papillon Magique 🦋</h2>
          
          {loading ? (
            <div className="animate-pulse flex flex-col items-center gap-4 py-12">
              <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-purple-500 font-bold">L'IA dessine un nouveau papillon...</p>
            </div>
          ) : (
            <>
              {/* Color Selector */}
              <div className="flex justify-center gap-3 mb-6 flex-wrap">
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full shadow-sm border-4 transition-transform ${COLOR_CLASSES[color]} ${selectedColor === color ? 'border-slate-800 scale-110' : 'border-transparent hover:scale-105'}`}
                  />
                ))}
                <button
                  onClick={() => setSelectedColor('empty')}
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-full shadow-sm border-4 transition-transform bg-slate-200 flex items-center justify-center ${selectedColor === 'empty' ? 'border-slate-800 scale-110' : 'border-transparent hover:scale-105'}`}
                >
                  <div className="w-6 h-1 bg-slate-400 rotate-45 rounded-full" />
                </button>
              </div>

              <div className={`flex justify-center gap-2 mb-8 bg-slate-50 p-4 rounded-3xl w-full ${axis === 'horizontal' ? 'flex-col' : 'flex-row'}`}>
                {/* Left/Top Wing */}
                <div className="grid gap-1 flex-1" style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
                  {leftGrid.map((color, i) => (
                    <div key={`l-${i}`} className={`aspect-square w-full rounded-md ${COLOR_CLASSES[color] || 'bg-slate-200'}`} />
                  ))}
                </div>
                
                <div className={`${axis === 'vertical' ? 'w-2 h-auto' : 'h-2 w-auto'} bg-slate-300 rounded-full shrink-0`} />
                
                {/* Right/Bottom Wing */}
                <div className="grid gap-1 flex-1" style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
                  {rightGrid.map((color, i) => (
                    <div key={`r-${i}`} onClick={() => handleCellClick(i)} className={`aspect-square w-full rounded-md cursor-pointer transition-colors ${COLOR_CLASSES[color] || 'bg-slate-200'}`} />
                  ))}
                </div>
              </div>

              <button onClick={checkWin} className="w-full bg-success-500 text-white font-black text-xl py-4 rounded-2xl btn-tactile flex items-center justify-center gap-2">
                <Check size={24} /> VÉRIFIER
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
