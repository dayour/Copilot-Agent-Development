#!/bin/bash

# Multi-Agent Scheduler GitHub Setup Script
# This script helps you create and push to a new GitHub repository

echo "🚀 Multi-Agent AI Scheduling Assistant - GitHub Setup"
echo "=================================================="
echo ""

echo "📋 Repository Details:"
echo "   Name: multi-agent-scheduler"
echo "   Organization: darbotlabs"
echo "   URL: https://github.com/darbotlabs/multi-agent-scheduler"
echo ""

echo "🔧 Setup Steps:"
echo "1. Go to https://github.com/organizations/darbotlabs/repositories/new"
echo "2. Create a new repository with:"
echo "   - Repository name: multi-agent-scheduler"
echo "   - Description: Multi-Agent AI Scheduling Assistant with Teams AI and Copilot Studio integration"
echo "   - Visibility: Public (or Private if preferred)"
echo "   - Initialize: Unchecked (we already have files)"
echo ""

echo "3. After creating the repository, run:"
echo "   git push -u origin main"
echo ""

echo "✅ Git repository is ready to push!"
echo "   Current commit: $(git log --oneline -1)"
echo "   Files ready: $(git ls-files | wc -l) files"
echo ""

echo "📦 Project Summary:"
echo "   - Multi-Agent AI Scheduling Assistant"
echo "   - Microsoft Teams AI integration"
echo "   - Copilot Studio Calendar Manager connection"
echo "   - Real calendar operations"
echo "   - DevTools for testing"
echo ""
