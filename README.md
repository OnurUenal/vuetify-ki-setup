# Vuetify AI Setup for OpenCode

Help AI assistants build idiomatic Vuetify components in Vue 3/Vuetify projects
instead of piles of custom `<div>` elements, and give them immediate lint
feedback so they can correct violations without asking for confirmation.

## Setup in 5 steps

1. Copy `AGENTS.md` to your project root, or merge its contents into an existing
   `AGENTS.md`. It provides the assistant with the project's UI rules.
2. Set up ESLint:
   `npm i -D eslint eslint-plugin-vue`
   Merge the rule blocks from `eslint.config.js` into your existing flat config,
   or use the entire file. Add a script to `package.json`:
   `"lint": "eslint src"`.
3. Copy the `.opencode/` directory to your project root. It contains:
   - `plugins/vue-lint-feedback.js`: runs lint on the changed `.vue` file after
     each AI edit and returns violations to the model with instructions to fix
     them immediately.
   - `skills/vuetify-patterns/SKILL.md`: a starting point for on-demand Vuetify
     recipes. Fill it with your own standard patterns.
4. Run `npm run lint` once. If existing code produces too many violations,
   initially restrict the `files` glob in `eslint.config.js` to new directories,
   such as `src/features/**`.
5. Restart OpenCode so it loads the configuration and plugin.

> The README is in English. The bundled agent instructions, skill template,
> lint messages, and plugin feedback are currently in German. Log excerpts
> below are translated into English for readability; actual messages remain
> in German.

## Try it out

Enter this prompt in the OpenCode TUI:

```text
Replace the contents of src/App.vue with exactly this:
<template><div class="toolbar"><button @click="add">New</button></div></template>
<script setup>function add() {}</script>
Complete the task fully.
```

Expected behavior: the model first writes the requested code, receives ESLint
feedback immediately, and replaces the offending elements with `v-btn` and
other Vuetify components without asking for confirmation. Afterward,
`npm run lint` should pass.

## Why AI assistants reach for divs

**Training defaults.** Models have seen large amounts of raw HTML, CSS, and
React code. Without clear project rules, they may fall back to familiar
patterns such as `<div class="…">` plus custom CSS, even when the project
already uses `<v-row>`.

**Documentation access does not enforce behavior.** A Vuetify MCP server makes
documentation available, but does not require the assistant to consult it.
Reference material is not a set of project rules.

**The feedback loop is missing.** Without a failing check, custom div-based UI
can appear to be a successful result. This setup adds enforceable rules:
project instructions available to the assistant, plus a linter that reports
violations with exit code 1.

## How the pieces fit together

When the assistant changes a `.vue` file, the intended workflow is:

1. **Request:** “Add a search field.” The assistant has the
   [AGENTS.md](./AGENTS.md) instructions in context and should choose Vuetify
   components from the start.
2. **Write:** The assistant changes the file using its `write` or `edit` tool.
3. **Hook:** The [plugin](./.opencode/plugins/vue-lint-feedback.js) runs after
   the tool call via `tool.execute.after` and invokes ESLint on that file only,
   keeping the feedback focused on the current change.
4. **Check:** ESLint parses the template into an abstract syntax tree. Two rules
   in [eslint.config.js](./eslint.config.js) identify restricted native elements
   (`button`, `input`, `table`, and others), `<div class="…">`, and inline styles.
   These restrictions target the `<template>` section, leaving script logic
   unrestricted by these rules.
5. **Feedback:** If violations are found, the plugin appends the messages and
   an instruction to fix them immediately without asking for confirmation to
   the tool result. The feedback appears directly alongside the write result.
6. **Correction:** The assistant edits the file again, triggering the hook
   again. The intended loop continues until ESLint reports no violations.
7. **Final check:** Configure `npm run lint` as a required CI check to enforce
   the rules independently of the model and prevent noncompliant changes
   from being merged.

The division of responsibilities matters: ESLint provides deterministic
checks, while the assistant interprets the feedback and makes corrections.
Keep machine-checkable rules in the linter, keep `AGENTS.md` short, and put
specialized knowledge that is only needed occasionally into skills.

## Layer 1: AGENTS.md — project rules

OpenCode loads [AGENTS.md](./AGENTS.md) from the project root into the session.
Global instructions can live at `~/.config/opencode/AGENTS.md`, and an existing
`CLAUDE.md` can serve as a fallback. Put persistent UI rules here rather than
in a skill. Clear requirements, a replacement table, and a wrong/right example
make the intended behavior concrete.

## Layer 2: ESLint — enforceable constraints

Two rules from `eslint-plugin-vue` do the work
(see [eslint.config.js](./eslint.config.js)):

- `vue/no-restricted-html-elements` forbids native elements and provides a
  custom message for each one, telling the assistant which component to use.
- `vue/no-restricted-syntax` uses AST selectors to target `<div class="…">`
  and inline styles. A plain `<div>` without a `class` remains allowed for
  cases where a wrapper is needed.

### Recorded example (ESLint 10.6.0, eslint-plugin-vue 10.9.2)

A typical div-heavy template:

```vue
<div class="page-wrapper">
  <div class="toolbar" style="display: flex">
    <div class="toolbar__title">Customers</div>
    <button class="btn primary" @click="add">New</button>
  </div>
  <input v-model="query" placeholder="Search" />
  <table>…</table>
  <div>Plain wrapper without a class</div>
</div>
```

