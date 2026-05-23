import { useEffect, useState } from 'react';
import { UserProfile } from './types';
import Hub from './components/Hub';
import AudioTest from './components/AudioTest';
import DetectiveGame from './components/games/DetectiveGame';
import MarketGame from './components/games/MarketGame';
import ButterflyGame from './components/games/ButterflyGame';
import TrainGame from './components/games/TrainGame';
import BalanceGame from './components/games/BalanceGame';
import PolyglotGame from './components/games/PolyglotGame';
import ClockGame from './components/games/ClockGame';
import BubbleGame from './components/games/BubbleGame';
import MazeGame from './components/games/MazeGame';
import SubtractionGame from './components/games/SubtractionGame';

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<string>('hub');

  const INITIAL_PROFILE: UserProfile = {
    uid: "local-zeina",
    name: "Zeina",
    emojiAvatar: "👧",
    age: 8,
    gradeLevel: "CM1",
    totalScore: 0,
    gamesPlayed: {
      detective: 0,
      market: 0,
      butterfly: 0,
      train: 0,
      balance: 0,
      polyglot: 0,
      clock: 0,
      bubble: 0,
      maze: 0,
      subtraction: 0
    },
    timePlayedMinutes: 0
  };

  useEffect(() => {
    // Load profile from localStorage
    const saved = localStorage.getItem('zeina_profile');
    if (saved) {
      try {
        setProfile(JSON.parse(saved));
      } catch (e) {
        setProfile(INITIAL_PROFILE);
      }
    } else {
      setProfile(INITIAL_PROFILE);
    }
    setLoading(false);
  }, []);

  const updateProfile = (updates: Partial<UserProfile> | ((prev: UserProfile) => UserProfile)) => {
    setProfile(prev => {
      if (!prev) return prev;
      const newProfile = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };
      localStorage.setItem('zeina_profile', JSON.stringify(newProfile));
      return newProfile;
    });
  };

  const onScoreUpdate = (points: number, gameId?: string) => {
    updateProfile(prev => {
      const newProfile = { ...prev, totalScore: prev.totalScore + points };
      if (gameId && prev.gamesPlayed) {
        newProfile.gamesPlayed = {
          ...prev.gamesPlayed,
          [gameId]: (prev.gamesPlayed[gameId as keyof typeof prev.gamesPlayed] || 0) + 1
        };
      }
      return newProfile;
    });
  };

  useEffect(() => {
    if (profile) {
      const timer = setInterval(() => {
        updateProfile(prev => ({
          ...prev,
          timePlayedMinutes: (prev.timePlayedMinutes || 0) + 1
        }));
      }, 60000);
      return () => clearInterval(timer);
    }
  }, [profile?.uid]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-sky-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-bounce text-6xl">📚✨</div>
          <p className="text-sky-800 font-bold animate-pulse">Chargement du monde de Zeina...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-100 font-sans text-slate-800">
      {currentScreen === 'hub' && <Hub profile={profile} onNavigate={setCurrentScreen} />}
      {currentScreen === 'audiotest' && <AudioTest onBack={() => setCurrentScreen('hub')} />}
      {currentScreen === 'detective' && <DetectiveGame profile={profile} onBack={() => setCurrentScreen('hub')} onScoreUpdate={onScoreUpdate} />}
      {currentScreen === 'market' && <MarketGame profile={profile} onBack={() => setCurrentScreen('hub')} onScoreUpdate={onScoreUpdate} />}
      {currentScreen === 'butterfly' && <ButterflyGame profile={profile} onBack={() => setCurrentScreen('hub')} onScoreUpdate={onScoreUpdate} />}
      {currentScreen === 'train' && <TrainGame profile={profile} onBack={() => setCurrentScreen('hub')} onScoreUpdate={onScoreUpdate} />}
      {currentScreen === 'balance' && <BalanceGame profile={profile} onBack={() => setCurrentScreen('hub')} onScoreUpdate={onScoreUpdate} />}
      {currentScreen === 'polyglot' && <PolyglotGame profile={profile} onBack={() => setCurrentScreen('hub')} onScoreUpdate={onScoreUpdate} />}
      {currentScreen === 'clock' && <ClockGame profile={profile} onBack={() => setCurrentScreen('hub')} onScoreUpdate={onScoreUpdate} />}
      {currentScreen === 'bubble' && <BubbleGame profile={profile} onBack={() => setCurrentScreen('hub')} onScoreUpdate={onScoreUpdate} />}
      {currentScreen === 'maze' && <MazeGame profile={profile} onBack={() => setCurrentScreen('hub')} onScoreUpdate={onScoreUpdate} />}
      {currentScreen === 'subtraction' && <SubtractionGame profile={profile} onBack={() => setCurrentScreen('hub')} onScoreUpdate={onScoreUpdate} />}
    </div>
  );
}
