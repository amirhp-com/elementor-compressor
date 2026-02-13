
import React, { useState, useEffect, useCallback } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { JsonEditor } from './components/JsonEditor';
import { compressElementorJSON, formatByteSize } from './utils/compressor';
import { CompressorStats } from './types';

const App: React.FC = () => {
  const [inputJSON, setInputJSON] = useState<string>('');
  const [outputJSON, setOutputJSON] = useState<string>('');
  const [stats, setStats] = useState<CompressorStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleCompress = useCallback(() => {
    if (!inputJSON.trim()) return;
    setIsProcessing(true);
    setError(null);

    try {
      const parsed = JSON.parse(inputJSON);
      const originalBytes = new TextEncoder().encode(inputJSON).length;
      
      const { cleaned, removedCount } = compressElementorJSON(parsed);
      const compressed = JSON.stringify(cleaned, null, 2);
      const compressedBytes = new TextEncoder().encode(compressed).length;

      setOutputJSON(compressed);
      setStats({
        originalSize: originalBytes,
        compressedSize: compressedBytes,
        reductionPercentage: originalBytes > 0 ? ((originalBytes - compressedBytes) / originalBytes) * 100 : 0,
        removedKeys: removedCount
      });
    } catch (e: any) {
      setError(`Invalid JSON: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [inputJSON]);

  // Handle Ctrl+Enter / Cmd+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleCompress();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCompress]);

  const handlePrettify = (target: 'input' | 'output') => {
    try {
      if (target === 'input') {
        const obj = JSON.parse(inputJSON);
        setInputJSON(JSON.stringify(obj, null, 2));
      } else {
        const obj = JSON.parse(outputJSON);
        setOutputJSON(JSON.stringify(obj, null, 2));
      }
    } catch (e) {}
  };

  const handleMinify = (target: 'input' | 'output') => {
    try {
      if (target === 'input') {
        const obj = JSON.parse(inputJSON);
        setInputJSON(JSON.stringify(obj));
      } else {
        const obj = JSON.parse(outputJSON);
        setOutputJSON(JSON.stringify(obj));
      }
    } catch (e) {}
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInputJSON(content);
    };
    reader.readAsText(file);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputJSON);
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([outputJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'elementor-compressed.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col min-h-screen font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#161b22] border-b border-[#30363d] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Maximize2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#f0f6fc]">Elementor Compressor</h1>
            <p className="text-xs text-[#8b949e]">Optimize widgets by removing redundant meta properties</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-sm cursor-pointer transition-all">
            <Upload className="w-4 h-4" />
            <span>Load JSON</span>
            <input type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
          </label>
          <button 
            onClick={handleCompress}
            disabled={!inputJSON || isProcessing}
            className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-[#238636] hover:bg-[#2ea043] disabled:bg-[#238636]/50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-sm"
          >
            <Zap className={`w-4 h-4 ${isProcessing ? 'animate-pulse' : ''}`} />
            <span>{isProcessing ? 'Compressing...' : 'Convert'}</span>
            <span className="text-[10px] opacity-70 bg-black/20 px-1.5 rounded ml-1 hidden sm:inline">⌘↵</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
        {/* Left Side: Input */}
        <div className="flex flex-col gap-3 min-h-[400px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-[#8b949e] font-medium uppercase tracking-wider">
              <FileJson className="w-4 h-4" />
              <span>Input Elementor JSON</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handlePrettify('input')} className="p-1.5 text-xs text-[#8b949e] hover:text-[#58a6ff] transition-colors">Prettify</button>
              <button onClick={() => handleMinify('input')} className="p-1.5 text-xs text-[#8b949e] hover:text-[#58a6ff] transition-colors">Minify</button>
              <button onClick={() => setInputJSON('')} className="p-1.5 text-[#8b949e] hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex-1">
            <JsonEditor 
              value={inputJSON} 
              onChange={setInputJSON} 
              placeholder='Paste your Elementor JSON here...'
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm bg-red-900/20 border border-red-500/30 text-red-400 rounded-md">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right Side: Output */}
        <div className="flex flex-col gap-3 min-h-[400px]">
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
                onClick={handleCopy}
                disabled={!outputJSON}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {copyStatus === 'copied' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copyStatus === 'copied' ? 'Copied!' : 'Copy'}</span>
              </button>
              <button 
                onClick={handleDownload}
                disabled={!outputJSON}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>
          <div className="flex-1">
            <JsonEditor 
              value={outputJSON} 
              readOnly 
              placeholder='Result will appear here...'
            />
          </div>
          
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[#161b22] border border-[#30363d] rounded-md">
              <div className="flex flex-col">
                <span className="text-[10px] text-[#8b949e] uppercase font-bold tracking-widest">Original</span>
                <span className="text-sm font-semibold">{formatByteSize(stats.originalSize)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-[#8b949e] uppercase font-bold tracking-widest">Compressed</span>
                <span className="text-sm font-semibold text-green-400">{formatByteSize(stats.compressedSize)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-[#8b949e] uppercase font-bold tracking-widest">Reduction</span>
                <span className="text-sm font-semibold text-blue-400">{stats.reductionPercentage.toFixed(1)}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-[#8b949e] uppercase font-bold tracking-widest">Removed Keys</span>
                <span className="text-sm font-semibold">{stats.removedKeys}</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0d1117] border-t border-[#30363d] p-8 text-center sm:text-left">
        <div className="mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-[#f0f6fc] font-bold">
              <span>Elementor Compressor</span>
              <span className="px-2 py-0.5 rounded-full bg-[#1f6feb] text-[10px]">v1.0.0</span>
            </div>
            <p className="text-sm text-[#8b949e]">
              Built by <a href="https://amirhp.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">AmirhpCom</a>. 
              Optimize your WordPress workflow by shedding useless meta weight.
            </p>
            <p className="text-[10px] text-[#484f58] italic">
              Disclaimer: This tool is intended for performance optimization. Always backup your JSON files before using compressed results in production.
            </p>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-4">
            <div className="flex items-center gap-4">
              <a href="https://amirhp.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-[#161b22] border border-[#30363d] rounded-full hover:border-[#58a6ff] hover:text-[#58a6ff] transition-all" title="Visit amirhp.com">
                <Globe className="w-5 h-5" />
              </a>
              <a href="https://github.com/amirhp-com/elementor-compressor" target="_blank" rel="noopener noreferrer" className="p-2 bg-[#161b22] border border-[#30363d] rounded-full hover:border-[#58a6ff] hover:text-[#58a6ff] transition-all" title="View Source on GitHub">
                <Github className="w-5 h-5" />
              </a>
            </div>
            <div className="text-xs text-[#8b949e]">
              &copy; {new Date().getFullYear()} AmirhpCom. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
