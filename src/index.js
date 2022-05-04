import ConfigManager from "./configManager.js";
import PluginManager from "./pluginManager.js";
import ComponentManager from "./componentManager.js";

import _ from "lodash";
import * as events from "events";

global.config = ConfigManager.parse();

global.events = new events.EventEmitter();

global.componentManager = new ComponentManager();

global.pluginManager = new PluginManager();
global.plugins = global.pluginManager.pluginActive;

await global.pluginManager.loadPlugins();

global.pluginManager.plugins = _.sortBy(global.pluginManager.plugins, (plugin) => {
    return plugin["loadIndex"] ?? 0;
});

for (let plugin of global.pluginManager.plugins) {
    if (plugin["status"] === "loaded") {
        await global.pluginManager.activePlugin(plugin["name"], plugin["alias"]);
    }
}

console.log("Init done!");
