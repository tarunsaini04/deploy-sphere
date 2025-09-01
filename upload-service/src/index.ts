import express from "express";
import cors from "cors";
import {simpleGit} from "simple-git";
import { generate } from "./utils.js";
import path from "path";
import url from "url";
import {fileURLToPath} from "url";
import { getAllFiles } from "./file.js";
import { uploadFile } from "./aws.js";
import { createClient } from "redis";

const publisher = createClient();
publisher.connect();

const subscriber = createClient();
subscriber.connect();

const app=express();
app.use(cors());
app.use(express.json());


const port=3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); 

app.post("/deploy", async (req,res)=>{
    console.log("Deployment started");
    const repoUrl = req.body.repoUrl;
    const id = generate();
    await simpleGit().clone(repoUrl, path.join(__dirname, `output/${id}`));

    const files = getAllFiles(path.join(__dirname,`output/${id}`));

    for(const file of files){
        await uploadFile(file.slice(__dirname.length+1).replace(/\\/g,"/"), file);
    }

    publisher.lPush("build-queue",id);
    // Setting value in Redis DB
    publisher.hSet("status",id,"uploaded");

    res.json({
        id: id
    });
})

app.get("/status",async (req,res)=>{
    const id = req.query.id;
    const response = await subscriber.hGet("status", id as string);
    res.json({
        status:response
    })
})

app.listen(port,()=>{
    console.log(`Server running on port ${port} `);
}) 