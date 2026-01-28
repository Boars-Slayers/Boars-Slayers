
import React, { useEffect, useRef } from 'react';
import { MapType, Civilization, BuildStep } from '../types';

interface Props {
  mapType: MapType;
  civ: Civilization;
  currentTime: number;
  totalWoodGatheredAtTime: number;
  steps: BuildStep[];
}

const MapVisualizer: React.FC<Props> = ({ mapType, civ, currentTime, totalWoodGatheredAtTime, steps }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // --- DRAW TERRAIN ---
    const isArena = mapType === MapType.ARENA;
    
    // Ground Base
    const gradient = ctx.createRadialGradient(w/2, h/2, 20, w/2, h/2, w/1.5);
    gradient.addColorStop(0, '#1c1917'); // Dark Stone center
    gradient.addColorStop(1, '#0c0a09'); // Black edges
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // Grid Lines (Tactical feel)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.2;
    for(let i=0; i<w; i+=20) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,h); ctx.stroke(); }
    for(let i=0; i<h; i+=20) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(w,i); ctx.stroke(); }
    ctx.globalAlpha = 1.0;

    const centerX = w/2;
    const centerY = h/2;

    // --- DRAW BASE LAYOUT ---
    
    // 1. Walls (Arena Only) - Always visible in Arena
    if (isArena) {
        ctx.strokeStyle = '#57534e'; // Stone Wall Color
        ctx.lineWidth = 4;
        ctx.beginPath();
        // Octagon shape for Arena walls
        const r = 90;
        for (let i = 0; i <= 8; i++) {
            const angle = (i * 45) * Math.PI / 180;
            const x = centerX + r * Math.cos(angle);
            const y = centerY + r * Math.sin(angle);
            if (i===0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Gate (Bottom Right)
        ctx.strokeStyle = '#a8a29e';
        ctx.lineWidth = 6;
        ctx.beginPath();
        const gateAngle = 45 * Math.PI / 180;
        ctx.moveTo(centerX + (r-10) * Math.cos(gateAngle), centerY + (r-10) * Math.sin(gateAngle));
        ctx.lineTo(centerX + (r+5) * Math.cos(gateAngle), centerY + (r+5) * Math.sin(gateAngle));
        ctx.stroke();
    }

    // 2. Resources (Dynamic Forest)
    
    // Woodlines
    const drawTree = (x: number, y: number, alpha: number) => {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#166534';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#14532d'; // Shadow
        ctx.beginPath();
        ctx.arc(x+1, y+1, 2, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    };

    // Calculate Dynamic Wood Recession based on total gathered at this timestamp
    const woodLineDepth = Math.sqrt(totalWoodGatheredAtTime / 500);
    const woodDist = 70 + (woodLineDepth * 4); // Push trees away as wood is gathered
    
    // Draw "Forest" arc
    for(let a = -120; a < -60; a+=10) {
        const rad = a * Math.PI / 180;
        const x = centerX + woodDist * Math.cos(rad);
        const y = centerY + woodDist * Math.sin(rad);
        // Clump of trees
        drawTree(x, y, 1.0);
        drawTree(x+5, y+2, 0.8);
        drawTree(x-4, y+3, 0.9);
    }
    
    // Berries (Static for now)
    const berryDist = 50;
    const berryAngle = 10 * Math.PI / 180; // Right side
    for(let i=0; i<5; i++) {
        ctx.fillStyle = '#db2777'; // Pink berries
        ctx.beginPath();
        const bx = centerX + berryDist * Math.cos(berryAngle) + (Math.random()*10);
        const by = centerY + berryDist * Math.sin(berryAngle) + (Math.random()*10);
        ctx.arc(bx, by, 3, 0, Math.PI*2);
        ctx.fill();
    }

    // Gold
    const goldDist = 60;
    const goldAngle = 140 * Math.PI / 180; // Left Bottom
    for(let i=0; i<4; i++) {
        ctx.fillStyle = '#eab308'; 
        ctx.beginPath();
        const gx = centerX + goldDist * Math.cos(goldAngle) + (i*5);
        const gy = centerY + goldDist * Math.sin(goldAngle) + (Math.random()*5);
        ctx.rect(gx, gy, 6, 6);
        ctx.fill();
    }

    // 3. Buildings (Dynamic Appearance)
    // Filter steps for "build" type that have happened by currentTime
    const buildingsBuilt = steps.filter(s => s.type === 'build' && s.time <= currentTime);
    
    // Helper to place buildings
    const drawBuilding = (type: string, seed: number) => {
        const angle = (seed * 137.5) * Math.PI / 180; // Golden angle for distribution
        const dist = 30 + (seed % 4) * 10;
        const x = centerX + dist * Math.cos(angle);
        const y = centerY + dist * Math.sin(angle);
        
        // Color/Shape by type
        if (type.includes('House')) {
            ctx.fillStyle = '#78350f'; // Brown
            ctx.fillRect(x-3, y-3, 6, 6);
        } else if (type.includes('Lumber')) {
            ctx.fillStyle = '#047857'; // Green tint
            ctx.fillRect(x-4, y-4, 8, 8);
        } else if (type.includes('Mill')) {
            ctx.fillStyle = '#be185d'; // Pink tint
            ctx.fillRect(x-4, y-4, 8, 8);
        } else if (type.includes('Barracks')) {
            ctx.fillStyle = '#991b1b'; // Red tint
            ctx.fillRect(x-5, y-5, 10, 10);
        } else {
             ctx.fillStyle = '#475569'; // Grey generic
             ctx.fillRect(x-4, y-4, 8, 8);
        }
        
        // Spawn pop effect (if just built)
        if (currentTime - steps.find(s => s.instruction === type && s.time <= currentTime)?.time! < 2) {
             ctx.strokeStyle = '#fbbf24';
             ctx.lineWidth = 2;
             ctx.strokeRect(x-6, y-6, 12, 12);
        }
    };

    buildingsBuilt.forEach((b, idx) => {
        drawBuilding(b.instruction, idx + 1); // +1 to avoid 0 angle overlap with TC
    });

    // 4. Town Center
    ctx.fillStyle = '#3b82f6'; // Blue Player Color
    ctx.fillRect(centerX - 10, centerY - 10, 20, 20);
    // Roof
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.moveTo(centerX - 12, centerY - 10);
    ctx.lineTo(centerX, centerY - 20);
    ctx.lineTo(centerX + 12, centerY - 10);
    ctx.fill();

    // 5. Units (Dots)
    // Draw dots representing vills at current pop
    const currentPop = steps.filter(s => s.time <= currentTime).slice(-1)[0]?.population || 3;
    ctx.fillStyle = '#fca5a5';
    for(let i=0; i<currentPop; i++) {
        const angle = (currentTime * 0.5 + i) + (i * 20); // Animate rotation
        const r = 15 + (i%3)*5;
        ctx.beginPath();
        ctx.arc(centerX + r*Math.cos(angle), centerY + r*Math.sin(angle), 1.5, 0, Math.PI*2);
        ctx.fill();
    }
    
    // Overlay Text
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.font = '10px monospace';
    ctx.fillText(isArena ? "ARENA: CLOSED" : "ARABIA: OPEN", 10, 15);
    
    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };
    
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(formatTime(currentTime), w - 40, h - 10);

  }, [mapType, civ, currentTime, totalWoodGatheredAtTime, steps]);

  return (
    <div className="relative w-full h-full bg-black rounded border border-stone-800 overflow-hidden shadow-inner group">
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={200} 
        className="w-full h-full object-cover opacity-90 transition-opacity"
      />
      {/* Scanline effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,11,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_2px,3px_100%]"></div>
      
      {/* Playback Indicator */}
      <div className="absolute top-2 right-2 flex gap-1 items-center z-20 opacity-50 group-hover:opacity-100 transition-opacity">
         <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
         <span className="text-[8px] text-red-400 font-bold uppercase tracking-wider">LIVE SIM</span>
      </div>
    </div>
  );
};

export default MapVisualizer;
