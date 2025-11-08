#!/bin/bash
# Import The Anatomy Theater issues to GitHub
# Requires: gh (GitHub CLI) - https://cli.github.com/

set -e

REPO="kluth/synapse"  # Change to your repo
JSON_FILE="anatomy-theater-github-import.json"

echo "🎭 Importing The Anatomy Theater issues to GitHub..."
echo "Repository: $REPO"
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub."
    echo "Run: gh auth login"
    exit 1
fi

# Create milestones
echo "📋 Creating milestones..."

gh api repos/$REPO/milestones -f title="Phase 6.1: Theater Core" -f description="Core presentation engine, stage, and observation gallery" -f due_on="2025-12-15T00:00:00Z" || true
gh api repos/$REPO/milestones -f title="Phase 6.2: Specimen System" -f description="Component showcase and observation management" -f due_on="2025-12-22T00:00:00Z" || true
gh api repos/$REPO/milestones -f title="Phase 6.3: Microscope Tools" -f description="Deep inspection, debugging, and monitoring tools" -f due_on="2026-01-05T00:00:00Z" || true
gh api repos/$REPO/milestones -f title="Phase 6.4: Laboratory" -f description="Testing environment and experimentation framework" -f due_on="2026-01-12T00:00:00Z" || true
gh api repos/$REPO/milestones -f title="Phase 6.5: Atlas" -f description="Auto-documentation and architecture visualization" -f due_on="2026-01-19T00:00:00Z" || true
gh api repos/$REPO/milestones -f title="Phase 6.6: Server & Hot Reload" -f description="Development server with real-time updates" -f due_on="2026-01-26T00:00:00Z" || true
gh api repos/$REPO/milestones -f title="Phase 6.7: CLI & Configuration" -f description="Command-line interface and project configuration" -f due_on="2026-02-02T00:00:00Z" || true
gh api repos/$REPO/milestones -f title="Phase 6.8: Integration & Polish" -f description="Framework integration, testing, and documentation" -f due_on="2026-02-09T00:00:00Z" || true

echo "✅ Milestones created!"
echo ""

# Get milestone numbers
echo "📊 Fetching milestone numbers..."
MILESTONES=$(gh api repos/$REPO/milestones --jq '.[] | "\(.title)|\(.number)"')

# Function to get milestone number by title
get_milestone_number() {
    local title="$1"
    echo "$MILESTONES" | grep "^$title|" | cut -d'|' -f2
}

# Create issues
echo "📝 Creating issues..."
echo ""

# Phase 6.1 issues
MILESTONE_61=$(get_milestone_number "Phase 6.1: Theater Core")
gh issue create --repo $REPO --title "Implement Theater base class" --body-file <(cat <<'EOF'
## Description
Create the main Theater class that orchestrates the entire Anatomy Theater system.

## Acceptance Criteria
- [ ] Theater class with stage, amphitheater, and instruments
- [ ] Configuration loading and validation
- [ ] Lifecycle management (start, stop, reload)
- [ ] Event emitter for theater events
- [ ] TypeScript strict mode compliant
- [ ] Unit tests (>90% coverage)

## Technical Notes
```typescript
class Theater {
  stage: Stage;
  amphitheater: Amphitheater;
  instruments: Map<string, Instrument>;
  config: TheaterConfig;
}
```

## Files
- `src/theater/core/Theater.ts`
- `src/theater/core/Theater.test.ts`
EOF
) --label "Phase 6.1,core,enhancement" --milestone "$MILESTONE_61"

gh issue create --repo $REPO --title "Implement Stage component" --body-file <(cat <<'EOF'
## Description
Create the Stage where components are rendered and observed.

## Acceptance Criteria
- [ ] Stage class with viewport management
- [ ] Component mounting and unmounting
- [ ] Isolated rendering environment (shadow DOM/iframe)
- [ ] Resize and responsive testing
- [ ] Device emulation (mobile, tablet, desktop)
- [ ] Unit tests (>90% coverage)

## Technical Notes
- Integration with VisualNeuron rendering
- Support for different viewport sizes
- Screenshot capture capability

## Files
- `src/theater/core/Stage.ts`
- `src/theater/core/Stage.test.ts`
EOF
) --label "Phase 6.1,core,enhancement" --milestone "$MILESTONE_61"

gh issue create --repo $REPO --title "Implement Amphitheater (observation gallery)" --body-file <(cat <<'EOF'
## Description
Create the Amphitheater UI where developers observe and interact with components.

## Acceptance Criteria
- [ ] Gallery layout with component grid
- [ ] Search and filter functionality
- [ ] Category organization
- [ ] Dark/light theme support
- [ ] Responsive layout
- [ ] Keyboard navigation
- [ ] Unit tests (>90% coverage)

## Technical Notes
- Built using our own UI system (VisualNeurons)
- Accessibility compliant (WCAG 2.1 AA)

## Files
- `src/theater/core/Amphitheater.ts`
- `src/theater/core/Amphitheater.test.ts`
EOF
) --label "Phase 6.1,core,ui,enhancement" --milestone "$MILESTONE_61"

gh issue create --repo $REPO --title "Implement Instrument base interface" --body-file <(cat <<'EOF'
## Description
Create the base interface for all development tools (instruments).

## Acceptance Criteria
- [ ] Instrument interface definition
- [ ] Panel management (open, close, toggle)
- [ ] Tool registration system
- [ ] Inter-tool communication
- [ ] State persistence
- [ ] Unit tests (>90% coverage)

## Files
- `src/theater/core/Instrument.ts`
- `src/theater/core/Instrument.test.ts`
EOF
) --label "Phase 6.1,core,enhancement" --milestone "$MILESTONE_61"

echo "✅ Created Phase 6.1 issues (4 issues)"
echo ""

# Note: Add more issue creation commands here for other phases
# This is abbreviated for brevity - you would continue with all issues

echo "✨ Import complete!"
echo ""
echo "View issues at: https://github.com/$REPO/issues"
echo "View milestones at: https://github.com/$REPO/milestones"
