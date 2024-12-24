import React from 'react';

interface CodeEditorProps {
  content: string;
  onChange: (value: string) => void;
  // socket: any;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ content, onChange}) => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-2 bg-gray-800 text-white text-sm">
        <span>Editor</span>
      </div>
      <textarea
        className="flex-1 w-full bg-gray-900 text-gray-100 font-mono p-4 resize-none outline-none"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
    </div>
  );
};