import ConfigManager from "./configManager.js";
import PluginManager from "./pluginManager.js";

global.config=ConfigManager.parse();

console.log(global.config);

global.pluginManager=new PluginManager();
global.plugins=global.pluginManager.pluginList;

await global.pluginManager.loadPlugins();

for(let pluginName in global.pluginManager.pluginNameMap) {
    global.pluginManager.activePlugin(pluginName);
}
