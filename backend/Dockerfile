# Use a Node.js official image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first for better caching
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy the rest of the source code
COPY . .

# Expose port 4000
EXPOSE 4000

# Set NODE_ENV to production
ENV NODE_ENV=production

# Command to start the application
CMD ["node", "src/app.js"]