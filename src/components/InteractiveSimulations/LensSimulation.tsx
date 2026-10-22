import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Eye, ZoomIn, Info, Play, Pause } from 'lucide-react';

export const LensSimulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [focalLength, setFocalLength] = useState<number>(100); // pixels
  const [objectDistance, setObjectDistance] = useState<number>(200); // pixels
  const [objectHeight, setObjectHeight] = useState<number>(60); // pixels
  const [showRays, setShowRays] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // Physics calculation
  // 1/f = 1/s + 1/s' => 1/s' = 1/f - 1/s => s' = (f * s) / (s - f)
  const isVirtual = objectDistance <= focalLength;
  let imageDistance = 0;
  let magnification = 0;
  let imageHeight = 0;

  if (objectDistance === focalLength) {
    imageDistance = Infinity;
    magnification = Infinity;
    imageHeight = Infinity;
  } else {
    imageDistance = (focalLength * objectDistance) / (objectDistance - focalLength);
    magnification = Math.abs(imageDistance / objectDistance);
    imageHeight = objectHeight * (imageDistance / objectDistance);
  }

  // Animation oscillation for interactive feel
  useEffect(() => {
    let animId: number;
    let t = 0;
    if (isAnimating) {
      const loop = () => {
        t += 0.03;
        setObjectDistance(180 + Math.sin(t) * 70);
        animId = requestAnimationFrame(loop);
      };
      animId = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(animId);
  }, [isAnimating]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const originX = width / 2;
    const originY = height / 2;

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Optional grid
    if (showGrid) {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const step = 20;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // Principal Axis (Sumbu Utama)
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.stroke();

    // Lens Center (Lensa Cembung di tengah)
    // Draw lens shape (biconvex)
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    // left curve
    ctx.arc(originX - 160, originY, 180, -Math.PI / 6, Math.PI / 6);
    // right curve
    ctx.arc(originX + 160, originY, 180, (5 * Math.PI) / 6, (7 * Math.PI) / 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Optical Center Label 'O'
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText('O (0,0)', originX - 18, originY + 22);

    // Focal Points and 2F points
    const drawFocalPoint = (x: number, label: string) => {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(x, originY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(label, x - 8, originY + 20);
    };

    // Front (Left) F1 and 2F1
    drawFocalPoint(originX - focalLength, 'F1');
    drawFocalPoint(originX - 2 * focalLength, '2F1');

    // Behind (Right) F2 and 2F2
    drawFocalPoint(originX + focalLength, 'F2');
    drawFocalPoint(originX + 2 * focalLength, '2F2');

    // Coordinates of Object
    const objX = originX - objectDistance;
    const objTopY = originY - objectHeight;

    // Draw Object (Lilin / Panah)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(objX, originY);
    ctx.lineTo(objX, objTopY);
    ctx.stroke();

    // Arrowhead / Candle Flame
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(objX - 6, objTopY);
    ctx.lineTo(objX + 6, objTopY);
    ctx.lineTo(objX, objTopY - 14);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('Benda (s)', objX - 25, objTopY - 20);

    // Draw Light Rays
    if (showRays && objectDistance !== focalLength) {
      // Ray 1: Parallel to axis, refracts through F2 (Red)
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(objX, objTopY);
      ctx.lineTo(originX, objTopY);
      // from lens through F2 and forward
      const slope1 = (originY - objTopY) / focalLength;
      const ray1EndX = width;
      const ray1EndY = objTopY + slope1 * (ray1EndX - originX);
      ctx.lineTo(ray1EndX, ray1EndY);
      ctx.stroke();

      // If virtual, draw backward extension
      if (isVirtual) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(originX, objTopY);
        ctx.lineTo(originX - imageDistance, originY - imageHeight);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Ray 2: Through optical center O straight without refraction (Green)
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(objX, objTopY);
      const slope2 = (originY - objTopY) / (originX - objX);
      const ray2EndX = width;
      const ray2EndY = originY + slope2 * (ray2EndX - originX);
      ctx.lineTo(originX, originY);
      ctx.lineTo(ray2EndX, ray2EndY);
      ctx.stroke();

      if (isVirtual) {
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(originX - imageDistance, originY - imageHeight);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Ray 3: Through F1, refracts parallel to principal axis (Blue)
      // Only when object is not exactly at F1
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(objX, objTopY);

      if (!isVirtual) {
        const slope3 = (originY - objTopY) / (originX - focalLength - objX);
        const lensIntersectY = objTopY + slope3 * (originX - objX);
        ctx.lineTo(originX, lensIntersectY);
        ctx.lineTo(width, lensIntersectY);
        ctx.stroke();
      }
    }

    // Draw Image (Bayangan)
    if (objectDistance !== focalLength && Math.abs(imageDistance) < width * 2) {
      const imgX = originX + imageDistance;
      const imgTopY = originY + imageHeight;

      ctx.strokeStyle = isVirtual ? '#a855f7' : '#ec4899';
      ctx.lineWidth = 3;
      if (isVirtual) {
        ctx.setLineDash([6, 4]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.beginPath();
      ctx.moveTo(imgX, originY);
      ctx.lineTo(imgX, imgTopY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Image arrow head
      ctx.fillStyle = isVirtual ? '#d8b4fe' : '#f472b6';
      ctx.beginPath();
      const arrowDir = imageHeight > 0 ? 1 : -1;
      ctx.moveTo(imgX - 5, imgTopY);
      ctx.lineTo(imgX + 5, imgTopY);
      ctx.lineTo(imgX, imgTopY + 10 * arrowDir);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = isVirtual ? '#c084fc' : '#f472b6';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(
        isVirtual ? "Bayangan Maya (s')" : "Bayangan Nyata (s')",
        imgX - 40,
        imgTopY + (imageHeight > 0 ? 25 : -15)
      );
    }
  }, [focalLength, objectDistance, objectHeight, showRays, showGrid]);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* Top Banner simulation title & status */}
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-emerald-400">Optics Ray-Tracer Flash Engine v2.4</span>
          <span className="text-slate-400 hidden sm:inline">| Lensa Cembung Konvergen</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAnimating(!isAnimating)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition ${
              isAnimating ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            {isAnimating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isAnimating ? 'Jeda Gerak' : 'Animasi Gerak'}
          </button>
          <button
            onClick={() => {
              setFocalLength(100);
              setObjectDistance(200);
              setObjectHeight(60);
              setIsAnimating(false);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
            title="Reset ke Posisi Awal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Main Simulation Canvas */}
      <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden min-h-[300px]">
        <canvas
          ref={canvasRef}
          width={760}
          height={400}
          className="w-full h-full max-h-[460px] object-contain cursor-crosshair"
        />

        {/* Legend overlays */}
        <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur border border-slate-800 p-2.5 rounded-lg text-xs space-y-1 shadow-lg pointer-events-none">
          <div className="font-semibold text-slate-300 mb-1">Jalur Sinar Istimewa:</div>
          <div className="flex items-center gap-2 text-rose-400">
            <span className="w-3 h-0.5 bg-rose-500 inline-block"></span>
            <span>Sinar 1: Sejajar sumbu utama &rarr; Fokus F2</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="w-3 h-0.5 bg-emerald-500 inline-block"></span>
            <span>Sinar 2: Menembus Pusat O tanpa belok</span>
          </div>
          <div className="flex items-center gap-2 text-sky-400">
            <span className="w-3 h-0.5 bg-sky-500 inline-block"></span>
            <span>Sinar 3: Lewat Fokus F1 &rarr; Sejajar sumbu</span>
          </div>
        </div>

        {/* Real-time Calculation Card */}
        <div className="absolute top-3 right-3 bg-slate-900/95 backdrop-blur border border-slate-700 p-3 rounded-lg text-xs space-y-1.5 shadow-xl w-60">
          <div className="font-bold text-amber-400 flex items-center gap-1 border-b border-slate-800 pb-1">
            <Info className="w-3.5 h-3.5" />
            Hasil Perhitungan Gauss
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Jarak Benda (s):</span>
            <span className="font-mono font-bold text-emerald-400">{Math.round(objectDistance)} cm</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Jarak Fokus (f):</span>
            <span className="font-mono font-bold text-amber-400">{Math.round(focalLength)} cm</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Jarak Bayangan (s'):</span>
            <span className="font-mono font-bold text-sky-400">
              {objectDistance === focalLength ? '&infin; Tak Hingga' : `${Math.round(imageDistance)} cm`}
            </span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Perbesaran (M):</span>
            <span className="font-mono font-bold text-fuchsia-400">
              {objectDistance === focalLength ? '&infin;' : `${magnification.toFixed(2)}x`}
            </span>
          </div>
          <div className="pt-1.5 border-t border-slate-800 text-[11px] font-medium text-slate-400">
            Sifat Bayangan:{' '}
            <span className="font-bold text-white">
              {objectDistance === focalLength
                ? 'Tidak terbentuk (sinar sejajar)'
                : isVirtual
                ? 'Maya, Tegak, Diperbesar'
                : `Nyata, Terbalik, ${magnification > 1 ? 'Diperbesar' : magnification < 1 ? 'Diperkecil' : 'Sama Besar'}`}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="bg-slate-900 border-t border-slate-800 p-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Slider 1: Object Distance */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <label className="text-slate-300 font-medium">Jarak Benda (s):</label>
            <span className="font-mono text-emerald-400 font-bold">{Math.round(objectDistance)} cm</span>
          </div>
          <input
            type="range"
            min={40}
            max={340}
            value={objectDistance}
            onChange={(e) => {
              setObjectDistance(Number(e.target.value));
              setIsAnimating(false);
            }}
            className="w-full accent-emerald-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Dekat (40cm)</span>
            <span>2F ({2 * focalLength}cm)</span>
            <span>Jauh (340cm)</span>
          </div>
        </div>

        {/* Slider 2: Focal Length */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <label className="text-slate-300 font-medium">Jarak Fokus Lensa (f):</label>
            <span className="font-mono text-amber-400 font-bold">{Math.round(focalLength)} cm</span>
          </div>
          <input
            type="range"
            min={60}
            max={180}
            value={focalLength}
            onChange={(e) => setFocalLength(Number(e.target.value))}
            className="w-full accent-amber-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Lensa Tebal (60cm)</span>
            <span>Lensa Tipis (180cm)</span>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex items-center justify-around bg-slate-950/60 rounded-lg p-2 border border-slate-800">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={showRays}
              onChange={(e) => setShowRays(e.target.checked)}
              className="rounded accent-emerald-500"
            />
            <span>Sinar Cahaya</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="rounded accent-emerald-500"
            />
            <span>Kisi Kotak</span>
          </label>
        </div>
      </div>
    </div>
  );
};
