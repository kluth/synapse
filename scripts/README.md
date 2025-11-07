# Synapse Framework - Scripts

This directory contains utility scripts for the Synapse Framework project.

## GitHub Issues Creation Scripts

We provide two methods for creating GitHub issues:

### Method 1: Node.js Script (Recommended)

**Prerequisites:**
- Node.js installed
- GitHub Personal Access Token

**Usage:**
```bash
# Set your GitHub token
export GH_PAT=your_github_personal_access_token
# Or
export GITHUB_TOKEN=your_github_personal_access_token

# Run the script
node scripts/create-github-issues.js
```

The Node.js script will:
- Auto-detect your repository from git remotes
- Create all 18 issues using the GitHub REST API
- Handle rate limiting automatically
- Show progress for each issue created

### Method 2: Bash + GitHub CLI

**Prerequisites:**
1. **GitHub CLI (gh)** must be installed:
   ```bash
   # macOS
   brew install gh

   # Linux
   curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
   echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
   sudo apt update
   sudo apt install gh

   # Windows
   winget install --id GitHub.cli
   ```

2. **Authenticate with GitHub**:
   ```bash
   gh auth login
   ```

   Or use the `GH_PAT` environment variable:
   ```bash
   export GH_TOKEN=your_github_personal_access_token
   ```

**Usage:**
```bash
bash scripts/create-github-issues.sh
```

This will create 18 GitHub issues (Phases 3-20) with:
- Detailed descriptions
- Appropriate labels
- Milestone assignments
- Success criteria
- Technical requirements
- Dependencies

#### Create Issues Individually

If you want to create issues one at a time or customize them, you can extract individual `gh issue create` commands from the script and run them separately.

Example for Phase 3:
```bash
gh issue create \
  --title "Phase 3: Muscular System - Business Logic Layer" \
  --label "phase-3,muscular-system,enhancement" \
  --milestone "Phase 3" \
  --body "$(cat <<'EOF'
[Issue body content here]
EOF
)"
```

### What Gets Created

The script creates issues for all planned phases:

| Phase | Title | Labels | Tests Required |
|-------|-------|--------|----------------|
| 3 | Muscular System | `phase-3`, `muscular-system` | 150+ |
| 4 | Circulatory System | `phase-4`, `circulatory-system` | 200+ |
| 5 | Respiratory System | `phase-5`, `respiratory-system` | 180+ |
| 6 | Immune System | `phase-6`, `immune-system`, `security` | 250+ |
| 7 | Endocrine System | `phase-7`, `endocrine-system` | 120+ |
| 8 | Digestive System | `phase-8`, `digestive-system` | 180+ |
| 9 | Advanced UI Components | `phase-9`, `skin-layer`, `ui` | 500+ |
| 10 | Observability & Monitoring | `phase-10`, `observability` | 150+ |
| 11 | Developer Experience | `phase-11`, `dx`, `tooling` | 100+ |
| 12 | Performance Optimization | `phase-12`, `performance` | Benchmarks |
| 13 | Advanced Data Patterns | `phase-13`, `cqrs`, `event-sourcing` | 200+ |
| 14 | Real-time Collaboration | `phase-14`, `crdt`, `real-time` | 250+ |
| 15 | AI & ML Integration | `phase-15`, `ai`, `ml` | 180+ |
| 16 | Edge Computing | `phase-16`, `edge`, `distributed` | 200+ |
| 17 | Testing Framework | `phase-17`, `testing`, `qa` | 150+ |
| 18 | Enterprise Features | `phase-18`, `enterprise`, `compliance` | 200+ |
| 19 | Plugin Ecosystem | `phase-19`, `plugins` | 150+ |
| 20 | Advanced Visualization | `phase-20`, `visualization`, `webgl` | 300+ |

**Total**: 18 issues, 3,000+ tests planned

### Issue Structure

Each issue includes:

- **Goal**: Clear objective for the phase
- **Overview**: Duration, complexity, dependencies, coverage targets
- **Deliverables**: Detailed list of components to implement
- **Success Criteria**: Measurable outcomes with checkboxes
- **Technical Requirements**: Testing, performance, security requirements
- **Related**: Dependencies and related work

### Milestones

You may need to create milestones first:

```bash
# Create milestone for each phase
for i in {3..20}; do
  gh issue create-milestone "Phase $i" --description "Phase $i implementation"
done
```

### Labels

The script uses these labels (create them if they don't exist):

**Phase Labels**:
- `phase-3` through `phase-20`

**System Labels** (biological metaphor):
- `muscular-system`
- `circulatory-system`
- `respiratory-system`
- `immune-system`
- `endocrine-system`
- `digestive-system`
- `skin-layer`

**Feature Labels**:
- `enhancement`
- `security`
- `performance`
- `testing`
- `dx` (developer experience)
- `observability`
- `ui`
- `ai`
- `ml`
- `edge`
- `distributed`
- `cqrs`
- `event-sourcing`
- `crdt`
- `real-time`
- `plugins`
- `visualization`
- `webgl`

### Create Labels in Bulk

```bash
# Create all labels at once
gh label create "muscular-system" --color "0052CC" --description "Muscular System (business logic)"
gh label create "circulatory-system" --color "0052CC" --description "Circulatory System (data flow)"
gh label create "respiratory-system" --color "0052CC" --description "Respiratory System (I/O)"
gh label create "immune-system" --color "FF0000" --description "Immune System (security)"
gh label create "endocrine-system" --color "0052CC" --description "Endocrine System (config)"
gh label create "digestive-system" --color "0052CC" --description "Digestive System (ETL)"
gh label create "skin-layer" --color "00AA00" --description "Skin Layer (UI)"
gh label create "dx" --color "FFAA00" --description "Developer Experience"
# ... add more as needed
```

### Troubleshooting

**Issue**: `gh: command not found`
- **Solution**: Install GitHub CLI (see Prerequisites above)

**Issue**: `authentication failed`
- **Solution**: Run `gh auth login` or set `GH_TOKEN` environment variable

**Issue**: `milestone not found`
- **Solution**: Create milestones first (see Milestones section above)

**Issue**: `label not found`
- **Solution**: Labels are optional. Issues will be created without labels if they don't exist.

### Customization

To customize the issues:

1. Edit `scripts/create-github-issues.sh`
2. Modify the `--body` content for any phase
3. Add/remove labels as needed
4. Change milestone names
5. Run the script again

### Verification

After running the script, verify issues were created:

```bash
gh issue list --limit 20
```

Or view in your browser:
```bash
gh issue list --web
```

## Next Steps

1. Run the script to create all issues
2. Review and adjust issues as needed
3. Assign team members to issues
4. Begin Phase 3 implementation!

## See Also

- [ROADMAP.md](../ROADMAP.md) - Complete 20-phase roadmap
- [GitHub CLI Documentation](https://cli.github.com/manual/)
