import PluginBase from "../../src/pluginBase.js";

export default class MqttClient extends PluginBase {
    static Factory() {
        console.log("awwaa");
        return new MqttClient();
    }
    
    MqttClient() {
        console.log("qwq");
    }
}