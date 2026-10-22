import React, { useState } from 'react';
import { CheckCircle2, RotateCcw, PieChart, Sparkles } from 'lucide-react';

export const FractionSimulation: React.FC = () => {
  const [num1, setNum1] = useState<number>(1);
  const [den1, setDen1] = useState<number>(2);

  const [num2, setNum2] = useState<number>(2);
  const [den2, setDen2] = useState<number>(4);

  const [compareMode, setCompareMode] = useState<boolean>(true);

  // GCD
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

  const g1 = gcd(num1, den1);
  const simpleNum1 = num1 / g1;
  const simpleDen1 = den1 / g1;

  const val1 = num1 / den1;
  const val2 = num2 / den2;
  const isEquivalent = Math.abs(val1 - val2) < 0.0001;

  // Render SVG Pie
  const renderPieSvg = (numerator: number, denominator: number, color: string) => {
    const size = 160;
    const center = size / 2;
    const radius = 65;
    const slices = [];

    for (let i = 0; i < denominator; i++) {
      const startAngle = (i / denominator) * 2 * Math.PI - Math.PI / 2;
      const endAngle = ((i + 1) / denominator) * 2 * Math.PI - Math.PI / 2;

      const x1 = center + radius * Math.cos(startAngle);
      const y1 = center + radius * Math.sin(startAngle);
      const x2 = center + radius * Math.cos(endAngle);
      const y2 = center + radius * Math.sin(endAngle);

      const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
      const isFilled = i < numerator;

      const pathData = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      slices.push(
        <path
          key={i}
          d={pathData}
          fill={isFilled ? color : '#1e293b'}
          stroke="#0f172a"
          strokeWidth="2"
          className="transition-colors duration-200"
        />
      );
    }

    return (
      <svg width={size} height={size} className="mx-auto drop-shadow-md">
        <circle cx={center} cy={center} r={radius} fill="#1e293b" />
        {slices}
        <circle cx={center} cy={center} r={4} fill="#ffffff" />
      </svg>
    );
  };

  // Render Fraction Bar
  const renderBarSvg = (numerator: number, denominator: number, color: string) => {
    const blocks = [];
    for (let i = 0; i < denominator; i++) {
      const isFilled = i < numerator;
      blocks.push(
        <div
          key={i}
          style={{ width: `${100 / denominator}%`, backgroundColor: isFilled ? color : '#1e293b' }}
          className="h-7 border-r border-slate-900 first:rounded-l-md last:rounded-r-md last:border-r-0 transition-colors duration-200 flex items-center justify-center text-[10px] text-white/80 font-mono"
        >
          {isFilled ? '1' : ''}
        </div>
      );
    }
    return <div className="w-full flex rounded-md overflow-hidden border border-slate-700 bg-slate-800">{blocks}</div>;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* Top Banner */}
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></span>
          <span className="font-semibold text-sky-400">Interactive Fraction Engine v1.8 (Flash Port)</span>
          <span className="text-slate-400 hidden sm:inline">| Visualisasi Pecahan Senilai</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition ${
              compareMode ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {compareMode ? 'Mode Bandingkan: Aktif' : 'Mode Tunggal'}
          </button>
          <button
            onClick={() => {
              setNum1(1);
              setDen1(2);
              setNum2(2);
              setDen2(4);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* Fraction 1 Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center shadow-lg relative">
            <span className="absolute top-3 left-3 text-[11px] font-bold text-sky-400 uppercase tracking-wider">
              Pecahan A
            </span>

            {/* Display fraction number */}
            <div className="flex items-center gap-3 mb-2 mt-4">
              <div className="flex flex-col items-center font-mono text-2xl font-black text-sky-400">
                <span>{num1}</span>
                <span className="w-10 h-0.5 bg-sky-400 my-0.5"></span>
                <span>{den1}</span>
              </div>
              <div className="text-xs text-slate-400 pl-3 border-l border-slate-800">
                <div>Desimal: <span className="font-mono text-white font-bold">{val1.toFixed(3)}</span></div>
                <div>Persen: <span className="font-mono text-white font-bold">{(val1 * 100).toFixed(1)}%</span></div>
              </div>
            </div>

            {/* Visual Pie */}
            {renderPieSvg(num1, den1, '#0284c7')}

            {/* Visual Bar */}
            <div className="w-full mt-3 mb-4">{renderBarSvg(num1, den1, '#0284c7')}</div>

            {/* Sliders */}
            <div className="w-full space-y-2 pt-2 border-t border-slate-800 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Pembilang (Diarsir):</span>
                <span className="font-mono font-bold text-sky-400">{num1}</span>
              </div>
              <input
                type="range"
                min={1}
                max={den1}
                value={num1}
                onChange={(e) => setNum1(Number(e.target.value))}
                className="w-full accent-sky-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-slate-300 pt-1">
                <span>Penyebut (Total Bagian):</span>
                <span className="font-mono font-bold text-sky-400">{den1}</span>
              </div>
              <input
                type="range"
                min={1}
                max={12}
                value={den1}
                onChange={(e) => {
                  const newDen = Number(e.target.value);
                  setDen1(newDen);
                  if (num1 > newDen) setNum1(newDen);
                }}
                className="w-full accent-sky-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Fraction 2 Card (if compare mode) */}
          {compareMode && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center shadow-lg relative">
              <span className="absolute top-3 left-3 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                Pecahan B
              </span>

              {/* Display fraction number */}
              <div className="flex items-center gap-3 mb-2 mt-4">
                <div className="flex flex-col items-center font-mono text-2xl font-black text-amber-400">
                  <span>{num2}</span>
                  <span className="w-10 h-0.5 bg-amber-400 my-0.5"></span>
                  <span>{den2}</span>
                </div>
                <div className="text-xs text-slate-400 pl-3 border-l border-slate-800">
                  <div>Desimal: <span className="font-mono text-white font-bold">{val2.toFixed(3)}</span></div>
                  <div>Persen: <span className="font-mono text-white font-bold">{(val2 * 100).toFixed(1)}%</span></div>
                </div>
              </div>

              {/* Visual Pie */}
              {renderPieSvg(num2, den2, '#d97706')}

              {/* Visual Bar */}
              <div className="w-full mt-3 mb-4">{renderBarSvg(num2, den2, '#d97706')}</div>

              {/* Sliders */}
              <div className="w-full space-y-2 pt-2 border-t border-slate-800 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Pembilang (Diarsir):</span>
                  <span className="font-mono font-bold text-amber-400">{num2}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={den2}
                  value={num2}
                  onChange={(e) => setNum2(Number(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />

                <div className="flex justify-between text-slate-300 pt-1">
                  <span>Penyebut (Total Bagian):</span>
                  <span className="font-mono font-bold text-amber-400">{den2}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={12}
                  value={den2}
                  onChange={(e) => {
                    const newDen = Number(e.target.value);
                    setDen2(newDen);
                    if (num2 > newDen) setNum2(newDen);
                  }}
                  className="w-full accent-amber-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Comparison Result Banner */}
        {compareMode && (
          <div
            className={`w-full max-w-3xl p-3.5 rounded-xl border flex items-center justify-between text-sm transition-all ${
              isEquivalent
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isEquivalent ? (
                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <PieChart className="w-5 h-5 text-slate-400 shrink-0" />
              )}
              <div>
                <div className="font-bold">
                  {isEquivalent
                    ? `Hebat! Pecahan ${num1}/${den1} dan ${num2}/${den2} adalah PECAHAN SENILAI!`
                    : `Pecahan ${num1}/${den1} (${val1 > val2 ? '>' : '<'} ${num2}/${den2}) memiliki luas yang berbeda.`}
                </div>
                <div className="text-xs opacity-80">
                  {isEquivalent
                    ? `Keduanya menempati tepat ${(val1 * 100).toFixed(1)}% dari total luasan lingkaran.`
                    : `Bentuk sederhana Pecahan A: ${simpleNum1}/${simpleDen1}`}
                </div>
              </div>
            </div>

            <div className="font-mono font-bold text-base px-3 py-1 rounded bg-black/40">
              {isEquivalent ? '=' : val1 > val2 ? '>' : '<'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
