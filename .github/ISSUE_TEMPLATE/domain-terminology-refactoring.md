# Domain Terminology Refactoring: Align Codebase with Medical/Biological Terminology

## Overview

This issue tracks the comprehensive refactoring of the entire codebase to align with medical/biological domain terminology (Ubiquitous Language). The goal is to ensure **100% adherence** to medical/biological terminology throughout the codebase, reflecting the body and all that belongs to it.

## Current Status

**Health Score**: 17% (Critical - Significant terminology drift)

- **Direct Match**: 85 terms (17%)
- **Legacy/Deprecated**: 12 terms (2.4%)
- **Ambiguous/Confusing**: 8 terms (1.6%)
- **No Match**: 395+ terms (79%)
- **Misspelled**: 0 terms (0%)

## Critical Areas

1. **UI System (Critical)**: 12 legacy terms need migration to Skin system
2. **Type System (Critical)**: ComponentProps/ComponentState used in 100+ files
3. **Visualization System (High)**: 11+ generic chart terms need medical equivalents
4. **Infrastructure (High)**: Server/Client/Bridge terms need medical equivalents
5. **Communication (Medium)**: EventBus/Event need Circulatory System terms
6. **Respiratory System (Medium)**: Router/Resource/Route need medical equivalents

## Reference Documents

All analysis and planning documents have been created:

1. **`DOMAIN_TERMINOLOGY_GLOSSARY.md`** - Official Domain Terminology Glossary
2. **`AUDIT_FINDINGS.md`** - Complete audit findings with categorized terms
3. **`PRIORITIZED_REFACTORING_PLAN.md`** - Prioritized refactoring plan with 100+ changes
4. **`BLAST_RADIUS_ASSESSMENT.md`** - Blast radius assessment for each High Priority change
5. **`PHASING_AND_TDD_PLAN.md`** - 7-phase implementation strategy with TDD plan
6. **`COMPREHENSIVE_REFACTORING_PLAYBOOK.md`** - Complete refactoring playbook

## Implementation Phases

### Phase 1: Core UI System Terminology (Week 1-2) - **START HERE**

**Critical Changes**:
- [ ] `VisualNeuron` → `SkinCell` (42 files affected)
- [ ] `SensoryNeuron` → `Receptor` (25 files affected)
- [ ] `MotorNeuron` → `Effector` (3 files affected)
- [ ] `InterneuronUI` → `DermalLayer` (8 files affected)
- [ ] `VisualAstrocyte` → `Adipocyte` (3 files affected)
- [ ] `VisualOligodendrocyte` → `Melanocyte` (3 files affected)
- [ ] `ComponentProps` → System-specific props (`SkinCellProps`, `ReceptorProps`, `EffectorProps`, `DermalLayerProps`) (100+ files affected)
- [ ] `ComponentState` → System-specific state (`SkinCellState`, `ReceptorState`, `EffectorState`, `DermalLayerState`) (100+ files affected)

**Files to Update**:
- `src/ui/VisualNeuron.ts` → `src/ui/SkinCell.ts`
- `src/ui/SensoryNeuron.ts` → `src/ui/Receptor.ts`
- `src/ui/MotorNeuron.ts` → `src/ui/Effector.ts`
- `src/ui/InterneuronUI.ts` → `src/ui/DermalLayer.ts`
- `src/ui/glial/VisualAstrocyte.ts` → `src/ui/glial/Adipocyte.ts`
- `src/ui/glial/VisualOligodendrocyte.ts` → `src/ui/glial/Melanocyte.ts`
- `src/ui/types.ts` (add system-specific types)
- All files in `src/ui/components/` (18 files)
- All files in `src/visualization/` (10 files)
- All test files in `src/ui/__tests__/` (4 files)
- All story files `*.stories.ts` (9 files)
- `src/ui/index.ts` (update exports)

**Migration Steps**:
1. Create new classes with medical names (SkinCell, Receptor, etc.)
2. Update all imports (use find/replace carefully)
3. Update all type references
4. Update all class extensions
5. Update exports in index files
6. Update tests
7. Update stories
8. Run full test suite
9. Verify type checking passes
10. Verify build succeeds

