🚀 DeploySphere

A Personal Cloud Deployment Platform

DeploySphere is a Vercel-like deployment pipeline built from scratch with Node.js and React.
It demonstrates a deep understanding of system design and backend engineering by creating a fully automated system that:

📂 Clones a GitHub repository 

⚙️ Builds the project 

☁️ Deploys static assets to a cloud object store 

🌐 Serves them on the local machine via custom subdomains 



🏛️ Architecture & System Design

DeploySphere follows a decoupled microservices architecture powered by Redis as a central message broker.

🔑 Core Components

->API Gateway (upload-service) → Handles requests, validates input, queues jobs

->Message Broker (Redis) → Manages build-queue & deployment status

->Build Worker (deploy-service) → CI/CD pipeline executor (clone → build → deploy)

->Reverse Proxy (request-handler) → Serves deployed projects via subdomains

📌 Result → Resilient, scalable, and async system that mimics real-world cloud deployment platforms.




✨ Key Features

✅ Microservices architecture (Upload, Deploy, Request Handler, Frontend)

✅ Asynchronous job queue with Redis

✅ Automated CI/CD pipeline (clone → build → deploy)

✅ Cloud storage integration with Cloudflare R2 (S3-compatible)

✅ Dynamic subdomain routing (project-id.localhost)

✅ Real-time deployment status in the React frontend




🛠️ Tech Stack

Layer			->		Technology

Backend			->	Node.js, Express.js, TypeScript

Frontend		->	React, Vite, CSS

Queueing		->	Redis

Cloud			->	Cloudflare R2 (S3-compatible)

Core Libs		->	aws-sdk, simple-git, redis, dotenv, cors




⚙️ Deployment Lifecycle

1. Submission (Frontend → Upload Service)

	User submits GitHub repo → generates unique ID → uploaded to R2 → job pushed to Redis queue.

2. Build (Deploy Service)

	Worker picks job → installs deps → builds project → uploads build to R2.

3. Serve (Request Handler)

	Reverse proxy maps subdomain → fetches files from R2 → serves static assets.




🚀 Running the Project Locally

📋 Prerequisites

   ->Node.js (v20+ recommended)
   
   ->npm
   
   ->Redis (local or via Docker)
   
   ->Cloudflare R2 credentials


🔧 Setup Instructions

   # Clone the repo
   
   git clone https://github.com/tarunsaini04/deploy-sphere.git
   
   cd deploy-sphere

   # Install dependencies for all services
   
   cd upload-service && npm install && cd ..
   
   cd deploy-service && npm install && cd ..
   
   cd request-handler && npm install && cd ..
   
   cd vercel-frontend && npm install && cd ..



⚙️ Environment Variables

   Each backend service (upload-service, deploy-service, request-handler) needs a .env file.

   R2_ACCESS_KEY=your-key
   
   R2_SECRET_KEY=your-secret
   
   R2_BUCKET=your-bucket



🖥️ Modify Hosts File

   Map project subdomains to localhost:

   127.0.0.1 my-test-project.localhost



▶️ Start Services

   # Run each service in a separate terminal
   
   npm run dev  # inside upload-service
   
   npm run dev  # inside deploy-service
   
   npm run dev  # inside request-handler
   
   npm run dev  # inside vercel-frontend



🎉 Then open http://localhost:5173, paste a GitHub repo link, and hit Deploy! 




💡 Challenges & Learnings

System Design → Redis as message broker enabled true async processing.

S3 Key Consistency → Fixed NoSuchKey by aligning deploy & request-handler logic.

Async Ops → Switched from forEach to for...of for proper async/await handling.



🤝 Contributing

Contributions are welcome! Feel free to fork the repo, open issues, and submit PRs.
