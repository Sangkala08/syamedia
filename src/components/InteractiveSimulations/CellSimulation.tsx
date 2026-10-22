import React, { useState } from 'react';
import { Microscope, Info, Check, Sparkles } from 'lucide-react';

interface OrganelleInfo {
  id: string;
  name: string;
  inPlant: boolean;
  inAnimal: boolean;
  color: string;
  cx: number;
  cy: number;
  r: number;
  functionDesc: string;
  keyFact: string;
}

const ORGANELLES: OrganelleInfo[] = [
  {
    id: 'nucleus',
    name: 'Nukleus (Inti Sel)',
    inPlant: true,
    inAnimal: true,
    color: '#8b5cf6',
    cx: 260,
    cy: 180,
    r: 38,
    functionDesc: 'Menyimpan materi genetik DNA dan mengendalikan seluruh aktivitas metabolisme serta pembelahan sel.',
    keyFact: 'Dikelilingi oleh membran ganda berpori (selubung inti).'
  },
  {
    id: 'mitochondria',
    name: 'Mitokondria',
    inPlant: true,
    inAnimal: true,
    color: '#ef4444',
    cx: 160,
    cy: 130,
    r: 22,
    functionDesc: 'Pembangkit energi utama sel (Powerhouse of the Cell) yang menghasilkan molekul adenosin trifosfat (ATP) melalui respirasi aerob.',
    keyFact: 'Memiliki membran dalam berlekuk-lekuk yang disebut Krista.'
  },
  {
    id: 'chloroplast',
    name: 'Kloroplas',
    inPlant: true,
    inAnimal: false,
    color: '#22c55e',
    cx: 370,
    cy: 130,
    r: 26,
    functionDesc: 'Tempat berlangsungnya fotosintesis yang mengubah energi foton matahari, air, dan CO2 menjadi glukosa serta oksigen.',
    keyFact: 'HANYA ada pada sel tumbuhan dan alga, mengandung pigmen klorofil hijau.'
  },
  {
    id: 'vacuole',
    name: 'Vakuola Sentral',
    inPlant: true,
    inAnimal: true,
    color: '#06b6d4',
    cx: 340,
    cy: 240,
    r: 44,
    functionDesc: 'Menyimpan cadangan air, nutrisi, senyawa metabolit sekunder, serta mempertahankan tekanan turgor sel.',
    keyFact: 'Sangat besar pada sel tumbuhan dewasa, berukuran kecil pada sel hewan.'
  },
  {
    id: 'golgi',
    name: 'Badan Golgi',
    inPlant: true,
    inAnimal: true,
    color: '#f59e0b',
    cx: 170,
    cy: 240,
    r: 24,
    functionDesc: 'Memodifikasi, menyortir, dan membungkus glikoprotein serta lipid ke dalam vesikel sekresi.',
    keyFact: 'Terdiri dari kantung-kantung pipih bermembran yang bertumpuk (sisterna).'
  },
  {
    id: 'cellwall',
    name: 'Dinding Sel (Selulosa)',
    inPlant: true,
    inAnimal: false,
    color: '#10b981',
    cx: 260,
    cy: 60,
    r: 16,
    functionDesc: 'Lapisan kaku pelindung luar yang memberi bentuk tetap pada sel dan mencegah sel pecah akibat tekanan osmosis.',
    keyFact: 'Tersusun dari serat polisakarida selulosa, pektin, dan hemiselulosa.'
  }
];