### Phase 2: UI Component Names (Week 3-4)

**Changes**:
- [ ] `Button` → `TouchReceptor` (5 files)
- [ ] `Input` → `TextReceptor` (5 files)
- [ ] `Select` → `SelectReceptor` / `ChoiceReceptor` (5 files)
- [ ] `Form` → `DermalLayer` (5 files)
- [ ] `Modal` → `Membrane` / `Vesicle` (5 files)
- [ ] `Card` → `DermalLayer` / `Epidermis` (5 files)
- [ ] `Alert` → `AlertReceptor` / `Nociceptor` (5 files)
- [ ] `Text` → `Keratinocyte` / `TextCell` (5 files)
- [ ] `Radio` → `RadioReceptor` / `ChoiceReceptor` (5 files)
- [ ] `Checkbox` → `CheckReceptor` / `ToggleReceptor` (5 files)

**Files to Update**:
- All component files in `src/ui/components/`
- All component test files
- All component story files
- `src/ui/components/index.ts`

### Phase 3: Visualization System (Week 5-6)

**Changes**:
- [ ] `Chart` → `Visualization`
- [ ] `BarChart` → `BarVisualization`
- [ ] `LineChart` → `LineVisualization`
- [ ] `PieChart` → `PieVisualization`
- [ ] `ScatterPlot` → `ScatterVisualization`
- [ ] `ChartDataPoint` → `DataPoint` / `Measurement`
- [ ] `DataBounds` → `Bounds` / `Range`
- [ ] `CanvasPoint` → `Coordinate` / `Point`
- [ ] `BaseChartProps` → `BaseVisualizationProps`
- [ ] `BaseChartState` → `BaseVisualizationState`
- [ ] `ChartTheme` → `VisualizationTheme`

**Files to Update**:
- All files in `src/visualization/`
- `src/visualization/index.ts`

### Phase 4: Communication System (Week 7)

**Changes**:
- [ ] `EventBus` → `Heart` / `Artery` (decide on single term)
- [ ] `Event` → `BloodCell` / `Signal` (decide on single term)

**Files to Update**:
- `src/communication/EventBus.ts`
- `src/communication/index.ts`
- `src/index.ts`
- All files using EventBus

### Phase 5: Respiratory System (Week 8-9)

**Changes**:
- [ ] `Router` → `Bronchus` / `Trachea` (decide on single term)
- [ ] `Resource` → `Oxygen` / `Nutrient` (decide on single term)
- [ ] `ResourcePool` → `Alveolus` / `Capillary` (decide on single term)
- [ ] `Route` → `Bronchiole`
- [ ] `DatabaseResource` → `DatabaseOxygen` / `DatabaseNutrient`
- [ ] `CacheResource` → `CacheOxygen` / `CacheNutrient`
- [ ] `StorageResource` → `StorageOxygen` / `StorageNutrient`
- [ ] `RestAdapter` → `RestBronchus`
- [ ] `GraphQLAdapter` → `GraphQLBronchus`
- [ ] `WebSocketAdapter` → `WebSocketBronchus`
- [ ] `ProtocolAdapter` → `ProtocolBronchus`

**Files to Update**:
- All files in `src/respiratory/`
- `src/respiratory/index.ts`

### Phase 6: Infrastructure Terms (Week 10)

**Changes**:
- [ ] `Server` → `Organ` / `System` (decide on single term)
- [ ] `Client` → `Receptor` / `Effector` (decide on single term)
- [ ] `Bridge` → `Synapse` / `Connection` (decide on single term)
- [ ] `WebSocketBridge` → `WebSocketSynapse` / `WebSocketConnection`
- [ ] `TheaterServer` → `TheaterOrgan` / `TheaterSystem`
- [ ] `ClientConnection` → `ReceptorConnection` / `EffectorConnection`
- [ ] `HotReload` → `Regeneration` / `Renewal`
- [ ] `ServerConfig` → `OrganConfig` / `SystemConfig`
- [ ] `ServerState` → `OrganState` / `SystemState`
- [ ] `WebSocketConfig` → `WebSocketConnectionConfig`
- [ ] `HotReloadConfig` → `RegenerationConfig`

