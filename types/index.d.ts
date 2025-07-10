/**
 * Tenso TypeScript Definitions
 * 
 * A fast, secure & modern web framework built on top of Woodland.
 * Provides comprehensive TypeScript support for all Tenso modules.
 */

// Re-export core types and interfaces
export * from './core.js';

// Re-export main Tenso class and factory function
export * from './tenso.js';

// Re-export middleware types
export * from './middleware.js';

// Re-export parser types with namespace to avoid conflicts
export * as Parsers from './parsers.js';

// Re-export renderer types with namespace to avoid conflicts
export * as Renderers from './renderers.js';

// Re-export serializer types with namespace to avoid conflicts
export * as Serializers from './serializers.js';

// Re-export utility types
export * from './utils.js';

/**
 * Main export for the Tenso factory function
 * This allows for both named and default imports:
 * 
 * @example
 * ```typescript
 * import { tenso } from 'tenso';
 * // or
 * import tenso from 'tenso';
 * 
 * const app = tenso({
 *   port: 3000,
 *   host: '0.0.0.0'
 * });
 * ```
 */
import { tenso } from './tenso.js';
export default tenso; 