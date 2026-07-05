import pluginVue from 'eslint-plugin-vue'

export default [
  // im echten Projekt: eure bestehende Basis, z. B.
  // ...pluginVue.configs['flat/recommended'],
  ...pluginVue.configs['flat/base'],
  {
    files: ['src/**/*.vue'],
    rules: {
      'vue/no-restricted-html-elements': ['error',
        { element: ['button'], message: 'Nutze <v-btn> statt <button>.' },
        { element: ['input'], message: 'Nutze <v-text-field>/<v-checkbox>/<v-switch>/<v-file-input> statt <input>.' },
        { element: ['select'], message: 'Nutze <v-select>/<v-autocomplete> statt <select>.' },
        { element: ['textarea'], message: 'Nutze <v-textarea> statt <textarea>.' },
        { element: ['table'], message: 'Nutze <v-data-table>/<v-table> statt <table>.' },
        { element: ['dialog'], message: 'Nutze <v-dialog> statt <dialog>.' },
        { element: ['img'], message: 'Nutze <v-img> statt <img>.' },
        { element: ['progress'], message: 'Nutze <v-progress-linear>/<v-progress-circular> statt <progress>.' }
      ],
      'vue/no-restricted-syntax': ['error',
        {
          selector: 'VElement[name=div] > VStartTag > VAttribute[key.name=class]',
          message: 'Kein <div class="…"> für Layout/Styling: nutze v-container/v-row/v-col, v-sheet oder v-card. Bewusste Ausnahme: eslint-disable-next-line mit Begründung.'
        },
        {
          selector: 'VAttribute[key.name=style]',
          message: 'Keine Inline-Styles: nutze Vuetify-Props, Utility-Klassen (pa-*, ma-*, d-flex) oder Theme-Farben.'
        }
      ]
    }
  }
]
