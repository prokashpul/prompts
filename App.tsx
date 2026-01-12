import React, { useState, useEffect } from 'react';
import { ImageToPrompt } from './components/ImageToPrompt';
import { TextToPrompt } from './components/TextToPrompt';
import { AppMode, AIProvider, ProviderKeys } from './types';
import { Aperture, Type, Image as ImageIcon, Sun, Moon, Key, AlertCircle, Settings, X, Zap, Wind, Save, Eye, EyeOff, Trash2 } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.ImageToPrompt);
  const [provider, setProvider] = useState<AIProvider>(AIProvider.Gemini);
  const [showSettings, setShowSettings] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') !== 'light');
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  
  // Visibility toggles for keys
  const [showGroq, setShowGroq] = useState(false);
  const [showMistral, setShowMistral] = useState(false);

  const [extKeys, setExtKeys] = useState<ProviderKeys>(() => {
    const saved = localStorage.getItem('ext_keys');
    return saved ? JSON.parse(saved) : { groq: '', mistral: '' };
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const checkKey = async () => {
      try {
        if ((window as any).aistudio?.hasSelectedApiKey) {
          const selected = await (window as any).aistudio.hasSelectedApiKey();
          setHasGeminiKey(selected);
        }
      } catch (e) { console.error(e); }
    };
    checkKey();
    const interval = setInterval(checkKey, 5000);
    return () => clearInterval(interval);
  }, []);

  const saveKeys = (newKeys: ProviderKeys) => {
    setExtKeys(newKeys);
    localStorage.setItem('ext_keys', JSON.stringify(newKeys));
  };

  const handleOpenGeminiDialog = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      setHasGeminiKey(true);
    }
  };

  const ProviderIcon = ({ type, size = 18 }: { type: AIProvider, size?: number }) => {
    switch (type) {
      case AIProvider.Gemini: return <Aperture size={size} className="text-brand-400" />;
      case AIProvider.Groq: return <Zap size={size} className="text-orange-400" />;
      case AIProvider.Mistral: return <Wind size={size} className="text-blue-400" />;
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className={`fixed inset-0 pointer-events-none z-0 ${isDark ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950' : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-200 via-slate-50 to-slate-50 opacity-40'}`}></div>
      
      <nav className={`border-b sticky top-0 z-50 backdrop-blur-xl transition-colors duration-300 ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-white/70'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-brand-500/10 p-2 rounded-lg">
                <ProviderIcon type={provider} size={24} />
              </div>
              <span className="text-xl font-bold tracking-tight hidden sm:block">PromptMaster AI</span>
            </div>
            
            <div className="flex items-center gap-3">
              <select 
                value={provider}
                onChange={(e) => setProvider(e.target.value as AIProvider)}
                className={`text-xs font-semibold rounded-lg px-2 py-1.5 border transition-all ${isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}
              >
                <option value={AIProvider.Gemini}>Gemini 2.5 Lite</option>
                <option value={AIProvider.Groq}>Groq (Llama 3.3)</option>
                <option value={AIProvider.Mistral}>Mistral AI</option>
              </select>

              <div className={`h-6 w-px ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>

              <button
                onClick={() => setShowSettings(true)}
                className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
                title="API Settings"
              >
                <Settings size={20} />
              </button>

              <button
                onClick={() => setIsDark(!isDark)}
                className={`p-2 rounded-full transition-colors ${isDark ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {((provider === AIProvider.Gemini && !hasGeminiKey) ||
          (provider === AIProvider.Groq && !extKeys.groq) || 
          (provider === AIProvider.Mistral && !extKeys.mistral)) && (
          <div className={`mb-12 p-6 rounded-2xl border flex flex-col sm:flex-row items-start gap-4 animate-fade-in ${isDark ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
            <AlertCircle className="w-6 h-6 text-amber-500" />
            <div className="flex-1">
              <h3 className="font-bold">Provider Configuration Needed</h3>
              <p className="text-sm opacity-80">You have selected <strong>{provider.toUpperCase()}</strong>, but no API key is configured. Please provide your API key in settings to continue.</p>
              <button 
                onClick={provider === AIProvider.Gemini ? handleOpenGeminiDialog : () => setShowSettings(true)}
                className="mt-3 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors flex items-center gap-2"
              >
                <Key size={14} /> Configure {provider.toUpperCase()}
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-center mb-12">
          <div className={`p-1.5 rounded-xl border inline-flex shadow-lg backdrop-blur-sm ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
            <button onClick={() => setMode(AppMode.ImageToPrompt)} className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === AppMode.ImageToPrompt ? (isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900') : 'text-slate-500'}`}>
              <ImageIcon className="w-4 h-4 mr-2" /> Image to Prompt
            </button>
            <button onClick={() => setMode(AppMode.TextToPrompt)} className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === AppMode.TextToPrompt ? (isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900') : 'text-slate-500'}`}>
              <Type className="w-4 h-4 mr-2" /> Text to Prompt
            </button>
          </div>
        </div>

        {mode === AppMode.ImageToPrompt ? <ImageToPrompt provider={provider} keys={extKeys} /> : <TextToPrompt provider={provider} keys={extKeys} />}
      </main>

      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowSettings(false)}></div>
          <div className={`relative w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden animate-slide-up ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2"><Settings size={20} /> Provider Settings</h2>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-800 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mb-2"><Aperture size={12} /> Gemini (Native)</span>
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-sm font-medium">{hasGeminiKey ? 'Securely Connected' : 'No Key Selected'}</span>
                    <button onClick={handleOpenGeminiDialog} className="text-xs text-brand-400 hover:underline">Change</button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Zap size={12} /> Groq API Key</span>
                    {extKeys.groq && (
                      <button 
                        onClick={() => saveKeys({...extKeys, groq: ''})}
                        className="text-[10px] text-red-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 size={10} /> Clear
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input 
                      type={showGroq ? "text" : "password"} 
                      value={extKeys.groq}
                      onChange={(e) => saveKeys({...extKeys, groq: e.target.value})}
                      placeholder="Enter Groq Key..."
                      className={`w-full pl-4 pr-10 py-3 rounded-xl border text-sm focus:ring-1 focus:ring-orange-500 outline-none transition-all ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowGroq(!showGroq)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showGroq ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Wind size={12} /> Mistral API Key</span>
                    {extKeys.mistral && (
                      <button 
                        onClick={() => saveKeys({...extKeys, mistral: ''})}
                        className="text-[10px] text-red-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 size={10} /> Clear
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input 
                      type={showMistral ? "text" : "password"} 
                      value={extKeys.mistral}
                      onChange={(e) => saveKeys({...extKeys, mistral: e.target.value})}
                      placeholder="Enter Mistral Key..."
                      className={`w-full pl-4 pr-10 py-3 rounded-xl border text-sm focus:ring-1 focus:ring-blue-500 outline-none transition-all ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowMistral(!showMistral)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showMistral ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 text-[10px] text-slate-500 leading-tight">
                Gemini Native is configured via the environment key selection. External keys are stored locally in your browser session.
              </div>
              <button 
                onClick={() => setShowSettings(false)}
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Save size={18} /> Save and Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;