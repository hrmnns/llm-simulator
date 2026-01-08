import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useScenarios } from '../../context/ScenarioContext';

const Phase1_Embedding = ({ simulator, theme, setHoveredItem }) => {
  const { activeScenario } = useScenarios();
  const { noise, setNoise, positionWeight, setPositionWeight, processedVectors } = simulator;

  // Interaktions-States
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const containerRef = useRef(null);

  const getTokenData = (index) => {
    return activeScenario?.phase_0_tokenization?.tokens.find(t => t.id === index + 1) || { text: '?', explanation: '' };
  };

  // --- AUTO-FIT LOGIK ---
  const handleAutoFit = useCallback(() => {
    if (!processedVectors?.length || !containerRef.current) return;
    const margin = 120;
    const coordsX = processedVectors.map(v => v.displayX);
    const coordsY = processedVectors.map(v => v.displayY);
    const minX = Math.min(...coordsX) - margin;
    const maxX = Math.max(...coordsX) + margin;
    const minY = Math.min(...coordsY) - margin;
    const maxY = Math.max(...coordsY) + margin;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const newScale = Math.min(containerWidth / (maxX - minX), containerHeight / (maxY - minY), 1.1);

    setTransform({
      x: -((minX + maxX) / 2) * newScale,
      y: -((minY + maxY) / 2) * newScale,
      scale: newScale
    });
  }, [processedVectors]);

  useEffect(() => { handleAutoFit(); }, [activeScenario?.id]);

  // --- MAUS INTERAKTION ---
  const handleMouseDown = (e) => {
    if (e.target.closest('.token-point')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setTransform(prev => ({ ...prev, x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }));
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

  return (
    <div className="flex flex-col h-full p-6 font-mono select-none">
      <div className="mb-4 flex justify-between items-end">
        <div>
          <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Phase 1: Semantischer Vektorraum</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Navigation: Mausrad (Zoom) | Ziehen (Pan)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleAutoFit} className="px-3 py-1 bg-blue-600/20 border border-blue-500/50 rounded text-[10px] text-blue-400 font-bold uppercase hover:bg-blue-600/40 transition-colors">Zentrieren</button>
        </div>
      </div>

      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`flex-1 relative rounded-xl overflow-hidden border transition-colors cursor-${isDragging ? 'grabbing' : 'grab'} ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
      >
        {/* FESTE HINTERGRUND-QUADRANTEN (skalieren nicht mit) */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-10 pointer-events-none text-[8px] font-black uppercase tracking-[0.3em]">
          <div className="border-r border-b border-slate-700/40 flex items-start justify-start p-4 text-blue-500">Logisch / Wissenschaftlich</div>
          <div className="border-b border-slate-700/40 flex items-start justify-end p-4 text-purple-500">Funktional / Sozial</div>
          <div className="border-r border-slate-700/40 flex items-end justify-start p-4 text-green-500">Evolutionär / Ancestral</div>
          <div className="flex items-end justify-end p-4 text-pink-500">Poetisch / Emotional</div>
        </div>

        {/* INTERAKTIVER TRANSFORM-LAYER */}
        <div
          className="absolute inset-0 transition-transform duration-75 ease-out"
          style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, transformOrigin: 'center' }}
        >
          {/* Gitterkreuz im Hintergrund */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <div className="w-[10000px] h-px bg-blue-500"></div>
            <div className="h-[10000px] w-px bg-blue-500"></div>
          </div>

          {/* BEZIEHUNGS-LINIEN (SVG) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ overflow: 'visible' }}
            // Wir definieren ein Koordinatensystem, das immer von der Mitte aus geht
            viewBox={`${-containerRef.current?.clientWidth / 2 || -500} ${-containerRef.current?.clientHeight / 2 || -500} ${containerRef.current?.clientWidth || 1000} ${containerRef.current?.clientHeight || 1000}`}
          >
            {hoveredIndex !== null && processedVectors.map((target, idx) => {
              if (idx === hoveredIndex) return null;
              const source = processedVectors[hoveredIndex];
              const dist = Math.sqrt(Math.pow(source.displayX - target.displayX, 2) + Math.pow(source.displayY - target.displayY, 2));

              if (dist > 400) return null;

              return (
                <line
                  key={idx}
                  // Jetzt ohne calc() - direkt die Display-Koordinaten nutzen
                  x1={source.displayX} y1={source.displayY}
                  x2={target.displayX} y2={target.displayY}
                  stroke={theme === 'dark' ? '#3b82f6' : '#2563eb'}
                  strokeWidth={Math.max(0.5, (400 - dist) / 100)}
                  opacity={(400 - dist) / 600}
                />
              );
            })}
          </svg>

          {/* TOKEN-PUNKTE */}
          {processedVectors.map((vec, i) => {
            const token = getTokenData(vec.token_index);
            return (
              <div
                key={i}
                className="absolute token-point group z-20"
                style={{ left: `calc(50% + ${vec.displayX}px)`, top: `calc(50% + ${vec.displayY}px)`, transform: 'translate(-50%, -50%)' }}
                onMouseEnter={() => {
                  // Wir setzen erst den lokalen Index für die Linien (schnell)
                  setHoveredIndex(i);
                  // Dann die Sidebar (etwas schwerfälliger)
                  setHoveredItem({
                    title: `Vektor: ${token.text}`,
                    data: { "ID": vec.token_index, "X": vec.displayX.toFixed(2), "Y": vec.displayY.toFixed(2) }
                  });
                }}
                onMouseLeave={() => {
                  setHoveredIndex(null);
                  // NEU: Sidebar leeren
                  setHoveredItem(null);
                }}
              >
                {/* Punkt-Visualisierung */}
                <div className={`w-3.5 h-3.5 rounded-full transition-all duration-300 border-2 ${hoveredIndex === i
                  ? 'scale-150 bg-white border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.6)]'
                  : 'bg-blue-600 border-transparent'
                  }`} />

                {/* Label (skaliert gegengleich, um lesbar zu bleiben) */}
                <div
                  className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900/90 px-2 py-0.5 rounded text-[11px] text-blue-300 font-bold border border-slate-700 whitespace-nowrap shadow-xl pointer-events-none"
                  style={{ transform: `translateX(-50%) scale(${1 / transform.scale})` }}
                >
                  {token.text}
                </div>

                {/* Didaktischer Tooltip */}
                <div
                  className="absolute z-50 bottom-10 left-1/2 -translate-x-1/2 w-56 p-3 bg-slate-900 border border-blue-500 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                  style={{ transform: `translateX(-50%) scale(${1 / transform.scale})`, transformOrigin: 'bottom' }}
                >
                  <p className="text-blue-400 text-[10px] font-black uppercase mb-1 border-b border-blue-900/50 pb-1 italic">Semantische Analyse</p>
                  <p className="text-slate-200 text-[11px] leading-snug">{token.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CONTROLS */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] uppercase font-black text-blue-500">Semantic Noise</label>
            <span className="text-[10px] text-slate-500">{noise.toFixed(2)}</span>
          </div>
          <input type="range" min="0" max="5" step="0.1" value={noise} onChange={(e) => setNoise(parseFloat(e.target.value))} className="w-full accent-blue-500" />
        </div>
        <div className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] uppercase font-black text-purple-500">Position Weight</label>
            <span className="text-[10px] text-slate-500">{(positionWeight * 100).toFixed(0)}%</span>
          </div>
          <input type="range" min="0" max="1" step="0.01" value={positionWeight} onChange={(e) => setPositionWeight(parseFloat(e.target.value))} className="w-full accent-purple-500" />
        </div>
      </div>
    </div>
  );
};

export default Phase1_Embedding;