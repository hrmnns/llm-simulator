import React, { createContext, useState, useEffect, useContext } from 'react';

const ScenarioContext = createContext();

export const ScenarioProvider = ({ children }) => {
  const [scenarios, setScenarios] = useState([]);
  const [activeScenario, setActiveScenario] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initiales Laden der scenarios.json
  useEffect(() => {
    const baseUrl = import.meta.env.BASE_URL || "/";
    const dataPath = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}data/scenarios.json`;

    console.log("Fetch-Versuch von:", dataPath);

    fetch(dataPath)
      .then((response) => {
        if (!response.ok) throw new Error(`Server-Fehler: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        console.log("Daten empfangen:", data);

        // WICHTIG: Wir greifen auf den Schlüssel "scenarios" im Objekt zu
        const scenarioArray = data.scenarios;

        if (Array.isArray(scenarioArray) && scenarioArray.length > 0) {
          setScenarios(scenarioArray);
          setActiveScenario(scenarioArray[0]);
          setLoading(false); // Das beendet den "Lade Simulation..." Screen
        } else {
          console.error("Strukturfehler: 'scenarios' Feld nicht gefunden oder leer", data);
        }
      })
      .catch((error) => {
        console.error("Ladefehler:", error);
        // Damit die App nicht ewig hängen bleibt, beenden wir das Laden 
        // auch bei einem Fehler und zeigen eine Meldung
        setLoading(false);
      });
  }, []);

  // Global Reset Funktion: Wird beim Szenarien-Wechsel aufgerufen
  const handleScenarioChange = (scenarioId) => {
    const selected = scenarios.find(s => s.id === scenarioId);
    setActiveScenario(selected);

    // Da die App beim Szenarienwechsel neu lädt, 
    // werden die States im useLLMSimulator automatisch 
    // auf ihre Default-Werte (noise=0, temp=1.0) zurückgesetzt.
    // Falls du eine manuelle Reset-Funktion willst, könntest du diese hier triggern.
  };

  return (
    <ScenarioContext.Provider value={{
      scenarios,
      activeScenario,
      setActiveScenario, // <- Das hier MUSS rein, damit Header.jsx darauf zugreifen kann
      handleScenarioChange,
      loading
    }}>
      {children}
    </ScenarioContext.Provider>
  );
};

export const useScenarios = () => useContext(ScenarioContext);