# Multi-stage Dockerfile for the trader-ui Next.js app.
# Uses Next.js standalone output — the final image is ~150 MB and contains
# only the server bundle + its own node_modules, no build tooling.
#
# Built and deployed by .github/workflows/deploy-ui.yml via
#   gcloud run deploy --source=ui
# Cloud Build picks up this Dockerfile automatically.
#
# NEXT_PUBLIC_* values must be present at BUILD TIME (Next.js inlines
# them into the client bundle). The deploy workflow writes them to
# ui/.env.production before invoking gcloud — `next build` reads that
# file automatically. Don't re-add ARG/ENV plumbing here; it's redundant
# and was previously broken because gcloud's --update-build-env-vars
# doesn't pass values as Docker --build-arg for Dockerfile builds.

# -------- deps --------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# -------- build --------
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# -------- runtime --------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8080 \
    HOSTNAME=0.0.0.0

# Next.js standalone produces a self-contained server bundle. Copy just
# what it needs — no build tools in the runtime image.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Cloud Run sets PORT automatically; we listen on it.
EXPOSE 8080
CMD ["node", "server.js"]
