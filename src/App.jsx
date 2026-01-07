import React, { useState } from 'react';
import { ScenarioProvider, useScenarios } from './context/ScenarioContext';
import Header from './components/Header';
import PhaseNavigator from './components/PhaseNavigator';

// DIESE ZEILE FEHLT WAHRSCHEINLICH:
import { useLLMSimulator } from './hooks/useLLMSimulator'; 

// Importe der Phasen
import Phase0_Tokenization from './components/phases/Phase0_Tokenization';
import Phase1_Embedding from './components/phases/Phase1_Embedding';
import Phase2_Attention from './components/phases/Phase2_Attention';
import Phase3_FFN from './components/phases/Phase3_FFN';
import Phase4_Decoding from './components/phases/Phase4_Decoding';
import Phase5_Analysis from './components/phases/Phase5_Analysis';

function AppContent() {
  const [activePhase, setActivePhase] = useState(0);
  const { activeScenario } = useScenarios();
  
  // Hier wird der Hook aufgerufen (Zeile 17 in deinem Fehlerprotokoll)
  const simulator = useLLMSimulator(activeScenario);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header />
      <PhaseNavigator activePhase={activePhase} setActivePhase={setActivePhase} />
      
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950">
        <div className="w-full max-w-4xl h-[550px] bg-slate-900/40 border border-slate-800 rounded-3xl shadow-2xl relative overflow-hidden backdrop-blur-sm">
          {activePhase === 0 && <Phase0_Tokenization />}
          {activePhase === 1 && <Phase1_Embedding simulator={simulator} />}
          {activePhase === 2 && <Phase2_Attention simulator={simulator} />}
          {activePhase === 3 && <Phase3_FFN simulator={simulator} />}
          {activePhase === 4 && <Phase4_Decoding simulator={simulator} />}
          {activePhase === 5 && <Phase5_Analysis simulator={simulator} />}
        </div>
        
        {/* InfoBox zur Erklärung */}
        <div className="mt-6 w-full max-w-4xl p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-200 italic text-center">
          {activeScenario?.explanation || "Wähle ein Szenario aus, um die Simulation zu starten."}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <ScenarioProvider>
      <AppContent />
    </ScenarioProvider>
  );
}

export default App;