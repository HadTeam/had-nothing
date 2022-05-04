import {DateTime} from "luxon";
import * as crypto from "crypto";
import pTimeout from "p-timeout";

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
                    // console.log("[heartBeatFunc]",diedCount,tempAuthKey,expectedKey,tempAuthKey === expectedKey);
                    return tempAuthKey === expectedKey;
                };
                
                component["status"] = "online";
                let heartBeatDelay = global.config?.component?.heartBeatDelay ?? 500;
                let diedCountLimit = global.config?.components?.heartBeatDied ?? 5;
                let diedCount = 0;
                component["heartBeat"] = setInterval(async () => {
                    let ret = false;
                    try {
                        ret = await pTimeout(heartBeatFunc(uuid), heartBeatDelay, () => {
                            ret = false;
                        });
                    } catch (err) {
                    }
                    if (!ret) diedCount++;
                    else diedCount = 0;
                    if (diedCount >= diedCountLimit) {
                        this.remove(uuid);
                    }
                }, heartBeatDelay);
                
                this.components.push(component);
                this.componentIdMap[uuid] = this.components.length - 1;
                
                console.log("New component " + (component.name ?? "unnamed") + "{uuid:" + uuid + "} registered.");
                
                return true;
            } catch (err) {
                console.warn(err);
            }
        }
        return false;
    }
    
    remove(uuid) {
        let index = this.componentIdMap[uuid];
        console.log("Component " + (this.components[index]["name"] ?? "unnamed") + "{uuid:" + uuid + "} removed.");
        clearInterval(this.components[index]["heartBeat"]);
        this.components[index] = undefined;
        this.componentIdMap[uuid] = undefined;
    }
}