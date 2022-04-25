import fs from 'fs';

export default class ConfigManager {
    static parse(path="./config/global.json") {
        try {
            return JSON.parse(fs.readFileSync(path).toString());
        }
        catch (err) {
            console.warn(err);
        }
    }
}