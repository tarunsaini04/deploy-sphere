import pkg from "aws-sdk";
import fs from "fs";
import dotenv from "dotenv";
import path, { resolve } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const r2Endpoint = process.env.R2_ENDPOINT;

if (!r2AccessKeyId || !r2SecretAccessKey || !r2Endpoint) {
    // If any key is missing, throw an error and stop the app
    throw new Error("Missing required R2 environment variables. Please check your .env file.");
}

const {S3} = pkg;

const s3 = new S3({
    accessKeyId: r2AccessKeyId,
    secretAccessKey: r2SecretAccessKey,
    endpoint: r2Endpoint,
});

export async function downloadS3Folder(prefix: string){
    console.log(prefix);
    const allFiles = await s3.listObjectsV2({
        Bucket: "vercel",
        Prefix: prefix
    }).promise();

    const allPromises = allFiles.Contents?.map(async({Key})=>{
        return new Promise(async(resolve)=>{
            if(!Key){
                resolve("");
                return;
            }
            const finalOutputPath = path.join(__dirname,Key);
            const outputFile = fs.createWriteStream(finalOutputPath);
            const dirName = path.dirname(finalOutputPath);
            if(!fs.existsSync(dirName)){
                fs.mkdirSync(dirName,{recursive:true});
            }
            s3.getObject({
                Bucket:"vercel",
                Key
            }).createReadStream().pipe(outputFile).on("finish",()=>{
                resolve("");
            })
        })
    })||[]
    console.log("awaiting");

    await Promise.all(allPromises?.filter(x => x!==undefined));

}

export const copyFinalDist = async (id: string) => { // FIX 1: Added 'async'
    const folderPath = path.join(__dirname, `output/${id}/dist`);
    const allFiles = getAllFiles(folderPath);

    // FIX 2: Switched to a 'for...of' loop to correctly handle 'await'
    for (const file of allFiles) {
        // This calculates the path of the file relative to the dist folder
        const relativePath = file.slice(folderPath.length + 1);

        // FIX 3: Added the "vercel/" prefix to match the request-handler
        const key = `vercel/dist/${id}/${relativePath.replace(/\\/g, "/")}`;

        // This is the diagnostic log we wanted to add
        console.log(`[DEPLOY-SERVICE] UPLOADING TO KEY ---> "${key}"`);

        await uploadFile(key, file);
    }
}

const getAllFiles = (folderPath: string) => {
    let response: string[] = [];

    const allFilesAndFolders = fs.readdirSync(folderPath);allFilesAndFolders.forEach(file => {
        const fullFilePath = path.join(folderPath, file);
        if (fs.statSync(fullFilePath).isDirectory()) {
            response = response.concat(getAllFiles(fullFilePath))
        } else {
            response.push(fullFilePath);
        }
    });
    return response;
}

const uploadFile = async (fileName: string, localFilePath: string) => {
    const fileContent = fs.readFileSync(localFilePath);
    const response = await s3.upload({
        Body: fileContent,
        Bucket: "vercel",
        Key: fileName,
    }).promise();
    console.log(response);
}