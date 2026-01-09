import React, { useState, useEffect } from 'react';
import { ScenarioProvider, useScenarios } from './context/ScenarioContext';
import { useLLMSimulator } from './hooks/useLLMSimulator';

// Komponenten-Importe
import Footer from './components/Footer';
import PhaseNavigator from './components/PhaseNavigator';
import PhaseSidebar from './components/PhaseSidebar';
import InternalHeader from './components/InternalHeader';
import GlossaryModal from './components/GlossaryModal';
import Phase0_Tokenization from './components/phases/Phase0_Tokenization';
import Phase1_Embedding from './components/phases/Phase1_Embedding';
import Phase2_Attention from './components/phases/Phase2_Attention';
import Phase3_FFN from './components/phases/Phase3_FFN';
import Phase4_Decoding from './components/phases/Phase4_Decoding';
import Phase5_Analysis from './components/phases/Phase5_Analysis';

// --- HAUPT APP CONTENT ---

function AppContent() {
  const [activePhase, setActivePhase] = useState(0);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [glossaryData, setGlossaryData] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);

  const { scenarios, activeScenario, handleScenarioChange } = useScenarios();
  const simulator = useLLMSimulator(activeScenario);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/glossary.json`)
      .then(res => res.json())
      .then(data => setGlossaryData(data))
      .catch(err => console.error("Glossar-Ladefehler:", err));
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  if (!scenarios || scenarios.length === 0) {
    return <div className="bg-slate-950 min-h-screen flex items-center justify-center text-blue-500 font-mono uppercase text-xs">Loading Data...</div>;
  }

  return (
    /* RESPONSIVE FIX: 
      - min-h-screen (Mobil): Seite darf wachsen
      - lg:h-screen (Desktop): Fixiert auf Fensterhöhe
      - lg:overflow-hidden (Desktop): Verhindert Browser-Scrollbar
    */
    <div className={`min-h-screen lg:h-screen flex flex-col lg:overflow-hidden transition-colors duration-700 ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    } font-sans`}>
      
      <InternalHeader
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenHelp={() => setIsHelpOpen(true)}
        scenarios={scenarios}
        activeScenario={activeScenario}
        onScenarioChange={(id) => {
          setActivePhase(0);
          handleScenarioChange(id);
        }}
      />

      <PhaseNavigator activePhase={activePhase} setActivePhase={setActivePhase} activeScenario={activeScenario} theme={theme} />

      {/* MAIN BEREICH:
        - overflow-y-auto (Mobil): Die ganze Seite scrollt
        - lg:overflow-hidden (Desktop): Nur interne Panels scrollen
      */}
      <main className="flex-1 flex flex-col items-center py-4 px-4 overflow-y-auto lg:overflow-hidden">
        
        {/* CONTAINER:
          - flex-col (Mobil): Panels untereinander
          - lg:flex-row (Desktop): Panels nebeneinander
          - h-auto (Mobil) vs lg:h-full (Desktop)
        */}
        <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-6 h-auto lg:h-full">

          {/* LINKES PANEL */}
          <div className={`w-full lg:flex-1 relative border rounded-[2rem] lg:rounded-[2.5rem] shadow-2xl overflow-hidden backdrop-blur-md transition-all duration-500 flex flex-col min-h-[500px] lg:min-h-0 ${
            theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-white/80 border-slate-200 shadow-slate-200'
          }`}>

            {(!activeScenario || !simulator) ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-blue-500">Verbinde Simulator...</p>
              </div>
            ) : (
              /* h-full auf Mobil sorgt für Platz, auf Desktop fixiert es */
              <div key={activeScenario.id} className="h-full w-full flex flex-col p-5 lg:p-6 overflow-hidden">
                
                {/* PHASEN-CONTENT:
                   - Scrollbar nur auf Desktop innerhalb des Panels aktiv
                */}
                <div className="flex-1 relative mt-2 lg:mt-4 lg:overflow-y-auto custom-scrollbar lg:pr-2">
                  {activePhase === 0 && <Phase0_Tokenization simulator={simulator} theme={theme} setHoveredItem={setHoveredItem} />}
                  {activePhase === 1 && <Phase1_Embedding simulator={simulator} theme={theme} setHoveredItem={setHoveredItem} />}
                  {activePhase === 2 && <Phase2_Attention simulator={simulator} theme={theme} setHoveredItem={setHoveredItem} />}
                  {activePhase === 3 && <Phase3_FFN simulator={simulator} theme={theme} setHoveredItem={setHoveredItem} />}
                  {activePhase === 4 && <Phase4_Decoding simulator={simulator} theme={theme} setHoveredItem={setHoveredItem} />}
                  {activePhase === 5 && <Phase5_Analysis simulator={simulator} theme={theme} setHoveredItem={setHoveredItem} />}
                </div>
              </div>
            )}
          </div>

          {/* RECHTES PANEL (Aside)
              - w-full (Mobil)
              - lg:w-[340px] (Desktop)
              - h-auto (Mobil) vs lg:h-full (Desktop)
          */}
          <aside className="w-full lg:w-[340px] h-auto lg:h-full flex-none">
            <PhaseSidebar
              activePhase={activePhase}
              activeScenario={activeScenario}
              simulator={simulator}
              hoveredItem={hoveredItem}
              theme={theme}
              isExpanded={isSidebarExpanded}
              setIsExpanded={setIsSidebarExpanded}
            />
          </aside>

        </div>
      </main>

      {/* FOOTER: shrink-0 verhindert das Quetschen auf Desktop */}
      <Footer className="shrink-0" />
      
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