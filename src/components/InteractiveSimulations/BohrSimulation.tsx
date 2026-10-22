import React, { useState } from 'react';
import { Atom, Sparkles, CheckCircle2 } from 'lucide-react';

interface MoleculePreset {
  id: string;
  name: string;
  formula: string;
  bondType: string;
  description: string;
  atoms: { symbol: string; color: string; electrons: number; valency: number }[];
}

const PRESETS: MoleculePreset[] = [
  {
    id: 'h2o',
    name: 'Molekul Air (H\u2082O)',
    formula: 'H\u2082O',
    bondType: '2 Ikatan Kovalen Tunggal',
    description: '1 atom Oksigen berbagi elektron dengan 2 atom Hidrogen. Oksigen mencapai oktet (8) dan Hidrogen mencapai duplet (2).',
    atoms: [
      { symbol: 'O', color: '#ef4444', electrons: 8, valency: 6 },
      { symbol: 'H', color: '#38bdf8', electrons: 1, valency: 1 },
      { symbol: 'H', color: '#38bdf8', electrons: 1, valency: 1 },
    ]
  },
  {
    id: 'o2',
    name: 'Molekul Gas Oksigen (O\u2082)',
    formula: 'O\u2082',
    bondType: 'Ikatan Kovalen Rangkap Dua (O = O)',
    description: 'Dua atom Oksigen masing-masing menyumbangkan 2 elektron valensi untuk dipakai bersama sehingga keduanya stabil dengan 8 elektron.',
    atoms: [
      { symbol: 'O', color: '#ef4444', electrons: 8, valency: 6 },
      { symbol: 'O', color: '#ef4444', electrons: 8, valency: 6 },
    ]
  },
  {
    id: 'ch4',
    name: 'Metana (CH\u2084)',
    formula: 'CH\u2084',
    bondType: '4 Ikatan Kovalen Tunggal',
    description: 'Atom Karbon pusat dengan 4 elektron valensi berikatan kovalen dengan 4 atom Hidrogen membentuk geometri tetrahedral stabil.',
    atoms: [
      { symbol: 'C', color: '#10b981', electrons: 6, valency: 4 },
      { symbol: 'H', color: '#38bdf8', electrons: 1, valency: 1 },
      { symbol: 'H', color: '#38bdf8', electrons: 1, valency: 1 },
      { symbol: 'H', color: '#38bdf8', electrons: 1, valency: 1 },
      { symbol: 'H', color: '#38bdf8', electrons: 1, valency: 1 },
    ]
  }
];

