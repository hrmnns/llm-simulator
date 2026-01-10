import React, { useState, useRef, useEffect, useCallback } from 'react';
import PhaseLayout from './../PhaseLayout';
import { useScenarios } from '../../context/ScenarioContext';

const Phase1_Embedding = ({ simulator, theme, setHoveredItem }) => {
  const { activeScenario } = useScenarios();
  const { noise, setNoise, positionWeight, setPositionWeight, processedVectors } = simulator;

  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [selectedTokenId, setSelectedTokenId] = useState(null); 
  const containerRef = useRef(null);

  const tokens = activeScenario?.phase_0_tokenization?.tokens || [];

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const getTokenData = (index) => {
    return tokens.find(t => t.id === index + 1) || { text: '?', explanation: '' };
  };

  const getInspectorData = useCallback((id) => {
    if (!id) return null;
    const vec = processedVectors.find(v => v.token_index === id - 1);
    const token = getTokenData(id - 1);
    if (vec && token) {
      const stabilityValue = Math.max(5, 100 - (noise * 16));
      return {
        title: `Vektor-Analyse: ${token.text}`,
        subtitle: "Semantische Positionierung",
        data: {
          "Token-ID": id,
          "Position": `[${vec.displayX.toFixed(0)}, ${vec.displayY.toFixed(0)}]`,
          "Status": stabilityValue > 70 ? "Stabil" : stabilityValue > 40 ? "Rauschen" : "Instabil",
          "Stabilität": stabilityValue.toFixed(0) + "%",
          "Kontext": token.explanation?.substring(0, 45) + "..."
        }
      };
    }
    return null;
  }, [processedVectors, noise, tokens]);

  useEffect(() => {
    if (selectedTokenId) setHoveredItem(getInspectorData(selectedTokenId));
  }, [noise, positionWeight, selectedTokenId, getInspectorData, setHoveredItem]);

  const handleAutoFit = useCallback(() => {
    if (!processedVectors?.length || !containerRef.current) return;
    const margin = 140;
    const coordsX = processedVectors.map(v => v.displayX);
    const coordsY = processedVectors.map(v => v.displayY);
    const minX = Math.min(...coordsX) - margin;
    const maxX = Math.max(...coordsX) + margin;
    const minY = Math.min(...coordsY) - margin;
    const maxY = Math.max(...coordsY) + margin;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const scaleX = containerWidth / (maxX - minX);
    const scaleY = containerHeight / (maxY - minY);
    const newScale = Math.min(scaleX, scaleY, 1.4);
    setTransform({
      x: -((minX + maxX) / 2) * newScale,
      y: -((minY + maxY) / 2) * newScale,
      scale: newScale
    });
  }, [processedVectors]);

  useEffect(() => { handleAutoFit(); }, [activeScenario?.id]);

  const move = (dx, dy) => {
    const step = 60 / transform.scale;
    setTransform(prev => ({ ...prev, x: prev.x + dx * step, y: prev.y + dy * step }));
  };

  const zoom = (factor) => {
    setTransform(prev => ({ ...prev, scale: Math.max(0.1, Math.min(prev.scale + factor, 5)) }));
  };

  const axisTicks = [-800, -600, -400, -200, 200, 400, 600, 800];

  return (
    <PhaseLayout
      title="Phase 1: Semantischer Vektorraum"
      subtitle="Einbettung der Tokens in n-Dimensionen"
      theme={theme}
      badges={[
        { text: `Vektoren: ${tokens.length}`, className: "border-blue-500/30 text-blue-400 bg-blue-500/5" },
        { text: `Zoom: ${(transform.scale * 100).toFixed(0)}%`, className: "border-slate-500/30 text-slate-500 bg-white/5" }
      ]}
      visualization={
        <div className="relative w-full h-[450px] lg:h-full overflow-hidden bg-slate-950/20"
             ref={containerRef}
             onMouseDown={(e) => {
                if (e.target.closest('.token-point')) return;
                setIsDragging(true);
                setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
             }}
             onMouseMove={(e) => {
                if (!isDragging) return;
                setTransform(prev => ({ ...prev, x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }));
             }}
             onMouseUp={() => setIsDragging(false)}
             onMouseLeave={() => setIsDragging(false)}
             onWheel={(e) => {
                const scaleAmount = -e.deltaY * 0.001;
                zoom(scaleAmount);
             }}
        >
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-10 pointer-events-none text-[7px] font-black uppercase tracking-[0.4em] select-none">
            <div className="border-r border-b border-white/5 flex items-start justify-start p-6 text-blue-500">Logisch</div>
            <div className="border-b border-white/5 flex items-start justify-end p-6 text-purple-500">Sozial</div>
            <div className="border-r border-white/5 flex items-end justify-start p-6 text-green-500">Ancestral</div>
            <div className="flex items-end justify-end p-6 text-pink-500">Poetisch</div>
          </div>

          <div 
            className="absolute inset-0 transition-transform duration-75 ease-out" 
            style={{ 
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, 
              transformOrigin: 'center' 
            }}
          >
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox={`${-dimensions.width/2} ${-dimensions.height/2} ${dimensions.width} ${dimensions.height}`}>
              <line x1="-2000" y1="0" x2="2000" y2="0" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
              <line x1="0" y1="-2000" x2="0" y2="2000" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
              {axisTicks.map(tick => (
                <g key={`tick-${tick}`}>
                  <line x1={tick} y1="-5" x2={tick} y2="5" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                  <text x={tick} y="20" fontSize="8" fill="rgba(255,255,255,0.15)" textAnchor="middle">{tick}</text>
                  <line x1="-5" y1={tick} x2="5" y2={tick} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                  <text x="-25" y={tick} fontSize="8" fill="rgba(255,255,255,0.15)" textAnchor="end" dominantBaseline="middle">{tick}</text>
                </g>
              ))}
              {(hoveredIndex !== null || selectedTokenId !== null) && processedVectors.map((target, idx) => {
                const sourceIdx = hoveredIndex !== null ? hoveredIndex : processedVectors.findIndex(v => v.token_index === selectedTokenId - 1);
                if (idx === sourceIdx || sourceIdx === -1) return null;
                const source = processedVectors[sourceIdx];
                const dist = Math.sqrt(Math.pow(source.displayX - target.displayX, 2) + Math.pow(source.displayY - target.displayY, 2));
                if (dist > 400) return null;
                return (
                  <line key={idx} x1={source.displayX} y1={source.displayY} x2={target.displayX} y2={target.displayY} stroke="#3b82f6" strokeWidth={Math.max(0.5, (400 - dist) / 100)} opacity={(400 - dist) / 800} />
                );
              })}
            </svg>

            {processedVectors.map((vec, i) => {
              const token = getTokenData(vec.token_index);
              const isSelected = selectedTokenId === token.id;
              const isHovered = hoveredIndex === i;
              return (
                <div key={i} className="absolute token-point group z-20 cursor-pointer" style={{ left: `calc(50% + ${vec.displayX}px)`, top: `calc(50% + ${vec.displayY}px)`, transform: 'translate(-50%, -50%)' }}
                  onMouseEnter={() => { setHoveredIndex(i); setHoveredItem(getInspectorData(token.id)); }}
                  onMouseLeave={() => { setHoveredIndex(null); setHoveredItem(getInspectorData(selectedTokenId)); }}
                  onClick={(e) => { e.stopPropagation(); setSelectedTokenId(token.id); setActiveTooltip({ token, x: vec.displayX, y: vec.displayY }); }}
                >
                  <div className={`w-3 h-3 rounded-full transition-all duration-300 border-2 ${isHovered || isSelected ? 'scale-150 bg-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.6)]' : 'bg-blue-600 border-transparent opacity-60'}`} />
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900/90 px-2 py-0.5 rounded text-[10px] text-blue-200 font-bold border border-white/5 whitespace-nowrap pointer-events-none" style={{ transform: `translateX(-50%) scale(${1 / transform.scale})` }}>
                    {token.text}
                  </div>
                </div>
              );
            })}

            {activeTooltip && (
              <div className="absolute z-[100] w-64 p-4 rounded-xl border shadow-2xl bg-slate-900 border-blue-500 text-white" style={{ left: `calc(50% + ${activeTooltip.x}px)`, top: `calc(50% + ${activeTooltip.y}px)`, transform: `translate(-50%, calc(-100% - 40px)) scale(${1 / transform.scale})`, transformOrigin: 'bottom' }}>
                <div className="flex justify-between items-start mb-2 border-b border-white/10 pb-2">
                  <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest">Semantik-Analyse</span>
                  <button onClick={(e) => { e.stopPropagation(); setActiveTooltip(null); }} className="text-sm opacity-50 hover:opacity-100">&times;</button>
                </div>
                <p className="text-[11px] leading-relaxed italic text-slate-200">{activeTooltip.token.explanation}</p>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 border-r border-b border-blue-500 rotate-45"></div>
              </div>
            )}
          </div>
        </div>
      }
      controls={
        <>
          <div className="px-4 py-3 bg-slate-900/80 rounded-lg border border-white/5">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[8px] uppercase font-black text-blue-500 tracking-widest leading-none">Semantic Noise</label>
              <div className="text-[10px] font-mono font-black text-blue-400">{noise.toFixed(2)}</div>
            </div>
            <input type="range" min="0" max="5" step="0.1" value={noise} onChange={(e) => setNoise(parseFloat(e.target.value))} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
          </div>

          <div className="px-4 py-3 bg-slate-900/80 rounded-lg border border-white/5">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[8px] uppercase font-black text-purple-500 tracking-widest leading-none">Position Weight</label>
              <div className="text-[10px] font-mono font-black text-purple-400">{(positionWeight * 100).toFixed(0)}%</div>
            </div>
            <input type="range" min="0" max="1" step="0.01" value={positionWeight} onChange={(e) => setPositionWeight(parseFloat(e.target.value))} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500" />
          </div>

          {/* ÜBERARBEITETES NAVIGATION PANEL */}
          <div className="px-4 py-3 bg-slate-900/80 rounded-lg border border-white/5 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[8px] uppercase font-black text-slate-500 tracking-widest leading-none">Navigation</label>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Reset Button (Statt Link) */}
              <button 
                onClick={handleAutoFit} 
                className="flex flex-col items-center justify-center w-12 h-12 rounded-lg border border-blue-500/30 bg-blue-500/5 text-blue-400 hover:bg-blue-500/20 transition-all group"
                title="Ansicht zurücksetzen"
              >
                <span className="text-sm group-hover:rotate-[-45deg] transition-transform">↺</span>
                <span className="text-[6px] font-black uppercase mt-0.5">Reset</span>
              </button>

              {/* Steuerkreuz */}
              <div className="grid grid-cols-3 gap-0.5 bg-slate-800/50 p-0.5 rounded-lg border border-white/5">
                <div />
                <button onClick={() => move(0, 1)} className="w-5 h-5 flex items-center justify-center bg-slate-900 rounded-sm hover:bg-slate-700 text-[8px] transition-colors">▲</button>
                <div />
                <button onClick={() => move(1, 0)} className="w-5 h-5 flex items-center justify-center bg-slate-900 rounded-sm hover:bg-slate-700 text-[8px] transition-colors">◀</button>
                <button onClick={() => move(0, -1)} className="w-5 h-5 flex items-center justify-center bg-slate-900 rounded-sm hover:bg-slate-700 text-[8px] transition-colors">▼</button>
                <button onClick={() => move(-1, 0)} className="w-5 h-5 flex items-center justify-center bg-slate-900 rounded-sm hover:bg-slate-700 text-[8px] transition-colors">▶</button>
              </div>

              {/* Zoom Panel */}
              <div className="flex flex-col gap-1 flex-1">
                <button 
                  onClick={() => zoom(0.1)} 
                  className="h-5 flex items-center justify-center bg-slate-800 rounded-md border border-white/5 hover:bg-blue-600/20 hover:border-blue-500/30 text-[10px] font-black transition-all"
                >
                  +
                </button>
                <button 
                  onClick={() => zoom(-0.1)} 
                  className="h-5 flex items-center justify-center bg-slate-800 rounded-md border border-white/5 hover:bg-blue-600/20 hover:border-blue-500/30 text-[10px] font-black transition-all"
                >
                  −
                </button>
              </div>
            </div>
          </div>
        </>
      }
    />
  );
};

export default Phase1_Embedding;