import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Compass } from 'lucide-react';

export const OrbitSimulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [eccentricity, setEccentricity] = useState<number>(0.5); // 0 = circle, 0.7 = ellipse
  const [showKeplerSectors, setShowKeplerSectors] = useState<boolean>(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.fillStyle = '#05070e';
      ctx.fillRect(0, 0, w, h);

      // Starfield background
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 40; i++) {
        const sx = ((i * 97) % w);
        const sy = ((i * 131) % h);
        ctx.fillRect(sx, sy, 1, 1);
      }

      // Ellipse parameters
      const a = 180; // semi-major axis
      const e = eccentricity;
      const b = a * Math.sqrt(1 - e * e); // semi-minor axis
      const c = a * e; // focus distance from center

      // Sun at right focus (cx + c, cy)
      const sunX = cx + c;
      const sunY = cy;

      // Draw Elliptical Orbit Track
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, a, b, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Planet position on ellipse
      const px = cx + a * Math.cos(angle);
      const py = cy + b * Math.sin(angle);

      // Kepler's 2nd law sector visualization (swept area)
      if (showKeplerSectors) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sunX, sunY);
        const sectorWidth = 0.35;
        for (let sa = angle - sectorWidth; sa <= angle; sa += 0.05) {
          const sx = cx + a * Math.cos(sa);
          const sy = cy + b * Math.sin(sa);
          ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Radius vector line from Sun to Planet
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sunX, sunY);
      ctx.lineTo(px, py);
      ctx.stroke();

      // Draw Sun
      const sunRadius = 24;
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, sunRadius + 18);
      sunGlow.addColorStop(0, '#fef08a');
      sunGlow.addColorStop(0.3, '#f59e0b');
      sunGlow.addColorStop(0.8, 'rgba(239, 68, 68, 0.3)');
      sunGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRadius + 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('Matahari', sunX - 22, sunY + 3);

      // Draw Planet
      const planetRadius = 11;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(px, py, planetRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Perihelion / Aphelion markers
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px sans-serif';
      ctx.fillText('Perihelion (Cepat)', cx + a + 6, cy + 3);
      ctx.fillText('Aphelion (Lambat)', cx - a - 90, cy + 3);

      // Orbital speed physics (Kepler conservation of angular momentum r * v = const)
      const distToSun = Math.hypot(px - sunX, py - sunY);
      const baseDTheta = (0.015 * Math.pow(a / Math.max(distToSun, 30), 1.5)) * speedMultiplier;

      if (isPlaying) {
        angle = (angle + baseDTheta) % (Math.PI * 2);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [isPlaying, speedMultiplier, eccentricity, showKeplerSectors]);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse"></span>
          <span className="font-semibold text-sky-400">Kepler Celestial Mechanics Engine</span>
          <span className="text-slate-400 hidden sm:inline">| Hukum I & II Kepler</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition ${
              isPlaying ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-200'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'Jeda Orbit' : 'Lanjutkan Orbit'}
          </button>
          <button
            onClick={() => {
              setSpeedMultiplier(1);
              setEccentricity(0.5);
              setIsPlaying(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      <div className="relative flex-1 bg-slate-950 flex items-center justify-center min-h-[300px]">
        <canvas ref={canvasRef} width={760} height={380} className="w-full h-full max-h-[440px] object-contain" />
      </div>

      <div className="bg-slate-900 border-t border-slate-800 p-3 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300">Eksentrisitas Orbit (e):</span>
            <span className="font-mono text-sky-400 font-bold">{eccentricity.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={0.75}
            step={0.05}
            value={eccentricity}
            onChange={(e) => setEccentricity(Number(e.target.value))}
            className="w-full accent-sky-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Lingkaran (e=0)</span>
            <span>Elips Sangat Lonjong (e=0.75)</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300">Kecepatan Waktu:</span>
            <span className="font-mono text-amber-400 font-bold">{speedMultiplier.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={0.2}
            max={3.0}
            step={0.2}
            value={speedMultiplier}
            onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
            className="w-full accent-amber-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-center">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
            <input
              type="checkbox"
              checked={showKeplerSectors}
              onChange={(e) => setShowKeplerSectors(e.target.checked)}
              className="rounded accent-sky-500"
            />
            <span>Tampilkan Juring Luasan Kepler (Hukum II)</span>
          </label>
        </div>
      </div>
    </div>
  );
};
