import * as mqtt from "mqtt";
import {waitFor} from "wait-for-event";

export default async function Factory() {
    let client = mqtt.connect(global.config['brokerUrl']);
    client.on('connect', () => {
        console.log("Mqtt connection built, listening...");
    })
    await waitFor('connect', client);
    return client;
}