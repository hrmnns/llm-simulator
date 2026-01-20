# Szenario-Dokumentation: Halluzinations-Labor (Limits of Logic)

## 1. Übersicht & Didaktik

**ID:** `hallucination-lab-001`

**Prompt:** *"Die Hauptstadt von Frankreich ist"*

### Lernziel

Dieses Szenario visualisiert den **Kipppunkt der Logik**. Nutzer lernen:

1. Wie Faktenwissen in einem Transformer aktiv durch Attention-Signale "wachgeküsst" werden muss.
2. Dass eine Halluzination (Bananen-Republik) kein technischer Fehler ist, sondern das Ergebnis eines zu schwachen Logik-Signals, das am **MLP-Gate (Phase 3)** scheitert.
3. Wie **Positional Encodings** sicherstellen, dass das Modell weiß, dass "Frankreich" das Bezugswort für "ist" ist.

## 2. Technische Logik: Die Kausalitäts-Brücke

1. **Phase 1 (Embedding):** Die Positions-Vektoren bilden die lineare Satzstruktur ab. Ohne den **Position Weight Slider** verliert das Modell den Bezug zwischen der Entität (Frankreich) und der Abfrage (ist).
2. **Phase 2 (Attention):** Head 3 (Logik) fungiert als Fakten-Extraktor. Er leitet die Aufmerksamkeit vom Wort "ist" (ID 4) zurück auf "Frankreich" (ID 3).
3. **Phase 3 (FFN):** Die allgemeine Logik verknüpft:
* `Geographie`  **Head 3** (Logik/Fakten).
* `Zufall/Nonsense`  **Head 4** (Struktur/Rauschen).


4. **Phase 4 (Decoding):** Wenn `Geographie` in Phase 3 über 50% steigt, erhält "Paris" einen massiven Logit-Boost. Sinkt der Wert unter das MLP-Gate (20%), übernimmt der Nonsense-Pfad.

## 3. Vollständiges Szenario-JSON (`scenarios.json`)

```json
{
  "id": "hallucination-lab-001",
  "name": "Halluzinations-Labor: Der Logik-Verlust",
  "input_prompt": "Die Hauptstadt von Frankreich ist",
  "explanation": "Steuerung: Head 3 (Logik) für Fakten, Head 4 (Struktur) für Rauschen.",
  "phase_0_tokenization": {
    "tokens": [
      { "id": "0", "text": "Die" },
      { "id": "1", "text": "Hauptstadt" },
      { "id": "2", "text": "von" },
      { "id": "3", "text": "Frankreich" },
      { "id": "4", "text": "ist" }
    ]
  },
  "phase_1_embedding": {
    "token_vectors": [
      { "token_index": 0, "base_vector": [0.1, 0.1], "positional_vector": [-0.4, 0.0] },
      { "token_index": 1, "base_vector": [0.4, 0.5], "positional_vector": [-0.2, 0.0] },
      { "token_index": 2, "base_vector": [0.2, 0.2], "positional_vector": [0.0, 0.0] },
      { "token_index": 3, "base_vector": [0.8, 0.8], "positional_vector": [0.2, 0.0] },
      { "token_index": 4, "base_vector": [0.1, 0.1], "positional_vector": [0.4, 0.0] }
    ]
  },
  "phase_2_attention": {
    "attention_profiles": [
      {
        "id": "entropy-mode",
        "label": "Kontext: Fakten-Check",
        "rules": [
          { "head": 3, "source": "4", "target": "3", "strength": 1.4 },
          { "head": 4, "source": "4", "target": "0", "strength": 0.5 }
        ]
      }
    ]
  },
  "phase_3_ffn": {
    "activation_profiles": [
      {
        "ref_profile_id": "entropy-mode",
        "activations": [
          { "label": "Geographie", "activation": 0.50, "linked_head": 3, "color": "#3b82f6" },
          { "label": "Zufall/Nonsense", "activation": 0.50, "linked_head": 4, "color": "#f97316" }
        ]
      }
    ]
  },
  "phase_4_decoding": {
    "outputs": [
      { "label": "Paris", "logit": 5.0, "type": "Geographie" },
      { "label": "Bananen-Republik", "logit": 5.0, "type": "Zufall/Nonsense" }
    ]
  }
}

```

## 4. Test-Szenarien & Labor-Protokoll

| Testfall | UI-Eingriff | Effekt Phase 3 | Resultat Phase 4 |
| --- | --- | --- | --- |
| **A: Fakten-Sieg** | Wort **"ist"** wählen, **Head 3 auf Max** | Geographie leuchtet blau (>50%) | **Paris** gewinnt mit hoher Konfidenz. |
| **B: Logik-Verlust** | **Head 3 auf 0.1** reduzieren | Geographie sinkt unter 20% | **Bananen-Republik** übernimmt (Halluzination). |
| **C: Positions-Chaos** | **Position Weight Slider auf 0.0** | Räumliche Trennung in Phase 1 verschwindet | Attention-Linien in Phase 2 wirken "flacher", Fokus geht verloren. |
| **D: Rausch-Modus** | **Head 4 auf Max**, Temp auf 1.2 | Nonsense-Kategorie dominiert | Instabile Vorhersage, Modell "erfindet" Begriffe. |

## 5. UI/UX Highlights für dieses Szenario

* **Der "Kipppunkt":** Man kann beobachten, wie die Kategorie "Geographie" erst grau ist und bei ca. 0.6 Slider-Stärke (Head 3) plötzlich farbig (aktiv) wird. In diesem Moment springt die Wahrscheinlichkeit im Decoder schlagartig auf Paris um.
* **Entropie-Visualisierung:** Durch Erhöhen der Temperatur (Phase 4) fangen die Wahrscheinlichkeitsbalken an zu "zittern" – ein Zeichen für die Unsicherheit des Modells bei schwacher Logik-Anbindung.
* **Inspektor-Analyse:** Bei Klick auf "Paris" zeigt der Inspektor den Pfad: `Frankreich (ID 3) -> Head 3 -> Geographie -> Boost`.

**Dieses Szenario ist nun vollständig kompatibel mit deiner generischen `processedFFN`-Logik. Soll ich als Nächstes "Das Schloss" (Polysemie) finalisieren?**
