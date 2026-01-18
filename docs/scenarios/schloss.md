# Szenario-Dokumentation: Mehrdeutigkeit (Das Schloss)

## 1. Übersicht & Didaktik

**ID:** `polysemie-schloss-labor`

**Prompt:** *"Das Schloss war für den Einbrecher kein Hindernis."*

### Lernziel

Dieses Szenario ist das Referenz-Beispiel für die **vertikale Kausalität** im Transformer-Modell. Es demonstriert, wie die Aufmerksamkeit (Phase 2) direkt steuert, welches Weltwissen (Phase 3) aktiviert wird und wie dies die physikalische Wahrscheinlichkeit im Decoder (Phase 4) mathematisch erzwingt.

## 2. Technische Logik: Die Kausalitäts-Brücke

Um die Verbindung zwischen dem aktivierten Weltwissen (FFN) und der Vorhersage (Decoding) abzubilden, nutzt der Simulator in Phase 4 eine dynamische Logit-Manipulation:

* **:** Die dynamische Live-Aktivierung der Kategorie aus Phase 3 (beeinflusst durch die Attention-Slider).
* **:** Der resultierende Bias, der auf den Basis-Logit des Wortes addiert wird.
* **12:** Ein didaktischer Verstärkungsfaktor, um deutliche "Kipp-Momente" in der Demo zu erzeugen.

## 3. Vollständiges Szenario-JSON (`scenarios.json`)

