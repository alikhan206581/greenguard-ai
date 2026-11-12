# GreenGuard AI

## Deploy frontend and backend on Render

1. Push this repository to GitHub.
2. In Render, choose **New → Blueprint**, connect this repository, and deploy the `render.yaml` Blueprint.
3. Render creates the FastAPI backend and Next.js frontend. Open the frontend service URL when both services are live.

The frontend proxies API requests to the backend. The Blueprint uses Render's free instances, which can sleep when idle; the backend's SQLite data is on ephemeral storage and may be lost after a restart or redeploy. This is a public demo deployment: the backend has no authentication. Do not upload sensitive documents or use it for production.