import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FileJson, 
  Download, 
  Copy, 
  Zap, 
  Trash2, 
  Maximize2, 
  Upload,
  Globe,
  Github,
  Check,
  AlertCircle,
  XCircle,
  Sparkles,
  ClipboardPaste
} from 'lucide-react';
import { JsonEditor } from './components/JsonEditor';
import { compressElementorJSON, formatByteSize } from './utils/compressor';
import { CompressorStats, CompressorOptions } from './types';

// Helper for iOS-style toggle
const Switch = ({ 
  label, 
  checked, 
  onChange, 
  description 
}: { 
  label: string; 
  checked: boolean; 
  onChange: (val: boolean) => void;
  description?: string;
}) => (
  <div className="flex items-center justify-between gap-4 group cursor-pointer" onClick={() => onChange(!checked)}>
    <div className="flex flex-col">
      <span className="text-sm font-medium text-[#c9d1d9] group-hover:text-[#f0f6fc] transition-colors">{label}</span>
      {description && <span className="text-[10px] text-[#8b949e]">{description}</span>}
    </div>
    <div 
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f6feb] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-[#238636]' : 'bg-[#30363d]'}`}
    >
      <span
        className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}
      />
    </div>
  </div>
);

const App: React.FC = () => {
  const [inputJSON, setInputJSON] = useState<string>('');
  const [outputJSON, setOutputJSON] = useState<string>('');
  const [stats, setStats] = useState<CompressorStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; success: boolean; message: string }>({ show: false, success: false, message: '' });
  
  const editorRef = useRef<any>(null);
  const toastTimeoutRef = useRef<any>(null);

  // Compressor Settings with LocalStorage persistence
  const [options, setOptions] = useState<CompressorOptions>(() => {
    const saved = localStorage.getItem('elementor_compressor_settings');
    return saved ? JSON.parse(saved) : {
      rtlize: false,
      removeMotionFX: false,
      autoFormatOnPaste: true
    };
  });

  useEffect(() => {
    localStorage.setItem('elementor_compressor_settings', JSON.stringify(options));
  }, [options]);

  const playSuccessSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      oscillator.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.1); // C6
      
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn('Audio playback failed', e);
    }
  };

  const handleCopy = useCallback((text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 2000);
  }, []);

  const showToast = useCallback((success: boolean, message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ show: true, success, message });
    if (success) playSuccessSound();
    toastTimeoutRef.current = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2000);
  }, []);

  const closeToast = () => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(prev => ({ ...prev, show: false }));
  };

  const performConversion = useCallback((rawJson: string) => {
    if (!rawJson.trim()) return;
    setIsProcessing(true);
    setError(null);

    try {
      const parsed = JSON.parse(rawJson);
      const originalBytes = new TextEncoder().encode(rawJson).length;
      
      const { cleaned, removedCount } = compressElementorJSON(parsed, options);
      const compressed = JSON.stringify(cleaned, null, 2);
      const compressedBytes = new TextEncoder().encode(compressed).length;

      setOutputJSON(compressed);
      setStats({
        originalSize: originalBytes,
        compressedSize: compressedBytes,
        reductionPercentage: originalBytes > 0 ? ((originalBytes - compressedBytes) / originalBytes) * 100 : 0,
        removedKeys: removedCount
      });

      handleCopy(compressed);
      showToast(true, 'Optimized & Copied to Clipboard!');
    } catch (e: any) {
      setError(`Invalid JSON: ${e.message}`);
      showToast(false, `Conversion Failed: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [options, handleCopy, showToast]);

  const handleCompress = useCallback(() => {
    performConversion(inputJSON);
  }, [inputJSON, performConversion]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleCompress();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCompress]);

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Integrated shortcut for the editor
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleCompress();
    });

    editor.onDidPaste(() => {
      setTimeout(() => {
        try {
          const val = editor.getValue();
          const obj = JSON.parse(val);
          const formatted = JSON.stringify(obj, null, 2);
          setInputJSON(formatted);
          // Run conversion and copy automatically on paste
          performConversion(formatted);
        } catch (e) {
          // Not valid JSON yet, skip auto-format and auto-convert
        }
      }, 100);
    });
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputJSON(text);
        performConversion(text);
      }
    } catch (err) {
      showToast(false, 'Clipboard access denied');
    }
  };

  const handleClearAll = () => {
    setInputJSON('');
    setOutputJSON('');
    setStats(null);
    setError(null);
  };

  const handlePrettify = (target: 'input' | 'output') => {
    try {
      const jsonStr = target === 'input' ? inputJSON : outputJSON;
      if (!jsonStr) return;
      const obj = JSON.parse(jsonStr);
      const formatted = JSON.stringify(obj, null, 2);
      if (target === 'input') setInputJSON(formatted);
      else setOutputJSON(formatted);
    } catch (e) {}
  };

  const handleMinify = (target: 'input' | 'output') => {
    try {
      const jsonStr = target === 'input' ? inputJSON : outputJSON;
      if (!jsonStr) return;
      const obj = JSON.parse(jsonStr);
      const minified = JSON.stringify(obj);
      if (target === 'input') setInputJSON(minified);
      else setOutputJSON(minified);
    } catch (e) {}
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setInputJSON(result);
      performConversion(result);
    };
    reader.readAsText(file);
  };

  const handleDownload = () => {
    const blob = new Blob([outputJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'elementor-optimized.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen font-sans bg-[#0d1117] text-[#c9d1d9] overflow-hidden">
      {/* Header */}
      <header className="flex-none bg-[#161b22] border-b border-[#30363d] px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-[#1f6feb] p-2 rounded-lg">
            <Maximize2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#f0f6fc]">Elementor Compressor</h1>
            <p className="text-xs text-[#8b949e]">v1.8.1: Smart Clipboard & Immersive UI</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden xl:flex items-center gap-6 px-4 border-r border-[#30363d] mr-2">
            <Switch 
              label="RTLize" 
              checked={options.rtlize} 
              onChange={val => setOptions(prev => ({...prev, rtlize: val}))} 
            />
            <Switch 
              label="No MotionFX" 
              checked={options.removeMotionFX} 
              onChange={val => setOptions(prev => ({...prev, removeMotionFX: val}))} 
            />
             <Switch 
              label="Auto Format" 
              checked={options.autoFormatOnPaste} 
              onChange={val => setOptions(prev => ({...prev, autoFormatOnPaste: val}))} 
              description="On Paste"
            />
          </div>

          <label className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-sm cursor-pointer transition-all">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Load JSON</span>
            <input type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
          </label>
          <button 
            onClick={handleCompress}
            disabled={!inputJSON || isProcessing}
            className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-[#238636] hover:bg-[#2ea043] disabled:bg-[#238636]/50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-sm"
          >
            <Zap className={`w-4 h-4 ${isProcessing ? 'animate-pulse' : ''}`} />
            <span>{isProcessing ? 'Optimizing...' : 'Convert'}</span>
            <span className="text-[10px] opacity-70 bg-black/20 px-1.5 rounded ml-1 hidden sm:inline">⌘↵</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-0 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
        {/* Left Side: Input */}
        <div className="flex flex-col gap-3 h-full min-h-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-[#8b949e] font-medium uppercase tracking-wider">
              <FileJson className="w-4 h-4" />
              <span>Input Source</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handlePasteFromClipboard} 
                className="flex items-center gap-1.5 px-2 py-1 text-xs text-[#c9d1d9] bg-[#21262d] border border-[#30363d] rounded hover:bg-[#30363d] transition-colors"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                Paste
              </button>
              <button onClick={() => handlePrettify('input')} className="p-1.5 text-xs text-[#8b949e] hover:text-[#58a6ff] transition-colors">Prettify</button>
              <button onClick={() => handleMinify('input')} className="p-1.5 text-xs text-[#8b949e] hover:text-[#58a6ff] transition-colors">Minify</button>
              <button onClick={handleClearAll} className="p-1.5 text-[#8b949e] hover:text-red-400 transition-colors" title="Clear All">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <JsonEditor 
              value={inputJSON} 
              onChange={setInputJSON} 
              onMount={handleEditorMount}
              placeholder='Paste your raw Elementor JSON here...'
            />
          </div>

          {/* Settings Section (Mobile/Responsive) */}
          <div className="xl:hidden grid grid-cols-2 gap-4 p-3 bg-[#161b22] border border-[#30363d] rounded-md">
            <Switch 
              label="RTLize" 
              checked={options.rtlize} 
              onChange={val => setOptions(prev => ({...prev, rtlize: val}))} 
            />
            <Switch 
              label="No Motion" 
              checked={options.removeMotionFX} 
              onChange={val => setOptions(prev => ({...prev, removeMotionFX: val}))} 
            />
             <Switch 
              label="Auto Format" 
              checked={options.autoFormatOnPaste} 
              onChange={val => setOptions(prev => ({...prev, autoFormatOnPaste: val}))} 
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2 text-sm bg-red-900/20 border border-red-500/30 text-red-400 rounded-md">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="truncate">{error}</span>
            </div>
          )}
        </div>

        {/* Right Side: Output */}
        <div className="flex flex-col gap-3 h-full min-h-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-[#8b949e] font-medium uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              <span>Compressed Result</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handlePrettify('output')} className="p-1.5 text-xs text-[#8b949e] hover:text-[#58a6ff] transition-colors">Prettify</button>
              <button onClick={() => handleMinify('output')} className="p-1.5 text-xs text-[#8b949e] hover:text-[#58a6ff] transition-colors">Minify</button>
              <div className="h-4 w-[1px] bg-[#30363d] mx-1"></div>
              <button 
                onClick={() => handleCopy(outputJSON)}
                disabled={!outputJSON}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {copyStatus === 'copied' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copyStatus === 'copied' ? 'Copied!' : 'Copy'}</span>
              </button>
              <button 
                onClick={handleDownload}
                disabled={!outputJSON}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <JsonEditor 
              value={outputJSON} 
              readOnly 
              placeholder='Result will appear here...'
            />
          </div>
          
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-[#161b22] border border-[#30363d] rounded-md">
              <div className="flex flex-col">
                <span className="text-[9px] text-[#8b949e] uppercase font-bold tracking-widest">Original</span>
                <span className="text-xs font-semibold">{formatByteSize(stats.originalSize)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-[#8b949e] uppercase font-bold tracking-widest">Result</span>
                <span className="text-xs font-semibold text-green-400">{formatByteSize(stats.compressedSize)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-[#8b949e] uppercase font-bold tracking-widest">Save</span>
                <span className="text-xs font-semibold text-[#1f6feb]">{stats.reductionPercentage.toFixed(1)}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-[#8b949e] uppercase font-bold tracking-widest">Removed</span>
                <span className="text-xs font-semibold">{stats.removedKeys} keys</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-none bg-[#0d1117] border-t border-[#30363d] px-6 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#f0f6fc]">Elementor Compressor</span>
          <span className="px-1.5 py-0.5 rounded-full bg-[#1f6feb] text-[10px] font-mono">v1.8.1</span>
          <span className="text-[10px] text-[#8b949e] hidden sm:inline ml-2">Built by amirhp.com</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="https://github.com/amirhp-com/elementor-compressor" target="_blank" rel="noopener noreferrer" className="text-[#8b949e] hover:text-[#c9d1d9] transition-colors"><Github className="w-4 h-4" /></a>
          <a href="https://amirhp.com" target="_blank" rel="noopener noreferrer" className="text-[#8b949e] hover:text-[#c9d1d9] transition-colors"><Globe className="w-4 h-4" /></a>
        </div>
      </footer>

      {/* Immersive Floating Toast (No background overlay) */}
      {toast.show && (
        <div 
          className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
        >
          {/* Toast Card with high contrast and deep shadow */}
          <div 
            onClick={closeToast}
            className="relative bg-[#161b22] border border-[#30363d] rounded-2xl p-8 flex flex-col items-center gap-6 animate-in fade-in duration-300 transform scale-100 shadow-[0_0_50px_rgba(0,0,0,0.8)] pointer-events-auto cursor-pointer hover:border-[#58a6ff] transition-all"
          >
            <div className={`p-6 rounded-full ${toast.success ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'} scale-125 shadow-inner`}>
              {toast.success ? <Sparkles className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
            </div>
            <div className="text-center">
              <h2 className={`text-3xl font-bold mb-2 ${toast.success ? 'text-green-400' : 'text-red-400'}`}>
                {toast.success ? 'Success!' : 'Oops!'}
              </h2>
              <p className="text-[#c9d1d9] text-lg font-medium max-w-xs">{toast.message}</p>
            </div>
            {toast.success && (
              <div className="px-4 py-2 bg-[#21262d] rounded-lg border border-[#30363d] text-sm text-[#8b949e] flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>Ready to use in Elementor</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;