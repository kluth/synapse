# Blast Radius Assessment for High Priority Changes

## Overview

This document assesses the blast radius (impact) of each High Priority change, identifying affected files, systems, breaking changes, and migration requirements.

---

## 1. VisualNeuron → SkinCell

### Affected Files
- **42 files** directly affected
- **Core files**: `src/ui/VisualNeuron.ts`, `src/ui/index.ts`
- **Component files**: All files in `src/ui/components/` (18 files)
- **Visualization files**: All files in `src/visualization/` (10 files)
- **Test files**: All files in `src/ui/__tests__/` (4 files)
- **Theater files**: `src/theater/specimens/Specimen.ts`, `src/theater/laboratory/TestSubject.ts`, `src/theater/instruments/*.ts` (5 files)
- **Story files**: All `*.stories.ts` files (9 files)

### Breaking Changes
- **API Breaking**: All imports of `VisualNeuron` will break
- **Type Breaking**: All `VisualNeuron<Props, State>` type references will break
- **Inheritance Breaking**: All classes extending `VisualNeuron` will break
- **Export Breaking**: `src/ui/index.ts` exports will break
- **Documentation Breaking**: All documentation referencing VisualNeuron will be outdated

### Migration Requirements
1. Rename class: `VisualNeuron` → `SkinCell`
2. Rename file: `src/ui/VisualNeuron.ts` → `src/ui/SkinCell.ts`
3. Update all imports (42 files)
4. Update all type references (100+ occurrences)
5. Update all class extensions (18 component files + 4 visualization files)
6. Update exports in `src/ui/index.ts`
7. Update documentation
8. Update tests
9. Update stories

### Risk Level: **CRITICAL**
- **Impact**: High - Core UI base class
- **Complexity**: High - Many dependent files
- **Breaking**: Yes - Public API change

---

## 2. SensoryNeuron → Receptor

### Affected Files
- **25 files** directly affected
- **Core files**: `src/ui/SensoryNeuron.ts`, `src/ui/index.ts`
- **Component files**: `Button.ts`, `Input.ts`, `Select.ts`, `Radio.ts`, `Checkbox.ts` (5 files)
- **Test files**: `src/ui/__tests__/SensoryNeuron.test.ts`
- **Story files**: `Button.stories.ts`, `Input.stories.ts`, `Select.stories.ts` (3 files)

### Breaking Changes
- **API Breaking**: All imports of `SensoryNeuron` will break
- **Type Breaking**: All `SensoryNeuron<Props, State>` type references will break
- **Inheritance Breaking**: All classes extending `SensoryNeuron` will break
- **Export Breaking**: `src/ui/index.ts` exports will break

### Migration Requirements
1. Rename class: `SensoryNeuron` → `Receptor`
2. Rename file: `src/ui/SensoryNeuron.ts` → `src/ui/Receptor.ts`
3. Update all imports (25 files)
4. Update all type references (50+ occurrences)
5. Update all class extensions (5 component files)
6. Update exports in `src/ui/index.ts`
7. Update tests
8. Update stories

### Risk Level: **CRITICAL**
- **Impact**: High - Core input component base class
- **Complexity**: Medium - Fewer dependent files than VisualNeuron
- **Breaking**: Yes - Public API change

---

## 3. MotorNeuron → Effector

### Affected Files
- **3 files** directly affected
- **Core files**: `src/ui/MotorNeuron.ts`, `src/ui/index.ts`
- **Test files**: `src/ui/__tests__/MotorNeuron.test.ts`

### Breaking Changes
- **API Breaking**: All imports of `MotorNeuron` will break
- **Type Breaking**: All `MotorNeuron<Props, State>` type references will break
- **Inheritance Breaking**: All classes extending `MotorNeuron` will break
- **Export Breaking**: `src/ui/index.ts` exports will break

### Migration Requirements
1. Rename class: `MotorNeuron` → `Effector`
2. Rename file: `src/ui/MotorNeuron.ts` → `src/ui/Effector.ts`
3. Update all imports (3 files)
4. Update all type references (10+ occurrences)
5. Update exports in `src/ui/index.ts`
6. Update tests

### Risk Level: **HIGH**
- **Impact**: Medium - Less used than SensoryNeuron
- **Complexity**: Low - Few dependent files
- **Breaking**: Yes - Public API change

---

## 4. InterneuronUI → DermalLayer

