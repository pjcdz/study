# Use the official Node.js image as the base
FROM node:22.15.0-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Create environment variables to disable ESLint
ENV NEXT_DISABLE_ESLINT=true
ENV NEXT_TELEMETRY_DISABLED=1

# Copy the rest of the application
COPY . .

# Expose the port that Next.js runs on
EXPOSE 3000

# Command to start in development mode
CMD ["npm", "run", "dev"]