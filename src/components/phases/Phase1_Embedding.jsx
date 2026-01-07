import React from 'react';
import { useLLMSimulator } from '../../hooks/useLLMSimulator';
import { useScenarios } from '../../context/ScenarioContext';

const Phase1_Embedding = () => {
  const { activeScenario } = useScenarios();
  const { noise, setNoise, processedVectors } = useLLMSimulator(activeScenario);

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex-1 relative bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
        {/* Ein einfaches Koordinatenkreuz im Hintergrund */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <div className="w-full h-px bg-white"></div>
          <div className="h-full w-px bg-white"></div>
        </div>

        {/* Die Vektoren als Punkte */}
        {processedVectors.map((vec, i) => (
          <div
            key={i}
            className="absolute w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300 ease-out"
            style={{ 
              left: `calc(50% + ${vec.displayX}px)`, 
              top: `calc(50% + ${vec.displayY}px)` 
            }}
          >
            <span className="absolute top-5 left-1/2 -translate-x-1/2 text-[10px] text-blue-300 font-mono whitespace-nowrap">
              Token #{vec.token_index}
            </span>
          </div>
        ))}
      </div>

      {/* Control Panel für diese Phase */}
      <div className="mt-6 p-4 bg-slate-900 border border-slate-800 rounded-lg">
        <label className="text-xs uppercase tracking-widest text-slate-500 font-bold block mb-2">
          Embedding Noise (Halluzinations-Potenzial): {noise.toFixed(2)}
        </label>
        <input 
          type="range" min="0" max="5" step="0.1" 
          value={noise} 
          onChange={(e) => setNoise(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <p className="text-sm text-slate-400 mt-2 italic">
          {noise > 3 ? "⚠️ Hohes Rauschen: Das Modell verliert den semantischen Bezug!" : "Stabile Vektor-Repräsentation."}
        </p>
      </div>
    </div>
  );
};

export default Phase1_Embedding;