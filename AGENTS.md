# UI-Arbeit (Vue 3 + Vuetify): verbindliche Regeln

Gilt für JEDE Änderung an .vue-Dateien, auch für kleine Fixes.

## Arbeitsablauf (Pflicht)

1. Vor neuem UI erst prüfen, ob es eine passende Komponente schon gibt:
   `ls src/components`, dann per grep nach Zweck suchen. Vorhandenes
   verwenden oder erweitern, nicht neu bauen.
2. Kein natives HTML-Element, wenn Vuetify eine Komponente dafür hat
   (Tabelle unten).
3. Layout nur mit v-container/v-row/v-col, v-sheet, v-card und
   Utility-Klassen (d-flex, ga-*, pa-*, ma-*). Keine eigenen
   Flex/Grid-Div-Konstrukte.
4. Farben, Abstände, Typografie über Theme und Utilities
   (color="primary", class="text-h6 pa-4"). Ein eigener <style>-Block
   ist die begründete Ausnahme, nicht der Normalfall. Kein style="…".
5. Nach jeder Änderung an .vue-Dateien `npm run lint` ausführen.
   Kommt ESLint-Feedback (Plugin/Hook), setze es SOFORT selbstständig
   um: korrigieren, nicht nachfragen, nicht auf Bestätigung warten.
   Das gilt auch, wenn der Auftrag „exakt diesen Code" verlangte.
   Ein Task ist erst fertig, wenn Lint fehlerfrei ist.

## Ersetzungstabelle

| Statt | Nimm |
|---|---|
| <button> | <v-btn> |
| <input> | <v-text-field>, <v-checkbox>, <v-switch>, <v-file-input> |
| <select> | <v-select>, <v-autocomplete> |
| <textarea> | <v-textarea> |
| <table> | <v-data-table>, <v-table> |
| <img> | <v-img> |
| <dialog>, Overlay-Divs | <v-dialog>, <v-menu>, <v-overlay> |
| <ul>/<li> für Datenlisten | <v-list>, <v-list-item> |
| <div class="…"> für Layout | <v-row>/<v-col>, <v-sheet>, <v-card> |
| style="…" inline | Props, Utility-Klassen, Theme |

## Beispiel

Falsch:

```vue
<div class="toolbar">
  <div class="toolbar__title">Kunden</div>
  <button class="btn primary" @click="add">Neu</button>
</div>
```

Richtig:

```vue
<v-toolbar density="compact">
  <v-toolbar-title>Kunden</v-toolbar-title>
  <v-spacer />
  <v-btn color="primary" @click="add">Neu</v-btn>
</v-toolbar>
```
