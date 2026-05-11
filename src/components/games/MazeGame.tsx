import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { playVoice, playSuccessSound, playErrorSound, playBipSound } from '../../lib/audio';
import { ArrowLeft, Play, RotateCcw, ArrowUp, CornerUpRight, CornerUpLeft, Delete, Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { generateMazeLevel } from '../../lib/gemini';

type Direction = 'N' | 'E' | 'S' | 'W';
type Command = 'FORWARD' | 'RIGHT' | 'LEFT';

const GRID_SIZE = 6;

export default function MazeGame({ profile, onBack, onScoreUpdate }: { profile: UserProfile, onBack: () => void, onScoreUpdate: (points: number, gameId?: string) => void }) {
  const [commands, setCommands] = useState<Command[]>([]);
  const [robotPos, setRobotPos] = useState({ x: 0, y: 0 });
  const [robotDir, setRobotDir] = useState<Direction>('N');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [difficulty, setDifficulty] = useState<string>(profile.gradeLevel || "CP");

  const [targetPos, setTargetPos] = useState({ x: 5, y: 5 });
  const [walls, setWalls] = useState<{x: number, y: number}[]>([]);

  useEffect(() => {
    playVoice("Programme le robot pour atteindre le cadeau !", "fr");
    generateLevel();
  }, []);

  const generateLevel = async (customDifficulty?: string) => {
    setIsGenerating(true);
    const targetDifficulty = customDifficulty || difficulty;
    try {
      const levelData = await generateMazeLevel(targetDifficulty, GRID_SIZE);
      
      if (levelData && levelData.target && levelData.walls) {
        setTargetPos(levelData.target);
        setWalls(levelData.walls);
      } else {
        throw new Error("Invalid level data");
      }
    } catch (error) {
      console.error("Failed to generate level:", error);
      // Fallback level
      setTargetPos({ x: 5, y: 5 });
      setWalls([{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }]);
    } finally {
      setRobotPos({ x: 0, y: 0 });
      setRobotDir('N');
      setCommands([]);
      setIsGenerating(false);
    }
  };

  const handleDifficultyChange = (newDiff: string) => {
    if (isPlaying || isGenerating) return;
    setDifficulty(newDiff);
    generateLevel(newDiff);
  };

  const addCommand = (cmd: Command) => {
    if (isPlaying) return;
    playBipSound();
    setCommands(prev => [...prev, cmd]);
  };

  const removeLastCommand = () => {
    if (isPlaying || commands.length === 0) return;
    playBipSound();
    setCommands(prev => prev.slice(0, -1));
  };

  const reset = () => {
    if (isPlaying) return;
    setCommands([]);
    setRobotPos({ x: 0, y: 0 });
    setRobotDir('N');
  };

  const getRotation = (dir: Direction) => {
    switch (dir) {
      case 'N': return 0;
      case 'E': return 90;
      case 'S': return 180;
      case 'W': return -90;
    }
  };

  const playSequence = async () => {
    if (isPlaying || commands.length === 0) return;
    setIsPlaying(true);

    let currentX = 0;
    let currentY = 0;
    let currentDir: Direction = 'N';

    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i];
      playBipSound();
      
      if (cmd === 'FORWARD') {
        let nextX = currentX;
        let nextY = currentY;
        if (currentDir === 'N') nextY -= 1;
        if (currentDir === 'S') nextY += 1;
        if (currentDir === 'E') nextX += 1;
        if (currentDir === 'W') nextX -= 1;

        if (nextX >= 0 && nextX < GRID_SIZE && nextY >= 0 && nextY < GRID_SIZE && !walls.some(w => w.x === nextX && w.y === nextY)) {
          currentX = nextX;
          currentY = nextY;
        } else {
          playErrorSound();
          setRobotPos({ x: currentX, y: currentY });
          setRobotDir(currentDir);
          setIsPlaying(false);
          return;
        }
      } else if (cmd === 'RIGHT') {
        const dirs: Direction[] = ['N', 'E', 'S', 'W'];
        currentDir = dirs[(dirs.indexOf(currentDir) + 1) % 4];
      } else if (cmd === 'LEFT') {
        const dirs: Direction[] = ['N', 'E', 'S', 'W'];
        currentDir = dirs[(dirs.indexOf(currentDir) + 3) % 4];
      }

      setRobotPos({ x: currentX, y: currentY });
      setRobotDir(currentDir);
      
      await new Promise(r => setTimeout(r, 500));
    }

    if (currentX === targetPos.x && currentY === targetPos.y) {
      playSuccessSound();
      playVoice("Bravo ! Le robot a trouvé le cadeau.", "fr");
      
      // Local score update
      onScoreUpdate(15, 'maze');

      setTimeout(() => {
        setIsPlaying(false);
        generateLevel();
      }, 2000);
    } else {
      playErrorSound();
      setIsPlaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-lime-50 p-2 md:p-4 font-sans">
      <button onClick={onBack} className="mb-4 flex items-center gap-2 text-lime-700 font-bold bg-white px-4 py-3 rounded-2xl btn-tactile">
        <ArrowLeft size={20} /> Retour
      </button>
      
      <div className="max-w-4xl mx-auto bg-white rounded-[32px] p-4 md:p-6 shadow-sm card-tactile">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 md:mb-6 gap-4">
          <h2 className="text-xl md:text-2xl font-black text-lime-600 text-tight-heading">Le Labyrinthe du Codeur 🤖</h2>
          
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
            {["CP", "CM1", "1ère Année Collège"].map((level) => (
              <button
                key={level}
                onClick={() => handleDifficultyChange(level)}
                disabled={isGenerating || isPlaying}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  difficulty === level 
                    ? 'bg-white text-lime-600 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {level === "CP" ? "Niveau 1" : level === "CM1" ? "Niveau 2" : "Niveau 3"}
              </button>
            ))}
          </div>

          <button 
            onClick={() => generateLevel()}
            disabled={isGenerating || isPlaying}
            className="flex items-center gap-2 bg-lime-100 text-lime-700 px-3 py-2 rounded-xl font-bold btn-tactile text-sm disabled:opacity-50"
          >
            <RefreshCw size={18} className={isGenerating ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Changer de grille</span>
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 md:gap-8">
          {/* Game Board */}
          <div className="flex-1 w-full max-w-[320px] mx-auto md:max-w-none relative">
            {isGenerating && (
              <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-lime-500 animate-spin mb-4" />
                <p className="text-lime-700 font-bold">Génération du niveau...</p>
              </div>
            )}
            <div className="bg-slate-50 p-2 md:p-4 rounded-3xl border-2 border-slate-100 relative mx-auto w-full max-w-[320px]">
              <div 
                className="grid gap-1 w-full relative" 
                style={{ 
                  gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`
                }}
              >
                {Array(GRID_SIZE * GRID_SIZE).fill(0).map((_, i) => {
                  const x = i % GRID_SIZE;
                  const y = Math.floor(i / GRID_SIZE);
                  const isWall = walls.some(w => w.x === x && w.y === y);
                  const isTarget = targetPos.x === x && targetPos.y === y;

                  return (
                    <div key={i} className={`aspect-square rounded-lg flex items-center justify-center text-xl md:text-3xl ${isWall ? 'bg-slate-700' : 'bg-white shadow-sm border border-slate-100'}`}>
                      {isTarget && '🎁'}
                    </div>
                  );
                })}

                {/* Robot Overlay */}
                <motion.div
                  className="absolute flex items-center justify-center text-2xl md:text-3xl z-10 pointer-events-none"
                  initial={false}
                  animate={{
                    x: `calc(${robotPos.x * 100}% + ${robotPos.x * 4}px)`,
                    y: `calc(${robotPos.y * 100}% + ${robotPos.y * 4}px)`,
                    rotate: getRotation(robotDir)
                  }}
                  style={{
                    width: `calc((100% - ${(GRID_SIZE - 1) * 4}px) / ${GRID_SIZE})`,
                    height: `calc((100% - ${(GRID_SIZE - 1) * 4}px) / ${GRID_SIZE})`,
                    top: 0,
                    left: 0,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  🐞
                </motion.div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="bg-slate-50 p-4 rounded-3xl border-2 border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Commandes</h3>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <button onClick={() => addCommand('LEFT')} disabled={isPlaying} className="p-3 bg-sky-100 text-sky-600 rounded-2xl btn-tactile flex items-center justify-center">
                  <CornerUpLeft size={24} />
                </button>
                <button onClick={() => addCommand('FORWARD')} disabled={isPlaying} className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl btn-tactile flex items-center justify-center">
                  <ArrowUp size={24} />
                </button>
                <button onClick={() => addCommand('RIGHT')} disabled={isPlaying} className="p-3 bg-sky-100 text-sky-600 rounded-2xl btn-tactile flex items-center justify-center">
                  <CornerUpRight size={24} />
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={removeLastCommand} disabled={isPlaying || commands.length === 0} className="flex-1 p-2 bg-danger-100 text-danger-600 font-bold rounded-2xl btn-tactile flex items-center justify-center gap-1 text-sm">
                  <Delete size={18} /> Effacer
                </button>
                <button onClick={reset} disabled={isPlaying} className="flex-1 p-2 bg-warning-100 text-warning-700 font-bold rounded-2xl btn-tactile flex items-center justify-center gap-1 text-sm">
                  <RotateCcw size={18} /> Reset
                </button>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-3xl border-2 border-slate-100 flex-1 flex flex-col">
              <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Programme</h3>
              <div className="flex-1 flex flex-wrap gap-1.5 content-start mb-4 min-h-[60px] bg-white p-3 rounded-2xl border-2 border-slate-100 shadow-inner">
                {commands.map((cmd, i) => (
                  <div key={i} className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-white shadow-sm ${cmd === 'FORWARD' ? 'bg-success-500' : 'bg-sky-500'}`}>
                    {cmd === 'FORWARD' ? <ArrowUp size={16} /> : cmd === 'LEFT' ? <CornerUpLeft size={16} /> : <CornerUpRight size={16} />}
                  </div>
                ))}
                {commands.length === 0 && <p className="text-slate-400 font-medium w-full text-center mt-2 text-xs">Ajoute des commandes...</p>}
              </div>

              <button 
                onClick={playSequence} 
                disabled={isPlaying || commands.length === 0}
                className="w-full bg-lime-400 text-lime-900 font-black py-3 px-4 rounded-2xl btn-tactile flex items-center justify-center gap-2 text-lg"
              >
                <Play size={24} fill="currentColor" /> {isPlaying ? 'En cours...' : 'LANCER'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
