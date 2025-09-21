/**
 * Botok-JS - JavaScript/TypeScript port of Botok Tibetan tokenizer
 * Main entry point
 */

// Core types
export * from './types';

// Text processing
export { BoString } from './textunits/BoString';
export { ChunkFramework } from './chunks/ChunkFramework';

// Configuration
export { Config } from './config/Config';

// Tokenizers
export { WordTokenizer } from './tokenizers/WordTokenizer';
export { Tokenize } from './tokenizers/Tokenize';
export { Token } from './tokenizers/Token';

// Tries
export { BasicTrie, TrieNode } from './tries/BasicTrie';

// Utils
export * from './utils/constants';

// Configuration (will be implemented)
// export { Config } from './config/Config';

// Main tokenizer (will be implemented)  
// export { WordTokenizer } from './tokenizers/WordTokenizer';

// Version
export const VERSION = '1.0.0';