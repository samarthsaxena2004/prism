#!/bin/bash
# Use miniconda python — it has all dependencies installed.
# Do NOT use system python3 (Homebrew-protected, PEP 668).
cd "$(dirname "$0")"
/opt/miniconda3/bin/python3 -m uvicorn main:app --reload --port 8000
