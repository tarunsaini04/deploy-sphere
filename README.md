# deploy-sphere
DeploySphere: A Personal Cloud Deployment Platform
DeploySphere is a sophisticated, Vercel-like deployment pipeline built from the ground up with Node.js and React. This project demonstrates a deep understanding of system design and backend engineering by creating a fully automated system that clones a GitHub repository, builds the project, deploys the static assets to a cloud object store, and serves them on the local machine via a custom subdomain.

This is not just a web application; it is the underlying infrastructure that powers modern web development, designed to showcase a robust microservices architecture and asynchronous job processing.

🏛️ Architecture & System Design
The architecture of DeploySphere is designed around the principles of separation of concerns and asynchronous processing, mimicking the scalable systems of commercial cloud providers. It operates as a set of coordinated microservices that communicate through a central message broker.

The core components are:

The API Gateway (upload-service): This is the single entry point for all deployment requests. It is responsible for initial validation, generating a unique ID for the job, and placing the job onto a Redis queue. It decouples the client-facing API from the heavy lifting of the build process.

The Message Broker (Redis): Redis serves as the central nervous system of the platform. It holds a build-queue (a List) for pending jobs and a status hash table to track the state of each deployment (uploaded, building, deployed, failed). This allows the services to be stateless and communicate asynchronously.

The Build Worker (deploy-service): This is a headless background service that is completely decoupled from the API. Its sole responsibility is to listen for new jobs on the Redis queue. When a job appears, it executes the entire CI/CD pipeline: downloading the source, installing dependencies, running the build script, and uploading the final assets to cloud storage.

The Reverse Proxy (request-handler): This service acts as the final delivery layer. It intercepts all incoming traffic for deployed sites, inspects the subdomain to identify the project, and serves the corresponding static files directly from the cloud object store. This is a highly efficient, read-only operation that can be scaled independently.

This decoupled, queue-based architecture ensures the platform is resilient and scalable. The API can handle a high volume of requests without being slowed down by the build process, and multiple build workers could theoretically be added to process jobs in parallel.

✨ Key Features
Microservices Architecture: The platform is decoupled into four independent services: an Upload Service, a Deploy Service, a Request Handler Service, and a Frontend, communicating via a central Redis queue.

Asynchronous Build Queue: Leverages Redis to manage a queue of build jobs, allowing the system to handle multiple deployment requests concurrently without blocking.

Automated CI/CD Pipeline: A complete, hands-off pipeline from a GitHub URL to a deployed site. The system automatically clones, installs dependencies, builds, and deploys the project.

Cloud Storage Integration: Seamlessly integrates with Cloudflare R2 (or any S3-compatible object store) to store both the initial source code and the final, static build assets.

Dynamic Subdomain Routing: Each successful deployment is served on a unique, generated subdomain (e.g., project-id.localhost), simulating a real-world multi-tenant hosting environment.

Real-time Deployment Status: The React frontend provides a live log of the deployment process by polling a status endpoint, giving users real-time feedback from "Uploading" to "Deployed".

🛠️ Tech Stack
Category

Technology / Library

Backend

Node.js, Express.js, TypeScript

Frontend

React, Vite, CSS

Queueing

Redis (for job queueing and status management)

Cloud

Cloudflare R2 (S3-Compatible Object Storage)

Core Libs

aws-sdk, simple-git, redis, dotenv, cors

⚙️ How It Works: The Deployment Lifecycle
Submission: The user pastes a GitHub repository URL into the React Frontend and clicks "Deploy".

Upload Service:

Receives the POST request.

Generates a unique 5-character ID for the deployment (e.g., vopvz).

Clones the entire Git repository into a temporary local folder.

Uploads the complete source code to an output/ directory in the R2 bucket.

Pushes the unique ID onto the build-queue list in Redis.

Sets the initial status in a Redis hash: HSET status vopvz "uploaded".

Returns the unique ID to the frontend.

Deploy Service:

This service is a background worker, constantly listening to the build-queue in Redis using BRPOP.

When an ID appears, it downloads the corresponding source code from the output/ directory in R2.

It runs npm install and npm run build in an isolated child process.

Upon successful build, it uploads the contents of the final dist (or build) folder to a new vercel/dist/ directory in R2.

It updates the status in the Redis hash: HSET status vopvz "deployed".

Request Handler Service:

This is a reverse-proxy server that listens for all incoming traffic.

When a request comes in for http://vopvz.localhost:3001, it parses the subdomain to extract the project ID (vopvz).

It constructs the S3 Key for the requested file (e.g., vercel/dist/vopvz/index.html).

It fetches the file directly from R2 and streams it back to the user's browser with the correct Content-Type.

🚀 Running the Project Locally
This project is designed to run on a local machine, simulating a cloud environment.

Prerequisites
Node.js (v20.x or higher recommended)

npm

A running Redis instance (via Docker or local installation)

Cloudflare R2 credentials

Setup Instructions
Clone the Repository

git clone [https://github.com/your-username/deploy-sphere.git](https://github.com/your-username/deploy-sphere.git)
cd deploy-sphere

Install Dependencies
You need to install dependencies for each of the four services.

cd upload-service && npm install && cd ..
cd deploy-service && npm install && cd ..
cd request-handler && npm install && cd ..
cd vercel-frontend && npm install && cd ..

Configure Environment Variables
Each backend service (upload-service, deploy-service, request-handler) needs its own .env file with your R2 credentials.

In each of these three folders, copy the .env.example file to a new file named .env.

Fill in your actual R2 credentials in each .env file.

Modify Your hosts File (for Subdomains)
To make project-id.localhost work on your machine, you need to edit your hosts file to point these domains to your local server.

Windows: c:\Windows\System32\drivers\etc\hosts (run editor as Administrator)

Mac/Linux: /etc/hosts

Add a line for each project you want to test, for example: 127.0.0.1 my-test-project.localhost

Start the Services
Open four separate terminals, one for each service.

Start your three backend services by running npm run dev (or npx tsc -b && node dist/index.js) in each of their respective folders.

Start the frontend by running npm run dev in the vercel-frontend folder.

Deploy!

Open your browser to the frontend URL (usually http://localhost:5173).

Paste a link to a simple, buildable GitHub repository (e.g., a basic Vite React app) and click Deploy.

Watch the magic happen!

💡 Challenges & Learnings
System Design: The biggest challenge was designing the interaction between the services. Using Redis as a message broker was a key decision that decoupled the services and enabled asynchronous processing.

S3 Key Consistency: A persistent bug was the NoSuchKey error. This was solved by ensuring the key generation logic in the Deploy Service was perfectly identical to the key parsing logic in the Request Handler.

Asynchronous Operations: Managing asynchronous loops (e.g., uploading multiple files) required a deep understanding of async/await and using for...of loops instead of forEach to ensure sequential execution.
