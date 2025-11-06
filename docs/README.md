# Synapse UI Documentation

This directory contains the interactive documentation and component showcase for Synapse UI Framework - a neural-inspired, framework-agnostic UI library.

## 🌐 Live Site

Visit the live documentation at: https://kluth.github.io/synapse/

## 📦 What's Included

- **index.html**: Entry point that redirects to showcase
- **showcase.html**: Interactive component showcase with live demos
- **UI_FRAMEWORK.md**: Comprehensive framework documentation

## 🧠 Components Showcased

### Base Components
- **Button**: Neural button with 4 variants (primary, secondary, danger, success) and 3 sizes
- **Input**: Text input with validation and focus states
- **Select**: Dropdown selection with keyboard navigation
- **Form**: Form container with validation and submission handling

### Glial Systems
- **VisualAstrocyte**: Redux-like state management with time-travel debugging
- **VisualOligodendrocyte**: Rendering optimization with Virtual DOM diffing and memoization

## 🏗️ Architecture

Pure HTML/CSS/JavaScript showcase - **no React, Vue, or Angular dependencies**. Components are framework-agnostic TypeScript classes that render to Virtual DOM.

## 🚀 Deployment

Automatic deployment to GitHub Pages happens via `.github/workflows/docs.yml` on:
- Pushes to `main` branch
- Pushes to branches matching `claude/review-approach-terminology-*`
- Manual workflow dispatch

The workflow:
1. Builds TypeScript (`npm run build`)
2. Deploys `docs/` directory to GitHub Pages

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Open showcase in browser
open docs/showcase.html
```

No build step required for the showcase - it's pure HTML/CSS/JS!
