# Project Rename Analysis: Synapse → Full Body Metaphor

## Current State

**Current Name**: "Synapse Framework"
- Package: `@synapse-framework/core`
- CLI: `synapse`
- Repository: `synapse`
- Description: "Neural-inspired TypeScript framework"

## The Problem

"Synapse" is **too narrow** - it only refers to the **Nervous System** (a synapse is a connection between neurons). However, the framework has expanded to include the **entire body metaphor**:

### Current Systems (Implemented + Planned)
- ✅ **Nervous System** (Synapse is part of this)
- ✅ **Skeletal System** (Bone, Schema, validation)
- ✅ **Skin Layer** (SkinCell, Receptor, Effector)
- ⚪ **Muscular System** (Muscle, MuscleGroup, operations)
- ⚪ **Circulatory System** (Heart, Artery, Vein, BloodCell)
- ⚪ **Respiratory System** (Lung, Alveoli, Diaphragm, Bronchi)
- ⚪ **Immune System** (TCell, BCell, Macrophage, WhiteBloodCell)
- ⚪ **Endocrine System** (Gland, Hormone, Receptor)
- ⚪ **Digestive System** (Mouth, Esophagus, Stomach, Intestine)
- ⚪ **Theater System** (Stage, Specimen, Laboratory, Experiment)

**Conclusion**: The framework is about the **entire body/organism**, not just the nervous system.

## Rename Options

### Option 1: **Anatomy Framework** ⭐ (Recommended)
**Pros**:
- ✅ Reflects the entire body structure
- ✅ Medical/biological terminology
- ✅ Clear and professional
- ✅ "Anatomy" = study of body structure (perfect fit)
- ✅ Package: `@anatomy-framework/core`
- ✅ CLI: `anatomy`

**Cons**:
- ⚠️ Breaking change for existing users
- ⚠️ Repository rename needed
- ⚠️ Package name change needed

**Tagline**: "A TypeScript framework inspired by human anatomy"

---

### Option 2: **Organism Framework**
**Pros**:
- ✅ Reflects the entire living system
- ✅ Biological terminology
- ✅ Emphasizes systems working together
- ✅ Package: `@organism-framework/core`
- ✅ CLI: `organism`

**Cons**:
- ⚠️ Less specific than "Anatomy"
- ⚠️ Might sound too generic
- ⚠️ Breaking change

**Tagline**: "A TypeScript framework inspired by biological organisms"

---

### Option 3: **Physiology Framework**
**Pros**:
- ✅ Reflects body functions (physiology = how body works)
- ✅ Medical terminology
- ✅ Emphasizes systems and their functions
- ✅ Package: `@physiology-framework/core`
- ✅ CLI: `physiology`

**Cons**:
- ⚠️ Less well-known term than "Anatomy"
- ⚠️ Breaking change
- ⚠️ Might be confused with medical education

**Tagline**: "A TypeScript framework inspired by human physiology"

---

### Option 4: **Body Framework**
**Pros**:
- ✅ Simple and clear
- ✅ Immediately understandable
- ✅ Package: `@body-framework/core`
- ✅ CLI: `body`

**Cons**:
- ⚠️ Too generic (could be confused with CSS frameworks)
- ⚠️ Less professional sounding
- ⚠️ Breaking change

**Tagline**: "A TypeScript framework inspired by the human body"

---

### Option 5: **Keep "Synapse" but Rebrand**
**Pros**:
- ✅ No breaking changes
- ✅ Existing brand recognition
- ✅ Can expand meaning: "Synapse = connection between all body systems"

**Cons**:
- ⚠️ Still narrow - synapse is specifically nervous system
- ⚠️ Doesn't reflect full body metaphor
- ⚠️ Might confuse users when they see "Muscle", "Heart", "Lung" but framework is called "Synapse"

**Tagline**: "A TypeScript framework inspired by biological systems" (vague)

---

## Impact Assessment

### Breaking Changes Required

1. **Package Name**: `@synapse-framework/core` → `@anatomy-framework/core`
   - All imports need updating
   - NPM package republish
   - Documentation updates

2. **CLI Command**: `synapse` → `anatomy`
   - All scripts need updating
   - Documentation updates
   - User migration guide needed

3. **Repository Name**: `synapse` → `anatomy` (or `anatomy-framework`)
   - GitHub repository rename
   - All URLs change
   - CI/CD updates
   - Badge URLs update

4. **Documentation**:
   - All README files
   - All code examples
   - All API documentation
   - All guides and tutorials

5. **Code References**:
   - Framework metadata in `src/index.ts`
   - All documentation files
   - All markdown files

### Migration Strategy

If renaming, recommend:

1. **Phase 1**: Create new package name, keep old one as alias
   ```json
   {
     "name": "@anatomy-framework/core",
     "synapse": "@anatomy-framework/core"  // Alias
   }
   ```

2. **Phase 2**: Update all documentation to use new name
3. **Phase 3**: Deprecate old package name (6 months)
4. **Phase 4**: Remove old package name

---

## Recommendation

### **Recommendation: Rename to "Anatomy Framework"** ⭐

**Rationale**:
1. **Accurate**: Reflects the entire body metaphor, not just nervous system
2. **Professional**: Medical terminology that's well-understood
3. **Clear**: "Anatomy" = study of body structure (perfect fit)
4. **Consistent**: Aligns with all the body system terminology already in use
5. **Future-proof**: Works for all planned systems

**Timing**:
- **Best time**: Before v1.0.0 (currently v0.1.0)
- **Reason**: Less breaking change impact before major release
- **Strategy**: Do it now while still in early development

**Alternative if keeping current name**:
- Keep "Synapse" but update tagline to: "A TypeScript framework inspired by biological systems"
- Add note in README: "Synapse connects all body systems, just as synapses connect neurons"
- Accept that name is narrower than scope

---

## Decision Matrix

| Option | Accuracy | Professional | Breaking Change | Brand Recognition | Score |
|--------|----------|-------------|-----------------|-------------------|-------|
| **Anatomy** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⚠️⚠️⚠️ | ⭐⭐ | **18/20** |
| Organism | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⚠️⚠️⚠️ | ⭐ | 15/20 |
| Physiology | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⚠️⚠️⚠️ | ⭐ | 14/20 |
| Body | ⭐⭐⭐ | ⭐⭐ | ⚠️⚠️⚠️ | ⭐ | 10/20 |
| Keep Synapse | ⭐⭐ | ⭐⭐⭐⭐ | ✅ | ⭐⭐⭐⭐ | 13/20 |

---

## Next Steps

If proceeding with rename:

1. **Create GitHub issue** for project rename
2. **Update package.json** with new name
3. **Update all documentation** files
4. **Update repository name** (GitHub settings)
5. **Create migration guide** for users
6. **Update CI/CD** configurations
7. **Publish new package** to NPM
8. **Deprecate old package** (6 months notice)

---

## Questions to Consider

1. **Is the project mature enough for a rename?** (Currently v0.1.0 - YES, perfect time)
2. **How many users would be affected?** (Check GitHub stars, NPM downloads)
3. **Is brand recognition important?** (If yes, consider keeping "Synapse")
4. **Do we want to emphasize "body" or "systems"?** (Anatomy = body, Organism = systems)

---

**Status**: Ready for decision
**Priority**: High (should be decided before v1.0.0)
**Impact**: High (affects all users, documentation, branding)

