import React, { useState } from 'react';

const PhaseSidebar = ({ activePhase, activeScenario, theme }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Beispiel-Inhalte (Diese könnten auch aus deiner glossary.json kommen)
  const phaseInfo = [
    { title: "Tokenization", info: "Text wird in kleine Einheiten (Tokens) zerlegt. Das Modell sieht keine Buchstaben, sondern Zahlen-IDs." },
    { title: "Embedding", info: "Tokens werden im Vektorraum platziert. Nähe im Raum bedeutet Ähnlichkeit in der Bedeutung." },
    { title: "Attention", info: "Das Modell gewichtet Beziehungen. Welche Wörter im Satz sind für das Verständnis von 'Hund' gerade wichtig?" },
    { title: "FFN (Wissen)", info: "Aktivierung der vier Wissenskategorien: Logisch, Funktional, Poetisch, Ancestral." },
    { title: "Decoding", content: "Berechnung der Wahrscheinlichkeiten für das nächste Wort." }
  ];

  if (!isExpanded) {
    return (
      <button 
        onClick={() => setIsExpanded(true)}
        className={`p-2 rounded-xl border flex items-center justify-center hover:bg-blue-600/10 transition-all ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <span className="rotate-90 text-[10px] font-bold uppercase tracking-widest text-blue-500">Details einblenden</span>
      </button>
    );
  }

  return (
    <div className={`flex-1 flex flex-col p-5 rounded-3xl border shadow-xl transition-all ${
      theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
    }`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-black uppercase tracking-tighter text-blue-500">Phasen-Details</h3>
        <button onClick={() => setIsExpanded(false)} className="text-[10px] opacity-50 hover:opacity-100">minimieren</button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        <div className="p-3 rounded-xl bg-blue-600/5 border border-blue-500/20">
          <h4 className="text-[11px] font-bold mb-1 uppercase tracking-tight">{phaseInfo[activePhase]?.title}</h4>
          <p className="text-[11px] leading-relaxed opacity-70 italic">
            {phaseInfo[activePhase]?.info || "Wähle einen Token für Details."}
          </p>
        </div>

        {/* Hier können wir später dynamisch die Scenarios-Daten einblenden */}
        <div className="text-[10px] space-y-2 opacity-50 font-mono">
          <p className="border-b border-slate-700 pb-1">Context: {activeScenario.name}</p>
          <p>Tokens: {activeScenario.phase_0_tokenization.tokens.length}</p>
        </div>
      </div>
    </div>
  );
};

export default PhaseSidebar;