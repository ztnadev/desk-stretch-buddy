# DeskFit - Desk Exercise App

A wellness application that helps desk workers stay healthy with personalized exercise recommendations, streak tracking, and achievements.

## Technologies

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Supabase (Auth, Database, Edge Functions)
- Framer Motion for animations

## Running with Docker

### Prerequisites
- Docker installed on your machine

### Build and Run

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Build the Docker image
docker build -t deskfit .

# Run the container
docker run -p 8080:80 deskfit
```

The app will be available at `http://localhost:8080`

### Docker Commands Reference

```bash
# Stop the container
docker stop $(docker ps -q --filter ancestor=deskfit)

# Remove the image
docker rmi deskfit

# Rebuild after changes
docker build -t deskfit . --no-cache
```

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Pushing to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit"

# Add remote origin
git remote add origin <YOUR_GITHUB_REPO_URL>

# Push to GitHub
git push -u origin main
```

## Project Structure

- `src/pages/` - Page components (Index, Auth, Dashboard)
- `src/components/` - Reusable UI components
- `src/hooks/` - Custom React hooks
- `supabase/functions/` - Edge functions for AI recommendations
- `Dockerfile` - Multi-stage Docker build configuration
- `nginx.conf` - Nginx configuration for SPA routing
