# TrySnap Backend

Backend API for TrySnap lives here as a separate Node.js + Express + Prisma package under the React Native app.

## Setup

1. Copy `.env.example` to `.env` and fill in Cloudinary, Gemini, Vertex AI, and PostgreSQL values.
2. Install dependencies from `backend/`.
3. Run Prisma generate and start the server.

## Scripts

- `npm run dev` - start the API in watch mode
- `npm run build` - compile TypeScript
- `npm run start` - run the compiled server
- `npm run prisma:generate` - generate Prisma client
- `npm run prisma:studio` - open Prisma Studio

## API routes

- `POST /api/validate-photo`
- `POST /api/process-avatar`
- `POST /api/process-garment`
- `POST /api/avatar/save`
- `GET /api/avatar`
- `POST /api/tryon/generate`

## Notes

- `userId` is passed directly in avatar storage routes because auth is not wired yet.
- Vertex Imagen reference-image payloads are isolated in `src/services/vertex.ts` so they can be adjusted to the exact deployed API shape without affecting the rest of the backend.
