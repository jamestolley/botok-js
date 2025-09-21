/**
 * Core types and interfaces for Botok-JS
 */

/**
 * Character markers for Tibetan text classification
 */
export enum CharMarkers {
  // Regular Tibetan
  CONS = 0,           // Consonants
  SUB_CONS = 1,       // Sub-consonants
  VOW = 2,            // Vowels
  TSEK = 3,           // Tsek (syllable separator)
  
  // Punctuation
  NORMAL_PUNCT = 4,   // Normal punctuation
  SPECIAL_PUNCT = 5,  // Special punctuation
  
  // Others
  NUMERAL = 6,        // Numerals
  SYMBOL = 7,         // Symbols
  IN_SYL_MARK = 8,    // In-syllable marks
  NON_BO_NON_SKRT = 9, // Non-Tibetan, non-Sanskrit
  
  // Sanskrit characters
  SKRT_CONS = 10,     // Sanskrit consonants
  SKRT_SUB_CONS = 11, // Sanskrit sub-consonants
  SKRT_VOW = 12,      // Sanskrit vowels
  
  // Others
  TRANSPARENT = 13,   // Transparent characters (spaces, etc.)
  LATIN = 14,         // Latin characters
  CJK = 15,           // CJK characters
  OTHER = 16,         // Other characters
  NFC = 17            // NFC normalized
}

/**
 * Chunk type markers
 */
export enum ChunkMarkers {
  TEXT = 100,         // Tibetan text
  PUNCT = 101,        // Punctuation
  NON_BO = 102,       // Non-Tibetan
  NON_PUNCT = 103,    // Non-punctuation
  NUM = 104,          // Numbers
  NON_NUM = 105,      // Non-numbers
  SYM = 106,          // Symbols
  NON_SYM = 107,      // Non-symbols
  BO = 108,           // Tibetan
  OTHER = 109,        // Other
  LATIN = 110,        // Latin
  CJK = 111           // CJK
}

/**
 * Word markers for token classification
 */
export enum WordMarkers {
  NO_POS = 'NO_POS',
  NON_WORD = 'NON_WORD'
}

/**
 * Token interface representing a tokenized unit
 */
export interface Token {
  /** Original text content */
  text: string;
  
  /** Cleaned/normalized text */
  textCleaned?: string;
  
  /** Unaffixed form (root) */
  textUnaffixed?: string;
  
  /** Part of speech tag */
  pos?: string;
  
  /** Lemma (dictionary form) */
  lemma?: string;
  
  /** Frequency in corpus */
  freq?: number;
  
  /** Start position in original text */
  start: number;
  
  /** Length of token */
  length: number;
  
  /** Character types for each character */
  charTypes?: string[];
  
  /** Chunk type (TEXT, PUNCT, etc.) */
  chunkType: string;
  
  /** Syllables breakdown */
  syllables?: string[];
  
  /** Syllable indices in text */
  syllableIndices?: number[][];
  
  /** Syllable start/end positions */
  syllableStartEnd?: Array<{ start: number; end: number }>;
  
  /** Sense information */
  senses?: SenseInfo[];
  
  /** Whether this is Sanskrit */
  sanskrit?: boolean;
  
  /** Whether this is an affix */
  affix?: boolean;
  
  /** Whether this hosts an affix */
  affixHost?: boolean;
  
  /** Affixation information */
  affixation?: AffixationInfo;
}

/**
 * Sense information for dictionary entries
 */
export interface SenseInfo {
  pos?: string;
  freq?: number;
  lemma?: string;
  sense?: string;
  affixed?: boolean;
}

/**
 * Affixation information
 */
export interface AffixationInfo {
  type: string;
  len: number;
  aa: boolean; // Whether 'a vowel is added
}

/**
 * Tokenization options
 */
export interface TokenizeOptions {
  /** Whether to split affixed particles */
  splitAffixes?: boolean;
  
  /** Treat spaces as punctuation */
  spacesAsPunct?: boolean;
  
  /** Enable debug output */
  debug?: boolean;
  
  /** Enable POS tagging */
  posTagging?: boolean;
  
  /** Enable lemmatization */
  lemmatize?: boolean;
}

/**
 * Chunk representation
 */
export interface Chunk {
  /** Character indices or null for non-syllable */
  syllable: number[] | null;
  
  /** Chunk metadata (type, start, length) */
  meta: [ChunkMarkers, number, number];
}

/**
 * Dictionary entry data
 */
export interface DictEntry {
  pos?: string;
  lemma?: string;
  freq?: number;
  sense?: string;
  affixed?: boolean;
  sanskrit?: boolean;
}

/**
 * Trie node data structure
 */
export interface TrieNodeData {
  _: Record<string, unknown>;
  senses?: SenseInfo[];
  formFreq?: number;
  affixation?: AffixationInfo;
  sanskrit?: boolean;
  version?: string;
}

/**
 * Configuration for tokenizer
 */
export interface ConfigOptions {
  dialectName?: string;
  basePath?: string;
  dictionary?: Record<string, string[]>;
  adjustments?: Record<string, string[]>;
}

/**
 * Syllable components information
 */
export interface SyllableInfo {
  root: string;
  subfix?: string;
  suffix?: string;
  vowel?: string;
  valid: boolean;
}

/**
 * Text processing chunk
 */
export interface TextChunk {
  type: ChunkMarkers;
  start: number;
  length: number;
  content: string;
}