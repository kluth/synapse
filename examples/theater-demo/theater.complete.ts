/**
 * Complete Anatomy Theater Demo
 *
 * This example demonstrates the full integration of all Theater components:
 * - Theater (main orchestrator)
 * - Stage (component rendering)
 * - Amphitheater (component gallery)
 * - Specimens (component variations)
 * - Laboratory (testing)
 * - Atlas (documentation)
 * - Server (development server with hot reload)
 */

import { Theater } from '../../src/theater/core/Theater';
import { TheaterServer } from '../../src/theater/server/TheaterServer';
import { HotReload } from '../../src/theater/server/HotReload';
import { WebSocketBridge } from '../../src/theater/server/WebSocketBridge';

// Import button specimens and documentation
import { ButtonSpecimens } from './button.specimens';
import { ButtonLaboratory, runButtonTests } from './button.laboratory';
import {
  ButtonAtlas,
  ButtonCatalogue,
  ButtonProtocol,
  generateFullDocumentation,
} from './button.atlas';

/**
 * Complete Theater Setup
 */
class CompleteTheaterDemo {
  private theater: Theater;
  private server: TheaterServer;
  private hotReload: HotReload;
  private wsbridge: WebSocketBridge;

  constructor() {
    // Initialize Theater
    this.theater = new Theater({
      title: 'Button Component Theater',
      darkMode: false,
    });

    // Initialize Server
    this.server = new TheaterServer({
      port: 6006,
      host: 'localhost',
      hotReload: true,
      verbose: true,
    });

    // Initialize Hot Reload
    this.hotReload = new HotReload({
      enabled: true,
      patterns: [{ pattern: 'examples/**/*.ts' }, { pattern: 'src/ui/**/*.ts' }],
      ignore: ['node_modules/**', 'dist/**', '**/*.test.ts'],
      debounce: 300,
      verbose: true,
    });

    // Initialize WebSocket Bridge
    this.wsbridge = new WebSocketBridge({
      port: 6007,
      host: 'localhost',
      heartbeat: 30000,
      verbose: true,
    });

    this.setupEventHandlers();
  }

  /**
   * Setup event handlers for real-time updates
   */
  private setupEventHandlers(): void {
    // Theater events
    this.theater.on('started', () => {
      console.log('🎭 Theater started');
    });

    this.theater.on('specimen:mounted', (event: { specimenId: string }) => {
      console.log(`📦 Specimen mounted: ${event.specimenId}`);
    });

    // Server events
    this.server.on('started', (event: { url: string }) => {
      console.log(`🚀 Server started at ${event.url}`);
    });

    this.server.on('reload', (event: { reason: string }) => {
      console.log(`🔄 Hot reload triggered: ${event.reason}`);
      this.wsbridge.broadcast({
        type: 'reload',
        payload: { reason: event.reason },
        timestamp: Date.now(),
      });
    });

    // Hot reload events
    this.hotReload.on('change', (event: { path: string; type: string }) => {
      console.log(`📝 File changed: ${event.path} (${event.type})`);
      this.server.triggerReload(`File ${event.type}: ${event.path}`);
    });

    // WebSocket events
    this.wsbridge.on('client:connected', (event: { clientId: string }) => {
      console.log(`🔌 Client connected: ${event.clientId}`);
    });

    this.wsbridge.on('message:received', (event: { clientId: string; message: { type: string } }) => {
      console.log(`📨 Message from ${event.clientId}:`, event.message.type);
    });
  }

  /**
   * Load all button specimens into the gallery
   */
  private loadSpecimens(): void {
    console.log('\n📦 Loading Button Specimens...\n');

    ButtonSpecimens.forEach((specimen) => {
      // Register with Amphitheater
      this.theater.amphitheater.registerSpecimen(specimen.metadata);

      console.log(`  ✓ ${specimen.metadata.name}`);
    });

    console.log(`\n  Total specimens loaded: ${ButtonSpecimens.length}\n`);
  }

  /**
   * Run Laboratory tests
   */
  private async runTests(): Promise<void> {
    console.log('\n🧪 Running Laboratory Tests...\n');
    await runButtonTests();
  }

