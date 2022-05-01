import ConfigManager from "./configManager.js";
import PluginManager from "./pluginManager.js";
import ComponentManager from "./componentManager.js";

global.config = ConfigManager.parse();

global.componentManager = new ComponentManager();

global.pluginManager = new PluginManager();
global.plugins = global.pluginManager.pluginActive;

await global.pluginManager.loadPlugins();

for (let plugin of global.pluginManager.plugins) {
    if (plugin["status"] === "loaded") {
        await global.pluginManager.activePlugin(plugin["name"], plugin["alias"]);
    }
}

/*
// debug code start
console.log("debug code enabled");
const handler=(uuid, action, param)=>{
    console.log("handler: ", uuid, " ", action, " ", param);
    switch (action) {
        case "getComponentInfo": return {
            name: "test",
            version: "1.0.0",
            authKey: "awwa"
        }
        case "heartBeat": {
            const getSha1Hex=(str)=>{
                return crypto.createHash('sha256').update(str).digest('hex');
            }

            return getSha1Hex("awwa" + param[0]);
        }
    }
}

await global.componentManager.register(uuid.v4(), handler);

// debug code end
*/

console.log("Init done!");