### Affected Files
- **8 files** directly affected
- **Core files**: `src/ui/InterneuronUI.ts`, `src/ui/index.ts`
- **Component files**: `Form.ts`, `Modal.ts`, `Card.ts` (3 files)
- **Test files**: `src/ui/__tests__/InterneuronUI.test.ts`

### Breaking Changes
- **API Breaking**: All imports of `InterneuronUI` will break
- **Type Breaking**: All `InterneuronUI<Props, State>` type references will break
- **Inheritance Breaking**: All classes extending `InterneuronUI` will break
- **Export Breaking**: `src/ui/index.ts` exports will break

### Migration Requirements
1. Rename class: `InterneuronUI` → `DermalLayer`
2. Rename file: `src/ui/InterneuronUI.ts` → `src/ui/DermalLayer.ts`
3. Update all imports (8 files)
4. Update all type references (20+ occurrences)
5. Update all class extensions (3 component files)
6. Update exports in `src/ui/index.ts`
7. Update tests

### Risk Level: **HIGH**
- **Impact**: Medium - Container component base class
- **Complexity**: Medium - Moderate dependent files
- **Breaking**: Yes - Public API change

---

## 5. VisualAstrocyte → Adipocyte

### Affected Files
- **3 files** directly affected
- **Core files**: `src/ui/glial/VisualAstrocyte.ts`, `src/ui/glial/index.ts`
- **Test files**: `src/ui/glial/__tests__/VisualAstrocyte.test.ts`

### Breaking Changes
- **API Breaking**: All imports of `VisualAstrocyte` will break
- **Type Breaking**: All `VisualAstrocyte` type references will break
- **Export Breaking**: `src/ui/glial/index.ts` exports will break

### Migration Requirements
1. Rename class: `VisualAstrocyte` → `Adipocyte`
2. Rename file: `src/ui/glial/VisualAstrocyte.ts` → `src/ui/glial/Adipocyte.ts`
3. Update all imports (3 files)
4. Update all type references (10+ occurrences)
5. Update exports in `src/ui/glial/index.ts`
6. Update tests

### Risk Level: **MEDIUM**
- **Impact**: Low - Less frequently used
- **Complexity**: Low - Few dependent files
- **Breaking**: Yes - Public API change

---

## 6. VisualOligodendrocyte → Melanocyte

### Affected Files
- **3 files** directly affected
- **Core files**: `src/ui/glial/VisualOligodendrocyte.ts`, `src/ui/glial/index.ts`
- **Test files**: `src/ui/glial/__tests__/VisualOligodendrocyte.test.ts`

### Breaking Changes
- **API Breaking**: All imports of `VisualOligodendrocyte` will break
- **Type Breaking**: All `VisualOligodendrocyte` type references will break
- **Export Breaking**: `src/ui/glial/index.ts` exports will break

### Migration Requirements
1. Rename class: `VisualOligodendrocyte` → `Melanocyte`
2. Rename file: `src/ui/glial/VisualOligodendrocyte.ts` → `src/ui/glial/Melanocyte.ts`
3. Update all imports (3 files)
4. Update all type references (10+ occurrences)
5. Update exports in `src/ui/glial/index.ts`
6. Update tests

### Risk Level: **MEDIUM**
- **Impact**: Low - Less frequently used
- **Complexity**: Low - Few dependent files
- **Breaking**: Yes - Public API change

---

## 7. ComponentProps → System-Specific Props

### Affected Files
- **100+ files** directly affected
- **Core files**: `src/ui/types.ts`
- **All UI component files**: All files in `src/ui/components/` (18 files)
- **All visualization files**: All files in `src/visualization/` (10 files)
- **All test files**: All test files referencing ComponentProps (50+ files)
- **All story files**: All story files (9 files)

### Breaking Changes
- **Type Breaking**: All `ComponentProps` type references will break
- **Generic Breaking**: Generic type constraints will break
- **Export Breaking**: `src/ui/types.ts` exports will break

### Migration Requirements
1. Create system-specific types:
   - `SkinCellProps` (base)
   - `ReceptorProps` (input)
   - `EffectorProps` (action)
   - `DermalLayerProps` (container)
2. Update all type references (100+ files)
3. Update all generic constraints (100+ occurrences)
4. Update exports in `src/ui/types.ts`
5. Update tests
6. Update stories

