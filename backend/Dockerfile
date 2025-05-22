# Use a Node.js official image
FROM node:23-alpine

# Set working directory
WORKDIR /app

# Add build argument for Sentry auth token
ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN

# Copy package.json and package-lock.json first for better caching
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy the rest of the source code
COPY . .

# Create directory for file uploads
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

# Expose port 4000
EXPOSE 4000

# Set NODE_ENV to production
ENV NODE_ENV=production

# Command to start the application
CMD ["node", "src/app.js"]