  /**
   * Generate documentation
   */
  private generateDocs(): void {
    console.log('\n📚 Generating Documentation...\n');
    generateFullDocumentation();

    // Show Atlas statistics
    const atlasStats = ButtonAtlas.getStatistics();
    console.log('\n📊 Atlas Statistics:');
    console.log(`  Components: ${atlasStats.totalComponents}`);
    console.log(`  Examples: ${atlasStats.totalExamples}`);
    console.log(`  Categories: ${Object.keys(atlasStats.byCategory).join(', ')}`);

    // Show Catalogue statistics
    const catalogueStats = ButtonCatalogue.getStatistics();
    console.log('\n📊 Catalogue Statistics:');
    console.log(`  Total Components: ${catalogueStats.total}`);
    console.log(`  Stable: ${catalogueStats.byStability['stable']}`);

    // Show Protocol statistics
    const protocolStats = ButtonProtocol.getStatistics();
    console.log('\n📊 Protocol Statistics:');
    console.log(`  Total Guidelines: ${protocolStats.totalGuidelines}`);
    console.log(`  Accessibility: ${protocolStats.byType.accessibility}`);
    console.log(`  Performance: ${protocolStats.byType.performance}`);
    console.log(`  Usage: ${protocolStats.byType.usage}`);
  }

  /**
   * Start the complete Theater environment
   */
  public async start(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('🎭 The Anatomy Theater - Complete Demo');
    console.log('='.repeat(60));

    // Load specimens
    this.loadSpecimens();

    // Start server components
    console.log('\n🚀 Starting Server Components...\n');

    await this.server.start();
    await this.hotReload.start();
    await this.wsbridge.start();

    console.log('\n✅ All server components started\n');

    // Start Theater
    console.log('🎭 Starting Theater...\n');
    await this.theater.start();

    // Run tests
    await this.runTests();

    // Generate documentation
    this.generateDocs();

    // Show summary
    this.showSummary();
  }

  /**
   * Stop the Theater environment
   */
  public async stop(): Promise<void> {
    console.log('\n🛑 Stopping Theater...\n');

    await this.theater.stop();
    await this.server.stop();
    await this.hotReload.stop();
    await this.wsbridge.stop();

    console.log('✅ Theater stopped\n');
  }

  /**
   * Show Theater summary
   */
  private showSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Theater Summary');
    console.log('='.repeat(60));

    // Theater status
    const theaterState = this.theater.getState();
    console.log(`\n🎭 Theater: ${theaterState}`);

    // Server statistics
    const serverStats = this.server.getStatistics();
    console.log(`\n🚀 Server:`);
    console.log(`  URL: ${this.server.getUrl()}`);
    console.log(`  WebSocket: ${this.server.getWebSocketUrl()}`);
    console.log(`  Active Connections: ${serverStats.activeConnections}`);
    console.log(`  Total Requests: ${serverStats.totalRequests}`);

    // Hot Reload statistics
    const hotReloadStats = this.hotReload.getStatistics();
    console.log(`\n🔥 Hot Reload:`);
    console.log(`  Watching: ${hotReloadStats.watchedFiles} files`);
    console.log(`  Total Changes: ${hotReloadStats.totalChanges}`);

    // WebSocket statistics
    const wsStats = this.wsbridge.getStatistics();
    console.log(`\n🔌 WebSocket Bridge:`);
    console.log(`  Active Connections: ${wsStats.activeConnections}`);
    console.log(`  Messages Sent: ${wsStats.messagesSent}`);
    console.log(`  Messages Received: ${wsStats.messagesReceived}`);
    console.log(`  Broadcast Count: ${wsStats.broadcastCount}`);

    // Amphitheater statistics
    const amphiStats = this.theater.amphitheater.getStats();
    console.log(`\n🏛️ Amphitheater:`);
    console.log(`  Total Specimens: ${amphiStats.totalSpecimens}`);
    console.log(`  Categories: ${amphiStats.totalCategories}`);

