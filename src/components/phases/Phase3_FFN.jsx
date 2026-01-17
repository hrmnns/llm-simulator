import React, { useState, useMemo, useEffect } from 'react';
import PhaseLayout from './../PhaseLayout';

const Phase3_FFN = ({ simulator, setHoveredItem, theme, activeScenario }) => {
  const { mlpThreshold, setMlpThreshold, activeFFN, activeAttention, activeProfileId, headOverrides, sourceTokenId } = simulator;
  const [selectedLabel, setSelectedLabel] = useState(null);

  const pipelineSignal = activeAttention?.avgSignal || 1.0;
  const isDegraded = pipelineSignal < 0.7;
  const isCritical = pipelineSignal < 0.4;

  const getDynamicStyles = (cat) => {
    const baseColor = cat.color || "#3b82f6";
    if (!cat.isActuallyActive) {
      return { 
        borderColor: 'rgba(255,255,255,0.05)', 
        backgroundColor: 'rgba(15, 23, 42, 0.4)', 
        color: 'rgba(255,255,255,0.2)',
        boxShadow: 'none'
      };
    }
    return { 
      borderColor: baseColor, 
      backgroundColor: `${baseColor}10`, 
      color: baseColor, 
      boxShadow: `0 10px 15px -3px ${baseColor}33` 
    };
  };

  const processedFFN = useMemo(() => {
    if (!activeFFN) return [];

    const storageKey = activeScenario ? `sim_overrides_${activeScenario.id}` : 'sim_overrides_temp';
    let savedData = {};
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) savedData = JSON.parse(raw);
    } catch (e) {}

    const findUniversalWeight = (headNum) => {
      const entries = Object.entries(savedData);
      const matchingEntry = entries.find(([key]) => 
        key.startsWith(`${activeProfileId}_`) && key.endsWith(`_h${headNum}`)
      );
      if (matchingEntry) return parseFloat(matchingEntry[1]);
      
      if (headOverrides) {
        const stateEntry = Object.entries(headOverrides).find(([key]) => 
          key.startsWith(`${activeProfileId}_`) && key.endsWith(`_h${headNum}`)
        );
        if (stateEntry) return parseFloat(stateEntry[1]);
      }
      return 0.7;
    };

    const wLogik = findUniversalWeight(3);
    const wSemantik = findUniversalWeight(1);
    const wSyntax = findUniversalWeight(2);
    const wStruktur = findUniversalWeight(4);

    return activeFFN.map(cat => {
      const label = (cat.label || "").toLowerCase();
      let factor = 1.0;

      if (label.includes("funktional") || label.includes("functional")) {
        factor = wLogik / 0.7; 
      } 
      else if (label.includes("wissenschaft") || label.includes("scientific")) {
        factor = ((wSemantik + wSyntax) / 2) / 0.7;
      }
      else {
        factor = ((wSemantik + wStruktur) / 2) / 0.7;
      }

      const finalVal = Math.max(0, Math.min(1.0, (cat.activation || 0) * factor * pipelineSignal));
      
      return {
        ...cat,
        activation: finalVal,
        isActuallyActive: finalVal >= mlpThreshold,
        currentWeight: factor
      };
    });
  }, [activeFFN, mlpThreshold, activeProfileId, sourceTokenId, pipelineSignal, activeScenario, headOverrides]);

  const activeCategory = useMemo(() => {
    const active = [...processedFFN].sort((a,b) => b.activation - a.activation)[0];
    return (active && active.activation >= mlpThreshold) ? active.label : "Keine Dominanz";
  }, [processedFFN, mlpThreshold]);

  const getInspectorData = (cat) => ({
    title: `🧠 Wissens-Extraktion: ${cat.label}`,
    subtitle: `Resonanz auf Phase 2 Heads`,
    data: {
      "--- Mechanik": "---",
      "Status": cat.isActuallyActive ? "AKTIVIERT" : "UNTERDRÜCKT",
      "Signal-Einfluss": isCritical ? "KRITISCH (Rauschen)" : isDegraded ? "GEDÄMPFT" : "OPTIMAL",
      "--- Mathematik": "---",
      "Netz-Spannung": (cat.activation * 100).toFixed(1) + "%",
      "Slider-Einfluss": ((cat.currentWeight || 1) * 100).toFixed(0) + "%",
      "--- Erkenntnis": "---",
      "Information": cat.isActuallyActive 
        ? `Das FFN-Netzwerk erkennt das Muster durch die Verstärkung der relevanten Attention-Heads.` 
        : `Die aktuelle Attention-Gewichtung reicht nicht aus, um dieses Wissensgebiet zu aktivieren.`
    }
  });

  useEffect(() => {
    if (selectedLabel) {
      const cat = processedFFN.find(c => c.label === selectedLabel);
      if (cat) setHoveredItem(getInspectorData(cat));
    }
  }, [processedFFN, mlpThreshold, selectedLabel]);

  const handleCategoryClick = (cat, e) => {
    e.stopPropagation();
    if (selectedLabel === cat.label) {
      setSelectedLabel(null);
      setHoveredItem(null);
    } else {
      setSelectedLabel(cat.label);
      setHoveredItem(getInspectorData(cat));
    }
  };

  if (!activeFFN || activeFFN.length === 0) return null;

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
              const glitchClass = isCritical && cat.isActuallyActive ? "animate-pulse skew-x-1" : "";
              const dynamicStyles = getDynamicStyles(cat);
              
              return (
                <div key={cat.label} style={dynamicStyles}
                  onMouseEnter={() => !selectedLabel && setHoveredItem(getInspectorData(cat))}
                  onMouseLeave={() => !selectedLabel && setHoveredItem(null)}
                  className={`relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all duration-500 cursor-pointer overflow-hidden ${!cat.isActuallyActive ? 'grayscale opacity-40' : ''} ${isSelected ? 'ring-2 ring-white scale-105 z-20' : 'z-10'} ${glitchClass}`}
                  onClick={(e) => handleCategoryClick(cat, e)}
                >
                  <div className="absolute bottom-0 left-0 w-full transition-all duration-1000 opacity-10 pointer-events-none"
                    style={{ 
                      height: `${cat.activation * 100}%`, 
                      backgroundColor: 'currentColor',
                      filter: isDegraded ? `blur(${5 * (1 - pipelineSignal)}px)` : 'none'
                    }} />
                  
                  <div className="z-10 text-[10px] font-black uppercase tracking-widest text-center px-2">{cat.label}</div>
                  <div className="z-10 text-[9px] font-mono mt-2 opacity-60">{(cat.activation * 100).toFixed(0)}% Active</div>
                  
                  {cat.isActuallyActive && <div className="absolute top-4 right-4 text-xl transition-all duration-500">
                    {cat.label.includes("Wissenschaft") && "🔬"}
                    {cat.label.includes("Funktional") && "⚙️"}
                    {cat.label.includes("Sozial") && "🤝"}
                    {cat.label.includes("Evolution") && "🦴"}
                    {!["Wissenschaft", "Funktional", "Sozial", "Evolution"].some(s => cat.label.includes(s)) && "🧠"}
                  </div>}

                  <div className={`absolute top-4 left-4 w-1.5 h-1.5 rounded-full ${cat.isActuallyActive ? 'bg-current shadow-[0_0_10px_currentColor]' : 'bg-slate-800'}`} />
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