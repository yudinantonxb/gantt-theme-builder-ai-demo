import '@dhx/trial-gantt/codebase/dhtmlxgantt.css';

import { Gantt } from '@dhx/trial-gantt';
import { io } from 'socket.io-client';
import { initChat } from './chat-widget.js';
import initZoom from './gantt-utils/zoom.js';
import fitTaskText from './gantt-utils/fit-text.js';
import createCommandRunner from './command-runner.js';
import { demoData } from './demo-data.js';

const gantt = Gantt.getGanttInstance();
gantt.config.columns = [
  { name: 'wbs', label: 'WBS', width: 60, resize: true, template: gantt.getWBSCode },
  { name: 'text', label: 'Task name', tree: true, width: 250, resize: true },
  { name: 'start_date', align: 'center', width: 100, resize: true },
  { name: 'duration', align: 'center', width: 80, resize: true },
  { name: 'add', width: 40 },
];
gantt.plugins({
  auto_scheduling: true,
  undo: true,
  export_api: true,
  marker: true,
  tooltip: true,
});

gantt.config.auto_scheduling = true;
gantt.config.open_tree_initially = true;
gantt.config.auto_types = true;
gantt.config.scale_height = 60;
gantt.config.link_radius = 4;
initZoom(gantt);
fitTaskText(gantt);

// if llm can't decide in which format it returns dates
function parseSmartDate(str) {
  if (typeof str !== 'string') return null;
  const p = str.trim().replace(/\//g, '-').split('-');
  if (p.length !== 3) return null;

  // decide order by first chunk length
  const [y, m, d] = p[0].length === 4 ? p : [p[2], p[1], p[0]];
  const dt = new Date(+y, +m - 1, +d);
  return isNaN(dt) ? null : dt;
}
gantt.templates.parse_date = parseSmartDate;

gantt.init('gantt_here');
gantt.parse(demoData);

const configList = ['link_line_width', 'link_radius', 'row_height', 'bar_height', 'show_progress'];
const defaultConfigValues = configList.map((cfgName) => ({ name: cfgName, value: gantt.config[cfgName] }));
let currentThemeVariables = [];
let currentConfigs = [...defaultConfigValues];

const runCommand = createCommandRunner(
  gantt,
  {
    onThemeSet: (variables, cmd) => {
      if (cmd === 'set_theme') {
        currentThemeVariables = mergeVariables(currentThemeVariables, variables);
      } else if (cmd === 'reset_theme') {
        currentThemeVariables = [];
        return currentThemeVariables;
      }
    },
    onConfigSet: (configs, cmd) => {
      if (cmd === 'set_theme') {
        currentConfigs = mergeConfigs(currentConfigs, configs);
        return currentConfigs;
      } else if (cmd === 'reset_theme') {
        currentConfigs = defaultConfigValues;
        return currentConfigs;
      }
    },
  },
  defaultConfigValues
);

function mergeVariables(oldVars, newVars) {
  const map = new Map();
  oldVars.forEach((v) => map.set(v.key, v.value));
  (newVars || []).forEach((v) => map.set(v.key, v.value));
  return Array.from(map.entries()).map(([key, value]) => ({ key, value }));
}
function mergeConfigs(oldConfigs, newConfigs) {
  const map = new Map();
  oldConfigs.forEach((config) => map.set(config.name, config.value));
  (newConfigs || []).forEach((config) => map.set(config.name, config.value));
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `${window.location.origin}`;
const socket = io(SOCKET_URL);

initChat({
  socket,
  runCommand,
  getTheme: () => currentThemeVariables,
  getConfigs: () => currentConfigs,
});
