import React from 'react';

const PhaseSidebar = ({ activePhase, activeScenario, theme, isExpanded, setIsExpanded }) => {
  const phaseContent = [
    { title: "Tokenisierung", details: "KI zerlegt Text in Tokens (Wortteile). Jeder Token erhält eine ID." },
    { title: "Vektorraum", details: "Wörter werden in Wissens-Quadranten einsortiert (Embedding)." },
    { title: "Attention", details: "Gewichtung der Wortbeziehungen im aktuellen Satz." },
    { title: "FFN & Wissen", details: "Abruf der Kategorien: Logisch, Funktional, Poetisch, Ancestral." },
    { title: "Decoding", details: "Berechnung der Wahrscheinlichkeiten für das nächste Wort (Logits)." },
    { title: "Analyse", details: "Interpretation der finalen Simulations-Ergebnisse." }
  ];

  if (!isExpanded) return (
    <button onClick={() => setIsExpanded(true)} className={`lg:h-full p-4 rounded-2xl border flex lg:flex-col items-center justify-center hover:bg-blue-600/10 transition-all ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      <span className="lg:rotate-90 text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 whitespace-nowrap">Details einblenden</span>
    </button>
  );

  return (
    <div className={`w-full lg:w-80 h-full flex flex-col p-6 rounded-[2rem] border shadow-2xl transition-all ${theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">Phase {activePhase}</h3>
          <h4 className="text-sm font-bold uppercase tracking-tighter">{phaseContent[activePhase]?.title}</h4>
        </div>
        <button onClick={() => setIsExpanded(false)} className="text-[18px] opacity-30 hover:opacity-100">×</button>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto font-sans">
        <section className="p-4 rounded-xl bg-blue-600/5 border border-blue-500/10">
          <p className="text-[10px] font-black text-blue-400 mb-2 uppercase tracking-widest">Technische Details</p>
          <p className="text-[11px] leading-relaxed opacity-80 italic">{phaseContent[activePhase]?.details}</p>
        </section>
        
        <section className="space-y-2">
           <p className="text-[10px] font-black opacity-40 uppercase">Aktiver Kontext</p>
           <div className="p-3 rounded-lg bg-slate-500/5 border border-slate-500/10 text-[11px]">
              {activeScenario?.name}
           </div>
        </section>
      </div>
    </div>
  );
};

export default PhaseSidebar;