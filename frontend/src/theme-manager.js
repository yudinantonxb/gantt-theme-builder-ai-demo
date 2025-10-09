export class ThemeManager {
  constructor() {
    this.originalThemeCSS = "";
    this.editedThemeCSS = "";
    this.originalThemeConfigs = "";
    this.editedThemeConfigs = "";
    this.cssEditor = null;
    this.configEditor = null;
    this.onThemeChangeCallback = null;
  }

  initEditors() {
    this.initCssEditor();
    this.initConfigEditor();
  }

  initCssEditor() {
    require.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.34.1/min/vs" } });
    require(["vs/editor/editor.main"], () => {
      this.cssEditor = monaco.editor.create(document.getElementById("css-editor-container"), {
        value: this.originalThemeCSS,
        language: "css",
        theme: "vs-dark",
        automaticLayout: true,
        readOnly: false,
      });

      this.setupEditorEvents(this.cssEditor, "css");
    });
  }

  initConfigEditor() {
    require.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.34.1/min/vs" } });
    require(["vs/editor/editor.main"], () => {
      this.configEditor = monaco.editor.create(document.getElementById("config-editor-container"), {
        value: this.originalThemeConfigs,
        language: "javascript",
        theme: "vs-dark",
        automaticLayout: true,
        readOnly: false,
      });

      this.setupEditorEvents(this.configEditor, "config");
    });
  }

  setupEditorEvents(editor, type) {
    editor.onDidChangeModelContent(() => {
      const value = editor.getValue();
      this[`editedTheme${type === "css" ? "CSS" : "Configs"}`] = value;

      this.updateButtonsState(type);
      this.applyThemeOnFly();
    });

    document.querySelector(`[data-editor="${type}"].copy-editor-btn`).addEventListener("click", () => {
      this.copyContent(type);
    });

    document.querySelector(`[data-editor="${type}"].save-editor-btn`).addEventListener("click", () => {
      this.saveChanges(type);
    });

    document.querySelector(`[data-editor="${type}"].cancel-editor-btn`).addEventListener("click", () => {
      this.cancelChanges(type);
    });
  }

  updateButtonsState(type) {
    const original = type === "css" ? this.originalThemeCSS : this.originalThemeConfigs;
    const edited = type === "css" ? this.editedThemeCSS : this.editedThemeConfigs;
    const changed = edited.trim() !== original.trim();

    document.querySelector(`[data-editor="${type}"].save-editor-btn`).disabled = !changed;
    document.querySelector(`[data-editor="${type}"].cancel-editor-btn`).disabled = !changed;
  }

  setTheme(themeCSS, themeConfigs) {
    this.originalThemeCSS = themeCSS;
    this.editedThemeCSS = themeCSS;
    this.originalThemeConfigs = themeConfigs;
    this.editedThemeConfigs = themeConfigs;

    if (this.cssEditor) {
      this.cssEditor.setValue(themeCSS);
    }
    if (this.configEditor) {
      this.configEditor.setValue(themeConfigs);
    }

    this.updateButtonsState("css");
    this.updateButtonsState("config");
  }

  applyThemeOnFly() {
    if (this.onThemeChangeCallback) {
      this.onThemeChangeCallback(this.editedThemeCSS, this.editedThemeConfigs);
    }
  }

  copyContent(type) {
    const content = type === "css" ? this.editedThemeCSS : this.editedThemeConfigs;
    navigator.clipboard.writeText(content);

    const btn = document.querySelector(`[data-editor="${type}"].copy-editor-btn`);
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = "Copy"), 1000);
  }

  saveChanges(type) {
    if (type === "css") {
      this.originalThemeCSS = this.editedThemeCSS;
    } else {
      this.originalThemeConfigs = this.editedThemeConfigs;
    }

    this.updateButtonsState(type);

    if (this.onThemeChangeCallback) {
      this.onThemeChangeCallback(this.editedThemeCSS, this.editedThemeConfigs, true);
    }
  }

  cancelChanges(type) {
    if (type === "css") {
      this.editedThemeCSS = this.originalThemeCSS;
      this.cssEditor.setValue(this.originalThemeCSS);
    } else {
      this.editedThemeConfigs = this.originalThemeConfigs;
      this.configEditor.setValue(this.originalThemeConfigs);
    }

    this.updateButtonsState(type);
    this.applyThemeOnFly();
  }

  onThemeChange(callback) {
    this.onThemeChangeCallback = callback;
  }

  resetTheme() {
    this.setTheme("", "");
  }
}
