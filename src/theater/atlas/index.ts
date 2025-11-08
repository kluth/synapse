/**
 * Atlas Module - Documentation and Cataloging System
 *
 * The Atlas module provides comprehensive documentation, component cataloging,
 * visual diagrams, and usage protocols for The Anatomy Theater.
 */

// Atlas
export { Atlas } from './Atlas';
export type {
  ComponentDocumentation,
  PropDocumentation,
  StateDocumentation,
  SignalDocumentation,
  CodeExample,
  DocumentationQuery,
  SearchResult,
  AtlasConfig,
  AtlasStatistics,
} from './Atlas';

// ComponentCatalogue
export { ComponentCatalogue } from './ComponentCatalogue';
export type {
  CatalogueEntry,
  CatalogueFilter,
  CatalogueGroup,
  DependencyGraph,
  CatalogueConfig,
  CatalogueStatistics,
} from './ComponentCatalogue';

// Diagram
export { Diagram } from './Diagram';
export type {
  DiagramType,
  DiagramFormat,
  DiagramConfig,
  DiagramNode,
  DiagramEdge,
  StateMachineState,
  StateMachineTransition,
} from './Diagram';

// Protocol
export { Protocol } from './Protocol';
export type {
  ProtocolType,
  ProtocolSeverity,
  ProtocolExample,
  ProtocolGuideline,
  ChecklistItem,
  ComponentProtocol,
  ProtocolQuery,
  ProtocolConfig,
  ProtocolStatistics,
} from './Protocol';
