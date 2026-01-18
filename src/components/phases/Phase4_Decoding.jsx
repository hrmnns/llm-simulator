import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PhaseLayout from './../PhaseLayout';

const Phase4_Decoding = ({ simulator, setHoveredItem, theme, activeScenario }) => {
  const { 
    temperature, setTemperature, finalOutputs, activeAttention, 
    setSelectedToken, mlpThreshold, activeFFN, noise, 
    headOverrides, activeProfileId, sourceTokenId 
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
    if (item.type?.includes("Wissenschaft")) icon = "🔬";
    if (item.type?.includes("Sozial")) icon = "🤝";
    if (item.type?.includes("Funktional")) icon = "⚙️";
    if (item.type?.includes("Evolution")) icon = "🦴";
    return { color, icon };
  };

  // KERN-LOGIK: Berechnung der Wahrscheinlichkeiten ohne Side-Effects
  const calculateLogic = useCallback(() => {
    if (!finalOutputs || finalOutputs.length === 0) return null;

    const storageKey = activeScenario ? `sim_overrides_${activeScenario.id}` : 'sim_overrides_temp';
    let savedData = {};
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) savedData = JSON.parse(raw);
    } catch (e) {}

    const findWeight = (headNum) => {
      const entries = Object.entries(savedData);
      const matchingEntry = entries.find(([key]) => key.startsWith(`${activeProfileId}_`) && key.endsWith(`_h${headNum}`));
      if (matchingEntry) return parseFloat(matchingEntry[1]);
      if (headOverrides) {
        const stateEntry = Object.entries(headOverrides).find(([key]) => key.startsWith(`${activeProfileId}_`) && key.endsWith(`_h${headNum}`));
        if (stateEntry) return parseFloat(stateEntry[1]);
      }
      return 0.7;
    };

    const wLogik = findWeight(3);
    const wSemantik = findWeight(1);
    const wSyntax = findWeight(2);
    const T = Math.max(0.01, parseFloat(temperature) || 0.7);

    const calculated = finalOutputs.map(item => {
      const ffnCat = activeFFN?.find(f => f.label === item.type);
      const baseActivation = ffnCat ? ffnCat.activation : 0.5;
      const typeLabel = (item.type || "").toLowerCase();
      
      let factor = 1.0;
      if (typeLabel.includes("funktional")) factor = wLogik / 0.7;
      else if (typeLabel.includes("wissenschaft")) factor = ((wSemantik + wSyntax) / 2) / 0.7;

      const liveActivation = baseActivation * factor;
      const ffnBias = (liveActivation - 0.5) * 12; 
      const jitter = (Math.random() - 0.5) * (noise || 0) * 2.5;

      const baseLogit = item.logit !== undefined ? item.logit : Math.log(item.probability + 0.0001);
      const effectiveLogit = baseLogit + ffnBias + jitter;

      return { 
        ...item, 
        effectiveLogit, 
        liveActivation,
        isBlockedByMLP: liveActivation < mlpThreshold,
        ffnBoost: ffnBias,
        exp: Math.exp(effectiveLogit / T) 
      };
    });

    const sum = calculated.reduce((acc, curr) => acc + curr.exp, 0);
    const probabilities = calculated.map(item => ({
      ...item,
      dynamicProb: sum > 0 ? item.exp / sum : 0
    }));

    const sorted = [...probabilities].sort((a, b) => b.dynamicProb - a.dynamicProb);
    return sorted;
  }, [finalOutputs, temperature, mlpThreshold, activeFFN, noise, headOverrides, activeProfileId, activeScenario]);

  // Funktion für das manuelle Re-Sampling (mit Shuffle-Effekt)
  const triggerResample = () => {
    setIsShuffling(true);
    setTimeout(() => {
      const results = calculateLogic();
      if (results) {
        let winnerCandidate = results[0];
        const r = Math.random();
        let cumulative = 0;
        for (let i = 0; i < results.length; i++) {
          cumulative += results[i].dynamicProb;
          if (r <= cumulative) { winnerCandidate = results[i]; break; }
        }
        setSimulationState({ outputs: results.slice(0, 10), winner: winnerCandidate });
        if (setSelectedToken) setSelectedToken(winnerCandidate);
      }
      setIsShuffling(false);
    }, 450);
  };

  // Effekt für Slider-Änderungen: Berechnet sofort, aber OHNE Shuffle
  useEffect(() => {
    const results = calculateLogic();
    if (results) {
      // Wenn wir nur Parameter ändern, wählen wir meist den Top-Kandidaten als Winner
      // außer es läuft gerade ein Shuffle
      if (!isShuffling) {
        setSimulationState({ outputs: results.slice(0, 10), winner: results[0] });
        if (setSelectedToken) setSelectedToken(results[0]);
      }
    }
  }, [calculateLogic, activeScenario, activeProfileId, sourceTokenId]);

  // Prüfen, wie viele Optionen mathematisch "aktiv" sind
  const activeOptionsCount = useMemo(() => {
    return simulationState.outputs.filter((out, i) => 
      i < topK && out.dynamicProb >= minPThreshold && !out.isBlockedByMLP
    ).length;
  }, [simulationState.outputs, topK, minPThreshold]);

  const getInspectorData = (out, index) => {
    const { icon } = getItemVisuals(out);
    return {
      title: `${icon} Decoding: ${out.label}`,
      subtitle: `Kategorie: ${out.type}`,
      data: {
        "Aktivierung (Live)": (out.liveActivation * 100).toFixed(0) + "%",
        "Logit-Shift": (out.ffnBoost >= 0 ? "+" : "") + out.ffnBoost?.toFixed(2),
        "Wahrscheinlichkeit": (out.dynamicProb * 100).toFixed(2) + "%",
        "Status": out.isBlockedByMLP ? "BLOCKIERT (MLP)" : (index < topK ? "AKTIV" : "GEFILTERT")
      }
    };
  };

  return (
    <PhaseLayout
      title="Phase 4: Softmax Decoding Pipeline"
      subtitle="Physikalische Signal-Modulation & Sampling"
      theme={theme}
      badges={[
        { text: `Entropy: ${(noise || 0).toFixed(2)}`, className: noise > 1 ? "text-red-500 font-bold border-red-500/20" : "text-slate-400 border-white/5" },
        { text: `MLP Filter: ${mlpThreshold.toFixed(2)}`, className: "text-blue-500 font-bold border-blue-500/20" }
      ]}
      visualization={
        <div className="flex flex-row h-full w-full gap-4 relative pt-12 px-2" onClick={() => { setSelectedLabel(null); setHoveredItem(null); }}>
          <div className={`flex flex-col justify-between items-end pb-10 pt-4 text-[8px] font-black w-8 shrink-0 ${theme === 'light' ? 'text-slate-500' : 'text-slate-600'}`}>
            <span>1.0</span><span>0.5</span><span className={theme === 'light' ? 'text-slate-900' : 'text-slate-300'}>0.0</span>
          </div>

          <div className="relative flex-1 h-full flex flex-col justify-end">
            <div className="absolute inset-0 pb-10 pt-4 pointer-events-none opacity-20">
              <div className={`absolute top-4 w-full border-t ${theme === 'light' ? 'border-slate-500' : 'border-white/10'}`} />
              <div className={`absolute top-1/2 w-full border-t ${theme === 'light' ? 'border-slate-500' : 'border-white/10'}`} />
              <div className={`absolute bottom-10 w-full border-t-2 ${theme === 'light' ? 'border-slate-900' : 'border-slate-700'}`} />
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
                const isTopK = i < topK;
                const isAboveThreshold = out.dynamicProb >= minPThreshold;
                const isActive = isTopK && isAboveThreshold && !out.isBlockedByMLP;
                const { color, icon } = getItemVisuals(out);

                return (
                  <div key={i} className={`relative flex flex-col items-center flex-1 h-full justify-end transition-all duration-500 ${selectedLabel === out.label ? 'z-30' : 'z-10'} ${(!isActive && !isWinner) ? 'opacity-30 grayscale' : 'opacity-100'}`}
                    onMouseEnter={() => !selectedLabel && setHoveredItem(getInspectorData(out, i))}
                    onMouseLeave={() => !selectedLabel && setHoveredItem(null)}
                    onClick={(e) => { e.stopPropagation(); setSelectedLabel(out.label); }}
                  >
                    {isWinner && !isShuffling && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-[20px] animate-bounce z-40 bg-slate-900/50 rounded-full p-1 border border-white/20 shadow-xl">
                        {noise > 1.2 ? '🥴' : '🎯'}
                      </div>
                    )}
                    {out.isBlockedByMLP && !isWinner && <div className="absolute top-0 text-[10px] z-20">🚫</div>}
                    <div className="mb-1 text-[10px]">{icon}</div>
                    <span className={`text-[8px] font-black mb-1 ${(isActive || isWinner) ? (theme === 'light' ? 'text-slate-900' : 'text-blue-400') : 'text-slate-500'}`}>
                      {isShuffling ? (Math.random() * 100).toFixed(0) : (out.dynamicProb * 100).toFixed(0)}%
                    </span>
                    <div className={`w-full max-w-[40px] rounded-t-lg transition-all duration-300 ${isWinner && !isShuffling ? 'ring-2 ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : ''} ${isShuffling ? 'animate-pulse opacity-50' : ''}`}
                      style={{ 
                        height: isShuffling ? `${Math.random() * 85}%` : `${out.dynamicProb * 85}%`, 
                        backgroundColor: (isActive || isWinner) ? color : (theme === 'light' ? '#cbd5e1' : '#334155') 
                      }}
                    />
                    <div className="absolute top-full pt-2 w-full text-center">
                      <span className={`text-[9px] uppercase tracking-tighter block truncate px-0.5 ${isWinner ? 'font-black text-blue-600' : (theme === 'light' ? 'text-slate-800' : 'text-slate-500')}`}>{out.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      }
      controls={[
        <div key="c-1" className={`${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-white/5'} px-4 py-3 rounded-xl border flex flex-col justify-center h-full`}>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[9px] uppercase font-black text-blue-500 tracking-widest">Creativity (Temp)</label>
            <div className="text-xs font-mono font-black text-blue-500">{temperature.toFixed(2)}</div>
          </div>
          <input type="range" min="0.1" max="2.0" step="0.1" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-400/20 rounded-lg appearance-none cursor-pointer accent-blue-500" />
        </div>,
        <div key="c-2" className={`${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-white/5'} px-4 py-3 rounded-xl border flex flex-col justify-center h-full`}>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[9px] uppercase font-black text-green-600 tracking-widest">Filter (Top-K)</label>
            <div className="text-xs font-mono font-black text-green-600">{topK}</div>
          </div>
          <input type="range" min="1" max="10" step="1" value={topK} onChange={(e) => setTopK(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-400/20 rounded-lg appearance-none cursor-pointer accent-green-600" />
        </div>,
        <div key="c-3" className={`${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-white/5'} px-4 py-3 rounded-xl border flex flex-col justify-center h-full`}>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[9px] uppercase font-black text-red-600 tracking-widest">Min-P Quality</label>
            <div className="text-xs font-mono font-black text-red-600">{(minPThreshold * 100).toFixed(0)}%</div>
          </div>
          <input type="range" min="0.01" max="0.25" step="0.01" value={minPThreshold} onChange={(e) => setMinPThreshold(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-400/20 rounded-lg appearance-none cursor-pointer accent-red-600" />
        </div>,
        <div key="c-4" className="h-full">
          <button
            disabled={isShuffling || activeOptionsCount <= 1}
            onClick={triggerResample}
            className={`w-full h-full min-h-[56px] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all flex flex-col items-center justify-center gap-1 border-2
            ${(isShuffling || activeOptionsCount <= 1) 
              ? 'bg-slate-800 text-slate-500 border-transparent cursor-not-allowed opacity-50' 
              : 'bg-blue-600 text-white hover:bg-blue-700 border-blue-500/50'}`}
          >
            {isShuffling ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span className="text-sm">🎲 Re-Sample</span>
                {activeOptionsCount <= 1 && <span className="text-[7px] opacity-60">Deterministisch</span>}
              </>
            )}
          </button>
        </div>
      ]}
    />
  );
};

export default Phase4_Decoding;