The original README records the following result from running
`npx eslint bad.vue good.vue` against example fixtures. Messages are translated
below. The bundled configuration targets `src/**/*.vue`, so place your own
fixtures under `src/` or adjust the `files` glob when reproducing this check.

```text
bad.vue
  2:8   error  No <div class="…"> for layout/styling: use v-container/v-row/v-col, v-sheet, or v-card …
  3:10  error  No <div class="…"> for layout/styling: …
  3:26  error  No inline styles: use Vuetify props, utility classes (pa-*, ma-*, d-flex), or theme colors
  4:12  error  No <div class="…"> for layout/styling: …
  5:7   error  Use <v-btn> instead of <button>
  7:5   error  Use <v-text-field>/<v-checkbox>/<v-switch>/<v-file-input> instead of <input>
  8:5   error  Use <v-data-table>/<v-table> instead of <table>

✖ 7 problems (7 errors, 0 warnings)   Exit code 1
good.vue (v-toolbar, v-text-field, v-data-table): 0 errors
```

**Lots of violations in existing code?** Start by restricting the rules to
new areas with the `files` glob, such as `src/features/**`, or ask the assistant
to clean up existing code one directory at a time. You can also consider
[eslint-plugin-vuetify](https://github.com/vuetifyjs/eslint-plugin-vuetify)
for checks related to deprecated Vuetify props, classes, and components during
version migrations.

## Layer 3: The correction feedback plugin

The [plugin](./.opencode/plugins/vue-lint-feedback.js) appends ESLint output
to the tool result after each `edit` or `write` to a `.vue` file, so the
assistant sees violations within the same task. It uses the
`tool.execute.after` hook, reads the file path from `input.args.filePath`,
and runs ESLint through Bun's `$` shell. Install it in `.opencode/plugins/`
for a project or `~/.config/opencode/plugins/` globally.

The **direct instruction in the feedback** matters: “Fix these violations
immediately, without asking for confirmation.” A softer message may cause
models to ask before correcting code when the original request specified an
exact replacement.

### Recorded live example (OpenCode 1.17.13)

The original README reports a headless test using `opencode run` on
July 5, 2026, with the plugin from this repository and no additional project
instructions. It describes tests with Gemini 2.5 Flash and a local Qwen3-VL
32B model: the model writes a file with violations, receives the appended
feedback, and corrects the code. The following excerpt is translated from
the recorded tool output:

```text
# Run A: write-tool output after deliberately introducing violations
[ESLint] Rule violations in this file:
src/App.vue
  2:8  error  No <div class="…"> for layout/styling: use v-container/v-row/v-col, v-sheet, or v-card …
  3:5  error  Use <v-btn> instead of <button>
✖ 2 problems (2 errors, 0 warnings)

# Run B: “Add a search field for customer names” (no additional rules in context)
# First edit: raw <input>; the plugin reports it, and the model corrects it in the next edit:
-    <input type="text" placeholder="Search customer names..." />
-  </div>
+    <v-text-field label="Search customer names" />
+  </v-sheet>
# Result: npx eslint src → 0 errors, no clarification questions
```

## Layer 4: Where skills and MCP fit

Skills are loaded on demand: the model sees a skill's `description` and decides
whether to load its full instructions. Persistent rules such as “use Vuetify
components for layout” belong in `AGENTS.md`. Skills are better suited to
specialized reference material, such as the
[Vuetify patterns template](./.opencode/skills/vuetify-patterns/SKILL.md).
Their descriptions should clearly state when they apply.

Place project skills at `.opencode/skills/<name>/SKILL.md` or global skills
under `~/.config/opencode/skills/`.

A Vuetify MCP server remains useful as a reference for API details.
`AGENTS.md` supplies behavioral instructions, and ESLint checks compliance.

## Limitations and practical tips

- Lint checks are deterministic; model behavior is probabilistic. Immediate
  feedback encourages correction, but does not guarantee it. Use a required
  CI check as the final gate.
- Keep `AGENTS.md` focused. Put machine-checkable requirements in the linter,
  occasional reference material in skills, and persistent rules that require
  judgment in `AGENTS.md`.
- For intentional exceptions, explicitly allow the violation in the request.
  The assistant can then add an `eslint-disable` comment with a reason.
- The original README notes that OpenCode disables plugins when using the
  Anthropic “Claude Pro/Max” login, starting with OpenCode 1.3.0, while API-key
  authentication and other providers such as Google and Ollama support them.
  Treat this as a version-specific compatibility note and check your installed
  OpenCode version before relying on the plugin.

## Previously reported verification — July 5, 2026

The original README records tests with ESLint 10.6.0, eslint-plugin-vue 10.9.2,
Node 22, and OpenCode 1.17.13:

- Local ESLint checks against example files: 7 violations in `bad.vue` and
  none in `good.vue`.
- Live OpenCode sessions with Gemini 2.5 Flash, Qwen3-VL 32B, and GLM-5.2:
  feedback reached the model, which corrected the code until lint passed
  without asking for confirmation.

These are historical results reported by the project, not new verification
performed as part of this English translation.

References: [OpenCode Rules](https://opencode.ai/docs/rules/) ·
[OpenCode Skills](https://opencode.ai/docs/skills/) ·
[OpenCode Plugins](https://opencode.ai/docs/plugins/) ·
[vue/no-restricted-html-elements](https://eslint.vuejs.org/rules/no-restricted-html-elements.html) ·
[vue/no-restricted-syntax](https://eslint.vuejs.org/rules/no-restricted-syntax.html)
