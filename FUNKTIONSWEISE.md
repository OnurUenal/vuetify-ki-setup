# Vuetify statt Div-Suppe: wie dieses Setup funktioniert

Warum KI-Assistenten in Vue-Projekten rohe `<div>`s bauen, und wie die vier
Schichten in diesem Repo sie zuverlässig im Framework-Idiom halten.

## Warum die KI überhaupt Divs baut

**Statistisches Vorwissen.** Die Trainingsdaten der Modelle sind voll mit
rohem HTML, CSS und React. Idiomatischer Vuetify-Code ist selten. Ohne
Gegendruck fällt jedes Modell auf das statistisch Häufigste zurück:
`<div class="…">` plus eigenes CSS, selbst wenn `<v-row>` daneben im
Projekt steht.

**Doku-Zugriff ändert kein Verhalten.** Ein Vuetify-MCP macht die Doku
nachschlagbar, zwingt aber niemanden, sie zu benutzen. Ein Nachschlagewerk
ist keine Hausordnung.

**Es fehlt die Rückkopplung.** Solange nichts rot wird, gilt Div-Suppe als
Erfolg. Der Kern der Lösung ist deshalb nicht besseres Bitten, sondern
deterministische Durchsetzung: Regeln, die bei jedem Turn präsent sind,
plus ein Linter, der Verstöße mit Exit-Code 1 quittiert.

## So greift alles ineinander

Was passiert, wenn die KI eine `.vue`-Datei anfasst, Schritt für Schritt:

1. **Auftrag:** „Füge ein Suchfeld hinzu." Das Modell hat dabei die
   [AGENTS.md](./AGENTS.md) (Schicht 1) im Kontext, bei jeder einzelnen
   Nachricht neu. Im Normalfall entsteht deshalb direkt Vuetify-Code.
2. **Schreiben:** Das Modell ändert die Datei über sein write- oder
   edit-Tool.
3. **Hook:** Unmittelbar danach feuert das
   [Plugin](./.opencode/plugins/vue-lint-feedback.js)
   (`tool.execute.after`) und lässt ESLint nur über diese eine Datei
   laufen. Kostet etwa eine Sekunde, unabhängig von der Projektgröße.
4. **Prüfung:** ESLint parst das Template in einen Syntaxbaum. Darauf
   matchen die zwei Regeln aus der [eslint.config.js](./eslint.config.js):
   verbotene native Elemente (button, input, table, …) sowie die
   Selektoren für `<div class="…">` und Inline-Styles. Geprüft wird nur
   der `<template>`-Teil; die Script-Logik bleibt bewusst frei.
