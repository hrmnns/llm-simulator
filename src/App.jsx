import React, { useState, useEffect } from 'react';
import { ScenarioProvider, useScenarios } from './context/ScenarioContext';
import PhaseNavigator from './components/PhaseNavigator';
import { useLLMSimulator } from './hooks/useLLMSimulator';

// Phasen-Importe
import Phase0_Tokenization from './components/phases/Phase0_Tokenization';
import Phase1_Embedding from './components/phases/Phase1_Embedding';
import Phase2_Attention from './components/phases/Phase2_Attention';
import Phase3_FFN from './components/phases/Phase3_FFN';
import Phase4_Decoding from './components/phases/Phase4_Decoding';
import Phase5_Analysis from './components/phases/Phase5_Analysis';

// --- INTERNE KOMPONENTEN ---

const InternalHeader = ({ theme, toggleTheme, onOpenHelp, scenarios, activeScenario, onScenarioChange }) => (
  <header className={`w-full px-6 py-4 flex flex-col md:flex-row justify-between items-center border-b transition-colors duration-500 z-50 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
    <div className="flex items-center gap-6 mb-4 md:mb-0">
      <h1 className="text-lg font-black uppercase tracking-tighter text-blue-500">
        LLM Explorer <span className="font-light opacity-50 text-[10px] tracking-normal">Sim Lab</span>
      </h1>
      <div className={`flex items-center gap-2 p-1.5 rounded-xl border transition-all ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100 border-slate-300'
        }`}>
        <span className="text-[9px] font-black uppercase px-2 opacity-50">Szenario:</span>
        <select
          value={activeScenario?.id || ""}
          onChange={(e) => onScenarioChange(e.target.value)}
          className="bg-transparent text-xs font-bold outline-none cursor-pointer pr-2 text-blue-500 focus:ring-0"
        >
          {scenarios?.map(s => (
            <option key={s.id} value={s.id} className={theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-blue-500/10 transition-all text-xl">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      <button onClick={onOpenHelp} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black rounded-lg uppercase transition-all shadow-lg shadow-blue-900/20">
        Wissens-DB
      </button>
    </div>
  </header>
);

const PhaseSidebar = ({ activePhase, activeScenario, theme, isExpanded, setIsExpanded }) => {
  const phaseContent = [
    { title: "Tokenisierung", desc: "Übersetzung in Zahlenwerte.", details: "KI zerlegt Text in Tokens (Wortteile). Jeder Token erhält eine ID." },
    { title: "Vektorraum", desc: "Geometrische Bedeutung.", details: "Wörter werden in Wissens-Quadranten einsortiert." },
    { title: "Attention", desc: "Kontext-Verständnis.", details: "Gewichtung der Wortbeziehungen im aktuellen Satz." },
    { title: "FFN & Wissen", desc: "Netzwerk-Aktivierung.", details: "Abruf der Kategorien: Logisch, Funktional, Poetisch, Ancestral." },
    { title: "Decoding", desc: "Wort-Vorhersage.", details: "Berechnung der Wahrscheinlichkeiten für das nächste Wort." },
    { title: "Analyse", desc: "Zusammenfassung.", details: "Interpretation der finalen Simulations-Ergebnisse." }
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
          <h4 className="text-sm font-bold uppercase tracking-tighter">{phaseContent[activePhase].title}</h4>
        </div>
        <button onClick={() => setIsExpanded(false)} className="text-[18px] opacity-30 hover:opacity-100">×</button>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto font-sans">
        <section className="p-4 rounded-xl bg-blue-600/5 border border-blue-500/10">
          <p className="text-[10px] font-black text-blue-400 mb-2 uppercase tracking-widest">Technische Details</p>
          <p className="text-[11px] leading-relaxed opacity-80 italic">{phaseContent[activePhase].details}</p>
        </section>
      </div>
    </div>
  );
};

const GlossaryModal = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-white">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
          <h2 className="text-xl font-bold text-blue-400 uppercase tracking-tighter">Wissens-Datenbank</h2>
          <button onClick={onClose} className="text-3xl font-light">&times;</button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4 bg-slate-950/50">
          {data?.terms?.map((term, i) => (
            <div key={i} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
              <h3 className="text-blue-400 text-sm font-bold uppercase">{term.title}</h3>
              <p className="text-slate-300 text-[12px] italic mt-2">{term.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Footer = () => (
  <footer className="w-full p-4 flex flex-col md:flex-row justify-between items-center border-t border-slate-900/50 gap-4 font-mono">
    <div className="text-[9px] text-slate-600 font-mono uppercase tracking-[0.3em] opacity-40">Neural Simulation Lab</div>
    <div className="flex gap-4 items-center">
      <div className="text-[9px] text-slate-500 font-mono bg-slate-900/50 px-3 py-1 rounded border border-slate-800/50">
        BUILD: <span className="text-blue-500 font-bold">{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '20260108-STABLE'}</span>
      </div>
      <div className="text-[9px] text-slate-500 font-mono opacity-40">{typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : '08.01.2026'}</div>
    </div>
  </footer>
);

// --- HAUPT APP CONTENT ---

function AppContent() {
  const [activePhase, setActivePhase] = useState(0);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [glossaryData, setGlossaryData] = useState(null);

  const { scenarios, activeScenario, handleScenarioChange } = useScenarios();
  const simulator = useLLMSimulator(activeScenario);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/glossary.json`)
      .then(res => res.json())
      .then(data => setGlossaryData(data))
      .catch(err => console.error("Glossar-Ladefehler:", err));
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // DER ENTSCHEIDENDE FIX: Nur beim allerersten Laden blockieren, sonst sanft umschalten.
  if (!scenarios || scenarios.length === 0) {
    return <div className="bg-slate-950 min-h-screen flex items-center justify-center text-blue-500 font-mono uppercase text-xs">Loading Data...</div>;
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-700 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans`}>
      <InternalHeader
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenHelp={() => setIsHelpOpen(true)}
        scenarios={scenarios}
        activeScenario={activeScenario}
        onScenarioChange={(id) => {
          setActivePhase(0); // Springt zurück zur Token-Phase
          handleScenarioChange(id); // Führt den (jetzt korrigierten) Wechsel aus
        }}
      />

      <PhaseNavigator activePhase={activePhase} setActivePhase={setActivePhase} theme={theme} />

      <main className="flex-1 flex flex-col items-center py-4 px-4 overflow-x-hidden">
        <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-6 h-full lg:min-h-[620px]">

          {/* Linkes Panel */}
          <div className={`flex-[3] relative border rounded-[2.5rem] shadow-2xl overflow-hidden backdrop-blur-md transition-all duration-500 ${theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-white/80 border-slate-200 shadow-slate-200'
            }`}>
            {(!activeScenario || !simulator) ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-blue-500">
                  Verbinde Simulator...
                </p>
              </div>
            ) : (
              <div key={activeScenario.id} className="h-full w-full">
                {activePhase === 0 && <Phase0_Tokenization simulator={simulator} theme={theme} />}
                {activePhase === 1 && <Phase1_Embedding simulator={simulator} theme={theme} />}
                {activePhase === 2 && <Phase2_Attention simulator={simulator} theme={theme} />}
                {activePhase === 3 && <Phase3_FFN simulator={simulator} theme={theme} />}
                {activePhase === 4 && <Phase4_Decoding simulator={simulator} theme={theme} />}
                {activePhase === 5 && <Phase5_Analysis simulator={simulator} theme={theme} />}
              </div>
            )}
          </div>

          {/* Rechtes Panel (Sidebar) */}
          <aside className={`transition-all duration-300 ${isSidebarExpanded ? 'flex-1 min-w-[320px]' : 'flex-none w-auto'}`}>
            <PhaseSidebar activePhase={activePhase} activeScenario={activeScenario} theme={theme} isExpanded={isSidebarExpanded} setIsExpanded={setIsSidebarExpanded} />
          </aside>
        </div>
      </main>

      <Footer />
      <GlossaryModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} data={glossaryData} />
    </div>
  );
}

export default function App() {
  return (
    <ScenarioProvider>
      <AppContent />
    </ScenarioProvider>
  );
}