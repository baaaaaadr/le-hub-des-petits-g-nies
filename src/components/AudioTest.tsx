import { useState } from 'react';
import { ArrowLeft, Volume2 } from 'lucide-react';

export default function AudioTest({ onBack }: { onBack: () => void }) {
  const [status, setStatus] = useState<string>('Prêt à tester');

  const testSpeechSynthesis = () => {
    try {
      const utterance = new SpeechSynthesisUtterance("Ceci est un test avec Speech Synthesis");
      utterance.lang = 'fr-FR';
      window.speechSynthesis.speak(utterance);
      setStatus('Test SpeechSynthesis lancé');
    } catch (e: any) {
      setStatus(`Erreur SpeechSynthesis: ${e.message}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <header className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="p-4 bg-white rounded-2xl btn-tactile text-slate-500">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-black text-slate-700 text-tight-heading">Module de Test Audio</h1>
      </header>

      <div className="bg-white rounded-[32px] shadow-sm card-tactile p-8">
        <p className="text-slate-600 mb-6 text-center font-medium">
          Cliquez sur les boutons ci-dessous pour tester différentes techniques de synthèse vocale (TTS). 
          Notez celle qui fonctionne sur votre appareil.
        </p>

        <div className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl mb-8 text-center font-mono text-sm text-slate-700 font-bold">
          Statut : {status}
        </div>

        <div className="grid gap-4 md:grid-cols-1">
          <button onClick={testSpeechSynthesis} className="flex items-center justify-center gap-3 p-4 bg-indigo-100 text-indigo-700 rounded-2xl btn-tactile font-bold">
            <Volume2 size={20} /> Tester la synthèse vocale (SpeechSynthesis)
          </button>
        </div>
      </div>
    </div>
  );
}
