#!/usr/bin/env bash
set -euo pipefail

# Move to backend root
cd "$(dirname "$0")/.."

# Create venv if missing
if [ ! -d ".venv" ]; then
  echo "Creating virtual environment .venv..."
  python3 -m venv .venv
fi

# Activate venv
# shellcheck disable=SC1091
source .venv/bin/activate

# Ensure pip and install requirements
pip install --upgrade pip
pip install -r requirements.txt

# Run uvicorn through python -m to ensure it uses the venv interpreter
exec python -m uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload --log-level debug
