
import React, { useEffect, useRef } from 'react';
import { EditorProps } from '../types';

// Declare Prism globally to avoid import issues in this environment
declare const Prism: any;

export const JsonEditor: React.FC<EditorProps> = ({ value, onChange, readOnly, placeholder }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.textContent = value;
      Prism.highlightElement(codeRef.current);
    }
  }, [value]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.currentTarget.scrollTop;
      preRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  return (
    <div className="relative w-full h-full font-mono text-sm overflow-hidden bg-[#0d1117] rounded-md border border-[#30363d] focus-within:border-[#58a6ff] transition-colors">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onScroll={handleScroll}
        readOnly={readOnly}
        placeholder={placeholder}
        className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-white resize-none z-10 selection:bg-blue-500/30"
        spellCheck={false}
      />
      <pre
        ref={preRef}
        className="absolute inset-0 w-full h-full p-4 m-0 pointer-events-none overflow-hidden whitespace-pre-wrap break-all"
        aria-hidden="true"
      >
        <code ref={codeRef} className="language-json">
          {value}
        </code>
      </pre>
    </div>
  );
};
