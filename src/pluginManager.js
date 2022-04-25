import fs from 'fs';

export default class PluginManager {
    pluginList=[];
    pluginNameMap={};
    pluginActive={};
    
    constructor() {
        let pluginDir=global.config["pluginDir"]??"./plugin/";
        this.scanPluginDir(pluginDir);
    }
    
    scanPluginDir(pluginDir) {
        if(pluginDir.slice(-1)!=='/') pluginDir+='/';
        try {
            let dirList=fs.readdirSync(pluginDir).filter((name)=>{
                return fs.statSync(pluginDir+name).isDirectory();
            });
            for(let dir of dirList) {
                let dirPath=pluginDir+dir+'/';
                let packageJsonPath=dirPath+'package.json';
                let plugin={};
                if(fs.existsSync(packageJsonPath)) {
                    plugin=JSON.parse(fs.readFileSync(packageJsonPath).toString());
                }
                plugin["name"]=plugin["name"]??dir;
                plugin["dirPath"]=dirPath;
                plugin["status"]=plugin["status"]??"unload";
                
                this.pluginList.push(plugin);
                this.pluginNameMap[plugin.name]=this.pluginList.length-1;
            }
        }
        catch (err) {
            console.warn(err);
        }
    }
    
    async loadPlugins() {
        try {
            let pluginListNeedLoad=this.pluginList.filter((plugin)=>{
                return plugin.status==="unload";
            });
            for(let plugin of pluginListNeedLoad) {
                plugin["module"]=await import("../"+plugin.dirPath+plugin.main);
                plugin["status"]="load";
            }
        }
        catch (err) {
            console.warn(err);
        }
    }
    activePlugin(name) {
        if(this.pluginNameMap.hasOwnProperty(name)) {
            let pluginIndex=this.pluginNameMap[name];
            try {
                this.pluginActive[name]=this.pluginList[pluginIndex]["module"].default.Factory();
            }
            catch (err) {
                console.warn(err);
                return false;
            }
            this.pluginList[pluginIndex]["status"]="active";
            return true;
        }
        return false;
    }
}