**Files to Update**:
- All files in `src/theater/server/`
- `src/theater/index.ts`

### Phase 7: Tools & Testing Terms (Week 11)

**Changes**:
- [ ] `DependencyAuditor` → `DependencyAnalyzer` / `DependencyInspector`
- [ ] `AuditReport` → `AnalysisReport` / `InspectionReport`
- [ ] `AuditOptions` → `AnalysisOptions` / `InspectionOptions`
- [ ] `Test` → `Experiment` / `Hypothesis` (in test files - optional)
- [ ] `Mock` → `Specimen` / `Model` (in test files - optional)

**Files to Update**:
- `src/tools/dependency-auditor.ts`
- Test files (optional - can keep Test/Mock for compatibility)

## Implementation Guidelines

### Naming Conventions

1. **Classes**: PascalCase (e.g., `SkinCell`, `TouchReceptor`)
2. **Interfaces**: PascalCase (e.g., `SkinCellConfig`, `TouchReceptorProps`)
3. **Types**: PascalCase (e.g., `ReceptorType`, `SkinCellState`)
4. **Methods**: camelCase (e.g., `activate()`, `receive()`)
5. **Variables**: camelCase (e.g., `signalQueue`, `activationTime`)
6. **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`, `DEFAULT_TTL`)

### Migration Strategy

1. **Create New Classes**: Create new classes with medical names
2. **Update Imports**: Update all imports to use new names
3. **Update Types**: Update all type references
4. **Update Tests**: Update all test files
5. **Update Documentation**: Update all documentation
6. **Backward Compatibility** (if needed): Add deprecated aliases with warnings
7. **Remove Old Names**: After migration period, remove deprecated aliases

### Backward Compatibility

For critical breaking changes, consider adding deprecated aliases:

```typescript
/** @deprecated Use SkinCell instead. Will be removed in v2.0.0 */
export const VisualNeuron = SkinCell;