```json
{
  "id": "polysemie-schloss-labor",
  "name": "Mehrdeutigkeit: Das Schloss",
  "input_prompt": "Das Schloss war für den Einbrecher kein Hindernis.",
  "explanation": "Dieses Szenario demonstriert die Kausalitätskette eines LLMs: Attention-Heads (Phase 2) steuern die Wissens-Aktivierung (Phase 3), was wiederum die Wort-Wahrscheinlichkeiten im Decoder (Phase 4) physikalisch verschiebt.",
  "phase_0_tokenization": {
    "tokens": [
      { "id": "1", "text": "Das", "explanation": "Artikel (Neutral)" },
      { "id": "2", "text": "Schloss", "explanation": "Polysemes Nomen (Zentrum der Analyse)" },
      { "id": "3", "text": "war", "explanation": "Kopula-Verb (Zustand)" },
      { "id": "4", "text": "für", "explanation": "Präposition (Bezug)" },
      { "id": "5", "text": "den", "explanation": "Artikel (Bestimmt)" },
      { "id": "6", "text": "Einbrecher", "explanation": "Kontext-Anker für funktionale Bedeutung." },
      { "id": "7", "text": "kein", "explanation": "Negation" },
      { "id": "8", "text": "Hindernis", "explanation": "Abstrakter Kontext-Anker." },
      { "id": "9", "text": ".", "explanation": "Satzende" }
    ]
  },
  "phase_1_embedding": {
    "token_vectors": [
      { "token_index": 0, "base_vector": [0.1, 0.1], "positional_vector": [0.0, 0.1] },
      { "token_index": 1, "base_vector": [0.5, 0.5], "positional_vector": [0.1, 0.1] },
      { "token_index": 2, "base_vector": [0.2, 0.2], "positional_vector": [0.2, 0.1] },
      { "token_index": 3, "base_vector": [0.1, 0.1], "positional_vector": [0.3, 0.1] },
      { "token_index": 4, "base_vector": [0.1, 0.1], "positional_vector": [0.4, 0.1] },
      { "token_index": 5, "base_vector": [0.8, 0.7], "positional_vector": [0.5, 0.1] },
      { "token_index": 6, "base_vector": [0.1, 0.3], "positional_vector": [0.6, 0.1] },
      { "token_index": 7, "base_vector": [0.7, 0.8], "positional_vector": [0.7, 0.1] },
      { "token_index": 8, "base_vector": [0.1, 0.1], "positional_vector": [0.8, 0.1] }
    ]
  },
  "phase_2_attention": {
    "attention_profiles": [
      {
        "id": "scientific",
        "label": "Kontext: Sicherheit & Mechanik",
        "rules": [
          {
            "head": 1, "source": "2", "target": "6", "strength": 0.90,
            "explanation": "Semantik: 'Einbrecher' zieht die Bedeutung von 'Schloss' zur Mechanik."
          },
          {
            "head": 3, "source": "2", "target": "6", "strength": 0.95,
            "explanation": "Logik: Funktionale Interaktion zwischen Akteur und Objekt."
          },
          {
            "head": 2, "source": "2", "target": "1", "strength": 0.80,
            "explanation": "Syntax: Korrekte Artikel-Bindung."
          }
        ]
      },
      {
        "id": "architectural",
        "label": "Kontext: Architektur & Bauwerk",
        "rules": [
          {
            "head": 1, "source": "2", "target": "8", "strength": 0.85,
            "explanation": "Semantik: 'Schloss' wird als monumentales Hindernis/Gebäude interpretiert."
          },
          {
            "head": 3, "source": "2", "target": "8", "strength": 0.50,
            "explanation": "Logik: Ein Gebäude als räumliches Hindernis."
          },
          {
            "head": 4, "source": "2", "target": "2", "strength": 0.90,
            "explanation": "Struktur: Fokus auf das Nomen selbst ohne externen Kontext."
          }
        ]
      }
    ]
  },
  "phase_3_ffn": {
    "activation_profiles": [
      {
        "ref_profile_id": "scientific",
        "activations": [
          { "label": "Funktional", "activation": 0.65, "color": "#10b981" },
          { "label": "Wissenschaftlich", "activation": 0.20, "color": "#3b82f6" },
          { "label": "Sozial", "activation": 0.35, "color": "#f472b6" },
          { "label": "Evolutionär", "activation": 0.05, "color": "#f59e0b" }
        ]
      },
      {
        "ref_profile_id": "architectural",
        "activations": [
          { "label": "Wissenschaftlich", "activation": 0.75, "color": "#3b82f6" },
          { "label": "Funktional", "activation": 0.15, "color": "#10b981" },
          { "label": "Sozial", "activation": 0.10, "color": "#f472b6" },
          { "label": "Evolutionär", "activation": 0.05, "color": "#f59e0b" }
        ]
      }
    ]
  },
  "phase_4_decoding": {
    "outputs": [
      {
        "label": "Türschloss",
        "logit": 5.2,
        "type": "Funktional",
        "causality_trace": "Wird durch 'Funktional'-Aktivierung massiv verstärkt."
      },
      {
        "label": "Prachtbau",
        "logit": 4.9,
        "type": "Wissenschaftlich",
        "causality_trace": "Basis-Wahrscheinlichkeit hoch, sinkt aber bei mechanischem Fokus."
      },
      {
        "label": "Riegel",
        "logit": 3.8,
        "type": "Funktional",
        "causality_trace": "Mechanische Alternative zu 'Türschloss'."
      },
      {
        "label": "Residenz",
        "logit": 3.5,
        "type": "Wissenschaftlich",
        "causality_trace": "Architektonische Alternative zum Hauptgebäude."
      },
      {
        "label": "Sicherheit",
        "logit": 2.5,
        "type": "Funktional",
        "causality_trace": "Abstrakter Begriff aus dem Sicherheitsbereich."
      }
    ]
  }
}

```

## 4. Test-Szenarien & Erwartetes Verhalten

| Testfall | UI-Eingriff (Phase 2) | Effekt (Phase 3) | Vorhersage (Phase 4) | Didaktischer Fokus |
| --- | --- | --- | --- | --- |
| **A: Kontext-Sieg** | Head 3 (Logik) auf **1.0** | Funktional > 80% | **Türschloss** (~99%) | Korrektes Verständnis durch Attention. |
| **B: Halluzination** | Head 3 (Logik) auf **0.1** | Funktional < 20% | **Prachtbau** gewinnt | Fehlinterpretation durch Kontext-Verlust. |
| **C: Entropy-Test** | Noise auf **1.5** | Instabile Balken | **Jitter & 🥴 Icon** | Visualisierung statistischer Unschärfe. |

## 5. UI/UX Dokumentation

* **Auto-Reset:** Beim Wechsel in dieses Szenario werden alle Slider (Temp, Noise, MLP) auf Standardwerte (0.7, 0.0, 0.2) zurückgesetzt.
* **Deterministik-Logik:** Falls nur noch ein Kandidat über dem Min-P Gate liegt, wird der Re-Sample Button deaktiviert (Status: "Deterministisch").
* **Sampling-Visualisierung:** Während des Re-Samplings zeigt das System einen Shuffle-Effekt (450ms) zur Darstellung des stochastischen Prozesses.