export const BohrSimulation: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<MoleculePreset>(PRESETS[0]);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse"></span>
          <span className="font-semibold text-violet-400">Bohr Atom & Covalent Bond Engine</span>
          <span className="text-slate-400 hidden sm:inline">| Visualisasi Kulit K & L</span>
        </div>
        <div className="flex items-center gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPreset(p)}
              className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                selectedPreset.id === p.id
                  ? 'bg-violet-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {p.formula}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-6 gap-6 overflow-y-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center shadow-xl w-full max-w-md min-h-[300px]">
          <svg width="340" height="280" viewBox="0 0 340 280">
            {/* Draw Bohr shells representation for the preset */}
            {selectedPreset.id === 'h2o' && (
              <g transform="translate(170, 140)">
                {/* Central Oxygen atom */}
                <circle cx="0" cy="0" r="45" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" />
                <circle cx="0" cy="0" r="75" fill="none" stroke="#ef4444" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="24" fill="#ef4444" />
                <text x="0" y="6" fill="#ffffff" fontWeight="bold" fontSize="16" textAnchor="middle">O</text>

                {/* Left Hydrogen */}
                <g transform="translate(-75, 10)">
                  <circle cx="0" cy="0" r="30" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                  <circle cx="0" cy="0" r="16" fill="#38bdf8" />
                  <text x="0" y="5" fill="#ffffff" fontWeight="bold" fontSize="13" textAnchor="middle">H</text>
                  <circle cx="15" cy="-5" r="4" fill="#fef08a" />
                </g>

                {/* Right Hydrogen */}
                <g transform="translate(75, 10)">
                  <circle cx="0" cy="0" r="30" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                  <circle cx="0" cy="0" r="16" fill="#38bdf8" />
                  <text x="0" y="5" fill="#ffffff" fontWeight="bold" fontSize="13" textAnchor="middle">H</text>
                  <circle cx="-15" cy="-5" r="4" fill="#fef08a" />
                </g>

                {/* Shared pairs indicator glow */}
                <circle cx="-38" cy="5" r="7" fill="rgba(254, 240, 138, 0.4)" />
                <circle cx="38" cy="5" r="7" fill="rgba(254, 240, 138, 0.4)" />
              </g>
            )}

            {selectedPreset.id === 'o2' && (
              <g transform="translate(170, 140)">
                <circle cx="-50" cy="0" r="60" fill="none" stroke="#ef4444" strokeWidth="1.5" />
                <circle cx="-50" cy="0" r="26" fill="#ef4444" />
                <text x="-50" y="6" fill="#ffffff" fontWeight="bold" fontSize="16" textAnchor="middle">O</text>

                <circle cx="50" cy="0" r="60" fill="none" stroke="#ef4444" strokeWidth="1.5" />
                <circle cx="50" cy="0" r="26" fill="#ef4444" />
                <text x="50" y="6" fill="#ffffff" fontWeight="bold" fontSize="16" textAnchor="middle">O</text>

                {/* Overlap 4 electrons for double covalent bond */}
                <circle cx="0" cy="-20" r="4.5" fill="#fef08a" />
                <circle cx="0" cy="-7" r="4.5" fill="#fef08a" />
                <circle cx="0" cy="7" r="4.5" fill="#fef08a" />
                <circle cx="0" cy="20" r="4.5" fill="#fef08a" />
              </g>
            )}

            {selectedPreset.id === 'ch4' && (
              <g transform="translate(170, 140)">
                <circle cx="0" cy="0" r="65" fill="none" stroke="#10b981" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="26" fill="#10b981" />
                <text x="0" y="6" fill="#ffffff" fontWeight="bold" fontSize="16" textAnchor="middle">C</text>

                {/* 4 Hydrogens in 4 directions */}
                <circle cx="0" cy="-75" r="16" fill="#38bdf8" />
                <text x="0" y="-70" fill="#ffffff" fontWeight="bold" fontSize="12" textAnchor="middle">H</text>

                <circle cx="75" cy="0" r="16" fill="#38bdf8" />
                <text x="75" y="5" fill="#ffffff" fontWeight="bold" fontSize="12" textAnchor="middle">H</text>

                <circle cx="0" cy="75" r="16" fill="#38bdf8" />
                <text x="0" y="80" fill="#ffffff" fontWeight="bold" fontSize="12" textAnchor="middle">H</text>

                <circle cx="-75" cy="0" r="16" fill="#38bdf8" />
                <text x="-75" y="5" fill="#ffffff" fontWeight="bold" fontSize="12" textAnchor="middle">H</text>
              </g>
            )}
          </svg>
          <div className="text-[11px] text-amber-400 font-mono flex items-center gap-1.5 mt-2">
            <Sparkles className="w-3.5 h-3.5" />
            Titik Kuning = Pasangan Elektron Ikatan (PEI)
          </div>
        </div>

        <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <span className="text-xs text-violet-400 font-mono font-bold uppercase">{selectedPreset.formula}</span>
            <h3 className="text-lg font-bold text-white mt-0.5">{selectedPreset.name}</h3>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-violet-950 text-violet-300 border border-violet-800">
              {selectedPreset.bondType}
            </span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
            {selectedPreset.description}
          </p>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Memenuhi Kaidah Oktet / Duplet Gas Mulia</span>
            </div>
            <div className="flex items-center gap-2 text-sky-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Kestabilan Ikatan Kovalen Non-Logam</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
