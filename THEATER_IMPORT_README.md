# The Anatomy Theater - GitHub Import Guide

This directory contains files to import The Anatomy Theater project plan into GitHub.

## Files

1. **`anatomy-theater-github-import.json`** - Complete project structure with milestones and issues
2. **`import-theater-issues.sh`** - Shell script to automate GitHub import
3. **`THEATER_IMPORT_README.md`** - This file

## Project Overview

**The Anatomy Theater** is Phase 6 of the Synapse framework - a powerful component development and documentation system that replaces Storybook with medical-themed terminology and enhanced features.

### Milestones (8 phases)

- **Phase 6.1**: Theater Core (4 issues)
- **Phase 6.2**: Specimen System (3 issues)
- **Phase 6.3**: Microscope Tools (5 issues)
- **Phase 6.4**: Laboratory (4 issues)
- **Phase 6.5**: Atlas (4 issues)
- **Phase 6.6**: Server & Hot Reload (3 issues)
- **Phase 6.7**: CLI & Configuration (3 issues)
- **Phase 6.8**: Integration & Polish (6 issues)

**Total: 32 issues across 8 milestones**

## Import Methods

### Method 1: GitHub CLI (Recommended)

1. **Install GitHub CLI**:
   ```bash
   # macOS
   brew install gh

   # Linux
   sudo apt install gh

   # Or download from: https://cli.github.com/
   ```

2. **Authenticate**:
   ```bash
   gh auth login
   ```

3. **Edit the script** to set your repository:
   ```bash
   # Edit import-theater-issues.sh
   REPO="your-username/synapse"  # Change this line
   ```

4. **Run the import**:
   ```bash
   chmod +x import-theater-issues.sh
   ./import-theater-issues.sh
   ```

### Method 2: GitHub API with Node.js

```javascript
const fs = require('fs');
const https = require('https');

const data = JSON.parse(fs.readFileSync('anatomy-theater-github-import.json'));
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = 'username/synapse';

// Create milestones
data.milestones.forEach(milestone => {
  // POST to /repos/{owner}/{repo}/milestones
});

// Create issues
data.issues.forEach(issue => {
  // POST to /repos/{owner}/{repo}/issues
});
```

### Method 3: Manual Import

1. **Create Milestones** (GitHub UI):
   - Go to: `https://github.com/your-username/synapse/milestones/new`
   - Create each milestone with title, description, and due date from the JSON

2. **Create Issues** (GitHub UI):
   - Go to: `https://github.com/your-username/synapse/issues/new`
   - Copy-paste title and body from the JSON
   - Add labels and milestone

### Method 4: GitHub Projects (Beta)

GitHub Projects (beta) supports importing from CSV:

1. **Convert JSON to CSV**:
   ```bash
   # Use jq to convert
   jq -r '.issues[] | [.title, .body, .labels | join(","), .milestone] | @csv' anatomy-theater-github-import.json > theater-issues.csv
   ```

2. **Import to Project**:
   - Create a new GitHub Project (beta)
   - Use the "Import from CSV" feature

## Project Structure

```
The Anatomy Theater
├── Phase 6.1: Theater Core
│   ├── Issue #1: Implement Theater base class
│   ├── Issue #2: Implement Stage component
│   ├── Issue #3: Implement Amphitheater
│   └── Issue #4: Implement Instrument base interface
├── Phase 6.2: Specimen System
│   ├── Issue #5: Implement Specimen wrapper
│   ├── Issue #6: Implement Observation (variations)
│   └── Issue #7: Implement Dissection
├── Phase 6.3: Microscope Tools
│   ├── Issue #8: Implement Microscope hub
│   ├── Issue #9: Implement SignalTracer
│   ├── Issue #10: Implement StateExplorer
│   ├── Issue #11: Implement PerformanceProfiler
│   └── Issue #12: Implement HealthMonitor
├── Phase 6.4: Laboratory
│   ├── Issue #13: Implement Laboratory
│   ├── Issue #14: Implement PetriDish
│   ├── Issue #15: Implement Culture
│   └── Issue #16: Implement Experiment
├── Phase 6.5: Atlas
│   ├── Issue #17: Implement Atlas
│   ├── Issue #18: Implement ComponentCatalogue
│   ├── Issue #19: Implement Diagram
│   └── Issue #20: Implement Protocol
├── Phase 6.6: Server & Hot Reload
│   ├── Issue #21: Implement TheaterServer
│   ├── Issue #22: Implement HotReload system
│   └── Issue #23: Implement WebSocket communication
├── Phase 6.7: CLI & Configuration
│   ├── Issue #24: Implement Theater CLI
│   ├── Issue #25: Implement Theater configuration
│   └── Issue #26: Implement Specimen file loader
└── Phase 6.8: Integration & Polish
    ├── Issue #27: Create Theater UI components
    ├── Issue #28: Write Theater documentation
    ├── Issue #29: Create example specimens
    ├── Issue #30: Integration testing suite
    ├── Issue #31: Performance optimization
    ├── Issue #32: Accessibility audit and fixes
    └── Issue #33: Production build system
```

## Key Features

The Anatomy Theater surpasses Storybook with:

- ✅ **Real-time Neural Signal Visualization** - See signals flowing between components
- ✅ **Time-Travel State Debugging** - Built-in with VisualAstrocyte
- ✅ **Live Connection Topology** - Interactive neural network graph
- ✅ **Signal Replay** - Record and replay user interactions
- ✅ **Smart Auto-Documentation** - Extract from TypeScript + JSDoc
- ✅ **Health Monitoring** - Integrated Microglia monitoring
- ✅ **A/B Testing** - Adaptive UI experimentation
- ✅ **Accessibility Testing** - Built-in sensory profile testing
- ✅ **Performance Profiling** - VisualOligodendrocyte integration
- ✅ **Component Composition Playground** - Drag-and-drop circuit building

## Labels Used

- `Phase 6.1`, `Phase 6.2`, ... `Phase 6.8` - Phase indicators
- `core` - Core functionality
- `specimen` - Specimen system
- `microscope` - Inspection tools
- `laboratory` - Testing environment
- `atlas` - Documentation
- `server` - Server and networking
- `cli` - Command-line interface
- `ui` - User interface
- `enhancement` - New feature
- `documentation` - Documentation
- `testing` - Test-related
- `performance` - Performance optimization
- `accessibility` - Accessibility improvements
- `build` - Build system

## Estimated Timeline

- **Phase 6.1-6.2**: 2 weeks (Core + Specimens)
- **Phase 6.3-6.4**: 3 weeks (Tools + Lab)
- **Phase 6.5**: 1 week (Documentation)
- **Phase 6.6-6.7**: 2 weeks (Server + CLI)
- **Phase 6.8**: 2 weeks (Polish)

**Total: ~10 weeks**

## Next Steps

1. Import issues to GitHub
2. Set up GitHub Project board
3. Assign issues to team members
4. Begin Phase 6.1 implementation
5. Set up CI/CD for The Anatomy Theater

## Questions?

Refer to the main Synapse documentation or open a discussion in the repository.
