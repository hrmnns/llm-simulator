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
    const matchingCategory = activeFFN?.find(cat => cat.label === item.type);
    const color = item?.color || matchingCategory?.color || "#475569";
    let icon = "📄";
    const type = (item.type || "").toLowerCase();
    if (type.includes("geographie")) icon = "🌍";
    if (type.includes("wissenschaft")) icon = "🔬";
    if (type.includes("sozial")) icon = "🤝";
    if (type.includes("funktional")) icon = "⚙️";
    if (type.includes("poetisch")) icon = "✨";
    if (type.includes("nonsense") || type.includes("zufall")) icon = "🥴";
    return { color, icon };
  };

  const calculateLogic = useCallback(() => {
    if (!finalOutputs || finalOutputs.length === 0) return null;

    const getActiveHeadSignal = (headNum) => {
      const specificKey = `${activeProfileId}_s${sourceTokenId}_h${headNum}`;
      const looseKeyPart = `_h${headNum}`;
      const looseMatch = Object.entries(headOverrides || {}).find(([key]) => 
        key.startsWith(activeProfileId) && key.endsWith(looseKeyPart)
      );
      const slider = headOverrides?.[specificKey] ?? (looseMatch ? parseFloat(looseMatch[1]) : 0.7);
      const sliderFactor = slider / 0.7;
      const activeRules = activeAttention?.rules?.filter(r =>
        String(r.source) === String(sourceTokenId) && Number(r.head) === Number(headNum)
      ) || [];
      const rulesSum = activeRules.length > 0 ? activeRules.reduce((acc, r) => acc + parseFloat(r.strength), 0) : 0.30; 
      return Math.min(1.5, rulesSum * sliderFactor);
    };

    const sSemantik = getActiveHeadSignal(1);
    const sSyntax = getActiveHeadSignal(2);
    const sLogik = getActiveHeadSignal(3);
    const sStruktur = getActiveHeadSignal(4);
    const T = Math.max(0.01, parseFloat(temperature) || 0.7);

    const calculated = finalOutputs.map(item => {
      const ffnCat = activeFFN?.find(f => f.label === item.type);
      const baseActivation = ffnCat ? ffnCat.activation : 0.5;
      const typeLabel = (item.type || "").toLowerCase();
      let factor = 1.0;
      let actingHead = "Neutral / Bias";

      if (typeLabel.includes("geographie") || typeLabel.includes("fakten") || typeLabel.includes("funktional")) {
        factor = sLogik; actingHead = "Head 3 (Logik)";
      } else if (typeLabel.includes("nonsense") || typeLabel.includes("zufall")) {
        factor = Math.max(0.7, sStruktur); actingHead = "Head 4 (Struktur)";
      } else if (typeLabel.includes("wissenschaft")) {
        factor = (sSemantik + sSyntax) / 2; actingHead = "Head 1+2 (Akademisch)";
      } else if (typeLabel.includes("poetisch")) {
        factor = sSemantik; actingHead = "Head 1 (Semantik)";
      }

      const liveActivation = Math.max(0, Math.min(1.0, baseActivation * factor));
      const ffnBias = (liveActivation - 0.5) * 12;
      const jitter = (Math.random() - 0.5) * (noise || 0) * 2.0;
      const baseLogit = item.logit !== undefined ? item.logit : 5.0;
      const effectiveLogit = baseLogit + ffnBias + jitter;

      return {
        ...item, effectiveLogit, liveActivation, actingHead, ffnBoost: ffnBias,
        isBlockedByMLP: liveActivation < mlpThreshold,
        exp: Math.exp(effectiveLogit / T)
      };
    });

    const sum = calculated.reduce((acc, curr) => acc + curr.exp, 0);
    const probabilities = calculated.map(item => ({ ...item, dynamicProb: sum > 0 ? item.exp / sum : 0 }));
    return [...probabilities].sort((a, b) => b.dynamicProb - a.dynamicProb);
  }, [finalOutputs, temperature, mlpThreshold, activeFFN, noise, headOverrides, activeProfileId, sourceTokenId, activeAttention]);

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