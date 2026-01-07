import { useState, useMemo } from 'react';

export const useLLMSimulator = (activeScenario) => {
  // 1. Alle States für die Slider definieren
  const [noise, setNoise] = useState(0);
  const [temperature, setTemperature] = useState(1.0);
  const [activeProfileId, setActiveProfileId] = useState('scientific');
  const [mlpThreshold, setMlpThreshold] = useState(0.5);

  // 2. Phase 1 & 2: Vektor-Positionen berechnen
  const processedVectors = useMemo(() => {
    if (!activeScenario || !activeScenario.phase_1_embedding) return [];
    
    return activeScenario.phase_1_embedding.token_vectors.map(v => ({
      ...v,
      // Berechnung der Position inkl. Noise-Verschiebung
      displayX: (v.base_vector[0] * 100) + (Math.random() - 0.5) * noise * 20,
      displayY: (v.base_vector[1] * 100) + (Math.random() - 0.5) * noise * 20
    }));
  }, [activeScenario, noise]);

  // 3. Phase 3: FFN Aktivierung (Bento-Grid Daten)
  const activeFFN = useMemo(() => {
    // Sicherheitscheck: Existieren die FFN Daten im Szenario?
    if (!activeScenario || !activeScenario.phase_3_ffn || !activeScenario.phase_3_ffn.activation_profiles) {
      return [];
    }
    
    // Suche das Profil (z.B. scientific). Falls nicht gefunden, nimm das erste.
    const profile = activeScenario.phase_3_ffn.activation_profiles.find(
      p => p.ref_profile_id.toLowerCase() === activeProfileId.toLowerCase()
    ) || activeScenario.phase_3_ffn.activation_profiles[0];

    if (!profile) return [];

    // Erstelle das Array für die Bento-Karten
    return profile.activations.map(a => ({
      ...a,
      // Kategorie leuchtet auf, wenn sie über dem Schwellenwert liegt
      isActive: a.activation >= mlpThreshold
    }));
  }, [activeScenario, activeProfileId, mlpThreshold]);

  // 4. Phase 4: Decoding (Balkendiagramm Daten)
  const finalOutputs = useMemo(() => {
    if (!activeScenario || !activeScenario.phase_4_decoding) return [];
    
const outputs = activeScenario.phase_4_decoding.outputs;
  
  // Die Softmax-Berechnung muss die aktuelle 'temperature' nutzen
  // Wir nutzen Math.max(0.01), um eine Division durch Null zu verhindern
  const exponents = outputs.map(o => Math.exp(o.logit / Math.max(temperature, 0.01)));
  const sumExponents = exponents.reduce((a, b) => a + b, 0);
    
    return outputs.map((o, i) => ({
      ...o,
      probability: exponents[i] / sumExponents,
      // Halluzinations-Warnung (blinkt rot)
      isCritical: o.hallucination_risk > 0.7 && (noise > 2.5 || temperature > 1.4)
    }));
  }, [activeScenario, temperature, noise]);
  
  

  // 5. DAS WICHTIGSTE: Rückgabe aller Werte an die App
  return {
    noise, 
    setNoise,
    temperature, 
    setTemperature,
    activeProfileId, 
    setActiveProfileId,
    mlpThreshold, 
    setMlpThreshold,
    processedVectors,
    activeFFN,     // Hier war vermutlich der Fehler (muss exakt so heißen!)
    finalOutputs
  };
};