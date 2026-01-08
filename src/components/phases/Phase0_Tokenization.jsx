import React from 'react';

const Phase0_Tokenization = ({ simulator, theme }) => {
  // WICHTIG: Prüfung auf simulator-Daten, nicht auf activeScenario
  if (!simulator || !simulator.phase_0_tokenization) {
    return (
      <div className="flex items-center justify-center h-full text-blue-500 font-mono text-xs animate-pulse">
        INITIALISIERE TOKENS...
      </div>
    );
  }

  const { tokens } = simulator.phase_0_tokenization;

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 overflow-y-auto">
      <h2 className={`text-2xl font-light mb-8 uppercase tracking-tighter ${
        theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
      }`}>
        Input Zerlegung
      </h2>
      
      <div className="flex flex-wrap gap-4 justify-center">
        {tokens.map((token, index) => (
          <div 
            key={`${token.id}-${index}`}
            className={`group relative border p-6 rounded-2xl shadow-xl transition-all cursor-help ${
              theme === 'dark' 
                ? 'bg-slate-800 border-slate-700 hover:border-blue-500' 
                : 'bg-white border-slate-200 hover:border-blue-400 shadow-slate-200'
            }`}
          >
            <span className="text-3xl font-mono text-blue-500 font-bold">{token.text}</span>
            <div className="text-[10px] mt-2 tracking-widest uppercase font-black opacity-40">
              ID: {token.id.toString().padStart(3, '0')}
            </div>
            
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 p-3 bg-slate-900 text-[10px] text-slate-300 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-slate-700 shadow-2xl z-10">
              <div className="text-blue-400 font-bold mb-1 uppercase">Token Info</div>
              {token.explanation}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 max-w-md text-center text-[11px] uppercase tracking-[0.2em] opacity-40 italic">
        "Tokens sind die semantischen Atome der KI."
      </div>
    </div>
  );
};

export default Phase0_Tokenization;