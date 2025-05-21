# Use the official Node.js image as the base
FROM node:23-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Create environment variables to disable ESLint and Telemetry
ENV NEXT_DISABLE_ESLINT=true
ENV NEXT_TELEMETRY_DISABLED=1

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Production image
FROM node:23-alpine

WORKDIR /app

# Copy built assets from the builder stage
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

# Expose the port that Next.js runs on
EXPOSE 3000

# Set environment variables for production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Command to start in production mode
CMD ["npm", "start"]