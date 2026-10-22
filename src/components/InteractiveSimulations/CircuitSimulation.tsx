import React, { useState, useEffect, useRef } from 'react';
import { Zap, Power, Volume2, VolumeX, RotateCcw, AlertTriangle } from 'lucide-react';

export const CircuitSimulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [voltage, setVoltage] = useState<number>(12); // Volts
  const [resistance, setResistance] = useState<number>(6); // Ohms
  const [isSwitchOn, setIsSwitchOn] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Ohm's law
  const current = isSwitchOn ? voltage / resistance : 0; // Amperes
  const power = isSwitchOn ? voltage * current : 0; // Watts
  const bulbMaxWatts = 60;
  const isOverloaded = power > 75;

  // Sound generator
  const playClickSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isSwitchOn ? 350 : 220, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch {
      // AudioContext could be blocked until user gesture
    }
  };

  const toggleSwitch = () => {
    playClickSound();
    setIsSwitchOn(!isSwitchOn);
  };

  // Canvas animation for circuit and flowing electrons
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let electronOffset = 0;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      // Circuit dimensions
      const padX = 90;
      const padY = 70;
      const cLeft = padX;
      const cRight = w - padX;
      const cTop = padY;
      const cBottom = h - padY;

      // Draw Wires (Copper lines)
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 6;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      // Top wire (battery to switch to resistor)
      ctx.moveTo(cLeft, cTop);
      ctx.lineTo(cRight, cTop);
      // Right wire (resistor to bulb)
      ctx.lineTo(cRight, cBottom);
      // Bottom wire (bulb to battery)
      ctx.lineTo(cLeft, cBottom);
      // Left wire
      ctx.lineTo(cLeft, cTop);
      ctx.stroke();

      // Inner wire core
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Electron Flow Animation
      if (isSwitchOn && current > 0) {
        // Speed proportional to current
        const speed = Math.min(Math.max(current * 0.8, 0.4), 6);
        electronOffset = (electronOffset + speed) % 40;

        const perimeter = 2 * (cRight - cLeft) + 2 * (cBottom - cTop);
        const numElectrons = 30;

        ctx.fillStyle = '#38bdf8';
        for (let i = 0; i < numElectrons; i++) {
          const dist = ((i * (perimeter / numElectrons) + electronOffset) % perimeter + perimeter) % perimeter;
          let ex = cLeft;
          let ey = cTop;

          const topLen = cRight - cLeft;
          const rightLen = cBottom - cTop;
          const botLen = cRight - cLeft;

          if (dist < topLen) {
            // Moving Right along top wire
            ex = cLeft + dist;
            ey = cTop;
          } else if (dist < topLen + rightLen) {
            // Moving Down along right wire
            ex = cRight;
            ey = cTop + (dist - topLen);
          } else if (dist < topLen + rightLen + botLen) {
            // Moving Left along bottom wire
            ex = cRight - (dist - topLen - rightLen);
            ey = cBottom;
          } else {
            // Moving Up along left wire
            ex = cLeft;
            ey = cBottom - (dist - topLen - rightLen - botLen);
          }

          // Draw electron bead
          ctx.beginPath();
          ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Battery (on left wire)
      const batY = (cTop + cBottom) / 2;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cLeft - 18, batY - 35, 36, 70);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.strokeRect(cLeft - 18, batY - 35, 36, 70);

      // Positive terminal (Red)
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(cLeft - 10, batY - 35, 20, 10);
      // Battery label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`${voltage}V`, cLeft - 12, batY + 4);
      ctx.fillStyle = '#ef4444';
      ctx.fillText('+', cLeft - 4, batY - 40);
      ctx.fillStyle = '#3b82f6';
      ctx.fillText('-', cLeft - 2, batY + 48);

      // Draw Switch (on top wire)
      const switchX = (cLeft + cRight) / 2 - 80;
      ctx.fillStyle = '#090d16';
      ctx.fillRect(switchX - 25, cTop - 12, 50, 24); // clear wire segment

      // Switch contacts
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(switchX - 20, cTop, 5, 0, Math.PI * 2);
      ctx.arc(switchX + 20, cTop, 5, 0, Math.PI * 2);
      ctx.fill();

      // Switch blade
      ctx.strokeStyle = isSwitchOn ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(switchX - 20, cTop);
      if (isSwitchOn) {
        ctx.lineTo(switchX + 20, cTop);
      } else {
        ctx.lineTo(switchX + 15, cTop - 25);
      }
      ctx.stroke();

      ctx.fillStyle = isSwitchOn ? '#4ade80' : '#f87171';
      ctx.font = '10px sans-serif';
      ctx.fillText(isSwitchOn ? 'SAKLAR [ON]' : 'SAKLAR [OFF]', switchX - 28, cTop - 28);

      // Draw Resistor (on top right wire)
      const resX = (cLeft + cRight) / 2 + 80;
      ctx.fillStyle = '#090d16';
      ctx.fillRect(resX - 28, cTop - 14, 56, 28);

      // Zigzag resistor
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(resX - 28, cTop);
      ctx.lineTo(resX - 20, cTop - 10);
      ctx.lineTo(resX - 10, cTop + 10);
      ctx.lineTo(resX, cTop - 10);
      ctx.lineTo(resX + 10, cTop + 10);
      ctx.lineTo(resX + 20, cTop - 10);
      ctx.lineTo(resX + 28, cTop);
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`${resistance} \u03A9`, resX - 12, cTop + 24);

      // Draw Light Bulb (on bottom wire)
      const bulbX = (cLeft + cRight) / 2;
      const bulbY = cBottom;
      const brightnessNorm = Math.min(power / bulbMaxWatts, 1.5);

      // Bulb socket
      ctx.fillStyle = '#64748b';
      ctx.fillRect(bulbX - 14, bulbY - 6, 28, 14);

      // Glow Halo
      if (isSwitchOn && current > 0) {
        const glowRadius = 25 + brightnessNorm * 45;
        const grad = ctx.createRadialGradient(bulbX, bulbY - 25, 5, bulbX, bulbY - 25, glowRadius);
        grad.addColorStop(0, `rgba(253, 224, 71, ${0.4 + brightnessNorm * 0.5})`);
        grad.addColorStop(0.5, `rgba(245, 158, 11, ${0.15 + brightnessNorm * 0.3})`);
        grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(bulbX, bulbY - 25, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bulb Glass
      ctx.fillStyle = isSwitchOn && current > 0
        ? `rgba(254, 240, 138, ${0.3 + brightnessNorm * 0.6})`
        : 'rgba(148, 163, 184, 0.15)';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bulbX, bulbY - 25, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Filament
      ctx.strokeStyle = isSwitchOn && current > 0 ? '#fef08a' : '#475569';
      ctx.lineWidth = isSwitchOn && current > 0 ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(bulbX - 8, bulbY - 12);
      ctx.lineTo(bulbX - 4, bulbY - 28);
      ctx.lineTo(bulbX + 4, bulbY - 28);
      ctx.lineTo(bulbX + 8, bulbY - 12);
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '11px sans-serif';
      ctx.fillText(`Lampu Pijar (${Math.round(power)}W)`, bulbX - 44, bulbY + 26);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [voltage, resistance, isSwitchOn, current, power]);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* Top Banner */}
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
          <span className="font-semibold text-amber-400">DC Circuit Virtual Lab (Flash Engine)</span>
          <span className="text-slate-400 hidden sm:inline">| Hukum Ohm V = I &times; R</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded transition ${
              soundEnabled ? 'text-amber-400 bg-slate-800' : 'text-slate-500 bg-slate-800/50'
            }`}
            title="Efek Suara Audio Saklar"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={() => {
              setVoltage(12);
              setResistance(6);
              setIsSwitchOn(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative flex-1 bg-slate-950 flex items-center justify-center min-h-[300px]">
        <canvas
          ref={canvasRef}
          width={760}
          height={380}
          className="w-full h-full max-h-[440px] object-contain"
        />

        {/* Digital Multimeter Dashboard */}
        <div className="absolute top-3 right-3 bg-slate-900/95 backdrop-blur border border-slate-700 p-3.5 rounded-xl text-xs space-y-2 shadow-2xl w-64">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              Multimeter Digital
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              isSwitchOn ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {isSwitchOn ? 'LOOP AKTIF' : 'TERPUTUS'}
            </span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-lg space-y-1.5 border border-slate-800">
            <div className="flex justify-between items-center text-slate-300">
              <span>Beda Potensial (V):</span>
              <span className="font-mono font-bold text-amber-400 text-sm">
                {isSwitchOn ? voltage.toFixed(1) : '0.0'} V
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Hambatan Total (R):</span>
              <span className="font-mono font-bold text-amber-300 text-sm">{resistance.toFixed(1)} &Omega;</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Kuat Arus (I):</span>
              <span className="font-mono font-bold text-sky-400 text-sm">
                {current.toFixed(2)} A
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-300 border-t border-slate-800 pt-1">
              <span>Daya Lampu (P):</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {power.toFixed(1)} W
              </span>
            </div>
          </div>

          {isOverloaded && (
            <div className="flex items-center gap-1.5 text-rose-400 text-[11px] bg-rose-950/60 p-1.5 rounded border border-rose-900">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Peringatan: Beban daya tinggi!</span>
            </div>
          )}
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-slate-900 border-t border-slate-800 p-3 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        {/* Switch Button */}
        <div>
          <button
            onClick={toggleSwitch}
            className={`w-full py-2.5 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition ${
              isSwitchOn
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950'
            }`}
          >
            <Power className="w-4 h-4" />
            {isSwitchOn ? 'Matikan Saklar (OFF)' : 'Hidupkan Saklar (ON)'}
          </button>
        </div>

        {/* Voltage Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300">Tegangan Baterai (V):</span>
            <span className="font-mono text-amber-400 font-bold">{voltage} V</span>
          </div>
          <input
            type="range"
            min={1.5}
            max={24}
            step={0.5}
            value={voltage}
            onChange={(e) => setVoltage(Number(e.target.value))}
            className="w-full accent-amber-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>1.5V (AA)</span>
            <span>9V (Kotak)</span>
            <span>24V (Aki)</span>
          </div>
        </div>

        {/* Resistance Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300">Hambatan Resistor (R):</span>
            <span className="font-mono text-amber-300 font-bold">{resistance} &Omega;</span>
          </div>
          <input
            type="range"
            min={2}
            max={40}
            step={1}
            value={resistance}
            onChange={(e) => setResistance(Number(e.target.value))}
            className="w-full accent-amber-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>2 &Omega; (Rendah)</span>
            <span>40 &Omega; (Tinggi)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
