import React from 'react';
import { AlertCircle } from 'lucide-react';

export const Disclaimer: React.FC = () => {
  return (
    <footer className="mt-8 pt-4 pb-6 border-t border-slate-800/80 text-center text-slate-500 text-xs">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-center gap-2 text-slate-400">
        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
        <p className="leading-relaxed text-[11px]">
          <strong className="text-slate-300">Important Disclaimer:</strong> This assistant provides information strictly from the supplied fictional policy documents only. It does not make official coverage decisions, provide legal advice, or provide personalized insurance recommendations.
        </p>
      </div>
    </footer>
  );
};
