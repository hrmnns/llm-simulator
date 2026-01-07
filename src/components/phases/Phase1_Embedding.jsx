import React from 'react';
import { useScenarios } from '../../context/ScenarioContext';

const Phase1_Embedding = ({ simulator }) => {
  const { activeScenario } = useScenarios();
  const { 
    noise, setNoise, 
    positionWeight, setPositionWeight, 
    processedVectors 
  } = simulator;

  // Hilfsfunktion um Token-Text zu finden
  const getTokenData = (index) => {
    return activeScenario?.phase_0_tokenization?.tokens.find(t => t.id === index + 1) || { text: '?', explanation: '' };
  };

  return (
    <div className="flex flex-col h-full p-6 text-white font-mono">
      {/* Header Bereich */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-blue-400">Phase 1: High-Dimensional Embedding</h2>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Vektorraum-Transformation & Positional Encoding</p>
      </div>

      {/* Die Visualisierung */}
      <div className="flex-1 relative bg-slate-950/50 border border-slate-800 rounded-xl overflow-hidden shadow-inner group">
        
        {/* Achsenbeschriftung */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] text-slate-600 uppercase italic">Syntaktische Rolle</div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-600 uppercase italic rotate-90">Semantische Nähe</div>

        {/* Koordinatenkreuz */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <div className="w-full h-px bg-blue-500"></div>
          <div className="h-full w-px bg-blue-500"></div>
        </div>

        {/* Die Vektoren als interaktive Punkte */}
        {processedVectors.map((vec, i) => {
          const token = getTokenData(vec.token_index);
          return (
            <div
              key={i}
              className="absolute group/token cursor-help transition-all duration-700 ease-in-out"
              style={{ 
                left: `calc(50% + ${vec.displayX}px)`, 
                top: `calc(50% + ${vec.displayY}px)`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {/* Der Punkt selbst */}
              <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] group-hover/token:scale-150 transition-transform" />
              
              {/* Permanentes Token-Label */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-slate-900/60 px-1.5 py-0.5 rounded text-[10px] text-blue-300 font-bold border border-slate-800/50">
                {token.text}
              </div>

              {/* Info-Tooltip (erscheint bei Hover) */}
              <div className="absolute z-50 bottom-6 left-1/2 -translate-x-1/2 w-48 p-3 bg-slate-900 border border-blue-500 rounded-lg shadow-2xl opacity-0 group-hover/token:opacity-100 pointer-events-none transition-opacity duration-200">
                <p className="text-blue-400 text-[10px] font-bold uppercase mb-1 border-b border-blue-900/50 pb-1">Vektor-Analyse</p>
                <p className="text-slate-200 text-[11px] leading-tight mb-2">"{token.text}": {token.explanation}</p>
                <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                  <span>DIM_X: {vec.displayX.toFixed(0)}</span>
                  <span>DIM_Y: {vec.displayY.toFixed(0)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Control Panel mit Erklärungen */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {/* Semantic Noise Slider */}
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
          <p className="text-[8px] text-slate-600 mt-1 leading-tight opacity-0 group-hover:opacity-100 transition-opacity">
            Simuliert die Unschärfe im Vektorraum. Hohe Werte führen zu semantischen Halluzinationen.
          </p>
        </div>

        {/* Positional Weight Slider */}
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
          <p className="text-[8px] text-slate-600 mt-1 leading-tight opacity-0 group-hover:opacity-100 transition-opacity">
            Mischt die Satzposition (Positional Encoding) in den semantischen Vektor.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Phase1_Embedding;