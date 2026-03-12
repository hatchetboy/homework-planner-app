#!/bin/bash
set -euo pipefail

# Only run in remote Claude Code on the web environment
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Install npm dependencies
echo "Installing npm dependencies..."
cd "$CLAUDE_PROJECT_DIR"
npm install

# Install gcloud CLI if not already installed
if ! command -v gcloud &> /dev/null; then
  echo "Installing Google Cloud SDK..."
  GCLOUD_VERSION="560.0.0"
  GCLOUD_TARBALL="google-cloud-sdk-${GCLOUD_VERSION}-linux-x86_64.tar.gz"
  GCLOUD_URL="https://storage.googleapis.com/cloud-sdk-release/${GCLOUD_TARBALL}"
  INSTALL_DIR="/usr/local"

  curl -fsSL "$GCLOUD_URL" -o "/tmp/${GCLOUD_TARBALL}"
  tar -xzf "/tmp/${GCLOUD_TARBALL}" -C "$INSTALL_DIR"
  rm -f "/tmp/${GCLOUD_TARBALL}"

  ln -sf "${INSTALL_DIR}/google-cloud-sdk/bin/gcloud" /usr/local/bin/gcloud
  ln -sf "${INSTALL_DIR}/google-cloud-sdk/bin/gsutil" /usr/local/bin/gsutil

  echo "gcloud installed: $(gcloud --version | head -1)"
else
  echo "gcloud already installed: $(gcloud --version | head -1)"
fi

# Authenticate with service account if key is available
if [ -n "${GCLOUD_SERVICE_ACCOUNT_KEY:-}" ]; then
  echo "Authenticating with service account..."
  echo "$GCLOUD_SERVICE_ACCOUNT_KEY" > /tmp/gcloud-key.json
  gcloud auth activate-service-account --key-file=/tmp/gcloud-key.json
  rm -f /tmp/gcloud-key.json

  # Extract and set project ID from the key file
  PROJECT_ID=$(echo "$GCLOUD_SERVICE_ACCOUNT_KEY" | python3 -c "import sys,json; print(json.load(sys.stdin)['project_id'])")
  gcloud config set project "$PROJECT_ID"
  echo "Authenticated and project set to: $PROJECT_ID"
else
  echo "WARNING: GCLOUD_SERVICE_ACCOUNT_KEY not set — skipping gcloud authentication"
fi
