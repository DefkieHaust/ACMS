# Stage 1: Build frontend
FROM node:20-alpine@sha256:3a337eb4400c49ed1e3b99f8ea455cd57454d8b5c8b897ec2ea169f4a14e8f5e AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN apk upgrade --no-cache && npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Build & run backend (serves frontend/dist)
FROM node:20-alpine@sha256:3a337eb4400c49ed1e3b99f8ea455cd57454d8b5c8b897ec2ea169f4a14e8f5e AS backend
WORKDIR /app
RUN apk upgrade --no-cache && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

COPY package*.json ./
RUN npm ci --omit=dev

COPY src/ ./src/
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

USER appuser
EXPOSE 5000
ENV NODE_ENV=production
CMD ["node", "src/index.js"]
