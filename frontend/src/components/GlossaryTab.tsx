import React, { useState, useEffect } from 'react';
import { HelpCircle, Search, BookOpen, Tag } from 'lucide-react';
import { GlossaryTerm } from '../types';
import { fetchGlossary } from '../api/client';

export const GlossaryTab: React.FC = () => {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchGlossary().then((data) => setTerms(data));
  }, []);

  const filteredTerms = terms.filter(
    (t) =>
      t.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header & Search */}
      <div className="p-5 rounded-2xl glass-card border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" /> Plain-Language Insurance Terminology Glossary
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Explains complex legal policy terms in clear language. Does not override policy wording or create additional coverage.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search insurance terms..."
            className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 text-xs rounded-xl pl-9 pr-4 py-2.5 border border-slate-800 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Terms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTerms.map((t, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl glass-card glass-card-hover border border-slate-800 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-base font-bold text-cyan-400">{t.term}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-950 text-slate-400 border border-slate-800 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-cyan-500" /> {t.category}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mt-2">{t.definition}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
