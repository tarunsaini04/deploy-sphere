import pkg from "aws-sdk";
import express from 'express';
import dotenv from "dotenv";
dotenv.config();

const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const r2Endpoint = process.env.R2_ENDPOINT;

if (!r2AccessKeyId || !r2SecretAccessKey || !r2Endpoint) {
    // If any key is missing, throw an error and stop the app
    throw new Error("Missing required R2 environment variables. Please check your .env file.");
}

const { S3 } = pkg;

pkg.config.logger = console;


const app = express();
const PORT = 3001;

const s3 = new S3({
    accessKeyId: r2AccessKeyId,
    secretAccessKey: r2SecretAccessKey,
    endpoint: r2Endpoint,
    s3ForcePathStyle: true,
    signatureVersion: 'v4'
});

console.log("--- REQUEST HANDLER S3 FINAL CONFIG ---");
console.log("Endpoint:", s3.config.endpoint);
console.log("Access Key:", s3.config.credentials?.accessKeyId);
console.log("--------------------------------------");


app.use(async (req, res) => {
    const host = req.hostname;
    const id = host.split('.')[0];
    let filePath = req.path;

    if (filePath === '/') {
        filePath = '/index.html';
    }

    const key = `vercel/dist/${id}${filePath}`;
    
    console.log(`[REQUEST-HANDLER] Attempting to fetch key: "${key}"`);

    try {
        const contents = await s3.getObject({
            Bucket: "vercel",
            Key: key
        }).promise();

        const type = filePath.endsWith('html') ? "text/html" : filePath.endsWith("css") ? "text/css" : "application/javascript";
        res.set("Content-Type", type);
        
        res.send(contents.Body);

    } catch (error) {
        res.status(404).send("File not found. Check terminal logs.");
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});