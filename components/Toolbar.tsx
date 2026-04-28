import React from 'react';
import { Icons } from './Icons';

export const Toolbar: React.FC = () => {
  const tools = [
    { icon: Icons.Transcript, label: "Transcript" },
    { icon: Icons.Notes, label: "Notes" },
    { icon: Icons.Files, label: "Files" },
    { icon: Icons.Coach, label: "Discuss" },
  ];

  return (
    <div className="w-20 bg-[var(--cds-color-white)] border-l border-[var(--cds-color-grey-100)] h-full flex-shrink-0 flex flex-col items-center py-6 gap-6 hidden lg:flex">
      {tools.map((tool) => (
        <button 
          key={tool.label}
          className="flex flex-col items-center gap-1 text-[var(--cds-color-grey-500)] hover:text-blue-600 transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center group-hover:bg-blue-50">
            <tool.icon className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <span className="label-xs">{tool.label}</span>
        </button>
      ))}
    </div>
  );
};