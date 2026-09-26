# CivicFix — Deployment Guide

CivicFix is architected for local containerized deployment via Docker Compose or cloud production Kubernetes / Google Cloud Run / AWS ECS.

## Local Docker Compose Deployment

```bash
# 1. Clone repository and copy environment configuration
cp .env.example .env

# 2. Add Gemini API key if available
echo "GEMINI_API_KEY=your_key_here" >> .env

# 3. Start all services
docker-compose up --build -d

# 4. View logs
docker-compose logs -f
```

Services will be accessible at:
- **Web Application & Full-Stack UI**: `http://localhost:3000`
- **FastAPI Backend Documentation**: `http://localhost:8000/docs`
- **PostgreSQL Database**: `localhost:5432`
- **Redis Broker**: `localhost:6379`

## Cloud Deployment (Google Cloud Run / AWS ECS)

1. Build container image:
   ```bash
   docker build -t gcr.io/my-project/civicfix:latest .
   ```
2. Deploy to Cloud Run:
   ```bash
   gcloud run deploy civicfix \
     --image gcr.io/my-project/civicfix:latest \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --port 3000
   ```
