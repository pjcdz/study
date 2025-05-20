# Study Tool

A powerful tool for students that transforms PDF/document content into well-structured Notion notes and Quizlet flashcards using Google's Gemini AI.

## Features

- **Document Transformation**: Convert document content into beautifully formatted Notion markdown
- **Flashcard Generation**: Create Quizlet-compatible TSV flashcards from your notes
- **AI-Powered**: Utilizes Google Gemini 2.0 Flash for intelligent content processing
- **Simple Workflow**: Three-step process - Upload → Markdown → Flashcards
- **One-Click Copy**: Easily copy generated content to clipboard for use in Notion and Quizlet

## Architecture

### Frontend (Next.js)

Implements a **Screaming Architecture** where the code structure reflects the business domain:

```
frontend/
  app/            # Next.js app router structure
    upload/       # Document upload functionality 
    summary/      # Notion markdown generation
    flashcards/   # Quizlet flashcard generation
  components/     # Reusable React components
  lib/            # Utilities and services
    api-client.ts # Backend API integration
```

### Backend (Node.js + Express)

```
backend/
  src/
    config/        # Prompts and configuration
    controllers/   # Request handlers
    services/      # Gemini API integration
    app.js         # Express server setup
```

## Technologies

### Frontend
- Next.js with React 19
- Tailwind CSS for styling
- ShadCN UI components

### Backend
- Node.js with Express
- Google Gemini AI API integration

### Infrastructure
- Docker containers for local development and production
- Docker Swarm for orchestration
- GitHub Actions for CI/CD
- Node.js v22.15.0

## Setup and Deployment

### Prerequisites

- Google Cloud account with access to Gemini API
- `GEMINI_API_KEY` from Google AI Studio
- Docker and Docker Compose installed

### Local Development

```bash
# Create a .env file with your API key
echo "GEMINI_API_KEY=your_key_here" > .env

# Run the application with Docker Compose
docker compose up --build
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

### Production Deployment

1. Set up the required GitHub secrets:
   - `VPS_HOST`: Your server hostname
   - `VPS_USER`: SSH username
   - `DEPLOY_SSH_PRIVATE_KEY`: Private SSH key
   - `GEMINI_API_KEY`: Your Google Gemini API key

2. Push to the main branch to trigger automatic deployment

```bash
git push origin main
```

## Docker Swarm Management

Create the necessary Docker secrets:

```bash
echo "your_gemini_api_key" | docker secret create gemini_api_key -
```

Deploy the stack:

```bash
docker stack deploy --with-registry-auth -c docker-stack.yml study-tool
```

## Usage Flow

1. **Upload**: Paste document content in the upload text area
2. **Markdown**: View and copy the generated Notion-compatible markdown
3. **Flashcards**: Generate and copy TSV content for import into Quizlet

---

Built with ❤️ using Google Gemini AI
