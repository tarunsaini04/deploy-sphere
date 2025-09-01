import {createClient} from "redis";
import { downloadS3Folder, copyFinalDist } from "./aws.js";
import { buildProject } from "./utils.js";

const subscriber = createClient();
subscriber.connect();

const publisher = createClient();
publisher.connect();

async function main(){
    
    console.log("Connected to Redis. Waiting for jobs on 'build-queue'...");

    while(1){
        const response = await subscriber.brPop(
            'build-queue',
            0
        );
        if(response){
            console.log("Recieved job: ", response.element);
            const id = response.element
            await downloadS3Folder(`output/${id}`);
            console.log("downloaded");
            await buildProject(id);
            await copyFinalDist(id);
            publisher.hSet("status",id,"deployed");
        }
    }
}
main();