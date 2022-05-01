import fs from 'fs';

const rangeName = "@had-nothing-plugins";

export default class PluginManager {
    plugins = [];
    pluginNameMap = {};
    pluginActive = {};
    loadedNum = 0;
    
    constructor() {
        let pluginDir = global.config["pluginDir"] ?? "./node_modules/" + rangeName + "/";
        this.scanPluginDir(pluginDir);
    }
    
    scanPluginDir(pluginDir) {
        if (pluginDir.slice(-1) !== '/') pluginDir += '/';
        try {
            let dirList = fs.readdirSync(pluginDir).filter((name) => {
                return fs.statSync(pluginDir + name).isDirectory();
            });
            for (let dir of dirList) {
                let dirPath = pluginDir + dir + '/';
                let packageJsonPath = dirPath + 'package.json';
                let plugin = {};
                if (fs.existsSync(packageJsonPath)) {
                    plugin = JSON.parse(fs.readFileSync(packageJsonPath).toString());
                }
                plugin["name"] = plugin["name"] ? plugin["name"].replace(rangeName + "/", "") : dir;
                plugin["dirPath"] = dirPath;
                plugin["alias"] ??= dir;
                plugin["status"] = plugin["status"] ?? "unload";
                
                this.plugins.push(plugin);
                this.pluginNameMap[plugin.name] = this.plugins.length - 1;
            }
        } catch (err) {
            console.warn(err);
        }
    }
    
    async loadPlugins() {
        console.log("Loading plugins...");
        let pluginListNeedLoad = this.plugins.filter((plugin) => {
            return plugin.status === "unload";
        });
        for (let plugin of pluginListNeedLoad) {
            console.log("Loading plugin '" + plugin["name"] + "'...");
            try {
                plugin["status"] = "loaded";
                plugin["module"] = await import( rangeName + "/" + plugin.name);
            } catch (err) {
                console.warn(err);
                plugin["status"] = "error";
            }
        }
        this.loadedNum = pluginListNeedLoad.filter((plugin) => {
            return plugin["status"] === "loaded";
        }).length;
        console.log("Loaded " + this.loadedNum + " plugins!");
    }
    
    async activePlugin(name, alias) {
        console.log("Activating plugin '" + name + "'...");
        if (this.pluginNameMap.hasOwnProperty(name)) {
            let pluginIndex = this.pluginNameMap[name];
            try {
                let moduleDefault = this.plugins[pluginIndex]["module"].default;
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
            this.plugins[pluginIndex]["status"] = "active";
            return true;
        }
        return false;
    }
}