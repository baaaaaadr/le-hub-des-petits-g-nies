import { useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { motion } from 'motion/react';
import { LogOut, Trophy, Clock, Gamepad2, Volume2, Play } from 'lucide-react';

const GAMES = [
  {
    id: 'detective',
    title: 'Le Détective des Mots',
    desc: 'Trouve le mot caché !',
    emoji: '🕵️‍♂️',
    image: 'https://picsum.photos/seed/detective/600/400?blur=1',
    color: 'bg-emerald-500',
  },
  {
    id: 'market',
    title: "Le Marché de l'Atlas",
    desc: 'Apprends à compter tes Dirhams !',
    emoji: '🛒',
    image: 'https://picsum.photos/seed/market/600/400?blur=1',
    color: 'bg-amber-500',
  },
  {
    id: 'butterfly',
    title: 'Le Papillon Magique',
    desc: 'Complète les ailes du papillon !',
    emoji: '🦋',
    image: 'https://picsum.photos/seed/butterfly/600/400?blur=1',
    color: 'bg-fuchsia-500',
  },
  {
    id: 'train',
    title: "Le Train de l'Arabe",
    desc: 'Trouve la première lettre !',
    emoji: '🚂',
    image: 'https://picsum.photos/seed/train/600/400?blur=1',
    color: 'bg-sky-500',
  },
  {
    id: 'balance',
    title: 'La Balance Magique',
    desc: 'Équilibre les poids !',
    emoji: '⚖️',
    image: 'https://picsum.photos/seed/balance/600/400?blur=1',
    color: 'bg-rose-500',
  },
  {
    id: 'polyglot',
    title: 'Le Polyglotte',
    desc: 'Apprends l\'anglais et l\'arabe !',
    emoji: '🌍',
    image: 'https://picsum.photos/seed/polyglot/600/400?blur=1',
    color: 'bg-indigo-500',
  },
  {
    id: 'clock',
    title: "L'Horloge des Animaux",
    desc: "Apprends à lire l'heure !",
    emoji: '⏰',
    image: 'https://picsum.photos/seed/clock/600/400?blur=1',
    color: 'bg-orange-500',
  },
  {
    id: 'bubble',
    title: 'Le Chasseur de Dizaines',
    desc: 'Fais éclater les bulles de 10 !',
    emoji: '🫧',
    image: 'https://picsum.photos/seed/bubbles/600/400?blur=1',
    color: 'bg-cyan-500',
  },
  {
    id: 'maze',
    title: 'Le Labyrinthe du Codeur',
    desc: 'Programme le robot !',
    emoji: '🤖',
    image: 'https://picsum.photos/seed/maze/600/400?blur=1',
    color: 'bg-violet-500',
  }
];

export default function Hub({ profile, onNavigate }: { profile: UserProfile, onNavigate: (screen: string) => void }) {
  const gamesPlayedData = profile.gamesPlayed || {};
  const totalGames = Object.values(gamesPlayedData).reduce((a, b) => (a as number) + ((b as number) || 0), 0) as number;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 font-sans">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-center justify-between bg-white rounded-3xl shadow-sm p-4 md:p-6 mb-6 gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="text-4xl bg-sky-100 p-3 rounded-2xl shadow-inner"
          >
            {profile.emojiAvatar}
          </motion.div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-tight-heading text-slate-800">
              Salut, {profile.name} !
            </h1>
            <p className="text-slate-500 font-bold text-sm mt-1">
              Âge : {profile.age} ans • <span className="text-amber-500">{profile.totalScore} pts</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button 
            onClick={() => onNavigate('audiotest')}
            className="flex items-center justify-center gap-2 p-3 px-4 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 font-bold transition-colors btn-tactile flex-1 sm:flex-none"
          >
            <Volume2 size={20} />
            <span className="hidden sm:inline">Son</span>
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Games Grid */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl md:text-2xl font-black text-tight-heading text-slate-800 flex items-center gap-2 px-2">
            <Gamepad2 className="text-primary-500" size={28} /> 
            Les Jeux Magiques
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {GAMES.map((game) => (
              <motion.div
                key={game.id}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate(game.id)}
                className="card-tactile relative h-64 rounded-3xl overflow-hidden cursor-pointer group bg-slate-100"
              >
                {/* Background Image */}
                <img 
                  src={game.image} 
                  alt={game.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                
                {/* Gradient Overlay (bottom only) */}
                <div className="absolute inset-0 bg-gradient-overlay" />

                {/* Content */}
                <div className="absolute inset-0 p-5 flex flex-col justify-end">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl drop-shadow-md">{game.emoji}</span>
                    <h3 className="text-xl font-black text-white text-tight-heading drop-shadow-md leading-tight">
                      {game.title}
                    </h3>
                  </div>
                  <p className="text-slate-200 font-semibold text-sm mb-4 drop-shadow-sm line-clamp-1">
                    {game.desc}
                  </p>
                  
                  <button className={`w-full ${game.color} text-white rounded-xl py-3 font-bold btn-tactile flex justify-center items-center gap-2 text-sm uppercase tracking-wide`}>
                    <Play size={18} fill="currentColor" /> Jouer
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* My Stats */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-sm p-5 md:p-6 h-fit sticky top-6">
            <h2 className="text-xl md:text-2xl font-black text-tight-heading text-slate-800 mb-5 flex items-center gap-2">
              <Trophy className="text-amber-400" size={28} /> 
              Mes Records
            </h2>
            
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Score Total</p>
                  <p className="text-2xl font-black text-sky-600">{profile.totalScore} pts</p>
                </div>
                <Trophy className="text-amber-400 opacity-20" size={40} />
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Temps de Jeu</p>
                  <p className="text-2xl font-black text-indigo-600">{profile.timePlayedMinutes || 0} min</p>
                </div>
                <Clock className="text-indigo-400 opacity-20" size={40} />
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Parties Jouées</p>
                  <p className="text-2xl font-black text-emerald-600">{totalGames}</p>
                </div>
                <Gamepad2 className="text-emerald-400 opacity-20" size={40} />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-100">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-center mb-4">Détails par Jeu</p>
              <div className="grid grid-cols-3 gap-2">
                {GAMES.map(g => (
                  <div key={g.id} className="flex flex-col items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-lg">{g.emoji}</span>
                    <span className="font-black text-slate-600 text-[10px]">{profile.gamesPlayed?.[g.id as keyof typeof profile.gamesPlayed] || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
