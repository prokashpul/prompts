import React, { useState } from 'react';
import { Button } from './ui/Button';
import { generateImagePrompt } from '../services/aiService';
import { AIProvider, ProviderKeys } from '../types';
import { Sparkles, Copy, Check, Wand2, RefreshCw, Cpu, Zap, Wind, Aperture } from 'lucide-react';

interface Props {
  provider: AIProvider;
  keys: ProviderKeys;
}

interface PromptRecord {
  text: string;
  provider: AIProvider;
}

export const TextToPrompt: React.FC<Props> = ({ provider, keys }) => {
  const [inputText, setInputText] = useState('');
  const [history, setHistory] = useState<PromptRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [count, setCount] = useState(1);

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const prompts = await generateImagePrompt(provider, { text: inputText }, keys, count);
      const newRecords = prompts.map(p => ({ text: p, provider }));
      setHistory(prev => [...newRecords, ...prev]);
    } catch (error: any) {
      alert(error.message || "Error generating prompts.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const ProviderBadge = ({ type }: { type: AIProvider }) => {
    const icons = {
      [AIProvider.Gemini]: <Aperture size={10} />,
      [AIProvider.Groq]: <Zap size={10} />,
      [AIProvider.Mistral]: <Wind size={10} />
    };
    const colors = {
      [AIProvider.Gemini]: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
      [AIProvider.Groq]: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      [AIProvider.Mistral]: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    };
    
    return (
      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${colors[type]}`}>
        {icons[type]} {type}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in">
       <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Idea Expansion</h2>
        <p className="text-slate-400 flex items-center justify-center gap-2">
          Generating using <span className="text-slate-200 font-semibold">{provider.toUpperCase()}</span>
          <Cpu size={14} className="text-slate-500" />
        </p>
      </div>

      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-6 shadow-2xl backdrop-blur-md">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-400 ml-1">Concept or Keyword</label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Describe your scene briefly (e.g. 'cyberpunk cat in rain')..."
            className="w-full h-32 bg-slate-900/60 border border-slate-700/80 rounded-xl p-4 text-slate-100 placeholder-slate-600 focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/10 outline-none transition-all resize-none shadow-inner"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm text-slate-500 ml-1">Variations</label>
            <input 
              type="number" min="1" max="5" value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="w-full bg-slate-900/80 border border-slate-700/80 text-slate-200 rounded-lg p-2.5 outline-none focus:border-brand-500/50"
            />
          </div>
          <Button onClick={handleGenerate} disabled={!inputText.trim() || loading} className="flex-[3] h-[46px]" isLoading={loading}>
            {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Generate with {provider}
          </Button>
        </div>
      </div>

      {history.length > 0 && (
        <div className="space-y-4 animate-slide-up">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-medium text-slate-300 flex items-center gap-2">
              <Wand2 size={18} className="text-brand-400" />
              Generated History
            </h3>
            <button 
              onClick={() => setHistory([])}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors"
            >
              Clear Results
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {history.map((record, index) => (
              <div key={index} className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 relative group transition-all hover:bg-slate-800/60 hover:border-brand-500/40 shadow-lg">
                <button 
                  onClick={() => handleCopy(record.text, index)} 
                  className="absolute top-4 right-4 p-2.5 bg-slate-700/40 hover:bg-slate-700/80 rounded-lg text-slate-300 hover:text-white transition-all shadow-sm"
                  title="Copy Prompt"
                >
                  {copiedIndex === index ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                </button>
                <p className="text-slate-100 font-medium leading-relaxed pr-12 text-lg">
                  {record.text}
                </p>
                <div className="mt-6 pt-4 border-t border-slate-700/40 flex justify-between items-center">
                  <ProviderBadge type={record.provider} />
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${record.text.length > 280 ? 'text-amber-500' : 'text-slate-500'}`}>
                      {record.text.length} / 300 CHARS
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};