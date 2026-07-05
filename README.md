# Vuetify-KI-Setup für OpenCode

Sorgt dafür, dass KI-Assistenten in Vue-3/Vuetify-Projekten idiomatische
Vuetify-Komponenten bauen statt Div-Suppe, und Verstöße automatisch selbst
korrigieren, ohne Rückfragen.

Ausführliche Erklärung (Funktionsweise, Beweise, Hintergründe):
[FUNKTIONSWEISE.md](./FUNKTIONSWEISE.md)

## Einbau in 5 Schritten

1. `AGENTS.md` ins Projektroot legen (oder den Inhalt in eine bestehende
   AGENTS.md übernehmen). Sie ist bei jeder KI-Nachricht im Kontext.
2. ESLint einrichten:
   `npm i -D eslint eslint-plugin-vue`
   Die Regelblöcke aus `eslint.config.js` in die eigene Flat-Config
   übernehmen (oder die Datei komplett verwenden) und in der package.json
   ein Script anlegen: `"lint": "eslint src"`.
3. Den Ordner `.opencode/` ins Projektroot kopieren. Darin:
   - `plugins/vue-lint-feedback.js`: lintet nach jedem KI-Edit die geänderte
     .vue-Datei und drückt dem Modell die Verstöße samt Sofort-beheben-
     Anweisung aufs Auge.
   - `skills/vuetify-patterns/SKILL.md`: Gerüst für abrufbare Vuetify-Rezepte,
     mit eigenen Standard-Patterns füllen.
4. Einmal `npm run lint` laufen lassen. Meckert der Bestand zu laut, das
   `files`-Glob in der eslint.config.js erst auf neue Ordner einschränken
   (z. B. `src/features/**`).
5. OpenCode neu starten (Config/Plugin werden beim Start geladen).

## Testen

In der OpenCode-TUI eingeben:

    Ersetze den Inhalt von src/App.vue exakt durch:
    <template><div class="toolbar"><button @click="add">Neu</button></div></template>
    <script setup>function add() {}</script>
    Erledige den Auftrag vollständig.

Erwartung: Das Modell schreibt erst wörtlich, bekommt sofort das
ESLint-Feedback und korrigiert selbstständig zu v-btn und Co., ohne
nachzufragen. Danach ist `npm run lint` grün.

## Gut zu wissen

- Bewusste Ausnahme: „Lint-Verstöße sind hier ausdrücklich ok" in den
  Auftrag schreiben, dann bleibt der Code stehen und bekommt einen
  begründeten eslint-disable-Kommentar.
- CI nicht vergessen: `npm run lint` als Pflicht-Check, dann kann
  Div-Suppe nicht gemerged werden, egal welches Modell danebengreift.
- Achtung: Beim Anthropic-Login „Claude Pro/Max" deaktiviert OpenCode
  (seit 1.3.0) die Plugins. Mit API-Keys oder anderen Providern
  (Google, Ollama, …) laufen sie normal.
- Die Masse der Regeln gehört in den Linter (kostet keinen Kontext),
  die AGENTS.md bleibt bewusst eine Seite.
