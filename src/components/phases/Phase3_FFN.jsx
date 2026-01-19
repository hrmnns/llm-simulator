import React, { useState, useMemo, useEffect } from 'react';
import PhaseLayout from './../PhaseLayout';

const Phase3_FFN = ({ simulator, setHoveredItem, theme, activeScenario }) => {

  // 1. Hooks auf oberster Ebene
  const {
    mlpThreshold,
    setMlpThreshold,
    activeFFN,
    activeAttention,
    activeProfileId,
    headOverrides,
    selectedToken: sourceTokenId,
    setActiveFFN // Wir brauchen diese Funktion aus dem Simulator
  } = simulator;

  const [selectedLabel, setSelectedLabel] = useState(null);

  // Status-Badges berechnen
  const pipelineSignal = activeAttention?.avgSignal || 1.0;
  const isDegraded = pipelineSignal < 0.7;
  const isCritical = pipelineSignal < 0.4;

  // 2. Die zentrale, generische Berechnungslogik (REIN MATHEMATISCH)
  const processedFFN = useMemo(() => {
    if (!activeFFN || !Array.isArray(activeFFN)) return [];

    const getSliderVal = (hNum) => {
      if (!headOverrides) return 0.7;
      const allKeys = Object.keys(headOverrides);
      const targetSuffix = `_h${hNum}`;
      if (sourceTokenId) {
        const specificKey = allKeys.find(k => k.includes(`_s${sourceTokenId}_`) && k.endsWith(targetSuffix));
        if (specificKey !== undefined) return parseFloat(headOverrides[specificKey]);
      }
      const activeKeys = allKeys.filter(k => k.endsWith(targetSuffix));
      if (activeKeys.length > 0) {
        const primaryKey = activeKeys.find(k => k.includes("_s1_")) || activeKeys[0];
        return parseFloat(headOverrides[primaryKey]);
      }
      return 0.7;
    };

    const signals = { 1: getSliderVal(1), 2: getSliderVal(2), 3: getSliderVal(3), 4: getSliderVal(4) };

    const profiles = activeScenario?.phase_3_ffn?.activation_profiles || [];
    const currentProfile = profiles.find(p => String(p.ref_profile_id).trim() === String(activeProfileId).trim()) || profiles[0];

    const allRulesSource = currentProfile?.rules || activeAttention?.profiles?.find(p => String(p.id) === String(activeProfileId))?.rules || activeAttention?.rules || [];

    return activeFFN.map((cat, index) => {
      const scenarioMetadata = currentProfile?.activations?.find(a => String(a.label).toLowerCase().trim() === String(cat.label).toLowerCase().trim());
      const linkedHeadId = scenarioMetadata?.linked_head || cat.linked_head || (index + 1);
      const sliderVal = signals[linkedHeadId];
      const sliderFactor = sliderVal / 0.7;

      const rules = allRulesSource.filter(r => Number(r.head) === Number(linkedHeadId) && (!sourceTokenId || String(r.source) === String(sourceTokenId)));
      const rulesSum = rules.length > 0 ? rules.reduce((acc, r) => acc + parseFloat(r.strength), 0) : 0.50;

      let finalVal = 0;
      if (sliderVal > 0.01) {
        finalVal = 0.5 * rulesSum * sliderFactor;
      }
      finalVal = Math.max(0, Math.min(1.0, finalVal));

      return {
        ...cat,
        activation: finalVal,
        isActuallyActive: finalVal >= mlpThreshold,
        currentWeight: sliderFactor,
        debugHeadVal: sliderVal,
        linked_head: linkedHeadId
      };
    });
  }, [activeFFN, activeAttention, sourceTokenId, JSON.stringify(headOverrides), activeProfileId, mlpThreshold, activeScenario]);

  // 3. HILFSFUNKTIONEN
  const getInspectorData = (cat) => ({
    title: `🧠 Wissens-Extraktion: ${cat.label}`,
    subtitle: `Resonanz auf Phase 2 Heads`,
    data: {
      "--- Mechanik": "---",
      "Status": cat.isActuallyActive ? "AKTIVIERT" : "UNTERDRÜCKT",
      "Gesteuert über": `Head ${cat.linked_head}`,
      "Signal-Stärke": cat.debugHeadVal.toFixed(2),
      "Berechneter Faktor": cat.currentWeight?.toFixed(2),
      "--- Mathematik": "---",
      "Netz-Spannung": (cat.activation * 100).toFixed(1) + "%",
      "MLP-Gate": mlpThreshold.toFixed(2)
    }
  });

  const activeCategory = useMemo(() => {
    const active = [...processedFFN].sort((a, b) => b.activation - a.activation)[0];
    return (active && active.activation >= mlpThreshold) ? active.label : "Keine Dominanz";
  }, [processedFFN, mlpThreshold]);

  // 4. SYNCHRONISIERUNGS-EFFECTS (JETZT AN DER RICHTIGEN STELLE)

  // Phase3_FFN.jsx
  useEffect(() => {
    // Wir prüfen, ob die Funktion überhaupt existiert
    if (typeof simulator.setActiveFFN === 'function' && processedFFN.length > 0) {

      const currentSnapshot = processedFFN.map(f => f.activation.toFixed(4)).join('|');
      const stateSnapshot = simulator.activeFFN?.map(f => f.activation.toFixed(4)).join('|');

      if (currentSnapshot !== stateSnapshot) {
//        console.log("📡 [Phase 3] EMERGENCY SYNC: Sende neue Werte an Simulator...");

        // Wir erzwingen ein neues Array-Objekt, damit React die Änderung erkennt
        simulator.setActiveFFN([...processedFFN]);
      }
    } else {
      console.error("❌ [Phase 3] FEHLER: simulator.setActiveFFN ist nicht definiert!");
    }
  }, [processedFFN, simulator.setActiveFFN, simulator.activeFFN]);

  // Effekt 2: Sync zum Inspektor
  useEffect(() => {
    if (selectedLabel) {
      const cat = processedFFN.find(c => c.label === selectedLabel);
      if (cat) setHoveredItem(getInspectorData(cat));
    }
  }, [processedFFN, mlpThreshold, selectedLabel, setHoveredItem]);

  // 5. RENDERING
  return (
    <PhaseLayout
      title="Phase 3: FFN Knowledge Mapping"
      subtitle="Mustererkennung & Kategorisierung"
      theme={theme}
      badges={[
        { text: `Fokus: ${activeCategory}`, className: isCritical ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400" },
        { text: `Signal: ${(pipelineSignal * 100).toFixed(0)}%`, className: isDegraded ? "text-orange-400" : "text-slate-500" }
      ]}
      visualization={
        <div className="w-full h-full flex flex-col justify-center items-center py-4" onClick={() => { setSelectedLabel(null); setHoveredItem(null); }}>
          {isCritical && (
            <div className="absolute top-4 text-[10px] font-black text-red-500 animate-pulse z-50 uppercase tracking-widest">
              ⚠️ High Entropy Interference - Neural Mapping Unstable
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl px-6 relative">
            {processedFFN.map((cat) => {
              const isSelected = selectedLabel === cat.label;
              const baseColor = cat.color || "#3b82f6";
              const dynamicStyles = {
                borderColor: !cat.isActuallyActive ? (theme === 'light' ? '#e2e8f0' : 'rgba(255,255,255,0.05)') : baseColor,
                backgroundColor: !cat.isActuallyActive ? (theme === 'light' ? '#f8fafc' : 'rgba(15, 23, 42, 0.4)') : `${baseColor}15`,
                color: !cat.isActuallyActive ? (theme === 'light' ? '#cbd5e1' : 'rgba(255,255,255,0.2)') : baseColor,
                boxShadow: cat.isActuallyActive ? `0 10px 15px -3px ${baseColor}33` : 'none'
              };
              return (
                <div key={cat.label} style={dynamicStyles}
                  onMouseEnter={() => !selectedLabel && setHoveredItem(getInspectorData(cat))}
                  onMouseLeave={() => !selectedLabel && setHoveredItem(null)}
                  className={`relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all duration-500 cursor-pointer overflow-hidden ${isSelected ? 'ring-2 ring-blue-500 scale-105 z-20' : 'z-10'}`}
                  onClick={(e) => { e.stopPropagation(); setSelectedLabel(isSelected ? null : cat.label); }}
                >
                  <div className="absolute bottom-0 left-0 w-full transition-all duration-1000 opacity-10 pointer-events-none"
                    style={{ height: `${cat.activation * 100}%`, backgroundColor: 'currentColor' }} />
                  <div className="z-10 text-[10px] font-black uppercase tracking-widest text-center px-2">{cat.label}</div>
                  <div className="z-10 text-[9px] font-mono mt-2 opacity-60">{(cat.activation * 100).toFixed(0)}% Active</div>
                </div>
              );
            })}
          </div>
        </div>
      }
      controls={
        <div className="col-span-full px-6 py-4 bg-slate-900/80 rounded-xl border border-white/5 backdrop-blur-md" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-3">
            <label className="text-[9px] uppercase font-black text-slate-500 tracking-widest">MLP Filter (Threshold)</label>
            <div className="text-sm font-mono font-black text-blue-400">{mlpThreshold.toFixed(2)}</div>
          </div>
          <input type="range" min="0" max="1" step="0.01" value={mlpThreshold} onChange={(e) => setMlpThreshold(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
        </div>
      }
    />
  );
};

export default Phase3_FFN;