/**
 * Theater Configuration
 *
 * Configuration options for The Anatomy Theater system.
 */

/**
 * Theater configuration options
 */
export interface TheaterConfig {
  /**
   * Title of the theater instance
   */
  title: string;

  /**
   * Port for development server
   * @default 6006
   */
  port?: number;

  /**
   * Directory containing specimen files
   * @default './src/theater/specimens'
   */
  specimensDir?: string;

  /**
   * Enable hot module replacement
   * @default true
   */
  hotReload?: boolean;

  /**
   * Enable dark mode
   * @default false
   */
  darkMode?: boolean;

  /**
   * Custom theme configuration
   */
  theme?: TheaterTheme;

  /**
   * Enabled instruments (tools)
   */
  instruments?: string[];

  /**
   * Base path for routing
   * @default '/'
   */
  basePath?: string;

  /**
   * Enable neural signal visualization
   * @default true
   */
  signalVisualization?: boolean;

  /**
   * Enable time-travel debugging
   * @default true
   */
  timeTravel?: boolean;

  /**
   * Enable accessibility testing
   * @default true
   */
  a11yTesting?: boolean;
}

/**
 * Theme configuration
 */
export interface TheaterTheme {
  /**
   * Primary color
   */
  primaryColor?: string;

  /**
   * Background color
   */
  backgroundColor?: string;

  /**
   * Text color
   */
  textColor?: string;

  /**
   * Font family
   */
  fontFamily?: string;

  /**
   * Custom CSS
   */
  customCss?: string;
}

/**
 * Default theater configuration
 */
export const DEFAULT_THEATER_CONFIG: Required<TheaterConfig> = {
  title: 'The Anatomy Theater',
  port: 6006,
  specimensDir: './src/theater/specimens',
  hotReload: true,
  darkMode: false,
  theme: {
    primaryColor: '#0066cc',
    backgroundColor: '#ffffff',
    textColor: '#333333',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    customCss: '',
  },
  instruments: ['microscope', 'signals', 'state', 'performance', 'health', 'accessibility'],
  basePath: '/',
  signalVisualization: true,
  timeTravel: true,
  a11yTesting: true,
};
