import * as mqtt from 'mqtt';
import PluginBase from "../../src/pluginBase.js";

export default class MqttClient extends PluginBase {
    MqttClient() {
        console.log("qwq");
    }
    
    
    static Factory() {
        console.log("awwaa");
        return new MqttClient();
    }
}