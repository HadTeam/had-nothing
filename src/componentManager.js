import {DateTime} from "luxon";
import * as crypto from "crypto";

function getPanelInfo() {
    return {
        panelVersion: "1.0",
        Time: DateTime.now().setZone("Asia/Shanghai").toString()
    }
}

export default class ComponentManager {
    components = [];
    componentIdMap = {};
    
    async register(uuid, funcHandler) {
        if (!(uuid in this.componentIdMap)) {
            try {
                let component = await funcHandler(uuid, "getComponentInfo", getPanelInfo());
                component["uuid"] = uuid;
                component["funcHandler"] = funcHandler;
                
                const heartBeatFunc = async (uuid) => {
                    const getSha1Hex = (str) => {
                        return crypto.createHash('sha256').update(str).digest('hex');
                    }
                    
                    let randomAuthSecret = crypto.randomBytes(8).toString('hex');
                    let tempAuthKey = await funcHandler(uuid, "heartBeat", [randomAuthSecret]);
                    let expectedKey = getSha1Hex(component["authKey"] + randomAuthSecret);
                    return tempAuthKey === expectedKey;
                };
                
                component["status"] = "online";
                
                let diedCount = 0;
                component["heartBeat"] = setInterval(() => {
                    if (!heartBeatFunc(uuid)) diedCount++;
                    else diedCount = 0;
                    if (diedCount >= global.config?.components?.heartBeatDied ?? 5) {
                    
                    }
                }, global.config?.component?.heartBeatDelay ?? 500)
                
                this.components.push(component);
                let componentIndex = this.componentIdMap[uuid] = this.components.length - 1;
            } catch (err) {
                console.warn(err);
            }
        }
        return false;
    }
    
    remove(uuid) {
        let index = this.componentIdMap[uuid];
        clearInterval(this.components[index]["heartBeat"]);
        this.components[index] = undefined;
        this.componentIdMap[uuid] = undefined;
    }
    
}