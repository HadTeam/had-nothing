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
    
    componentType=new Map();
    
    async register(uuid, funcHandler) {
        if (!(uuid in this.componentIdMap) || this.componentIdMap[uuid]===undefined) {
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
                    tempAuthKey=tempAuthKey.toLowerCase()
                    // console.log("[heartBeatFunc]",diedCount,tempAuthKey,expectedKey,tempAuthKey === expectedKey);
                    return tempAuthKey === expectedKey;
                };
                
                component["status"] = "online";
                let heartBeatDelay = global.config?.component?.heartBeatDelay ?? 1000;
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
    
                this.handleType(uuid, 'init');
                
                console.log("New component " + (component.name ?? "unnamed") + "{uuid:" + uuid + "} registered.");
                
                return true;
            } catch (err) {
                console.warn(err);
            }
        }
        return false;
    }
    
    remove(uuid) {
        this.handleType(uuid, 'remove');
        let index = this.componentIdMap[uuid];
        console.log("Component " + (this.components[index]["name"] ?? "unnamed") + "{uuid:" + uuid + "} removed.");
        clearInterval(this.components[index]["heartBeat"]);
        this.components[index] = undefined;
        this.componentIdMap[uuid] = undefined;
    }
    
    handleType(uuid, stage) {
        let component=this.getComponentById(uuid);
        if(component["type"] && this.componentType.has(component["type"])) {
            let typeHandler=this.componentType.get(component["type"]);
            switch (stage) {
                case 'init': typeHandler.init(uuid); break;
                case 'remove': typeHandler.remove(uuid); break;
                default: break;
            }
        }
    }
    
    getComponentById(uuid) {
        return this.components[this.componentIdMap[uuid]];
    }
}