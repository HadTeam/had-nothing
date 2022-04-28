import fs from 'fs';

export default class ConfigManager {
    static parse(path = "./config/") {
        if (path.slice(-1) !== '/') path += '/';
        let config = {};
        try {
            let configFiles = fs.readdirSync(path).filter((name) => {
                return fs.statSync(path + name).isFile() && name.search(/.json$/);
            });
            for (let name of configFiles) {
                let configOrigin = JSON.parse(fs.readFileSync(path + name).toString());
                let configName = name.slice(0, name.length - 5);
                switch (configName) {
                    case 'global': {
                        objMerge(config, configOrigin)
                    }
                        break;
                    default: {
                        config[configName] ??= {};
                        objMerge(config[configName], configOrigin);
                    }
                        break;
                }
            }
            return config;
        } catch (err) {
            console.warn(err);
        }
    }
}

function objMerge(to, from) {
    for (let item in from) {
        to[item] = from[item];
    }
}