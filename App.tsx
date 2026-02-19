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
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; success: boolean; message: string }>({ show: false, success: false, message: '' });

  const editorRef = useRef<any>(null);
  const toastTimeoutRef = useRef<any>(null);
  const lastProcessedInput = useRef<string>('');

  const [options, setOptions] = useState<CompressorOptions>(() => {
    const saved = localStorage.getItem('elementor_compressor_settings_v14');
    return saved ? JSON.parse(saved) : {
      rtlize: true,
      removeMotionFX: false,
      autoFormatOnPaste: true,
      autoConvertOnPaste: true,
      autoRename: true,
      removeMargins: true,
      removeLevel2Padding: true,
      removeLevel3Padding: true,
      applyMotherPadding: true,
      motherPadding: { ...defaultDevicePadding },
      applyLevel2Padding: false,
      level2Padding: { ...defaultDevicePadding },
      applyLevel3Padding: false,
      level3Padding: { ...defaultDevicePadding }
    };
  });

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
      toastTimeoutRef.current = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    }
  }, []);

  const performConversion = useCallback((rawJson: string) => {
    if (!rawJson.trim()) return;
    setIsProcessing(true);
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

      lastProcessedInput.current = rawJson;
      navigator.clipboard.writeText(compressed);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
      showToast(true, 'Optimized & Copied to Clipboard!');
    } catch (e: any) {
      showToast(false, `Conversion Failed: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [options, showToast]);

  // Effect to handle Auto-Convert and Auto-Format when inputJSON changes
  useEffect(() => {
    if (!inputJSON.trim()) {
      setOutputJSON('');
      setStats(null);
      lastProcessedInput.current = '';
      return;
    }

    // Only auto-trigger if the input is significantly different from last processed
    // and options are enabled. This handles Ctrl+V into the editor.
    if (options.autoConvertOnPaste && inputJSON !== lastProcessedInput.current) {
      const timer = setTimeout(() => {
        performConversion(inputJSON);

        // Handle Auto Formatting of input if requested
        if (options.autoFormatOnPaste) {
          try {
            const formatted = JSON.stringify(JSON.parse(inputJSON), null, 2);
            if (formatted !== inputJSON) {
              setInputJSON(formatted);
              lastProcessedInput.current = formatted;
            }
          } catch (e) {
            // Silently fail formatting if JSON is invalid
          }
        }
      }, 500); // Debounce to allow user to finish pasting/small edits

      return () => clearTimeout(timer);
    }
  }, [inputJSON, options.autoConvertOnPaste, options.autoFormatOnPaste, performConversion]);

  useEffect(() => {
    localStorage.setItem('elementor_compressor_settings_v14', JSON.stringify(options));
  }, [options]);

  const handleCompress = useCallback(() => performConversion(inputJSON), [inputJSON, performConversion]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputJSON(text);
        showToast(true, 'Pasted from Clipboard!');
      } else {
        showToast(false, 'Clipboard is empty');
      }
    } catch (err) {
      showToast(false, 'Clipboard access denied');
    }
  };

  const handlePrettify = (target: 'input' | 'output') => {
    try {
      const jsonStr = target === 'input' ? inputJSON : outputJSON;
      if (!jsonStr) return;
      const formatted = JSON.stringify(JSON.parse(jsonStr), null, 2);
      if (target === 'input') setInputJSON(formatted);
      else setOutputJSON(formatted);
    } catch (e) { showToast(false, 'Invalid JSON'); }
  };

  const handleMinify = (target: 'input' | 'output') => {
    try {
      const jsonStr = target === 'input' ? inputJSON : outputJSON;
      if (!jsonStr) return;
      const minified = JSON.stringify(JSON.parse(jsonStr));
      if (target === 'input') setInputJSON(minified);
      else setOutputJSON(minified);
    } catch (e) { showToast(false, 'Invalid JSON'); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setInputJSON(result);
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

  const handleUpdatePadding = (target: 'mother' | 'level2' | 'level3', device: keyof DevicePadding, key: keyof PaddingValues, val: string) => {
    setOptions(prev => {
      const padKey = target === 'mother' ? 'motherPadding' : target === 'level2' ? 'level2Padding' : 'level3Padding';
      return {
        ...prev,
        [padKey]: {
          ...prev[padKey],
          [device]: { ...prev[padKey][device], [key]: val }
        }
      }
    });
  };

  return (
    <div className="flex flex-col h-screen font-sans bg-[#0d1117] text-[#c9d1d9] overflow-hidden">
      <header className="flex-none bg-[#161b22] border-b border-[#30363d] px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-[#1f6feb] p-2 rounded-lg"><Maximize2 className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-xl font-bold text-[#f0f6fc]">Elementor Compressor</h1><p className="text-xs text-[#8b949e]">A high-performance utility to optimize Elementor JSON (RTLize)</p></div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-sm cursor-pointer shadow-sm transition-all"><Upload className="w-4 h-4" /><span>Load File</span><input type="file" className="hidden" accept=".json" onChange={handleFileUpload} /></label>
          <button onClick={() => setShowSettings(true)} className="p-2 rounded-md border border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] shadow-sm"><Settings className="w-5 h-5" /></button>
          <button onClick={handleCompress} disabled={!inputJSON || isProcessing} className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-[#238636] hover:bg-[#2ea043] disabled:bg-[#238636]/50 text-white text-sm font-semibold transition-all shadow-md"><Zap className={`w-4 h-4 ${isProcessing ? 'animate-pulse' : ''}`} /><span>{isProcessing ? 'Processing' : 'Convert'}</span></button>
        </div>
      </header>

      <main className="flex-1 min-h-0 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
        <div className="flex flex-col gap-3 h-full min-h-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-[#8b949e] font-medium uppercase tracking-wider"><FileJson className="w-4 h-4" /><span>Input Source</span></div>
            <div className="flex items-center gap-3 text-xs">
              <button onClick={handlePaste} className="flex items-center gap-1.5 px-2 py-1 bg-[#21262d] border border-[#30363d] rounded text-[#c9d1d9] hover:bg-[#30363d] transition-colors"><ClipboardPaste className="w-3 h-3" /><span>Paste</span></button>
              <div className="h-4 w-[1px] bg-[#30363d] mx-1"></div>
              <button onClick={() => handlePrettify('input')} className="text-[#8b949e] hover:text-[#58a6ff]">Prettify</button>
              <button onClick={() => handleMinify('input')} className="text-[#8b949e] hover:text-[#58a6ff]">Minify</button>
              <div className="h-4 w-[1px] bg-[#30363d] mx-1"></div>
              <button onClick={() => setInputJSON('')} className="text-[#8b949e] hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <JsonEditor value={inputJSON} onChange={setInputJSON} onMount={(e, m) => {
              editorRef.current = e;
              e.addCommand(m.KeyMod.CtrlCmd | m.KeyCode.Enter, () => handleCompress());
            }} placeholder='Paste Elementor JSON here...' />
          </div>
        </div>

        <div className="flex flex-col gap-3 h-full min-h-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-[#8b949e] font-medium uppercase tracking-wider"><Zap className="w-4 h-4" /><span>Optimized Result</span></div>
            <div className="flex items-center gap-3 text-xs">
              <button onClick={() => handlePrettify('output')} className="text-[#8b949e] hover:text-[#58a6ff]">Prettify</button>
              <button onClick={() => handleMinify('output')} className="text-[#8b949e] hover:text-[#58a6ff]">Minify</button>
              <div className="h-4 w-[1px] bg-[#30363d] mx-1"></div>
              <button onClick={() => { navigator.clipboard.writeText(outputJSON); setCopyStatus('copied'); setTimeout(() => setCopyStatus('idle'), 2000); }} disabled={!outputJSON} className="flex items-center gap-1.5 px-3 py-1 font-semibold rounded bg-[#1f6feb] border border-[#1f6feb] text-white hover:bg-[#388bfd] transition-all">{copyStatus === 'copied' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}<span>Copy</span></button>
              <button onClick={handleDownload} disabled={!outputJSON} className="p-1.5 rounded bg-[#21262d] border border-[#30363d] text-[#c9d1d9] hover:bg-[#30363d] transition-all"><Download className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <JsonEditor value={outputJSON} readOnly placeholder='Result will appear here...' />
          </div>
          {stats && (
            <div className="grid grid-cols-4 gap-4 p-3 bg-[#161b22] border border-[#30363d] rounded-md text-[10px] shadow-sm">
              <div className="flex flex-col"><span className="text-[#8b949e] uppercase font-bold tracking-widest">Original</span><span className="text-xs font-semibold">{formatByteSize(stats.originalSize)}</span></div>
              <div className="flex flex-col"><span className="text-[#8b949e] uppercase font-bold tracking-widest">Result</span><span className="text-xs font-semibold text-green-400">{formatByteSize(stats.compressedSize)}</span></div>
              <div className="flex flex-col"><span className="text-[#8b949e] uppercase font-bold tracking-widest">Save</span><span className="text-xs font-semibold text-[#1f6feb]">{stats.reductionPercentage.toFixed(1)}%</span></div>
              <div className="flex flex-col"><span className="text-[#8b949e] uppercase font-bold tracking-widest">Removed</span><span className="text-xs font-semibold">{stats.removedKeys} keys</span></div>
            </div>
          )}
        </div>
      </main>

      <footer className="flex-none bg-[#0d1117] border-t border-[#30363d] px-6 py-3 flex items-center justify-between z-10 text-[10px] text-[#8b949e]">
        <div className="flex items-center gap-2 font-medium">
          <span className="text-[#f0f6fc]">Elementor Compressor</span>
          <span>v2.15.0</span>
          <span className="mx-2 text-[#484f58]">|</span>
          <span>Built by <a href="https://amirhp.com" target="_blank" className="text-[#58a6ff] hover:underline font-bold">AmirhpCom</a></span>
        </div>
        <div className="flex items-center gap-4">
          <a href="https://github.com/amirhp-com/elementor-compressor" target="_blank" className="hover:text-[#f0f6fc] transition-colors"><Github className="w-4 h-4" /></a>
          <a href="https://amirhp.com" target="_blank" className="hover:text-[#f0f6fc] transition-colors"><Globe className="w-4 h-4" /></a>
        </div>
      </footer>

      {/* Settings Drawer */}
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${showSettings ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
        <div className={`absolute top-0 right-0 h-full w-full max-w-sm bg-[#161b22] border-l border-[#30363d] shadow-2xl transition-transform duration-300 transform ${showSettings ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto`}>
          <div className="flex items-center justify-between p-6 border-b border-[#30363d] sticky top-0 bg-[#161b22] z-20"><div className="flex items-center gap-2"><Settings className="w-5 h-5 text-[#58a6ff]" /><h2 className="text-lg font-bold">Optimization Settings</h2></div><button onClick={() => setShowSettings(false)} className="p-2 hover:bg-[#30363d] rounded-md transition-colors"><X className="w-5 h-5" /></button></div>
          <div className="p-6 space-y-8 pb-24">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#8b949e] uppercase tracking-wider">General Options</h3>
              <Switch label="RTLize" checked={options.rtlize} onChange={v => setOptions(p => ({...p, rtlize: v}))} description="Mirror layout & alignments (Default: ON)" />
              <Switch label="Remove Margins" checked={options.removeMargins} onChange={v => setOptions(p => ({...p, removeMargins: v}))} description="Strip all container margins" />
              <Switch label="Strip Level 2 Paddings" checked={options.removeLevel2Padding} onChange={v => setOptions(p => ({...p, removeLevel2Padding: v}))} description="Remove all paddings from Level 2" />
              <Switch label="Strip Level 3+ Paddings" checked={options.removeLevel3Padding} onChange={v => setOptions(p => ({...p, removeLevel3Padding: v}))} description="Remove all paddings from Inner" />
              <Switch label="Auto Rename" checked={options.autoRename} onChange={v => setOptions(p => ({...p, autoRename: v}))} description="Section / Container / Inner" />
              <Switch label="Strip Animations" checked={options.removeMotionFX} onChange={v => setOptions(p => ({...p, removeMotionFX: v}))} description="Strip MotionFX properties" />
              <Switch label="Auto Format" checked={options.autoFormatOnPaste} onChange={v => setOptions(p => ({...p, autoFormatOnPaste: v}))} description="Beautify JSON on input" />
              <Switch label="Auto Convert" checked={options.autoConvertOnPaste} onChange={v => setOptions(p => ({...p, autoConvertOnPaste: v}))} description="Optimise instantly on paste" />
            </div>

            <div className="space-y-6 pt-4 border-t border-[#30363d]">
              {/* L1 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between"><h3 className="text-xs font-bold text-[#f0f6fc] uppercase tracking-wider">Level 1 (Sections)</h3><Switch label="" checked={options.applyMotherPadding} onChange={v => setOptions(p => ({...p, applyMotherPadding: v}))} /></div>
                {options.applyMotherPadding && <div className="space-y-4 animate-in fade-in duration-200"><PaddingGrid title="Desktop" icon={Monitor} values={options.motherPadding.desktop} onChange={(k,v) => handleUpdatePadding('mother', 'desktop', k, v)} /><PaddingGrid title="Tablet" icon={Tablet} values={options.motherPadding.tablet} onChange={(k,v) => handleUpdatePadding('mother', 'tablet', k, v)} /><PaddingGrid title="Mobile" icon={Smartphone} values={options.motherPadding.mobile} onChange={(k,v) => handleUpdatePadding('mother', 'mobile', k, v)} /></div>}
              </div>
              {/* L2 */}
              <div className="space-y-4 pt-4 border-t border-[#30363d]">
                <div className="flex items-center justify-between"><h3 className="text-xs font-bold text-[#f0f6fc] uppercase tracking-wider">Level 2 (Containers)</h3><Switch label="" checked={options.applyLevel2Padding} onChange={v => setOptions(p => ({...p, applyLevel2Padding: v}))} /></div>
                {options.applyLevel2Padding && <div className="space-y-4 animate-in fade-in duration-200"><PaddingGrid title="Desktop" icon={Monitor} values={options.level2Padding.desktop} onChange={(k,v) => handleUpdatePadding('level2', 'desktop', k, v)} /><PaddingGrid title="Tablet" icon={Tablet} values={options.level2Padding.tablet} onChange={(k,v) => handleUpdatePadding('level2', 'tablet', k, v)} /><PaddingGrid title="Mobile" icon={Smartphone} values={options.level2Padding.mobile} onChange={(k,v) => handleUpdatePadding('level2', 'mobile', k, v)} /></div>}
              </div>
              {/* L3+ */}
              <div className="space-y-4 pt-4 border-t border-[#30363d]">
                <div className="flex items-center justify-between"><h3 className="text-xs font-bold text-[#f0f6fc] uppercase tracking-wider">Level 3+ (Inner)</h3><Switch label="" checked={options.applyLevel3Padding} onChange={v => setOptions(p => ({...p, applyLevel3Padding: v}))} /></div>
                {options.applyLevel3Padding && <div className="space-y-4 animate-in fade-in duration-200"><PaddingGrid title="Desktop" icon={Monitor} values={options.level3Padding.desktop} onChange={(k,v) => handleUpdatePadding('level3', 'desktop', k, v)} /><PaddingGrid title="Tablet" icon={Tablet} values={options.level3Padding.tablet} onChange={(k,v) => handleUpdatePadding('level3', 'tablet', k, v)} /><PaddingGrid title="Mobile" icon={Smartphone} values={options.level3Padding.mobile} onChange={(k,v) => handleUpdatePadding('level3', 'mobile', k, v)} /></div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast.show && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
          <div
            onClick={() => setToast(p => ({...p, show: false}))}
            className={`relative bg-[#161b22]/90 backdrop-blur-md border ${toast.success ? 'border-[#238636]' : 'border-red-500/50'} rounded-2xl p-10 flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300 transform scale-100 shadow-[0_0_80px_rgba(0,0,0,0.9)] pointer-events-auto cursor-pointer max-w-sm w-full mx-4`}
          >
            <div className={`p-6 rounded-full ${toast.success ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'} scale-125`}>
              {toast.success ? <Sparkles className="w-14 h-14" /> : <AlertCircle className="w-14 h-14" />}
            </div>
            <div className="text-center">
              <h2 className={`text-4xl font-bold mb-3 ${toast.success ? 'text-green-400' : 'text-red-400'}`}>
                {toast.success ? 'Success!' : 'Oops!'}
              </h2>
              <p className="text-[#f0f6fc] text-xl font-medium leading-relaxed">
                {toast.message}
              </p>
            </div>
            <div className="text-[10px] text-[#8b949e] uppercase font-bold tracking-widest mt-2">
              Click to Dismiss
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;