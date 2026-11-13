# Deploying GreenGuard AI on Render

The root `render.yaml` defines two services from this repository: a Next.js frontend and a FastAPI backend. The frontend is configured to proxy `/api/*` and `/health` requests to the backend over Render's private network.

## Deploy

1. Push or merge the deployment files to the repository's default branch.
2. In Render, choose **New → Blueprint**, connect `alikhan206581/greenguard-ai`, and select the branch containing `render.yaml`.
3. Review the two services (`greenguard-backend` and `greenguard-frontend`) and deploy the Blueprint.
4. Open the frontend service's public URL. Check the backend health endpoint at `/health` on its service URL if you need to troubleshoot.

The Blueprint links the backend's internal host and port to the frontend as `BACKEND_URL`. The Next.js config adds `http://` when that value is a host-and-port rather than a full URL.

## Important limitations

- Both services use Render's free plan, which may sleep when idle and take time to wake up.
- The backend stores audit history in SQLite under `backendre/data`. The free service's filesystem is ephemeral, so stored audits can be lost when the service restarts or redeploys. Use persistent storage and backups before relying on audit history.
- The backend currently has no authentication or tenant isolation. Do not upload sensitive or real customer documents to this public prototype.
- Deterministic demo features need no API keys. If you intentionally enable OpenAI extraction, configure `OPENAI_API_KEY` as a secret on the backend service in Render; never put it in frontend variables.