5. **Feedback:** Bei Treffern hängt das Plugin die Meldungen samt Anweisung
   („sofort selbstständig beheben, nicht nachfragen") ans Tool-Ergebnis.
   Für das Modell sieht das aus, als käme die Rückmeldung vom Schreib-Tool
   selbst: unübersehbar, und in jeder Runde frisch.
6. **Korrektur:** Das Modell bessert nach und schreibt erneut; damit feuert
   der Hook wieder. Die Schleife endet erst, wenn ESLint nichts mehr meldet.
7. **Letzter Riegel:** `npm run lint` als Pflicht-Check in der CI prüft
   modellunabhängig. Div-Suppe kann nicht gemerged werden, selbst wenn ein
   Modell komplett danebengreift.

Warum das robust bleibt: Chat-Anweisungen verblassen in langen Sessions,
aber die AGENTS.md wird jede Runde neu eingespeist, und das Lint-Feedback
klebt direkt am Tool-Ergebnis, dem Modelle am stärksten vertrauen. Der
durchsetzende Teil ist zudem deterministisch: ESLint wird nie müde,
vergisst keine Regel und wird mit der Zeit nicht langsamer, weil immer nur
die eine geänderte Datei geprüft wird. Die Masse der Regeln gehört deshalb
in den Linter (kostet dort null Kontext-Tokens), die AGENTS.md bleibt eine
Seite, und nur abrufbares Spezialwissen wandert in Skills (Schicht 4).

## Schicht 1: AGENTS.md, die Hausordnung

OpenCode lädt [AGENTS.md](./AGENTS.md) aus dem Projektroot in jede Session
(global: `~/.config/opencode/AGENTS.md`; ein vorhandenes `CLAUDE.md` wird
als Fallback gelesen). Hier gehören die UI-Regeln hin, nicht in einen
Skill. Entscheidend sind harte Formulierungen, eine Ersetzungstabelle und
ein Falsch/Richtig-Paar: Negative Beispiele wirken bei Modellen erstaunlich
gut.

## Schicht 2: ESLint als harte Grenze

Zwei Regeln aus `eslint-plugin-vue` erledigen die Arbeit
(siehe [eslint.config.js](./eslint.config.js)):

- `vue/no-restricted-html-elements` verbietet native Elemente mit einer
  eigenen Meldung pro Element. Die Meldung sagt der KI gleich, was sie
  stattdessen nehmen soll.
- `vue/no-restricted-syntax` matcht per AST-Selektor gezielt
  `<div class="…">` und Inline-Styles. Ein nackter `<div>` ohne `class`
  bleibt erlaubt, den braucht man legitim als Wrapper.

### Der Beweis (ESLint 10.6.0, eslint-plugin-vue 10.9.2)

Typische KI-Div-Suppe:

```vue
<div class="page-wrapper">
  <div class="toolbar" style="display: flex">
    <div class="toolbar__title">Kunden</div>
    <button class="btn primary" @click="add">Neu</button>
  </div>
  <input v-model="query" placeholder="Suche" />
  <table>…</table>
  <div>Plain-Wrapper ohne class</div>
</div>
```

Ergebnis von `npx eslint bad.vue good.vue`:

```text
bad.vue
  2:8   error  Kein <div class="…"> für Layout/Styling: nutze v-container/v-row/v-col, v-sheet oder v-card …
  3:10  error  Kein <div class="…"> für Layout/Styling: …
  3:26  error  Keine Inline-Styles: nutze Vuetify-Props, Utility-Klassen (pa-*, ma-*, d-flex) oder Theme-Farben
  4:12  error  Kein <div class="…"> für Layout/Styling: …
  5:7   error  Nutze <v-btn> statt <button>
  7:5   error  Nutze <v-text-field>/<v-checkbox>/<v-switch>/<v-file-input> statt <input>
  8:5   error  Nutze <v-data-table>/<v-table> statt <table>

✖ 7 problems (7 errors, 0 warnings)   Exit-Code 1
good.vue (v-toolbar, v-text-field, v-data-table): 0 Fehler
```

**Bestandscode voller Verstöße?** Regeln zuerst über das `files`-Glob auf
neue Bereiche begrenzen (z. B. `src/features/**`) oder das Aufräumen als
erste Aufgabe an die KI geben, Ordner für Ordner. Zusätzlich lohnt sich
[eslint-plugin-vuetify](https://github.com/vuetifyjs/eslint-plugin-vuetify):
Es fängt veraltete Vuetify-Props, -Klassen und -Komponenten (v2→v3, v3→v4).

## Schicht 3: das Auto-Korrektur-Plugin

Damit die KI Verstöße im selben Arbeitsschritt sieht, hängt das
[Plugin](./.opencode/plugins/vue-lint-feedback.js) nach jedem
`edit`/`write` an einer `.vue`-Datei das ESLint-Ergebnis an die
Tool-Ausgabe an. Die API: Hook `tool.execute.after`, Dateipfad in
`input.args.filePath`, `$` ist die Bun-Shell. Ablageort projektweit:
`.opencode/plugins/`, global: `~/.config/opencode/plugins/`.

Wichtig ist der **imperative Meldungstext** („sofort selbstständig beheben,
nicht nachfragen"): Mit weicher Formulierung fragen Modelle bei wörtlich
bindenden Aufträgen („ersetze exakt durch …") sonst erst zurück, statt zu
korrigieren.

### Der Beweis (live, OpenCode 1.17.13)

Reproduziert am 05.07.2026 headless per `opencode run`, Plugin exakt wie im
Repo, Projekt bewusst ohne weitere Hilfen, getestet mit Gemini 2.5 Flash
und lokal mit Qwen3-VL 32B. Erst schreibt das Modell auf Anweisung eine
Verstoß-Datei: Das Plugin hängt die Meldungen an, das Modell korrigiert
selbstständig. Auszug aus dem gespeicherten Tool-Output der Session:

```text
# Lauf A: write-Tool-Output nach bewusster Verstoß-Datei
[ESLint] Regelverstöße in dieser Datei:
src/App.vue
  2:8  error  Kein <div class="…"> für Layout/Styling: nutze v-container/v-row/v-col, v-sheet oder v-card …
  3:5  error  Nutze <v-btn> statt <button>
✖ 2 problems (2 errors, 0 warnings)

# Lauf B: „Füge ein Suchfeld für Kundennamen hinzu" (keine weiteren Regeln im Kontext)
# 1. Edit: rohes <input>, Plugin meldet, Modell korrigiert im nächsten Edit selbst:
-    <input type="text" placeholder="Kundennamen suchen..." />
-  </div>
+    <v-text-field label="Kundennamen suchen" />
+  </v-sheet>
# Ergebnis: npx eslint src → 0 Fehler, keine einzige Rückfrage
```

## Schicht 4: Skills und MCP richtig einordnen

Skills werden on demand geladen: Das Modell sieht nur die `description`
und entscheidet selbst, ob es den Skill zieht. Für Dauerregeln wie „bau
keine Divs" ist das das falsche Werkzeug, die gehören in die immer geladene
AGENTS.md. Skills lohnen sich für tiefes, abrufbares Wissen
(siehe [SKILL.md-Gerüst](./.opencode/skills/vuetify-patterns/SKILL.md)),
und ihre description muss die Auslöse-Situationen konkret benennen, sonst
werden sie nie geladen. Gültige Pfade: `.opencode/skills/<name>/SKILL.md`
im Projekt oder `~/.config/opencode/skills/…` global.

Und der Vuetify-MCP? Behalten, aber als das sehen, was er ist: ein
Nachschlagewerk für API-Details. Verhalten steuern AGENTS.md und ESLint.

## Grenzen, ehrlich gesagt

- Der durchsetzende Teil (ESLint, Plugin, CI) ist deterministisch und
  altert nicht. Der ausführende Teil (das Modell) ist probabilistisch:
  sehr zuverlässig, aber kein Naturgesetz. Deshalb ist die CI der
  Schlussriegel.
- Eine wuchernde AGENTS.md verwässert. Faustregel: Was maschinell prüfbar
  ist, gehört in den Linter; was nur manchmal relevant ist, in einen Skill;
  nur was immer gelten muss und Urteilsvermögen braucht, in die AGENTS.md.
- Bewusste Ausnahmen gehen per Auftrag („Lint-Verstöße sind hier
  ausdrücklich ok"), dann setzt das Modell einen begründeten
  `eslint-disable`-Kommentar.

## Geprüft am 05.07.2026

ESLint 10.6.0, eslint-plugin-vue 10.9.2, Node 22, OpenCode 1.17.13.
ESLint-Config lokal gegen Beispieldateien ausgeführt (7 Treffer in bad.vue,
0 in good.vue). Plugin live in echten OpenCode-Sessions verifiziert
(Gemini 2.5 Flash, Qwen3-VL 32B, GLM-5.2): Feedback erreicht das Modell,
Selbstkorrektur bis Lint grün, ohne Rückfragen.

Quellen: [OpenCode Rules](https://opencode.ai/docs/rules/) ·
[OpenCode Skills](https://opencode.ai/docs/skills/) ·
[OpenCode Plugins](https://opencode.ai/docs/plugins/) ·
[vue/no-restricted-html-elements](https://eslint.vuejs.org/rules/no-restricted-html-elements.html) ·
[vue/no-restricted-syntax](https://eslint.vuejs.org/rules/no-restricted-syntax.html)
