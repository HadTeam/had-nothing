import fs from 'fs';

let pluginDirPrefix = "had-nothing-plugin-";

export default class PluginManager {
    pluginList = [];
    pluginNameMap = {};
    pluginActive = {};
    loadedPluginNum = -1;
    
    constructor() {
        let pluginDir = global.config["pluginDir"] ?? "./node_modules/";
        this.scanPluginDir(pluginDir);
    }
    
    scanPluginDir(pluginDir) {
        if (pluginDir.slice(-1) !== '/') pluginDir += '/';
        try {
            let dirList = fs.readdirSync(pluginDir).filter((name) => {
                return name.search("^" + pluginDirPrefix) !== -1 && fs.statSync(pluginDir + name).isDirectory();
            });
            for (let dir of dirList) {
                let dirPath = pluginDir + dir + '/';
                let packageJsonPath = dirPath + 'package.json';
                let plugin = {};
                if (fs.existsSync(packageJsonPath)) {
                    plugin = JSON.parse(fs.readFileSync(packageJsonPath).toString());
                }
                plugin["name"] ??= dir;
                plugin["dirPath"] = dirPath;
                plugin["alias"] ??= dir.replace(pluginDirPrefix, "");
                plugin["status"] = plugin["status"] ?? "unload";
                
                this.pluginList.push(plugin);
                this.pluginNameMap[plugin.name] = this.pluginList.length - 1;
            }
        } catch (err) {
            console.warn(err);
        }
    }
    
    async loadPlugins() {
        console.log("Loading plugins...");
        let pluginListNeedLoad = this.pluginList.filter((plugin) => {
            return plugin.status === "unload";
        });
        for (let plugin of pluginListNeedLoad) {
            console.log("Loading plugin '" + plugin["name"] + "'...");
            try {
                plugin["status"] = "loaded";
                plugin["module"] = await import("../" + plugin.dirPath + plugin.main);
            } catch (err) {
                console.warn(err);
                plugin["status"] = "error";
            }
        }
        this.loadedPluginNum = pluginListNeedLoad.filter((plugin) => {
            return plugin["status"] === "loaded";
        }).length;
        console.log("Loaded " + this.loadedPluginNum + " plugins!");
    }
    
    async activePlugin(name, alias) {
        console.log("Activating plugin '" + name + "'...");
        if (this.pluginNameMap.hasOwnProperty(name)) {
            let pluginIndex = this.pluginNameMap[name];
            try {
                let moduleDefault = this.pluginList[pluginIndex]["module"].default;
                let factoryFunc;
                if ((typeof moduleDefault) === 'class') {
                    factoryFunc = moduleDefault.Factory;
                } else if ((typeof moduleDefault) === 'function') {
                    factoryFunc = moduleDefault;
                }
                this.pluginActive[alias] = await factoryFunc();
            } catch (err) {
                console.warn(err);
                return false;
            }
            this.pluginList[pluginIndex]["status"] = "active";
            return true;
        }
        return false;
    }
}