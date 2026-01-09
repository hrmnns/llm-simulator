import React, { useState, useEffect } from 'react';
import { ScenarioProvider, useScenarios } from './context/ScenarioContext';
import { useLLMSimulator } from './hooks/useLLMSimulator';

// Kompnenten-Importe
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
    <div className={`min-h-screen flex flex-col transition-colors duration-700 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans`}>
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

      <main className="flex-1 flex flex-col items-center py-4 px-4 overflow-x-hidden">
        {/* Container mit fester Höhe für die Desktop-Ansicht */}
        <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-6 h-full lg:h-[720px]">

          {/* LINKES PANEL: Stabiler Arbeitsbereich */}
          <div className={`flex-1 relative border rounded-[2.5rem] shadow-2xl overflow-hidden backdrop-blur-md transition-all duration-500 ${theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-white/80 border-slate-200 shadow-slate-200'
            }`}>

            {(!activeScenario || !simulator) ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-blue-500">Verbinde Simulator...</p>
              </div>
            ) : (
              /* Padding p-6 sorgt für Abstand zum Rand innerhalb des stabilen Panels */
              <div key={activeScenario.id} className="h-full w-full flex flex-col p-6">
                <div className="flex-1 relative mt-4">
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

          {/* RECHTES PANEL: Der fixierte Inspektor */}
          <aside className="lg:w-[340px] h-full flex-none">
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