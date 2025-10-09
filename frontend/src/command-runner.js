export default function (gantt, { onThemeSet, onConfigSet }, defaultConfigValues = {}) {
  // handlers for commands defined in /backend/schemaList.js
  return function runCommand(cmd, args) {
    switch (cmd) {
      case "set_theme":
        const variables = args.variables;
        const configs = args.configs;
        const styleId = "dynamic-theme";
        let configStr = "";
        let mergedConfigs = [];

        [...defaultConfigValues, ...configs].forEach((config) => {
          gantt.config[config.name] = config.value;
        });

        let style = document.getElementById(styleId);
        if (!style) {
          style = document.createElement("style");
          style.id = styleId;
          document.head.appendChild(style);
        }

        const lines = variables.map((variable) => `${variable.key}: ${variable.value};`);
        const styles = `:root { \n${lines.join("\n")} \n}`;
        style.innerHTML = styles;

        if (onThemeSet) {
          onThemeSet(variables, cmd);
        }
        if (onConfigSet) {
          mergedConfigs = onConfigSet(configs, cmd);
        }

        configStr = mergedConfigs.map((config) => `gantt.config.${config.name} = ${config.value};`).join("\n");
        gantt.render();

        return { styles, configStr };

      case "reset_theme":
        const themeStyleId = "dynamic-theme";
        const styleEl = document.getElementById(themeStyleId);
        if (styleEl) {
          styleEl.remove();
        }

        if (onThemeSet) {
          onThemeSet([], cmd);
        }
        if (onConfigSet) {
          onConfigSet([], cmd);
          if (defaultConfigValues.length) {
            defaultConfigValues.forEach((config) => {
              gantt.config[config.name] = config.value;
            });
          }

          gantt.render();
        }

        break;

      case "set_configs":
        const configsArr = args.configs;
        if (configsArr.length) {
          configsArr.forEach((config) => {
            gantt.config[config.name] = config.value;
          });

          if (onConfigSet) {
            onConfigSet(configsArr, cmd);
          }

          gantt.render();
        }
        break;

      default:
        console.warn("Unknown cmd:", cmd, args);
    }
  };
}
