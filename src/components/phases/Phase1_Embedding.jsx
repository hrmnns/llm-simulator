import React, { useState, useRef, useEffect } from 'react';
import { useScenarios } from '../../context/ScenarioContext';

const Phase1_Embedding = ({ simulator }) => {
  const { activeScenario } = useScenarios();
  const { noise, setNoise, positionWeight, setPositionWeight, processedVectors } = simulator;

  // Viewport-State für Zoom & Pan
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Hilfsfunktion um Token-Daten zu holen
  const getTokenData = (index) => {
    return activeScenario?.phase_0_tokenization?.tokens.find(t => t.id === index + 1) || { text: '?', explanation: '' };
  };

  // --- INTERAKTIONS-LOGIK ---

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setTransform(prev => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    }));
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e) => {
    e.preventDefault();
    const scaleAmount = -e.deltaY * 0.001;
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.2, Math.min(prev.scale + scaleAmount, 5))
    }));
  };

  const resetView = () => setTransform({ x: 0, y: 0, scale: 1 });

  return (
    <div className="flex flex-col h-full p-6 text-white font-mono select-none">
      <div className="mb-4 flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-blue-400">Phase 1: High-Dimensional Embedding</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest text-glow">
            Interaktiver Vektorraum-Explorer
          </p>
        </div>
        <div className="flex gap-2 mb-1">
           <button onClick={() => setTransform(p => ({...p, scale: p.scale * 1.2}))} className="px-2 py-1 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 text-xs">+</button>
           <button onClick={() => setTransform(p => ({...p, scale: p.scale / 1.2}))} className="px-2 py-1 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 text-xs">-</button>
           <button onClick={resetView} className="px-2 py-1 bg-blue-900/30 border border-blue-500/50 rounded hover:bg-blue-800/50 text-[10px] uppercase">Reset View</button>
        </div>
      </div>

      {/* Interaktiver Container */}
      <div 
        ref={containerRef}
        className={`flex-1 relative bg-slate-950/50 border border-slate-800 rounded-xl overflow-hidden shadow-inner cursor-${isDragging ? 'grabbing' : 'grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        
        {/* Transform-Layer: Hier passiert die Magie */}
        <div 
          className="absolute inset-0 transition-transform duration-75 ease-out"
          style={{ 
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: 'center'
          }}
        >
          {/* Koordinatenkreuz */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <div className="w-[5000px] h-px bg-blue-500"></div>
            <div className="h-[5000px] w-px bg-blue-500"></div>
          </div>

          {/* Achsen-Labels (bewegen sich mit) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 text-[8px] text-slate-700 uppercase tracking-widest" style={{marginTop: '-200px'}}>Semantische Tiefe</div>
          <div className="absolute top-1/2 left-1/2 -translate-y-1/2 text-[8px] text-slate-700 uppercase tracking-widest rotate-90" style={{marginLeft: '200px'}}>Kontext-Abstand</div>

          {/* Die Tokens */}
          {processedVectors.map((vec, i) => {
            const token = getTokenData(vec.token_index);
            return (
              <div
                key={i}
                className="absolute group transition-all duration-700 ease-in-out"
                style={{ 
                  left: `calc(50% + ${vec.displayX}px)`, 
                  top: `calc(50% + ${vec.displayY}px)`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {/* Der Punkt */}
                <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] group-hover:scale-150 transition-transform cursor-help" />
                
                {/* Token-Label (Skaliert nicht mit, damit es lesbar bleibt) */}
                <div 
                  className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900/80 px-2 py-0.5 rounded text-[10px] text-blue-300 font-bold border border-slate-700/50 whitespace-nowrap"
                  style={{ transform: `translateX(-50%) scale(${1 / transform.scale})` }}
                >
                  {token.text}
                </div>

                {/* Didaktischer Tooltip */}
                <div 
                  className="absolute z-50 bottom-8 left-1/2 -translate-x-1/2 w-48 p-3 bg-slate-900 border border-blue-500 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200"
                  style={{ transform: `translateX(-50%) scale(${1 / transform.scale})`, transformOrigin: 'bottom' }}
                >
                  <p className="text-blue-400 text-[9px] font-bold uppercase mb-1 border-b border-blue-900/50 pb-1 italic">Vektor-Punkt</p>
                  <p className="text-slate-200 text-[10px] leading-tight mb-2">{token.explanation}</p>
                  <div className="flex justify-between text-[8px] text-slate-500 uppercase font-bold">
                    <span>X: {vec.displayX.toFixed(1)}</span>
                    <span>Y: {vec.displayY.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Overlay (Hilfetext) */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] text-slate-500 uppercase tracking-widest pointer-events-none bg-slate-950/80 px-2 py-1 rounded">
          Mausrad: Zoom | Klicken & Ziehen: Verschieben
        </div>
      </div>

      {/* Control Panel */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg group">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] uppercase text-blue-400 font-bold">Semantic Noise</label>
            <span className="text-[10px] text-slate-500">{noise.toFixed(2)}</span>
          </div>
          <input 
            type="range" min="0" max="5" step="0.1" 
            value={noise} 
            onChange={(e) => setNoise(parseFloat(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer"
          />
        </div>

        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg group">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] uppercase text-purple-400 font-bold">Positional Weight</label>
            <span className="text-[10px] text-slate-500">{(positionWeight * 100).toFixed(0)}%</span>
          </div>
          <input 
            type="range" min="0" max="1" step="0.01" 
            value={positionWeight} 
            onChange={(e) => setPositionWeight(parseFloat(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

export default Phase1_Embedding;