export const CellSimulation: React.FC = () => {
  const [cellType, setCellType] = useState<'plant' | 'animal'>('plant');
  const [selectedOrganelle, setSelectedOrganelle] = useState<OrganelleInfo>(ORGANELLES[0]);

  const activeOrganelles = ORGANELLES.filter(org => cellType === 'plant' ? org.inPlant : org.inAnimal);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* Top Banner */}
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-emerald-400">BioCell Explorer Flash Player v3.1</span>
          <span className="text-slate-400 hidden sm:inline">| Anatomi & Organel Sel Eukariotik</span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => {
              setCellType('plant');
              setSelectedOrganelle(ORGANELLES[0]);
            }}
            className={`px-3 py-1 rounded-md text-xs font-bold transition ${
              cellType === 'plant' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sel Tumbuhan
          </button>
          <button
            onClick={() => {
              setCellType('animal');
              setSelectedOrganelle(ORGANELLES[0]);
            }}
            className={`px-3 py-1 rounded-md text-xs font-bold transition ${
              cellType === 'animal' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sel Hewan
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-4 gap-4 overflow-y-auto">
        {/* Interactive Vector Cell SVG */}
        <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center shadow-xl w-full max-w-md">
          <div className="text-xs text-slate-400 mb-2 flex items-center gap-1.5 self-start">
            <Microscope className="w-4 h-4 text-emerald-400" />
            <span>Klik salah satu organel untuk mengamati fungsi:</span>
          </div>

          <svg width="340" height="340" viewBox="0 0 520 360" className="drop-shadow-2xl">
            {/* Outer Cell Boundary */}
            {cellType === 'plant' ? (
              // Plant Cell: Hexagonal / rigid rounded rectangular with thick wall
              <g>
                {/* Thick green cell wall */}
                <rect x="50" y="30" width="420" height="300" rx="45" fill="#064e3b" stroke="#10b981" strokeWidth="12" />
                {/* Plasma membrane */}
                <rect x="60" y="40" width="400" height="280" rx="38" fill="#022c22" stroke="#34d399" strokeWidth="3" />
              </g>
            ) : (
              // Animal Cell: Irregular soft ellipse
              <g>
                <ellipse cx="260" cy="180" rx="200" ry="140" fill="#0f172a" stroke="#38bdf8" strokeWidth="6" />
                <ellipse cx="260" cy="180" rx="192" ry="132" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" strokeDasharray="6 4" />
              </g>
            )}

            {/* Cytoplasm background texture */}
            <text x="75" y="65" fill="#475569" fontSize="12" fontWeight="bold">SITOPLASMA</text>

            {/* Organelles */}
            {activeOrganelles.map((org) => {
              const isSelected = selectedOrganelle.id === org.id;
              return (
                <g
                  key={org.id}
                  onClick={() => setSelectedOrganelle(org)}
                  className="cursor-pointer group"
                >
                  {/* Highlight ring if selected */}
                  {isSelected && (
                    <circle
                      cx={org.cx}
                      cy={org.cy}
                      r={org.r + 7}
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="3"
                      className="animate-pulse"
                    />
                  )}
                  {/* Organelle body */}
                  <circle
                    cx={org.cx}
                    cy={org.cy}
                    r={org.r}
                    fill={org.color}
                    opacity={isSelected ? '1' : '0.85'}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                    className="transition-all duration-200 group-hover:scale-105"
                  />
                  {/* Label */}
                  <text
                    x={org.cx}
                    y={org.cy + 4}
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                    pointerEvents="none"
                  >
                    {org.name.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="mt-2 text-[11px] text-slate-500 text-center">
            Tip: Sel {cellType === 'plant' ? 'Tumbuhan memiliki dinding sel kaku dan kloroplas' : 'Hewan fleksibel tanpa dinding sel'}.
          </div>
        </div>

        {/* Organelle Detail Card */}
        <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: selectedOrganelle.color }}
                ></span>
                <h4 className="font-bold text-slate-100 text-base">{selectedOrganelle.name}</h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300">
                Organel Eukariotik
              </span>
            </div>

            <div className="my-4 space-y-3">
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                  Fungsi Utama Selular:
                </span>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {selectedOrganelle.functionDesc}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-1">
                  Fakta Ilmiah Penting:
                </span>
                <div className="flex items-start gap-2 text-xs text-slate-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{selectedOrganelle.keyFact}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              {selectedOrganelle.inPlant ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span className="text-rose-400">&times;</span>}
              Ada di Tumbuhan
            </span>
            <span className="flex items-center gap-1">
              {selectedOrganelle.inAnimal ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span className="text-rose-400">&times;</span>}
              Ada di Hewan
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
