import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { playVoice, playSuccessSound, playErrorSound, playBipSound } from '../../lib/audio';
import { ArrowLeft, Volume2, Award, Sparkles, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Theme configurations for background and layout of easy mode Visuals
interface VisualTheme {
  emoji: string;
  nameAr: string;
  bgClass: string;
  borderClass: string;
  itemBg: string;
  groundLabel: string;
}

const THEMES: VisualTheme[] = [
  {
    emoji: '🍎',
    nameAr: 'تُفَّاحَات',
    bgClass: 'bg-emerald-50/50',
    borderClass: 'border-emerald-100',
    itemBg: 'bg-emerald-100/40',
    groundLabel: '🍎 الْأَرْض 🍎'
  },
  {
    emoji: '🍓',
    nameAr: 'فَرَاوِلَات',
    bgClass: 'bg-red-50/50',
    borderClass: 'border-red-100',
    itemBg: 'bg-red-100/40',
    groundLabel: '🍓 الْأَرْض 🍓'
  },
  {
    emoji: '🎈',
    nameAr: 'بَالُونَات',
    bgClass: 'bg-sky-50/50',
    borderClass: 'border-sky-100',
    itemBg: 'bg-sky-100/40',
    groundLabel: '☁️ الْهَوَاء ☁️'
  },
  {
    emoji: '🐠',
    nameAr: 'أَسْمَاك',
    bgClass: 'bg-cyan-50/50',
    borderClass: 'border-cyan-100',
    itemBg: 'bg-cyan-100/40',
    groundLabel: '🌊 قَاعُ الْبَحْرِ 🌊'
  },
  {
    emoji: '⭐️',
    nameAr: 'نُجُوم',
    bgClass: 'bg-indigo-50/50',
    borderClass: 'border-indigo-100',
    itemBg: 'bg-indigo-100/40',
    groundLabel: '🌌 الْفَضَاء 🌌'
  },
  {
    emoji: '🧁',
    nameAr: 'كَعْكَات',
    bgClass: 'bg-pink-50/50',
    borderClass: 'border-pink-100',
    itemBg: 'bg-pink-100/40',
    groundLabel: '🍽️ المَائِدَة 🍽️'
  }
];

export default function SubtractionGame({ profile, onBack, onScoreUpdate }: { profile: UserProfile, onBack: () => void, onScoreUpdate: (points: number, gameId?: string) => void }) {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [numA, setNumA] = useState(8);
  const [numB, setNumB] = useState(5);
  const [options, setOptions] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isFallen, setIsFallen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<VisualTheme>(THEMES[0]);
  const [animating, setAnimating] = useState(false);
  const [roundId, setRoundId] = useState(0);

  // Helper inside subtraction to generate unique items
  const [items, setItems] = useState<{ id: number; willFall: boolean }[]>([]);

  const generateLevel = (diff = difficulty) => {
    setSelectedAnswer(null);
    setIsCorrect(null);
    setIsFallen(false);
    setAnimating(false);
    setRoundId(prev => prev + 1);

    // Pick a random visual theme
    const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
    setCurrentTheme(randomTheme);

    let a = 8;
    let b = 5;

    if (diff === 'easy') {
      // Subtractions under 10
      a = Math.floor(Math.random() * 8) + 3; // 3 to 10
      b = Math.floor(Math.random() * (a - 1)) + 1; // 1 to a-1
    } else if (diff === 'medium') {
      // Subtractions under 50
      a = Math.floor(Math.random() * 30) + 15; // 15 to 45
      b = Math.floor(Math.random() * (a - 4)) + 3; // 3 to a-1
    } else {
      // Subtractions under 100
      a = Math.floor(Math.random() * 50) + 45; // 45 to 95
      b = Math.floor(Math.random() * (a - 10)) + 6; // 6 to a-1
    }

    const correct = a - b;
    setNumA(a);
    setNumB(b);

    // Generate options
    const optionSet = new Set<number>();
    optionSet.add(correct);

    while (optionSet.size < 4) {
      let offset = Math.floor(Math.random() * 8) - 4; // -4 to +4
      let wrong = correct + offset;
      if (wrong >= 0 && wrong !== correct) {
        optionSet.add(wrong);
      } else {
        // Fallback random answer
        let randomWrong = Math.floor(Math.random() * (a + 5));
        if (randomWrong >= 0 && randomWrong !== correct) {
          optionSet.add(randomWrong);
        }
      }
    }

    setOptions(Array.from(optionSet).sort(() => Math.random() - 0.5));

    // For Easy mode: Generate A elements. First (A-B) stay, last B fall.
    const tempItems = [];
    const remainingCount = a - b;
    for (let i = 0; i < a; i++) {
      tempItems.push({
        id: i,
        willFall: i >= remainingCount // The last B items will fall
      });
    }
    setItems(tempItems);

    // Speak the question in Arabic (Zeina)
    setTimeout(() => {
      speakQuestion(a, b);
    }, 400);
  };

  const speakQuestion = (a = numA, b = numB) => {
    // Elegant subtraction voice instruction in Arabic
    const sentence = `${a} نَاقِصُ ${b}، كَمْ يُسَاوِي يَا زَيْنَةُ؟`;
    playVoice(sentence, 'ar');
  };

  useEffect(() => {
    generateLevel();
  }, [difficulty]);

  const handleSelect = (ans: number) => {
    if (selectedAnswer !== null || animating) return;
    playBipSound();
    setSelectedAnswer(ans);
    const correct = numA - numB;

    if (ans === correct) {
      setIsCorrect(true);
      setAnimating(true);
      playSuccessSound();
      
      // Delay falling visualization slightly to match rhythm
      setTimeout(() => {
        setIsFallen(true);
        // Play success audio directed female to Zeina
        playVoice(`أَحْسَنْتِ يَا زَيْنَةُ! إِجَابَةٌ صَحِيحَةٌ رَائِعَةٌ. ${numA} نَاقِصُ ${numB} يُسَاوِي ${correct}.`, 'ar');
        
        // Success score update
        onScoreUpdate(15, 'subtraction');
        setAnimating(false);
      }, 500);

    } else {
      setIsCorrect(false);
      playErrorSound();
      playVoice("حَاوِلِي مَرَّةً أُخْرَى يَا زَيْنَةُ، أَنْتِ ذَكِيَّةٌ جِدًّا!", 'ar');
      onScoreUpdate(-2);
      
      // Reset after a short period so she can re-try
      setTimeout(() => {
        setSelectedAnswer(null);
        setIsCorrect(null);
      }, 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 font-sans" dir="rtl">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 flex-row-reverse">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-slate-500 font-bold bg-white px-5 py-3 rounded-2xl btn-tactile hover:bg-slate-50"
        >
          <span>الْعَوْدَةُ</span> <ArrowLeft size={22} className="rotate-180" />
        </button>
        <div className="bg-amber-100 px-6 py-3 rounded-2xl border-2 border-amber-200 shadow-sm flex items-center gap-2">
          <Award className="text-amber-600 animate-bounce" size={24} />
          <span className="text-xl font-black text-amber-800">نقاط زينة: {profile.totalScore}</span>
        </div>
      </header>

      {/* Main Card */}
      <div className="bg-white rounded-[32px] shadow-sm p-6 md:p-8 card-tactile text-center relative border-3 border-orange-100">
        
        {/* Game Badge */}
        <div className="flex justify-center mb-2">
          <span className="bg-orange-100 text-orange-700 font-black text-xs px-4 py-1.5 rounded-full flex items-center gap-2 uppercase tracking-wide">
            <Sparkles size={12} className="animate-spin" /> بَطَلُ الْحِسَابِ 🧮
          </span>
        </div>

        {/* Level Title */}
        <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-6 leading-tight">
          بَطَلُ الطَّرْحِ
        </h2>

        {/* Difficulty Selectors in Arabic */}
        <div className="flex justify-center gap-3 bg-slate-50 p-2 rounded-2xl mb-8 max-w-md mx-auto">
          <button
            onClick={() => setDifficulty('easy')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm md:text-base font-black transition-all ${
              difficulty === 'easy'
                ? 'bg-amber-500 text-white shadow-md scale-105'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            سَهْل 🍎 <span className="block text-[10px] opacity-80">(تحت 10)</span>
          </button>
          <button
            onClick={() => setDifficulty('medium')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm md:text-base font-black transition-all ${
              difficulty === 'medium'
                ? 'bg-orange-500 text-white shadow-md scale-105'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            مُتَوَسِّط 🧮 <span className="block text-[10px] opacity-80">(تحت 50)</span>
          </button>
          <button
            onClick={() => setDifficulty('hard')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm md:text-base font-black transition-all ${
              difficulty === 'hard'
                ? 'bg-rose-500 text-white shadow-md scale-105'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            صَعْب 🔥 <span className="block text-[10px] opacity-80">(تحت 100)</span>
          </button>
        </div>

        {/* Main Equation Box */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-3xl p-6 md:p-8 mb-8 border-2 border-orange-100 relative shadow-inner">
          <button
            onClick={() => speakQuestion()}
            className="absolute top-4 left-4 p-3 bg-white hover:bg-slate-50 text-orange-500 rounded-2xl border-2 border-orange-200 btn-tactile shadow-sm transition-colors"
            title="إعادة قراءة السؤال"
          >
            <Volume2 size={24} />
          </button>

          <div className="flex items-center justify-center gap-4 md:gap-8 flex-row-reverse select-none my-4">
            <span className="text-5xl md:text-8xl font-black text-slate-800">{numA}</span>
            <span className="text-4xl md:text-6xl font-black text-amber-500">−</span>
            <span className="text-5xl md:text-8xl font-black text-slate-800">{numB}</span>
            <span className="text-4xl md:text-6xl font-black text-amber-500">＝</span>
            <span className="text-5xl md:text-8xl font-black bg-white border-4 border-dashed border-orange-200 text-orange-600 px-6 py-2 rounded-3xl shadow-sm min-w-[3ch] text-center">
              {selectedAnswer !== null && isCorrect ? numA - numB : '؟'}
            </span>
          </div>

          <p className="text-slate-500 font-bold block text-sm md:text-base mt-2">
            كَمْ يَبْقَى عِنْدَمَا نَطْرَحُ {numB} مِنْ {numA}؟
          </p>
        </div>

        {/* VISUAL VISUALIZATION (Specially for EASY level under 10, option to show on medium) */}
        {difficulty === 'easy' && (
          <div className={`rounded-3xl p-6 md:p-8 mb-8 border border-dashed transition-all ${currentTheme.bgClass} ${currentTheme.borderClass} overflow-hidden max-w-2xl mx-auto`}>
            <div className="flex justify-between items-center mb-4 flex-row-reverse border-b border-slate-100 pb-3">
              <span className="font-black text-slate-700 text-base flex items-center gap-1.5">
                تَمْثِيلٌ بَصَرِيٌّ: <span className="text-xl">{currentTheme.emoji}</span>
              </span>
              <span className="text-xs bg-white px-3 py-1 rounded-full font-bold text-slate-400 border border-slate-100">
                {numA} {currentTheme.nameAr}
              </span>
            </div>

            {/* Sandbox Container representing garden, sea, or space */}
            <div className="relative min-h-[140px] md:min-h-[220px] bg-white/70 rounded-2xl p-2 md:p-6 flex flex-wrap gap-2 md:gap-4 items-center justify-center border border-dashed border-slate-200">
              <AnimatePresence>
                {items.map((item, index) => {
                  const isFailingItem = item.willFall;
                  return (
                    <motion.div
                      key={`r-${roundId}-item-${item.id}`}
                      className={`relative w-11 h-11 md:w-16 md:h-16 rounded-xl flex items-center justify-center text-2xl md:text-3xl m-0.5 md:m-1 shadow-sm border-2 ${currentTheme.itemBg} ${isFailingItem && isFallen ? 'border-red-200' : 'border-slate-100'}`}
                      animate={
                        isFallen && isFailingItem
                          ? {
                              y: [0, -30, 240],
                              x: [0, (index % 2 === 0 ? -15 : 15), (index % 2 === 0 ? -30 : 30)],
                              rotate: [0, -15, 120],
                              scale: [1, 1.1, 0],
                              opacity: [1, 1, 0],
                              zIndex: 0
                            }
                          : isFallen && !isFailingItem
                          ? {
                              scale: [1, 1.25, 1.0, 1.15, 1],
                              y: [0, -10, 0],
                              rotate: [0, 5, -5, 0]
                            }
                          : {
                              y: [0, -4, 0],
                              rotate: index % 2 === 0 ? [0, 2, 0] : [0, -2, 0]
                            }
                      }
                      transition={
                        isFallen && isFailingItem
                          ? {
                              duration: 1.5,
                              ease: "easeIn",
                              times: [0, 0.2, 1]
                            }
                          : isFallen && !isFailingItem
                          ? {
                              duration: 0.8,
                              ease: "easeInOut",
                              delay: index * 0.05
                            }
                          : {
                              duration: 3 + (index % 3),
                              repeat: Infinity,
                              ease: "easeInOut"
                            }
                      }
                    >
                      {/* Emoji Icon */}
                      <span className="drop-shadow-sm select-none">{currentTheme.emoji}</span>

                      {/* Small counter index badge */}
                      <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-slate-800 text-white rounded-full w-4 h-4 md:w-5 md:h-5 text-[8px] md:text-[10px] font-black flex items-center justify-center">
                        {index + 1}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Graphic representations of the falling zones */}
              <div className="absolute bottom-2 left-0 right-0 text-center select-none pointer-events-none opacity-40">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                  {currentTheme.groundLabel}
                </span>
              </div>
            </div>

            {/* Explanatory visual cues */}
            <div className="mt-4 text-xs font-bold text-slate-400 flex justify-between items-center px-2 flex-row-reverse border-t border-slate-100 pt-3">
              <span>{numA - numB} تَبْقَى ثَابِتَة</span>
              <span className="text-red-400">{numB} تَمْشِي/تَسْقُط</span>
            </div>
          </div>
        )}

        {/* Medium and Hard level helpful graphic blocks (base 10 representation) */}
        {difficulty !== 'easy' && (
          <div className="max-w-2xl mx-auto rounded-3xl p-6 bg-slate-50 border border-slate-100 mb-8">
            <h4 className="font-black text-slate-700 text-sm mb-4 text-right flex items-center gap-2 flex-row-reverse">
              <span>تَمْثِيلُ الْمَجْمُوعَاتِ العَشَرِيَّةِ:</span>
              <span className="text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full font-bold">عشرات وآحاد</span>
            </h4>
            
            {/* Display representation of numA as blocks of ten and units, with visual subtract lines */}
            <div className="flex flex-col gap-4">
              {/* Box representation of Num A */}
              <div className="flex flex-wrap gap-3 justify-center">
                {/* Tens Blocks */}
                {Array.from({ length: Math.floor(numA / 10) }).map((_, i) => (
                  <div key={`ten-${i}`} className="p-2 bg-indigo-100 rounded-xl border border-indigo-200 flex flex-col items-center justify-center gap-1 shadow-sm">
                    <span className="text-xs font-black text-indigo-700">📦 ١٠</span>
                    <div className="grid grid-cols-5 gap-0.5 mt-1">
                      {Array.from({ length: 10 }).map((_, subI) => (
                        <div key={subI} className="w-1.5 h-1.5 bg-indigo-400 rounded-sm"></div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Units Blocks */}
                {numA % 10 > 0 && (
                  <div className="p-2 bg-amber-100 rounded-xl border border-amber-200 flex flex-col items-center justify-center gap-1 shadow-sm">
                    <span className="text-xs font-black text-amber-700">🔸 {numA % 10}</span>
                    <div className="flex gap-0.5 mt-1 flex-wrap max-w-20 justify-center">
                      {Array.from({ length: numA % 10 }).map((_, subI) => (
                        <div key={subI} className="w-2 h-2 bg-amber-500 rounded-sm"></div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Explaining subtraction text in Arabic */}
              <div className="mt-2 text-xs font-bold text-slate-400 text-center" dir="rtl">
                إِذَا أَخَذْنَا {numB} مِنْ هَذَا الْمَجْمُوعِ، كَمْ شَيْءٍ آخَرَ سَيَبْقَى مَعَنَا؟
              </div>
            </div>
          </div>
        )}

        {/* Options grid */}
        <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto mb-8">
          {options.map((opt, i) => {
            let btnClass = "bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-orange-200";
            
            if (selectedAnswer === opt) {
              btnClass = isCorrect 
                ? "bg-emerald-500 border-emerald-600 text-white shadow-emerald-200 shadow-md" 
                : "bg-rose-500 border-rose-600 text-white shadow-rose-200 shadow-md";
            } else if (selectedAnswer !== null && opt === (numA - numB)) {
              // Highlight the correct answer if user got it wrong
              btnClass = "bg-emerald-100 border-emerald-400 text-emerald-800";
            }

            return (
              <motion.button
                key={i}
                whileHover={selectedAnswer === null ? { scale: 1.03, y: -2 } : {}}
                whileTap={selectedAnswer === null ? { scale: 0.97 } : {}}
                onClick={() => handleSelect(opt)}
                disabled={selectedAnswer !== null}
                className={`py-6 px-8 rounded-2xl text-2xl md:text-4xl font-black shadow-sm transition-all flex items-center justify-center ${btnClass}`}
              >
                {opt}
              </motion.button>
            );
          })}
        </div>

        {/* Next Question Controller */}
        {selectedAnswer !== null && isCorrect && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mt-6"
          >
            <button
              onClick={() => generateLevel()}
              className="bg-orange-500 hover:bg-orange-600 text-white font-black text-xl py-4 px-10 rounded-2xl shadow-md shadow-orange-100 flex items-center justify-center gap-3 transition-colors btn-tactile w-full md:w-auto"
            >
              <span>سُؤَالٌ جَدِيدٌ</span> <RefreshCw size={24} className="rotate-45" />
            </button>
          </motion.div>
        )}

      </div>
    </div>
  );
}