    // Laboratory statistics
    const labStats = ButtonLaboratory.getStats();
    console.log(`\n🧪 Laboratory:`);
    console.log(`  Total Experiments: ${labStats.totalExperiments}`);
    console.log(`  Passed: ${labStats.passed}`);
    console.log(`  Failed: ${labStats.failed}`);
    console.log(`  Success Rate: ${(labStats.successRate * 100).toFixed(1)}%`);

    console.log('\n' + '='.repeat(60));
    console.log('\n✨ Theater is ready for development!\n');
    console.log(`Visit ${this.server.getUrl()} to view components`);
    console.log(`WebSocket connected at ${this.server.getWebSocketUrl()}`);
    console.log('\n' + '='.repeat(60) + '\n');
  }

  /**
   * Demonstrate real-time updates
   */
  public demonstrateHotReload(): void {
    console.log('\n🔥 Demonstrating Hot Reload...\n');

    // Simulate file change
    this.hotReload.handleChange({
      path: 'examples/theater-demo/ButtonComponent.ts',
      type: 'changed',
      timestamp: Date.now(),
    });

    console.log('File change detected, reload triggered!\n');
  }

  /**
   * Demonstrate WebSocket communication
   */
  public demonstrateWebSocket(): void {
    console.log('\n🔌 Demonstrating WebSocket...\n');

    // Simulate client connection
    this.wsbridge.connectClient('demo-client', { browser: 'chrome' });

    // Subscribe to channel
    this.wsbridge.subscribeToChannel('demo-client', 'updates');

    // Broadcast message
    this.wsbridge.broadcastToChannel('updates', {
      type: 'update',
      payload: { message: 'Component updated!' },
      timestamp: Date.now(),
    });

    console.log('WebSocket message broadcast to channel "updates"\n');
  }

  /**
   * Show interactive menu
   */
  public showMenu(): void {
    console.log('\n' + '='.repeat(60));
    console.log('🎭 Theater Interactive Menu');
    console.log('='.repeat(60));
    console.log('\nAvailable Actions:');
    console.log('  1. View Specimens Gallery');
    console.log('  2. Run Laboratory Tests');
    console.log('  3. Generate Documentation');
    console.log('  4. Demonstrate Hot Reload');
    console.log('  5. Demonstrate WebSocket');
    console.log('  6. Show Server Statistics');
    console.log('  7. Export All Data');
    console.log('  0. Stop Theater\n');
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Export all Theater data
   */
  public exportData(): string {
    const data = {
      theater: {
        state: this.theater.getState(),
        config: this.theater.getConfig(),
      },
      specimens: ButtonSpecimens.map((s) => s.export()),
      laboratory: ButtonLaboratory.export(),
      atlas: ButtonAtlas.export(),
      catalogue: ButtonCatalogue.export(),
      protocol: ButtonProtocol.export(),
      server: {
        statistics: this.server.getStatistics(),
        url: this.server.getUrl(),
        wsUrl: this.server.getWebSocketUrl(),
      },
      hotReload: {
        statistics: this.hotReload.getStatistics(),
      },
      webSocket: {
        statistics: this.wsbridge.getStatistics(),
      },
    };

    return JSON.stringify(data, null, 2);
  }
}

/**
 * Main execution
 */
export async function runCompleteDemo(): Promise<void> {
  const demo = new CompleteTheaterDemo();

  try {
    // Start the theater
    await demo.start();

    // Show interactive menu
    demo.showMenu();

    // Demonstrate features
    console.log('🎬 Running Feature Demonstrations...\n');

    // Hot reload demo
    demo.demonstrateHotReload();

    // WebSocket demo
    demo.demonstrateWebSocket();

    // Export data
    const exportData = demo.exportData();
    console.log('\n💾 Theater data exported (sample):');
    console.log(exportData.substring(0, 500) + '...\n');

    // Keep running for demo (in real app, would run until user stops)
    console.log('Theater is now running. Press Ctrl+C to stop.\n');

    // Cleanup after 30 seconds for demo purposes
    setTimeout(async () => {
      await demo.stop();
      process.exit(0);
    }, 30000);
  } catch (error) {
    console.error('❌ Error running demo:', error);
    await demo.stop();
    process.exit(1);
  }
}

// Export for use in other scripts
export { CompleteTheaterDemo };
