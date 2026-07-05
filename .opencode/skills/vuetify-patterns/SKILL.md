---
name: vuetify-patterns
description: Vuetify-3-Rezepte für komplexe UI-Aufgaben. Laden bei Formularen
  mit Validierung, v-data-table (Server-Mode, Slots, Custom-Zellen),
  Dialog-Flows, Theme-Anpassungen und Responsive-Layout-Fragen.
---

# Vuetify-Patterns

## Formular mit Validierung

```vue
<v-form ref="form" @submit.prevent="save">
  <v-text-field
    v-model="email"
    label="E-Mail"
    :rules="[v => !!v || 'Pflichtfeld', v => /.+@.+/.test(v) || 'Ungültig']"
  />
  <v-btn type="submit" color="primary">Speichern</v-btn>
</v-form>
```

## Data-Table mit Server-Daten

(euer Standard-Pattern hier festhalten: v-data-table-server,
items-per-page, Slots für Aktionen)

## Dialog-Flow

(euer Standard: v-dialog mit v-card, Aktionen rechts unten,
persistent nur bei Formularen)
