import React from 'react';
import Editor from '@monaco-editor/react';
import { EditorProps } from '../types';

export const JsonEditor: React.FC<EditorProps> = ({ value, onChange, readOnly, placeholder, onMount }) => {
  const handleOnMount = (editor: any, monaco: any) => {
    // Local state to track folding toggle within this instance
    let isFolded = false;

    // Add custom context menu item
    editor.addAction({
      id: 'toggle-expand-collapse-all',
      label: 'Toggle Expand/Collapse All',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1,
      run: (ed: any) => {
        if (isFolded) {
          // Trigger built-in unfold all
          const unfoldAction = ed.getAction('editor.unfoldAll');
          if (unfoldAction) unfoldAction.run();
        } else {
          // Trigger built-in fold all
          const foldAction = ed.getAction('editor.foldAll');
          if (foldAction) foldAction.run();
        }
        isFolded = !isFolded;
      },
    });

    // Chain the external onMount prop if provided
    if (onMount) {
      onMount(editor, monaco);
    }
  };

  return (
    <div className="relative w-full h-full font-mono text-sm overflow-hidden bg-[#0d1117] rounded-md border border-[#30363d] focus-within:border-[#58a6ff] transition-colors">
      <Editor
        height="100%"
        defaultLanguage="json"
        theme="vs-dark"
        value={value}
        onChange={(val) => onChange?.(val || '')}
        onMount={handleOnMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
          wordWrap: 'on',
          formatOnPaste: true,
          renderLineHighlight: 'all',
          cursorBlinking: 'smooth',
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            useShadows: false,
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10
          }
        }}
        loading={<div className="flex items-center justify-center h-full text-[#8b949e]">Initializing Editor...</div>}
      />
      {!value && placeholder && (
        <div className="absolute top-4 left-[54px] pointer-events-none text-[#484f58] select-none">
          {placeholder}
        </div>
      )}
    </div>
  );
};