/** @deprecated Use SkinCell instead. Will be removed in v2.0.0 */
export class VisualNeuron extends SkinCell {
  constructor(...args: ConstructorParameters<typeof SkinCell>) {
    console.warn('VisualNeuron is deprecated. Use SkinCell instead.');
    super(...args);
  }
}
```

## Testing Requirements

### Before Each Phase

- [ ] Write tests asserting new terminology (if applicable)
- [ ] Document expected behavior
- [ ] Review test coverage

### During Each Phase

- [ ] Update test imports to use new names
- [ ] Update test class names (TestVisualNeuron → TestSkinCell)
- [ ] Update test type references
- [ ] Update test assertions
- [ ] Run tests frequently to catch issues early

### After Each Phase

- [ ] Run full test suite: `npm test`
- [ ] Verify all tests pass: `npm test -- --passWithNoTests`
- [ ] Check test coverage: `npm run test:coverage`
- [ ] Verify type checking: `npm run type-check`
- [ ] Verify build succeeds: `npm run build`
- [ ] Verify linting passes: `npm run lint`
- [ ] Verify no old terminology remains (grep for old names)
- [ ] Verify exports work correctly
- [ ] Update documentation

## Acceptance Criteria

### Phase 1 (Critical)

- [ ] All `VisualNeuron` references migrated to `SkinCell`
- [ ] All `SensoryNeuron` references migrated to `Receptor`
- [ ] All `MotorNeuron` references migrated to `Effector`
- [ ] All `InterneuronUI` references migrated to `DermalLayer`
- [ ] All `VisualAstrocyte` references migrated to `Adipocyte`
- [ ] All `VisualOligodendrocyte` references migrated to `Melanocyte`
- [ ] All `ComponentProps` references migrated to system-specific props
- [ ] All `ComponentState` references migrated to system-specific state
- [ ] All tests pass
- [ ] All type checking passes
- [ ] All builds succeed
- [ ] All linting passes
- [ ] All exports work correctly
- [ ] Documentation updated
- [ ] No old terminology remains in production code

### Overall Success Criteria

- [ ] 100% of High Priority changes completed
- [ ] 80% of Medium Priority changes completed
- [ ] All tests pass: `npm test`
- [ ] All type checking passes: `npm run type-check`
- [ ] All builds succeed: `npm run build`
- [ ] All linting passes: `npm run lint`
- [ ] All exports work correctly
- [ ] Documentation updated
- [ ] No old terminology remains in production code
- [ ] Domain language adherence > 80%

## Verification Checklist (Per Phase)

After completing each phase, verify:

- [ ] All tests pass: `npm test`
- [ ] Type checking passes: `npm run type-check`
- [ ] Build succeeds: `npm run build`
- [ ] Linting passes: `npm run lint`
- [ ] Exports work correctly
- [ ] Documentation updated
- [ ] No old terminology remains (grep for old names)
- [ ] Integration tests pass
- [ ] Performance not degraded
- [ ] No breaking changes (or documented with deprecation warnings)

## Risk Mitigation

### High Risk Changes

1. **VisualNeuron → SkinCell** (42 files, Critical)
   - Create comprehensive migration guide
   - Consider backward compatibility aliases
   - Test thoroughly before merging

2. **ComponentProps/State → System-specific** (100+ files, Critical)
   - Create type aliases for gradual migration
   - Use TypeScript's type system to catch errors
   - Test type checking thoroughly

3. **SensoryNeuron → Receptor** (25 files, Critical)
   - Create migration guide
   - Consider backward compatibility

### Testing Strategy

1. **Before Refactoring**: Write tests asserting new terminology
2. **During Refactoring**: Update tests as you go
3. **After Refactoring**: Run full test suite, verify coverage

## Decision Points

Before starting, decide on these ambiguous terms:

1. **EventBus → Heart or Artery?**
   - Recommendation: Use `Heart` (already exists, is message broker)

2. **Event → BloodCell or Signal?**
   - Recommendation: Use `BloodCell` for messages, `Signal` for neural communication

3. **Router → Bronchus or Trachea?**
   - Recommendation: Use `Bronchus` (branches airways, more flexible)

4. **Resource → Oxygen or Nutrient?**
   - Recommendation: Use `Oxygen` (more specific, fits respiratory metaphor)

5. **ResourcePool → Alveolus or Capillary?**
   - Recommendation: Use `Alveolus` (exchanges oxygen, fits pooling metaphor)

6. **Server → Organ or System?**
   - Recommendation: Use `Organ` (more specific, fits medical metaphor)

7. **Client → Receptor or Effector?**
   - Recommendation: Use `Receptor` (receives, fits client role)

8. **Bridge → Synapse or Connection?**
   - Recommendation: Use `Synapse` (connects neurons, fits bridge role)

9. **HotReload → Regeneration or Renewal?**
   - Recommendation: Use `Regeneration` (cells regenerate, fits hot reload)

## Notes

- **Do NOT break existing functionality** - All tests must pass
- **Do NOT introduce linting errors** - All linting must pass
- **Do NOT break type checking** - All type checking must pass
- **Do NOT break builds** - All builds must succeed
- **Consider backward compatibility** - Add deprecated aliases if needed
- **Update documentation** - Keep documentation in sync
- **Test thoroughly** - Run full test suite after each phase
- **Commit frequently** - Small, focused commits per change
- **Review carefully** - Code review before merging

## Reference

See `COMPREHENSIVE_REFACTORING_PLAYBOOK.md` for complete details.

---

**Status**: Ready for Implementation
**Priority**: High
**Estimated Effort**: 11 weeks (7 phases)
**Assignee**: TBD
**Labels**: `refactoring`, `domain-terminology`, `breaking-change`, `high-priority`

