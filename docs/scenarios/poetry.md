# Szenario-Dokumentation: Poesie-Generator (Reim vs. Botanik)

## 1. Übersicht & Didaktik

**ID:** `poetry-generator-001`

**Prompt:** *"Rosen sind rot, Veilchen sind"*

### Lernziel

Dieses Szenario visualisiert den internen Konflikt eines Sprachmodells zwischen **strukturellen Mustern** (Reimen) und **faktischem Wissen** (Botanik). Nutzer lernen:

1. Wie verschiedene Attention-Heads unterschiedliche Prioritäten setzen (Form vs. Inhalt).
2. Dass die „Wahrheit“ in einem LLM oft nur eine Frage der Gewichtung ist.
3. Wie die Unterdrückung eines Heads (Minimierung des Sliders) den anderen Pfad exklusiv freischaltet.

## 2. Technische Logik: Die Kausalitäts-Brücke

1. **Phase 1 (Embedding):** Die Tokens erhalten durch `positional_vector` eine klare Satzstruktur. Da der Slider standardmäßig auf **0.0** startet, müssen Nutzer erst Ordnung schaffen, um die Sequenzdidaktik zu verstehen.
2. **Phase 2 (Attention):** * **Head 4 (Struktur):** Schaut vom letzten Wort "sind" zurück auf "rot", um das Reim-Schema zu vervollständigen.
* **Head 1 (Semantik):** Schaut auf "Veilchen", um die biologische Eigenschaft der Pflanze zu extrahieren.


3. **Phase 3 (FFN):** Die Aktivierung der Kategorien folgt der generischen `linked_head`-Logik:
* `Poetisch`  **Head 4** (Reim-Schema).
* `Wissenschaft`  **Head 1** (Fakten-Wissen).


4. **Phase 4 (Decoding):** Wenn eine Kategorie dominiert, wird der entsprechende Logit ("blau" oder "violett") verstärkt. Bei Gleichstand (36%/36%) entscheidet das Sampling (Zufall).

## 3. Szenario-JSON (`scenarios.json`)

```json
{
  "id": "poetry-generator-001",
  "name": "Poesie-Generator: Reim vs. Botanik",
  "input_prompt": "Rosen sind rot, Veilchen sind",
  "explanation": "Steuerung: Head 1 (Semantik/Fakten) vs. Head 4 (Struktur/Reim).",
  "phase_0_tokenization": {
    "tokens": [
      { "id": "0", "text": "Rosen" },
      { "id": "1", "text": "sind" },
      { "id": "2", "text": "rot" },
      { "id": "3", "text": "," },
      { "id": "4", "text": "Veilchen" },
      { "id": "5", "text": "sind" }
    ]
  },
  "phase_1_embedding": {
    "token_vectors": [
      { "token_index": 0, "base_vector": [0.8, -0.2], "positional_vector": [-0.6, 0.0] },
      { "token_index": 1, "base_vector": [0.0, 0.0], "positional_vector": [-0.4, 0.0] },
      { "token_index": 2, "base_vector": [0.7, 0.5], "positional_vector": [-0.2, 0.0] },
      { "token_index": 3, "base_vector": [0.0, 0.0], "positional_vector": [0.0, 0.0] },
      { "token_index": 4, "base_vector": [0.6, -0.4], "positional_vector": [0.3, 0.0] },
      { "token_index": 5, "base_vector": [0.0, 0.0], "positional_vector": [0.6, 0.0] }
    ]
  },
  "phase_2_attention": {
    "attention_profiles": [
      {
        "id": "poetic-mode",
        "label": "Kontext: Stil-Analyse",
        "rules": [
          { "head": 1, "source": "5", "target": "4", "strength": 1.2, "explanation": "Semantik: Fokus auf die Pflanze 'Veilchen'." },
          { "head": 4, "source": "5", "target": "2", "strength": 1.4, "explanation": "Struktur: Suche nach einem Reimwort zu 'rot'." }
        ]
      }
    ]
  },
  "phase_3_ffn": {
    "activation_profiles": [
      {
        "ref_profile_id": "poetic-mode",
        "activations": [
          { "label": "Wissenschaft", "activation": 0.50, "linked_head": 1, "color": "#10b981" },
          { "label": "Poetisch", "activation": 0.50, "linked_head": 4, "color": "#8b5cf6" }
        ]
      }
    ]
  },
  "phase_4_decoding": {
    "outputs": [
      { "label": "blau", "logit": 5.1, "type": "Poetisch" },
      { "label": "violett", "logit": 5.0, "type": "Wissenschaft" }
    ]
  }
}

```

## 4. Testplan & Erwartete Ergebnisse

| Testfall | UI-Eingriff | Beobachtung Phase 3 | Vorhersage Phase 4 |
| --- | --- | --- | --- |
| **A: Der Reim-Fokus** | Pos. Weight: **1.0** <br>

<br> Head 4: **Max** <br>

<br> Head 1: **Min (0.1)** | **Poetisch** leuchtet violett auf (~36%). <br>

<br> Wissenschaft ist grau. | **"blau"** gewinnt eindeutig. |
| **B: Der Fakten-Fokus** | Pos. Weight: **1.0** <br>

<br> Head 1: **Max** <br>

<br> Head 4: **Min (0.1)** | **Wissenschaft** leuchtet grün auf (~36%). <br>

<br> Poetisch ist grau. | **"violett"** gewinnt eindeutig. |
| **C: Das Dilemma** | Pos. Weight: **1.0** <br>

<br> Head 1: **Max** <br>

<br> Head 4: **Max** | Beide Kategorien leuchten mit **36%**. | **Patt (50/50)**. <br>

<br> 🎲 Re-Sample nutzen! |
| **D: Struktur-Verlust** | Pos. Weight: **0.0** | Tokens kollabieren in Phase 1. | Attention wird diffus, Signal sinkt. |

## 5. UI/UX Features für dieses Szenario

* **Visualisierung der Pfade:** In Phase 2 sieht man beim Klick auf das letzte "sind" (ID 5) zwei Linien: Eine zu "Veilchen" (grün/Head 1) und eine zu "rot" (violett/Head 4).
* **Dynamisches Feedback:** Wenn der Nutzer Slider 4 bewegt, sieht er in Echtzeit, wie das Wort "blau" im Decoder wächst.
* **Inspektor-Detail:** Der Inspektor zeigt bei "violett", dass die Aktivierung aus der Kategorie "Wissenschaft" stammt, welche wiederum vom "Semantik-Head" gespeist wird.

**Das Poesie-Szenario ist damit vollständig dokumentiert. Möchtest du, dass wir nun die Tooltips in Phase 3 finalisieren, um die "linked_head"-Logik für den Nutzer textlich zu erklären?**
