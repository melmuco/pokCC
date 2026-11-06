# syntax=docker/dockerfile:1

# ============================================================
# pokcc-backend — production Docker image (NestJS + Prisma)
# Target: node:20-alpine, exposed on port 4000
# Build:  docker build -t pokcc-backend -f backend/Dockerfile .
# ============================================================

# --- Stage 1: build ---------------------------------------------------------
# Install ALL dependencies (incl. devDependencies: @nestjs/cli, prisma,
# typescript, etc.) so we can compile TypeScript and generate the Prisma client.
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps (layered for cache). No --only here: we need devDeps to build.
COPY package*.json ./
RUN npm ci

# Copy sources and generate the Prisma Client (query engine lives in node_modules/.prisma)
COPY . .
RUN npx prisma generate --schema ./prisma/schema.prisma

# Compile NestJS -> dist/
RUN npm run build

# --- Stage 2: runtime -------------------------------------------------------
# Minimal production image: only what's needed to run `node dist/main.js`.
FROM node:20-alpine AS runner

WORKDIR /app

# Production env; the app reads PORT, DATABASE_URL, JWT_SECRET, REDIS_URL, etc.
ENV NODE_ENV=production

# Non-root user (Prisma query engine and sharp need write access to /tmp,
# which is world-writable on Alpine; uploads go to a named volume).
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nestjs -u 1001

# Bring over only the artifacts the compiled app actually needs.
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/uploads ./uploads

# Static file serving under /uploads (see main.ts: app.use('/uploads', express.static(...)))
# Bind here so the volume mount in docker-compose.prod.yml works out of the box.
RUN chown -R nestjs:nodejs /app/uploads && chmod -R u+rwx /app/uploads

USER nestjs

EXPOSE 4000

# Railway/Render override this with their own CMD; default is the compiled entrypoint.
CMD ["node", "dist/main.js"]