### Risk Level: **CRITICAL**
- **Impact**: Very High - Core type system
- **Complexity**: Very High - Many dependent files
- **Breaking**: Yes - Type system change

---

## 8. ComponentState → System-Specific State

### Affected Files
- **100+ files** directly affected
- **Core files**: `src/ui/types.ts`
- **All UI component files**: All files in `src/ui/components/` (18 files)
- **All visualization files**: All files in `src/visualization/` (10 files)
- **All test files**: All test files referencing ComponentState (50+ files)
- **All story files**: All story files (9 files)

### Breaking Changes
- **Type Breaking**: All `ComponentState` type references will break
- **Generic Breaking**: Generic type constraints will break
- **Export Breaking**: `src/ui/types.ts` exports will break

### Migration Requirements
1. Create system-specific types:
   - `SkinCellState` (base)
   - `ReceptorState` (input)
   - `EffectorState` (action)
   - `DermalLayerState` (container)
2. Update all type references (100+ files)
3. Update all generic constraints (100+ occurrences)
4. Update exports in `src/ui/types.ts`
5. Update tests
6. Update stories

### Risk Level: **CRITICAL**
- **Impact**: Very High - Core type system
- **Complexity**: Very High - Many dependent files
- **Breaking**: Yes - Type system change

---

## 9. Button → TouchReceptor

### Affected Files
- **5 files** directly affected
- **Component files**: `src/ui/components/Button.ts`
- **Test files**: `src/ui/components/__tests__/Button.test.ts`
- **Story files**: `src/ui/components/Button.stories.ts`
- **Index files**: `src/ui/components/index.ts`

### Breaking Changes
- **API Breaking**: All imports of `Button` will break
- **Type Breaking**: All `Button` type references will break
- **Export Breaking**: `src/ui/components/index.ts` exports will break

### Migration Requirements
1. Rename class: `Button` → `TouchReceptor`
2. Rename file: `src/ui/components/Button.ts` → `src/ui/components/TouchReceptor.ts`
3. Update all imports (5 files)
4. Update all type references (20+ occurrences)
5. Update exports in `src/ui/components/index.ts`
6. Update tests
7. Update stories

### Risk Level: **HIGH**
- **Impact**: Medium - Common component
- **Complexity**: Low - Few dependent files
- **Breaking**: Yes - Public API change

---

## 10. Input → TextReceptor

### Affected Files
- **5 files** directly affected
- **Component files**: `src/ui/components/Input.ts`
- **Test files**: `src/ui/components/__tests__/Input.test.ts` (if exists)
- **Story files**: `src/ui/components/Input.stories.ts`
- **Index files**: `src/ui/components/index.ts`

### Breaking Changes
- **API Breaking**: All imports of `Input` will break
- **Type Breaking**: All `Input` type references will break
- **Export Breaking**: `src/ui/components/index.ts` exports will break

### Migration Requirements
1. Rename class: `Input` → `TextReceptor`
2. Rename file: `src/ui/components/Input.ts` → `src/ui/components/TextReceptor.ts`
3. Update all imports (5 files)
4. Update all type references (20+ occurrences)
5. Update exports in `src/ui/components/index.ts`
6. Update tests
7. Update stories

### Risk Level: **HIGH**
- **Impact**: Medium - Common component
- **Complexity**: Low - Few dependent files
- **Breaking**: Yes - Public API change

---

## 11. Chart → Visualization

### Affected Files
- **10 files** directly affected
- **Visualization files**: All files in `src/visualization/` (10 files)
- **Index files**: `src/visualization/index.ts`

### Breaking Changes
- **API Breaking**: All imports of `Chart` classes will break
- **Type Breaking**: All `Chart` type references will break
- **Export Breaking**: `src/visualization/index.ts` exports will break

### Migration Requirements
1. Rename classes: `BarChart` → `BarVisualization`, `LineChart` → `LineVisualization`, etc.
2. Rename files: `BarChart.ts` → `BarVisualization.ts`, etc.
3. Update all imports (10 files)
4. Update all type references (50+ occurrences)
5. Update exports in `src/visualization/index.ts`
6. Update tests

### Risk Level: **HIGH**
- **Impact**: Medium - Visualization system
- **Complexity**: Medium - Moderate dependent files
- **Breaking**: Yes - Public API change

---

## 12. EventBus → Heart/Artery

