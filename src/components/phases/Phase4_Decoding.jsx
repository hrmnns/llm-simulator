import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PhaseLayout from './../PhaseLayout';

const Phase4_Decoding = ({ simulator, setHoveredItem, theme, activeScenario }) => {
  const {
    temperature, setTemperature, finalOutputs, activeAttention,
    setSelectedToken, mlpThreshold, setMlpThreshold, activeFFN, noise, setNoise,
    headOverrides, setHeadOverrides, activeProfileId, sourceTokenId, setSourceTokenId
  } = simulator;

  const [selectedLabel, setSelectedLabel] = useState(null);
  const [topK, setTopK] = useState(5);
  const [minPThreshold, setMinPThreshold] = useState(0.05);
  const [simulationState, setSimulationState] = useState({ outputs: [], winner: null });
  const [isShuffling, setIsShuffling] = useState(false);

  const getItemVisuals = (item) => {
    // Wir suchen die Kategorie im aktiven FFN, die zum 'type' des Wortes passt
    const matchingCategory = activeFFN?.find(cat =>
      cat.label.toLowerCase() === (item.type || "").toLowerCase()
    );

    return {
      // Wenn im JSON eine Farbe oder ein Icon definiert ist, nimm das.
      // Ansonsten nimm Defaults.
      color: item?.color || matchingCategory?.color || "#475569",
      icon: item?.icon || matchingCategory?.icon || "📄"
    };
  };

  const calculateLogic = useCallback(() => {
    // 1. Hole das Szenario entweder aus der Prop oder direkt vom Simulator
    const scenario = activeScenario || simulator?.activeScenario;

    if (!finalOutputs || finalOutputs.length === 0 || !scenario) {
//      console.warn("⚠️ [Phase 4] Warte auf Szenario-Daten...");
      return null;
    }

    // 2. Nutze das Profil-Mapping aus Phase 3 (dort liegen die target_tokens)
    const profiles = scenario.phase_3_ffn?.activation_profiles || [];
    const currentProfile = profiles.find(p =>
      String(p.ref_profile_id).trim() === String(activeProfileId).trim()
    ) || profiles[0];

    const T = Math.max(0.01, parseFloat(temperature) || 0.7);

    const results = finalOutputs.map(item => {
      // 3. Generisches Mapping über target_tokens aus dem Szenario-JSON
      const ffnCatDefinition = activeFFN?.find(f => {
        const meta = currentProfile?.activations?.find(a =>
          String(a.label).toLowerCase().trim() === String(f.label).toLowerCase().trim()
        );
        return meta?.target_tokens?.some(t =>
          String(t).toLowerCase().trim() === String(item.label).toLowerCase().trim()
        );
      });

      // --- LIVE-ABGLEICH MIT DEM SIMULATOR-STATE ---
      // Wir suchen die AKTUELLEN Werte im Simulator, falls ffnCatDefinition gefunden wurde
      const liveFFNData = simulator?.activeFFN?.find(f =>
        String(f.label).toLowerCase().trim() === String(ffnCatDefinition?.label).toLowerCase().trim()
      );

      // Falls wir Live-Daten haben, nutzen wir diese, sonst Fallback auf Definition oder 0.5
      const liveActivation = liveFFNData ? liveFFNData.activation : (ffnCatDefinition ? ffnCatDefinition.activation : 0.5);

      // 4. Berechnung des Bias (Hebel 24 für SCHLOSS-02)
      const ffnBias = (liveActivation - 0.5) * 24;
      const baseLogit = item.logit !== undefined ? item.logit : 5.0;

      // Noise/Entropy-Einfluss
      const jitter = (Math.random() - 0.5) * (noise || 0) * 2.0;
      const effectiveLogit = baseLogit + ffnBias + jitter;

      // Debug-Log zur Überprüfung der mathematischen Kette
      if (ffnCatDefinition && (item.label === "Prachtbau" || item.label === "Türschloss")) {
        console.log(`🧪 BIAS-CHECK [${item.label}]: Act=${liveActivation.toFixed(3)} | Bias=${ffnBias.toFixed(2)}`);
      }

      return {
        ...item,
        effectiveLogit,
        liveActivation,
        actingHead: ffnCatDefinition ? `Head ${ffnCatDefinition.linked_head}` : "Default",
        ffnBoost: ffnBias,
        isBlockedByMLP: liveActivation < mlpThreshold,
        exp: Math.exp(effectiveLogit / T)
      };
    });

    const sumExp = results.reduce((acc, curr) => acc + curr.exp, 0);
    return results.map(item => ({
      ...item,
      dynamicProb: sumExp > 0 ? item.exp / sumExp : 0
    })).sort((a, b) => b.dynamicProb - a.dynamicProb);

  }, [
    finalOutputs,
    activeFFN,
    simulator?.activeFFN, // Wichtig: React muss auf Änderungen im Simulator-FFN reagieren
    activeScenario,
    simulator?.activeScenario,
    activeProfileId,
    temperature,
    noise,
    mlpThreshold,
    JSON.stringify(headOverrides)
  ]);

  // Effekt zur Synchronisierung des States
  useEffect(() => {
    const results = calculateLogic();
    if (results) {
      setSimulationState(prev => ({
        outputs: results.slice(0, 10),
        winner: (prev.winner && results.find(r => r.label === prev.winner.label)) || results[0]
      }));
    }
  }, [calculateLogic, JSON.stringify(headOverrides), activeFFN]);

  // DER TRIGGER-EFFECT (Prüfe ob dieser exakt so aussieht!)
  useEffect(() => {
    console.log("🔄 [DECODER] Effect Sync...");
    const results = calculateLogic();
    if (results) {
      setSimulationState(prev => ({
        outputs: results.slice(0, 10),
        winner: (prev.winner && results.find(r => r.label === prev.winner.label)) || results[0]
      }));
    }
  }, [calculateLogic, headOverrides, activeFFN]); // Diese drei müssen das Update treiben

  const getInspectorData = useCallback((out, index) => {
    if (!out) return null;
    const { icon } = getItemVisuals(out);
    return {
      title: `${icon} Decoding: ${out.label}`,
      subtitle: `Kategorie: ${out.type}`,
      data: {
        "Einfluss durch": out.actingHead,
        "Aktivierung (Live)": (out.liveActivation * 100).toFixed(0) + "%",
        "Logit-Shift": (out.ffnBoost >= 0 ? "+" : "") + out.ffnBoost?.toFixed(2),
        "Wahrscheinlichkeit": (out.dynamicProb * 100).toFixed(2) + "%",
        "Status": out.isBlockedByMLP ? "BLOCKIERT (MLP)" : (index < topK ? "AKTIV" : "GEFILTERT")
      }
    };
  }, [topK, activeFFN]);

  // Fix 1: Robuste Inspektor-Aktualisierung
  const updateInspector = useCallback((label) => {
    const results = calculateLogic();
    const out = results?.find(o => o.label === label);
    const idx = results?.findIndex(o => o.label === label);
    if (out) setHoveredItem(getInspectorData(out, idx));
  }, [calculateLogic, getInspectorData, setHoveredItem]);

  // Sync bei Slider-Bewegung für selektiertes Item
  useEffect(() => {
    if (selectedLabel) updateInspector(selectedLabel);
  }, [headOverrides, mlpThreshold, noise, temperature, selectedLabel, updateInspector]);

  // Ersetze den bestehenden useEffect für die initialen Ergebnisse durch diesen:
  useEffect(() => {
    if (!isShuffling) {
      const results = calculateLogic();
      if (results) {
        setSimulationState(prev => {
          // Wir suchen den aktuellen Gewinner in den neuen Ergebnissen
          const newWinner = prev.winner
            ? results.find(r => r.label === prev.winner.label)
            : results[0];

          return {
            outputs: results.slice(0, 10),
            // Falls der alte Gewinner jetzt blockiert ist, nimm den neuen Spitzenreiter
            winner: (newWinner && !newWinner.isBlockedByMLP) ? newWinner : results[0]
          };
        });
      }
    }
    // WICHTIG: headOverrides muss hier als Dependency stehen!
  }, [calculateLogic, activeScenario?.id, activeProfileId, sourceTokenId, isShuffling, headOverrides]);

  // Fix 2: Resampling-Logik mit State-Lock
  const triggerResample = () => {
    setIsShuffling(true);
    setTimeout(() => {
      const results = calculateLogic();
      if (results) {
        // Filtere Kandidaten, die überhaupt gewürfelt werden können
        const candidates = results.filter((out, i) => i < topK && !out.isBlockedByMLP && out.dynamicProb > 0.001);

        let win = results[0];
        const r = Math.random();
        let cum = 0;
        for (let o of results) {
          cum += o.dynamicProb;
          if (r <= cum) { win = o; break; }
        }

        setSimulationState({ outputs: results.slice(0, 10), winner: win });
        if (setSelectedToken) setSelectedToken(win);
        // Wir markieren den neuen Gewinner auch im Inspektor
        setSelectedLabel(win.label);
      }
      setIsShuffling(false);
    }, 450);
  };

  useEffect(() => {
    if (!isShuffling) {
      const results = calculateLogic();
      if (results) {
        // Wir überschreiben den winner NUR, wenn noch kein winner durch triggerResample gesetzt wurde
        // oder wenn sich das Szenario/Token ändert.
        setSimulationState(prev => ({
          outputs: results.slice(0, 10),
          winner: prev.winner && results.find(r => r.label === prev.winner.label) ? results.find(r => r.label === prev.winner.label) : results[0]
        }));
      }
    }
  }, [calculateLogic, activeScenario?.id, activeProfileId, sourceTokenId, isShuffling]);

  const activeOptionsCount = useMemo(() => {
    return simulationState.outputs.filter((out, i) =>
      i < topK && out.dynamicProb >= minPThreshold && !out.isBlockedByMLP
    ).length;
  }, [simulationState.outputs, topK, minPThreshold]);

  return (
    <PhaseLayout
      title="Phase 4: Softmax Decoding Pipeline"
      subtitle="Physikalische Signal-Modulation & Sampling"
      theme={theme}
      badges={[
        { text: `Entropy: ${(noise || 0).toFixed(2)}`, className: noise > 1 ? "text-red-500 font-bold" : "text-slate-400" },
        { text: `MLP Filter: ${mlpThreshold.toFixed(2)}`, className: "text-blue-500 font-bold" }
      ]}
      visualization={
        <div className="flex flex-row h-full w-full gap-4 relative pt-12 px-2" onClick={() => { setSelectedLabel(null); setHoveredItem(null); }}>
          <div className={`flex flex-col justify-between items-end pb-10 pt-4 text-[8px] font-black w-8 shrink-0 ${theme === 'light' ? 'text-slate-500' : 'text-slate-600'}`}>
            <span>1.0</span><span>0.5</span><span>0.0</span>
          </div>

          <div className="relative flex-1 h-full flex flex-col justify-end">
            <div className="absolute inset-0 pb-10 pt-4 pointer-events-none opacity-20">
              <div className="absolute top-4 w-full border-t border-current opacity-20" />
              <div className="absolute top-1/2 w-full border-t border-current opacity-20" />
              <div className="absolute bottom-10 w-full border-t-2 border-current opacity-50" />
            </div>

            <div className="absolute left-0 w-full border-t-2 border-dashed border-red-500 z-30 transition-all duration-500 pointer-events-none"
              style={{ bottom: `calc(${(minPThreshold * 85)}% + 40px)` }}>
              <div className="absolute right-0 -top-2.5 px-1.5 py-0.5 bg-red-600 text-[7px] text-white rounded font-black uppercase shadow-lg">
                Gate: {(minPThreshold * 100).toFixed(0)}%
              </div>
            </div>

            <div className="relative flex items-end justify-around gap-1 lg:gap-2 h-full pb-10">
              {simulationState.outputs.map((out, i) => {
                const isWinner = simulationState.winner?.label === out.label;
                const isActive = i < topK && out.dynamicProb >= minPThreshold && !out.isBlockedByMLP;
                const { color, icon } = getItemVisuals(out);

                return (
                  <div key={i} className={`relative flex flex-col items-center flex-1 h-full justify-end transition-all duration-500 ${selectedLabel === out.label ? 'z-30' : 'z-10'} ${(!isActive && !isWinner) ? 'opacity-30 grayscale' : 'opacity-100'}`}
                    onMouseEnter={() => setHoveredItem(getInspectorData(out, i))}
                    onMouseLeave={() => selectedLabel ? updateInspector(selectedLabel) : setHoveredItem(null)}
                    onClick={(e) => { e.stopPropagation(); setSelectedLabel(out.label); }}
                  >
                    {isWinner && !isShuffling && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-[20px] animate-bounce z-40 bg-slate-900/50 rounded-full p-1 border border-white/20 shadow-xl">
                        {noise > 1.2 ? '🥴' : '🎯'}
                      </div>
                    )}
                    <div className="mb-1 text-[10px]">{icon}</div>
                    <span className={`text-[8px] font-black mb-1 ${(isActive || isWinner) ? (theme === 'light' ? 'text-slate-900' : 'text-blue-400') : 'text-slate-500'}`}>
                      {isShuffling ? (Math.random() * 100).toFixed(0) : (out.dynamicProb * 100).toFixed(0)}%
                    </span>
                    <div className={`w-full max-w-[40px] rounded-t-lg transition-all duration-300 ${isWinner && !isShuffling ? 'ring-2 ring-blue-500 shadow-lg' : ''} ${isShuffling ? 'animate-pulse opacity-50' : ''}`}
                      style={{
                        height: isShuffling ? `${Math.random() * 85}%` : `${out.dynamicProb * 85}%`,
                        backgroundColor: (isActive || isWinner) ? color : (theme === 'light' ? '#cbd5e1' : '#334155')
                      }}
                    />
                    <div className="absolute top-full pt-2 w-full text-center">
                      <span className={`text-[9px] uppercase tracking-tighter block truncate px-0.5 ${isWinner ? 'font-black text-blue-600' : 'text-slate-500'}`}>{out.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      }
      controls={[
        <div key="c-1" className="px-4 py-3 rounded-xl border border-white/5 bg-slate-900 flex flex-col justify-center h-full">
          <div className="flex justify-between items-center mb-2">
            <label className="text-[9px] uppercase font-black text-blue-500">Creativity (Temp)</label>
            <div className="text-xs font-mono font-black text-blue-500">{temperature.toFixed(2)}</div>
          </div>
          <input type="range" min="0.1" max="2.0" step="0.1" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} className="w-full h-1.5 accent-blue-500" />
        </div>,
        <div key="c-2" className="px-4 py-3 rounded-xl border border-white/5 bg-slate-900 flex flex-col justify-center h-full">
          <div className="flex justify-between items-center mb-2">
            <label className="text-[9px] uppercase font-black text-green-600">Filter (Top-K)</label>
            <div className="text-xs font-mono font-black text-green-600">{topK}</div>
          </div>
          <input type="range" min="1" max="10" step="1" value={topK} onChange={(e) => setTopK(parseInt(e.target.value))} className="w-full h-1.5 accent-green-600" />
        </div>,
        <div key="c-3" className="px-4 py-3 rounded-xl border border-white/5 bg-slate-900 flex flex-col justify-center h-full">
          <div className="flex justify-between items-center mb-2">
            <label className="text-[9px] uppercase font-black text-red-600">Min-P Quality</label>
            <div className="text-xs font-mono font-black text-red-600">{(minPThreshold * 100).toFixed(0)}%</div>
          </div>
          <input type="range" min="0.01" max="0.25" step="0.01" value={minPThreshold} onChange={(e) => setMinPThreshold(parseFloat(e.target.value))} className="w-full h-1.5 accent-red-600" />
        </div>,
        <div key="c-4" className="h-full">
          <button
            disabled={isShuffling || activeOptionsCount <= 1}
            onClick={triggerResample}
            className={`w-full h-full min-h-[56px] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2
            ${(isShuffling || activeOptionsCount <= 1) ? 'bg-slate-800 text-slate-500 opacity-50' : 'bg-blue-600 text-white border-blue-500/50 shadow-lg'}`}
          >
            {isShuffling ? "Sampling..." : "🎲 Re-Sample"}
          </button>
        </div>
      ]}
    />
  );
};

export default Phase4_Decoding;