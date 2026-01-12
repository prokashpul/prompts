import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/Button';
import { generateImagePrompt } from '../services/aiService';
import { AIProvider, ProviderKeys } from '../types';
import { Upload, Image as ImageIcon, Copy, Check, X, Wand2, RefreshCw } from 'lucide-react';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  prompt: string;
  status: 'idle' | 'loading' | 'done' | 'error';
}

interface Props {
  provider: AIProvider;
  keys: ProviderKeys;
}

export const ImageToPrompt: React.FC<Props> = ({ provider, keys }) => {
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => imageFiles.forEach(img => URL.revokeObjectURL(img.preview));
  }, []);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles: ImageFile[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      prompt: '',
      status: 'idle'
    }));
    setImageFiles(prev => [...prev, ...newFiles]);
  };

  const handleGenerate = async () => {
    const idleFiles = imageFiles.filter(f => f.status !== 'done' && f.status !== 'loading');
    if (idleFiles.length === 0) return;

    const processFile = async (img: ImageFile) => {
      setImageFiles(prev => prev.map(f => f.id === img.id ? { ...f, status: 'loading' } : f));
      try {
        const results = await generateImagePrompt(provider, { file: img.file }, keys);
        setImageFiles(prev => prev.map(f => f.id === img.id ? { ...f, status: 'done', prompt: results[0] } : f));
      } catch (error) {
        console.error("Analysis Error:", error);
        setImageFiles(prev => prev.map(f => f.id === img.id ? { ...f, status: 'error' } : f));
      }
    };

    await Promise.all(idleFiles.map(processFile));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isAnyLoading = imageFiles.some(f => f.status === 'loading');

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Image Analysis Batch</h2>
        <p className="text-slate-400">Extracting prompts using <span className="text-slate-200 font-semibold">{provider.toUpperCase()}</span> Vision</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-4">
          <div 
            className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer h-48 border-slate-700/50 hover:border-brand-500/50 bg-slate-800/20 hover:bg-slate-800/40 shadow-inner`}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="space-y-2 pointer-events-none">
              <div className="w-12 h-12 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto text-brand-400">
                <Upload size={24} />
              </div>
              <div><p className="text-base font-medium">Add Images</p><p className="text-xs text-slate-500">JPG, PNG, WebP supported</p></div>
            </div>
            <input type="file" ref={fileInputRef} onChange={(e) => addFiles(e.target.files)} accept="image/*" multiple className="hidden" />
          </div>

          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {imageFiles.map(img => (
              <div key={img.id} className="bg-slate-800/40 border border-slate-700/50 p-2.5 rounded-xl flex items-center gap-3 group">
                <img src={img.preview} className="w-10 h-10 rounded-lg object-cover shadow-sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate text-slate-300">{img.file.name}</p>
                  <span className={`text-[10px] font-bold uppercase ${img.status === 'done' ? 'text-green-500' : img.status === 'error' ? 'text-red-400' : 'text-slate-500'}`}>
                    {img.status}
                  </span>
                </div>
                <button 
                  onClick={() => setImageFiles(prev => prev.filter(f => f.id !== img.id))} 
                  className="p-1.5 hover:bg-slate-700 rounded-md text-slate-500 hover:text-red-400 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {imageFiles.length === 0 && (
              <div className="text-center py-8 text-slate-600 border border-slate-800/50 rounded-xl border-dashed">
                <p className="text-xs">Queue is empty</p>
              </div>
            )}
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={imageFiles.filter(f => f.status === 'idle' || f.status === 'error').length === 0 || isAnyLoading} 
            className="w-full h-[48px] shadow-xl" 
            isLoading={isAnyLoading}
          >
            {isAnyLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
            Analyze with {provider}
          </Button>
        </div>

        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Results</h3>
            {imageFiles.length > 0 && (
              <button onClick={() => setImageFiles([])} className="text-xs text-slate-500 hover:text-red-400 transition-colors">Clear All</button>
            )}
          </div>
          
          <div className="space-y-4">
            {imageFiles.filter(f => f.prompt || f.status === 'loading' || f.status === 'error').map(img => (
              <div key={img.id} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-5 flex gap-5 animate-slide-up hover:bg-slate-800/50 transition-colors group">
                <div className="relative flex-shrink-0">
                  <img src={img.preview} className="w-28 h-28 rounded-xl object-cover shadow-lg border border-slate-700/50" />
                  {img.status === 'loading' && (
                    <div className="absolute inset-0 bg-slate-900/60 rounded-xl flex items-center justify-center backdrop-blur-[1px]">
                      <RefreshCw className="w-6 h-6 text-brand-400 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-brand-400 px-2 py-0.5 bg-brand-500/10 rounded border border-brand-500/20">
                      PROMPT VARIATION
                    </span>
                    {img.status === 'done' && (
                      <button 
                        onClick={() => handleCopy(img.prompt, img.id)} 
                        className="p-2 bg-slate-700/40 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
                      >
                        {copiedId === img.id ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                      </button>
                    )}
                  </div>
                  
                  {img.status === 'loading' ? (
                    <div className="space-y-2 py-1">
                      <div className="h-3.5 bg-slate-700/50 rounded-full w-full animate-pulse"></div>
                      <div className="h-3.5 bg-slate-700/50 rounded-full w-5/6 animate-pulse"></div>
                      <div className="h-3.5 bg-slate-700/50 rounded-full w-2/3 animate-pulse"></div>
                    </div>
                  ) : img.status === 'error' ? (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                      Failed to analyze image. Please check your API key or connection.
                    </div>
                  ) : (
                    <p className="text-slate-100 font-medium leading-relaxed text-lg italic">
                      "{img.prompt}"
                    </p>
                  )}
                  
                  {img.status === 'done' && (
                    <div className="pt-2 flex items-center gap-3">
                      <span className="text-[10px] text-slate-500 font-mono">{img.prompt.length} CHARS</span>
                      <div className="h-1 flex-1 bg-slate-700/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-500/50 transition-all" 
                          style={{ width: `${Math.min((img.prompt.length / 300) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {imageFiles.length === 0 && (
              <div className="h-80 border-2 border-dashed border-slate-800/50 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-600 bg-slate-900/20">
                <div className="bg-slate-800/40 p-5 rounded-full mb-4">
                  <ImageIcon size={40} className="opacity-20" />
                </div>
                <p className="text-sm font-medium">Ready for your visuals</p>
                <p className="text-xs opacity-60">Upload one or more images to extract their prompt DNA</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};