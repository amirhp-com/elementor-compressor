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
  Sparkles,
  ClipboardPaste,
  Settings,
  X,
  Monitor,
  Tablet,
  Smartphone,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { JsonEditor } from './components/JsonEditor';
import { compressElementorJSON, formatByteSize } from './utils/compressor';
import { CompressorStats, CompressorOptions, DevicePadding, PaddingValues } from './types';

const defaultPadding: PaddingValues = { top: '0', right: '0', bottom: '0', left: '0' };
const defaultDevicePadding: DevicePadding = {
  desktop: { ...defaultPadding },
  tablet: { ...defaultPadding },
  mobile: { ...defaultPadding }
};

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

const PaddingGrid = ({ 
  title, 
  icon: Icon, 
  values, 
  onChange 
}: { 
  title: string; 
  icon: any; 
  values: PaddingValues; 
  onChange: (key: keyof PaddingValues, val: string) => void;
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-[10px] text-[#8b949e] uppercase font-bold tracking-widest">
      <Icon className="w-3 h-3" />
      <span>{title}</span>
    </div>
    <div className="grid grid-cols-4 gap-2">
      <div className="relative">
        <ArrowUp className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#484f58]" />
        <input 
          type="text" 
          value={values.top} 
          onChange={(e) => onChange('top', e.target.value)}
          className="w-full bg-[#0d1117] border border-[#30363d] rounded py-1 pl-6 pr-1 text-xs text-center focus:border-[#58a6ff] outline-none" 
        />
      </div>
      <div className="relative">
        <ArrowRight className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#484f58]" />
        <input 
          type="text" 
          value={values.right} 
          onChange={(e) => onChange('right', e.target.value)}
          className="w-full bg-[#0d1117] border border-[#30363d] rounded py-1 pl-6 pr-1 text-xs text-center focus:border-[#58a6ff] outline-none" 
        />
      </div>
      <div className="relative">
        <ArrowDown className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#484f58]" />
        <input 
          type="text" 
          value={values.bottom} 
          onChange={(e) => onChange('bottom', e.target.value)}
          className="w-full bg-[#0d1117] border border-[#30363d] rounded py-1 pl-6 pr-1 text-xs text-center focus:border-[#58a6ff] outline-none" 
        />
      </div>
      <div className="relative">
        <ArrowLeft className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#484f58]" />
        <input 
          type="text" 
          value={values.left} 
          onChange={(e) => onChange('left', e.target.value)}
          className="w-full bg-[#0d1117] border border-[#30363d] rounded py-1 pl-6 pr-1 text-xs text-center focus:border-[#58a6ff] outline-none" 
        />
      </div>
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
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; success: boolean; message: string }>({ show: false, success: false, message: '' });
  
  const editorRef = useRef<any>(null);
  const toastTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (!inputJSON.trim()) {
      setOutputJSON('');
      setStats(null);
      setError(null);
    }
  }, [inputJSON]);

  const [options, setOptions] = useState<CompressorOptions>(() => {
    const saved = localStorage.getItem('elementor_compressor_settings_v3');
    return saved ? JSON.parse(saved) : {
      rtlize: false,
      removeMotionFX: false,
      autoFormatOnPaste: true,
      autoConvertOnPaste: true,
      applyMotherPadding: true,
      motherPadding: { ...defaultDevicePadding },
      applyLevel2Padding: false,
      level2Padding: { ...defaultDevicePadding }
    };
  });

  useEffect(() => {
    localStorage.setItem('elementor_compressor_settings_v3', JSON.stringify(options));
  }, [options]);

  const playSuccessSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {}
  };

  const showToast = useCallback((success: boolean, message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ show: true, success, message });
    if (success) {
      playSuccessSound();
      toastTimeoutRef.current = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2000);
    }
  }, []);

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
      navigator.clipboard.writeText(compressed);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
      showToast(true, 'Optimized & Copied to Clipboard!');
    } catch (e: any) {
      setError(`Invalid JSON: ${e.message}`);
      showToast(false, `Conversion Failed: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [options, showToast]);

  const handleCompress = useCallback(() => {
    performConversion(inputJSON);
  }, [inputJSON, performConversion]);

  const handlePrettify = (target: 'input' | 'output') => {
    try {
      const jsonStr = target === 'input' ? inputJSON : outputJSON;
      if (!jsonStr) return;
      const formatted = JSON.stringify(JSON.parse(jsonStr), null, 2);
      if (target === 'input') setInputJSON(formatted);
      else setOutputJSON(formatted);
    } catch (e) {
      showToast(false, 'Failed to format: Invalid JSON');
    }
  };

  const handleMinify = (target: 'input' | 'output') => {
    try {
      const jsonStr = target === 'input' ? inputJSON : outputJSON;
      if (!jsonStr) return;
      const minified = JSON.stringify(JSON.parse(jsonStr));
      if (target === 'input') setInputJSON(minified);
      else setOutputJSON(minified);
    } catch (e) {
      showToast(false, 'Failed to minify: Invalid JSON');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setInputJSON(result);
      if (options.autoConvertOnPaste) {
        performConversion(result);
      }
    };
    reader.readAsText(file);
  };

  const handleDownload = () => {
    if (!outputJSON) return;
    const blob = new Blob([outputJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'elementor-optimized.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => handleCompress());
    editor.onDidPaste(() => {
      setTimeout(() => {
        const val = editor.getValue();
        if (options.autoFormatOnPaste) {
          try {
            const formatted = JSON.stringify(JSON.parse(val), null, 2);
            setInputJSON(formatted);
            if (options.autoConvertOnPaste) performConversion(formatted);
          } catch (e) {
            setInputJSON(val);
            if (options.autoConvertOnPaste) performConversion(val);
          }
        } else {
          setInputJSON(val);
          if (options.autoConvertOnPaste) performConversion(val);
        }
      }, 100);
    });
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        let final = text;
        if (options.autoFormatOnPaste) {
          try { final = JSON.stringify(JSON.parse(text), null, 2); } catch(e){}
        }
        setInputJSON(final);
        performConversion(final);
      }
    } catch (err) { showToast(false, 'Clipboard access denied'); }
  };

  const handleUpdatePadding = (target: 'mother' | 'level2', device: keyof DevicePadding, key: keyof PaddingValues, val: string) => {
    setOptions(prev => {
      const padKey = target === 'mother' ? 'motherPadding' : 'level2Padding';
      return {
        ...prev,
        [padKey]: {
          ...prev[padKey],
          [device]: {
            ...prev[padKey][device],
            [key]: val
          }
        }
      }
    });
  };

  return (
    <div className="flex flex-col h-screen font-sans bg-[#0d1117] text-[#c9d1d9] overflow-hidden">
      <header className="flex-none bg-[#161b22] border-b border-[#30363d] px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-[#1f6feb] p-2 rounded-lg">
            <Maximize2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#f0f6fc]">Elementor Compressor</h1>
            <p className="text-xs text-[#8b949e]">v2.8.0: Robust Hierarchy Logic & Margins Fixed</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-sm cursor-pointer transition-all shadow-sm">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Load JSON</span>
            <input type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
          </label>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-md border border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] transition-all shadow-sm"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button 
            onClick={handleCompress}
            disabled={!inputJSON || isProcessing}
            className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-[#238636] hover:bg-[#2ea043] disabled:bg-[#238636]/50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-md"
          >
            <Zap className={`w-4 h-4 ${isProcessing ? 'animate-pulse' : ''}`} />
            <span>{isProcessing ? 'Optimizing...' : 'Convert'}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 min-h-0 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
        <div className="flex flex-col gap-3 h-full min-h-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-[#8b949e] font-medium uppercase tracking-wider">
              <FileJson className="w-4 h-4" />
              <span>Input Source</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handlePrettify('input')} className="p-1.5 text-xs text-[#8b949e] hover:text-[#58a6ff] transition-colors" title="Prettify">Prettify</button>
              <button onClick={() => handleMinify('input')} className="p-1.5 text-xs text-[#8b949e] hover:text-[#58a6ff] transition-colors" title="Minify">Minify</button>
              <div className="h-4 w-[1px] bg-[#30363d] mx-1"></div>
              <button 
                onClick={handlePasteFromClipboard} 
                className="flex items-center gap-1.5 px-3 py-1 text-xs text-[#c9d1d9] bg-[#1f6feb] border border-[#1f6feb] rounded-md hover:bg-[#388bfd] transition-colors font-semibold shadow-sm"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                Paste & Optimize
              </button>
              <button onClick={() => setInputJSON('')} className="p-1.5 text-[#8b949e] hover:text-red-400 transition-colors" title="Clear All">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <JsonEditor value={inputJSON} onChange={setInputJSON} onMount={handleEditorMount} placeholder='Paste your raw Elementor JSON here...' />
          </div>
          {error && <div className="flex items-center gap-2 p-2 text-sm bg-red-900/20 border border-red-500/30 text-red-400 rounded-md truncate"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
        </div>

        <div className="flex flex-col gap-3 h-full min-h-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-[#8b949e] font-medium uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              <span>Compressed Result</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handlePrettify('output')} className="p-1.5 text-xs text-[#8b949e] hover:text-[#58a6ff] transition-colors" title="Prettify">Prettify</button>
              <button onClick={() => handleMinify('output')} className="p-1.5 text-xs text-[#8b949e] hover:text-[#58a6ff] transition-colors" title="Minify">Minify</button>
              <div className="h-4 w-[1px] bg-[#30363d] mx-1"></div>
              <button 
                onClick={() => { navigator.clipboard.writeText(outputJSON); setCopyStatus('copied'); setTimeout(() => setCopyStatus('idle'), 2000); }}
                disabled={!outputJSON}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] disabled:opacity-50 transition-all shadow-sm"
              >
                {copyStatus === 'copied' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copyStatus === 'copied' ? 'Copied!' : 'Copy'}</span>
              </button>
              <button 
                onClick={handleDownload}
                disabled={!outputJSON}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] disabled:opacity-50 transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <JsonEditor value={outputJSON} readOnly placeholder='Result will appear here...' />
          </div>
          {stats && (
            <div className="grid grid-cols-4 gap-4 p-3 bg-[#161b22] border border-[#30363d] rounded-md shadow-sm">
              <div className="flex flex-col"><span className="text-[9px] text-[#8b949e] uppercase font-bold tracking-widest">Original</span><span className="text-xs font-semibold">{formatByteSize(stats.originalSize)}</span></div>
              <div className="flex flex-col"><span className="text-[9px] text-[#8b949e] uppercase font-bold tracking-widest">Result</span><span className="text-xs font-semibold text-green-400">{formatByteSize(stats.compressedSize)}</span></div>
              <div className="flex flex-col"><span className="text-[9px] text-[#8b949e] uppercase font-bold tracking-widest">Save</span><span className="text-xs font-semibold text-[#1f6feb]">{stats.reductionPercentage.toFixed(1)}%</span></div>
              <div className="flex flex-col"><span className="text-[9px] text-[#8b949e] uppercase font-bold tracking-widest">Removed</span><span className="text-xs font-semibold">{stats.removedKeys} keys</span></div>
            </div>
          )}
        </div>
      </main>

      <footer className="flex-none bg-[#0d1117] border-t border-[#30363d] px-6 py-3 flex items-center justify-between z-10 text-[10px] text-[#8b949e]">
        <div className="flex items-center gap-2"><span className="font-bold text-[#f0f6fc]">Elementor Compressor</span><span>v2.8.0</span></div>
        <div className="flex items-center gap-4"><a href="https://github.com/amirhp-com" target="_blank" rel="noopener noreferrer"><Github className="w-4 h-4" /></a><a href="https://amirhp.com" target="_blank" rel="noopener noreferrer"><Globe className="w-4 h-4" /></a></div>
      </footer>

      {/* Settings Drawer */}
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${showSettings ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
        <div className={`absolute top-0 right-0 h-full w-full max-w-sm bg-[#161b22] border-l border-[#30363d] shadow-2xl transition-transform duration-300 transform ${showSettings ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto`}>
          <div className="flex items-center justify-between p-6 border-b border-[#30363d] sticky top-0 bg-[#161b22] z-10">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#58a6ff]" />
              <h2 className="text-lg font-bold">Optimization Settings</h2>
            </div>
            <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-[#30363d] rounded-md"><X className="w-5 h-5" /></button>
          </div>
          
          <div className="p-6 space-y-8 pb-20">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#8b949e] uppercase tracking-wider">General Options</h3>
              <Switch label="RTLize" checked={options.rtlize} onChange={v => setOptions(p => ({...p, rtlize: v}))} description="Mirror layouts & alignments" />
              <Switch label="No MotionFX" checked={options.removeMotionFX} onChange={v => setOptions(p => ({...p, removeMotionFX: v}))} description="Strip animations" />
              <Switch label="Auto Format" checked={options.autoFormatOnPaste} onChange={v => setOptions(p => ({...p, autoFormatOnPaste: v}))} description="Beautify JSON on paste" />
              <Switch label="Auto Convert" checked={options.autoConvertOnPaste} onChange={v => setOptions(p => ({...p, autoConvertOnPaste: v}))} description="Trigger optimize on paste" />
            </div>

            <div className="space-y-4 pt-4 border-t border-[#30363d]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#f0f6fc] uppercase tracking-wider">Mother Container</h3>
                <Switch label="" checked={options.applyMotherPadding} onChange={v => setOptions(p => ({...p, applyMotherPadding: v}))} />
              </div>
              <p className="text-[10px] text-[#8b949e]">Forced 100% width. Margins removed.</p>
              {options.applyMotherPadding && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <PaddingGrid title="Desktop" icon={Monitor} values={options.motherPadding.desktop} onChange={(k,v) => handleUpdatePadding('mother', 'desktop', k, v)} />
                  <PaddingGrid title="Tablet" icon={Tablet} values={options.motherPadding.tablet} onChange={(k,v) => handleUpdatePadding('mother', 'tablet', k, v)} />
                  <PaddingGrid title="Mobile" icon={Smartphone} values={options.motherPadding.mobile} onChange={(k,v) => handleUpdatePadding('mother', 'mobile', k, v)} />
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-[#30363d]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#f0f6fc] uppercase tracking-wider">Nested Containers (L2+)</h3>
                <Switch label="" checked={options.applyLevel2Padding} onChange={v => setOptions(p => ({...p, applyLevel2Padding: v}))} />
              </div>
              <p className="text-[10px] text-[#8b949e]">Forced Boxed. Width properties removed. Margins removed.</p>
              {options.applyLevel2Padding && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <PaddingGrid title="Desktop" icon={Monitor} values={options.level2Padding.desktop} onChange={(k,v) => handleUpdatePadding('level2', 'desktop', k, v)} />
                  <PaddingGrid title="Tablet" icon={Tablet} values={options.level2Padding.tablet} onChange={(k,v) => handleUpdatePadding('level2', 'tablet', k, v)} />
                  <PaddingGrid title="Mobile" icon={Smartphone} values={options.level2Padding.mobile} onChange={(k,v) => handleUpdatePadding('level2', 'mobile', k, v)} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {toast.show && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
          <div onClick={() => setToast(p => ({...p, show: false}))} className={`relative bg-[#161b22] border ${toast.success ? 'border-[#30363d]' : 'border-red-500/50'} rounded-2xl p-8 flex flex-col items-center gap-6 animate-in fade-in duration-300 transform scale-100 shadow-[0_0_50px_rgba(0,0,0,0.8)] pointer-events-auto cursor-pointer`}>
            <div className={`p-6 rounded-full ${toast.success ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'} scale-125`}><Sparkles className="w-12 h-12" /></div>
            <div className="text-center"><h2 className={`text-3xl font-bold mb-2 ${toast.success ? 'text-green-400' : 'text-red-400'}`}>{toast.success ? 'Success!' : 'Oops!'}</h2><p className="text-[#c9d1d9] text-lg font-medium">{toast.message}</p></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;