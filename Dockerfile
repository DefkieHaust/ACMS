# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN apk upgrade --no-cache && npm ci --legacy-peer-deps
COPY frontend/ .
RUN npm run build

# Stage 2: Production image (backend + static frontend)
FROM node:20-alpine
WORKDIR /app

RUN apk upgrade --no-cache && \
    addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 appuser && \
    mkdir -p /app/uploads && \
    chown appuser:appgroup /app/uploads

COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

COPY src/ ./src/
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

USER appuser
EXPOSE 5000

ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=512"

CMD ["node", "src/index.js"]
