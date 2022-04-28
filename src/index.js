import ConfigManager from "./configManager.js";
import PluginManager from "./pluginManager.js";

global.config = ConfigManager.parse();

global.pluginManager = new PluginManager();
global.plugins = global.pluginManager.pluginActive;

await global.pluginManager.loadPlugins();

for (let plugin of global.pluginManager.pluginList) {
    if (plugin["status"] === "loaded") {
        await global.pluginManager.activePlugin(plugin["name"], plugin["alias"]);
    }
}

console.log("Init done!");

