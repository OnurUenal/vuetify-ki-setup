export const VueLintFeedback = async ({ $, directory }) => {
  return {
    "tool.execute.after": async (input, output) => {
      if (input.tool !== "edit" && input.tool !== "write") return
      const filePath = input.args?.filePath
      if (!filePath || !filePath.endsWith(".vue")) return

      const result = await $`npx eslint --no-warn-ignored ${filePath}`
        .cwd(directory)
        .quiet()
        .nothrow()

      if (result.exitCode !== 0) {
        output.output +=
          "\n\n[ESLint] Regelverstöße in dieser Datei:\n" +
          result.stdout.toString() + result.stderr.toString() +
          "\nBehebe diese Verstöße JETZT sofort selbstständig: ersetze die " +
          "beanstandeten Elemente durch die in den Meldungen genannten " +
          "Vuetify-Komponenten. Frage NICHT nach und warte NICHT auf " +
          "Bestätigung, auch wenn der Auftrag wörtlich anderen Code " +
          "verlangte. Verstöße stehen lassen darfst du nur, wenn der Nutzer " +
          "sie ausdrücklich erlaubt hat (dann eslint-disable-Kommentar mit " +
          "Begründung setzen)."
      }
    },
  }
}