### Affected Files
- **3 files** directly affected
- **Core files**: `src/communication/EventBus.ts`, `src/communication/index.ts`
- **Test files**: `src/communication/EventBus.test.ts`
- **Main exports**: `src/index.ts`

### Breaking Changes
- **API Breaking**: All imports of `EventBus` will break
- **Type Breaking**: All `EventBus` type references will break
- **Export Breaking**: `src/communication/index.ts` and `src/index.ts` exports will break

### Migration Requirements
1. Decide: Use `Heart` (already exists) or create `Artery`?
2. If using Heart: Update imports to use existing `Heart` class
3. If creating Artery: Create new `Artery` class for event bus
4. Update all imports (3 files)
5. Update all type references (20+ occurrences)
6. Update exports in `src/communication/index.ts` and `src/index.ts`
7. Update tests

### Risk Level: **MEDIUM**
- **Impact**: Medium - Communication system
- **Complexity**: Low - Few dependent files
- **Breaking**: Yes - Public API change

---

## 13. Router → Bronchus/Trachea

### Affected Files
- **15 files** directly affected
- **Core files**: `src/respiratory/resources/Router.ts`, `src/respiratory/index.ts`
- **Test files**: `src/respiratory/__tests__/Router.test.ts`
- **Dependent files**: All files using Router (10+ files)

### Breaking Changes
- **API Breaking**: All imports of `Router` will break
- **Type Breaking**: All `Router` type references will break
- **Export Breaking**: `src/respiratory/index.ts` exports will break

### Migration Requirements
1. Rename class: `Router` → `Bronchus` or `Trachea`
2. Rename file: `src/respiratory/resources/Router.ts` → `src/respiratory/resources/Bronchus.ts`
3. Update all imports (15 files)
4. Update all type references (30+ occurrences)
5. Update exports in `src/respiratory/index.ts`
6. Update tests

### Risk Level: **MEDIUM**
- **Impact**: Medium - Respiratory system
- **Complexity**: Medium - Moderate dependent files
- **Breaking**: Yes - Public API change

---

## 14. Resource → Oxygen/Nutrient

### Affected Files
- **20 files** directly affected
- **Core files**: `src/respiratory/resources/Resource.ts`, `src/respiratory/index.ts`
- **Resource files**: `DatabaseResource.ts`, `CacheResource.ts`, `StorageResource.ts` (3 files)
- **Test files**: All resource test files (3 files)
- **Dependent files**: All files using Resource (10+ files)

### Breaking Changes
- **API Breaking**: All imports of `Resource` will break
- **Type Breaking**: All `Resource` type references will break
- **Inheritance Breaking**: All classes extending `Resource` will break
- **Export Breaking**: `src/respiratory/index.ts` exports will break

### Migration Requirements
1. Rename class: `Resource` → `Oxygen` or `Nutrient`
2. Rename file: `src/respiratory/resources/Resource.ts` → `src/respiratory/resources/Oxygen.ts`
3. Update all imports (20 files)
4. Update all type references (50+ occurrences)
5. Update all class extensions (3 resource files)
6. Update exports in `src/respiratory/index.ts`
7. Update tests

### Risk Level: **MEDIUM**
- **Impact**: Medium - Respiratory system
- **Complexity**: Medium - Moderate dependent files
- **Breaking**: Yes - Public API change

---

## Summary

### Total Affected Files
- **VisualNeuron → SkinCell**: 42 files
- **SensoryNeuron → Receptor**: 25 files
- **ComponentProps/State**: 100+ files each
- **Button → TouchReceptor**: 5 files
- **Input → TextReceptor**: 5 files
- **Chart → Visualization**: 10 files
- **EventBus → Heart/Artery**: 3 files
- **Router → Bronchus**: 15 files
- **Resource → Oxygen**: 20 files

### Total Breaking Changes
- **API Breaking**: 10+ public APIs
- **Type Breaking**: 100+ type references
- **Export Breaking**: 10+ export files
- **Documentation Breaking**: All documentation

### Migration Complexity
- **Very High**: ComponentProps/State, VisualNeuron
- **High**: SensoryNeuron, Button, Input, Chart
- **Medium**: MotorNeuron, InterneuronUI, Router, Resource
- **Low**: VisualAstrocyte, VisualOligodendrocyte, EventBus

---

**Last Updated**: 2024
**Status**: Blast Radius Assessment Complete

