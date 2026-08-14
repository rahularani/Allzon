# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev for building)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client & Build TypeScript
RUN npx prisma generate
RUN npm run build
RUN npx tsc prisma/seed.ts --esModuleInterop

# Production Stage
FROM node:20-alpine AS runner

WORKDIR /app

# Add required libraries
RUN apk add --no-cache openssl

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy package files and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy compiled build from builder
COPY --from=builder /app/dist ./dist
# Copy generated Prisma Client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma/seed.js ./prisma/

# Expose backend port
EXPOSE 3000

# Start command
CMD ["sh", "-c", "npx prisma migrate deploy && if [ \"$RUN_SEED\" = \"true\" ]; then node prisma/seed.js; fi && npm run start"]
