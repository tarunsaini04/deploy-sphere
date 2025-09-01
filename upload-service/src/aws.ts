import pkg from "aws-sdk";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const r2Endpoint = process.env.R2_ENDPOINT;

if (!r2AccessKeyId || !r2SecretAccessKey || !r2Endpoint) {
    throw new Error("Missing required R2 environment variables. Please check your .env file.");
}

const {S3} = pkg;

const s3 = new S3({
    accessKeyId: r2AccessKeyId,
    secretAccessKey: r2SecretAccessKey,
    endpoint: r2Endpoint,
});

export const uploadFile = async (fileName: string, localFilePath: string)=>{
    const fileContent = fs.readFileSync(localFilePath);
    const response = await s3.upload({
        Body: fileContent,
        Bucket: "vercel",
        Key: fileName,
    }).promise();
    console.log(response);
};