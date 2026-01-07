import React from 'react';
import { useScenarios } from '../../context/ScenarioContext';
import { useLLMSimulator } from '../../hooks/useLLMSimulator';

const Phase2_Attention = () => {
  const { activeScenario } = useScenarios();
  const { activeProfileId, setActiveProfileId, currentProfile } = useLLMSimulator(activeScenario);

  if (!activeScenario) return null;
  const tokens = activeScenario.phase_0_tokenization.tokens;

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex-1 flex flex-col items-center justify-center relative bg-slate-900/30 rounded-xl border border-slate-800">
        
        {/* Die Tokens als interaktive Kreise im Kreis angeordnet */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          {tokens.map((token, i) => {
            const angle = (i / tokens.length) * 2 * Math.PI;
            const x = Math.cos(angle) * 120;
            const y = Math.sin(angle) * 120;
            
            // Prüfen, ob eine Attention-Regel für diesen Target-Token existiert
            const rule = currentProfile?.rules.find(r => r.target === token.id);
            const strength = rule ? rule.strength : 0.1;

            return (
              <div key={token.id} className="absolute transition-all duration-500" style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}>
                {/* Verbindungslinie zum Zentrum (Hund) */}
                <div 
                  className="absolute origin-left h-[2px] bg-blue-500/30"
                  style={{ 
                    width: '120px', 
                    transform: `rotate(${angle + Math.PI}deg)`,
                    opacity: strength,
                    height: `${strength * 4}px`
                  }}
                />
                <div className={`px-3 py-1 rounded bg-slate-800 border ${strength > 0.5 ? 'border-blue-500 text-blue-400' : 'border-slate-700 text-slate-500'} text-sm font-mono`}>
                  {token.text}
                </div>
              </div>
            );
          })}
          <div className="z-10 bg-blue-600 text-white px-4 py-2 rounded-full font-bold shadow-lg shadow-blue-500/20">
            Hund
          </div>
        </div>
      </div>

      {/* Profil-Umschalter (Wissenschaftlich / Poetisch) */}
      <div className="mt-6 flex gap-4">
        {activeScenario.phase_2_attention.attention_profiles.map(p => (
          <button
            key={p.id}
            onClick={() => setActiveProfileId(p.id)}
            className={`flex-1 py-3 px-4 rounded-lg border transition-all ${
              activeProfileId === p.id 
                ? 'bg-blue-600/20 border-blue-500 text-blue-100' 
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'
            }`}
          >
            <div className="text-xs uppercase tracking-tighter font-bold opacity-60">Fokus-Modus</div>
            <div className="text-sm">{p.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Phase2_Attention;