#!/bin/bash

# High-Performance Docker Setup for MacBook with 32GB RAM
# This script optimizes Docker Desktop settings for maximum development performance

echo "🚀 Optimizing Docker Desktop for high-performance development..."

# Check if Docker Desktop is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker Desktop is not running. Please start Docker Desktop first."
    exit 1
fi

echo "✅ Docker Desktop is running"

# Create optimized Docker daemon configuration
echo "📝 Creating optimized Docker daemon configuration..."

# Path to Docker Desktop settings (macOS)
DOCKER_SETTINGS_PATH="$HOME/.docker/daemon.json"

# Create or update daemon.json with high-performance settings
cat > "$DOCKER_SETTINGS_PATH" << EOF
{
  "builder": {
    "gc": {
      "enabled": true,
      "defaultKeepStorage": "10GB"
    }
  },
  "experimental": true,
  "features": {
    "buildkit": true
  },
  "max-concurrent-downloads": 20,
  "max-concurrent-uploads": 20,
  "max-download-attempts": 5,
  "registry-mirrors": [],
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.override_kernel_check=true"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "default-runtime": "runc",
  "runtimes": {
    "runc": {
      "path": "runc"
    }
  }
}
EOF

echo "✅ Docker daemon configuration created at $DOCKER_SETTINGS_PATH"

# Enable BuildKit by default
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

echo "✅ BuildKit enabled for faster builds"

# Cleanup Docker system to free space and improve performance
echo "🧹 Cleaning up Docker system..."
docker system prune -f
docker builder prune -f

echo "✅ Docker system cleaned up"

# Show current Docker resource usage
echo "📊 Current Docker resource allocation:"
docker system df

echo ""
echo "🎯 Recommended Docker Desktop Settings for your 32GB MacBook:"
echo "   Memory: 12GB (adjust in Docker Desktop preferences)"
echo "   CPUs: 8-10 cores"
echo "   Swap: 2GB"
echo "   Disk image size: 100GB+"
echo ""
echo "💡 To apply these settings:"
echo "   1. Open Docker Desktop"
echo "   2. Go to Settings > Resources"
echo "   3. Set Memory to 12GB"
echo "   4. Set CPUs to 8-10"
echo "   5. Set Swap to 2GB"
echo "   6. Click 'Apply & Restart'"
echo ""
echo "🚀 High-performance setup complete!"
echo "🏃‍♂️ Now run: docker-compose up --build for maximum performance"