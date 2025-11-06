# Synapse UI Documentation

This directory contains the documentation website for Synapse UI Framework, showcasing neural-inspired Web Components.

## 🌐 Live Site

Visit the live documentation at: https://kluth.github.io/synapse/

## 🏗️ Build

The documentation site is automatically built and deployed via GitHub Actions on every push to main.

```bash
# Build web components bundle
npm run build:web-components

# Serve locally
npx vite serve docs
```

## 📦 What's Included

- **index.html**: Main documentation page with interactive component demos
- **synapse-ui.js**: Bundled Web Components (auto-generated)

## 🧠 Components Showcased

- **synapse-button**: Neural button component with variants and states
- **synapse-input**: Input component with validation
- More components coming soon!

## 🚀 Deployment

Automatic deployment to GitHub Pages happens via `.github/workflows/docs.yml` on:
- Pushes to `main` branch
- Pushes to branches matching `claude/review-approach-terminology-*`
- Manual workflow dispatch

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Build web components
npm run build:web-components

# Open docs/index.html in browser
open docs/index.html
```
