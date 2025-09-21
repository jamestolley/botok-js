/**
 * Constants used throughout Botok-JS
 * Ported from botok/vars.py
 */

export const VERSION = '1.0.0';

// Character constants
export const TSEK = '་';        // Tibetan syllable separator
export const NAMCHE = 'ཿ';      // Sanskrit syllable separator  
export const SHAD = '།';        // Tibetan punctuation mark
export const AA = 'འ';          // 'A vowel
export const HASH = '#';        // Comment marker
export const SPACE = ' ';

// Vowels that affect syllable formation
export const VOWELS = ['ི'];

// Consonants that don't take final shad
export const NO_SHAD_CONS = ['ཀ', 'ག', 'ཤ'];

// Dagdra particles (པ/པོ/བ/བོ patterns)
export const DAGDRA = ['པ་', 'པོ་', 'བ་', 'བོ་'];

// Character mappings for human-readable output
export const CHAR_MARKERS = {
  0: 'cons',
  1: 'sub-cons', 
  2: 'vow',
  3: 'tsek',
  4: 'punct',
  5: 'punct',
  6: 'num',
  7: 'sym',
  8: 'mark',
  9: 'other',
  10: 'skrt-cons',
  11: 'skrt-sub-cons',
  12: 'skrt-vow',
  13: 'space',
  14: 'latin',
  15: 'cjk',
  16: 'other',
  17: 'nfc'
};

// Chunk type mappings
export const CHUNK_MARKERS = {
  100: 'TEXT',
  101: 'PUNCT', 
  102: 'NON_BO',
  103: 'NON_PUNCT',
  104: 'NUM',
  105: 'NON_NUM',
  106: 'SYM',
  107: 'NON_SYM',
  108: 'BO',
  109: 'OTHER',
  110: 'LATIN',
  111: 'CJK'
};

// Default configuration
export const DEFAULT_DIALECT = 'general';
export const DEFAULT_BASE_PATH = './dialect_packs';

// Tibetan Unicode ranges
export const TIBETAN_RANGE = {
  start: 0x0F00,  // Start of Tibetan block
  end: 0x0FFF     // End of Tibetan block
};

// Sanskrit Unicode ranges (extended)
export const SANSKRIT_RANGES = [
  { start: 0x0900, end: 0x097F }, // Devanagari
  { start: 0x0980, end: 0x09FF }  // Bengali (used for some Sanskrit)
];

// Punctuation patterns
export const TIBETAN_PUNCTUATION = [
  '།',   // Shad
  '༎',   // Nyis shad  
  '༏',   // Tsheg shad
  '༐',   // Tibetan mark bskur yon mig
  '༑',   // Tibetan mark rin chen spungs shad
  '༔',   // Tibetan mark halanta
];

// Common sentence ending particles
export const ENDING_PARTICLES = [
  'ངོ་',
  'ནོ་', 
  'དོ་',
  'བོ་',
  'སོ་',
  'ཏོ་',
  'རོ་',
  'ལོ་'
];

// Clause boundary particles
export const CLAUSE_BOUNDARIES = [
  'ན་',
  'ཏེ་', 
  'དེ་',
  'ཅིང་',
  'ཤིང་'
];

// Common Tibetan number words
export const TIBETAN_NUMBERS = {
  '༠': 0, '༡': 1, '༢': 2, '༣': 3, '༤': 4,
  '༥': 5, '༦': 6, '༧': 7, '༨': 8, '༩': 9
};

// Regex patterns for normalization  
export const NORMALIZATION_PATTERNS = [
  // Multiple spaces to single space
  [/\s+/g, ' '],
  // Multiple tseks to single tsek
  [/་+/g, '་'],
  // Normalize quotes
  [/["'"]/g, '"']
];

// File extensions for different resource types
export const RESOURCE_EXTENSIONS = {
  dictionary: '.tsv',
  rules: '.tsv', 
  syllables: '.json',
  config: '.json'
};

// Default tokenizer options
export const DEFAULT_TOKENIZE_OPTIONS = {
  splitAffixes: true,
  spacesAsPunct: false,
  debug: false,
  posTagging: true,
  lemmatize: true
};

// Common POS tags
export const POS_TAGS = {
  NOUN: 'NOUN',
  VERB: 'VERB', 
  ADJ: 'ADJ',
  ADV: 'ADV',
  PART: 'PART',  // Particle
  DET: 'DET',    // Determiner
  NUM: 'NUM',    // Number
  PUNCT: 'PUNCT' // Punctuation
};

// Mapping for chunk markers to string values
export const CHUNK_VALUES: Record<number, string> = {
  100: 'TEXT',
  101: 'PUNCT',
  102: 'NON_PUNCT',
  103: 'BO',
  104: 'NON_BO',
  105: 'OTHER'
};

// Mapping for character markers to string values  
export const CHAR_VALUES: Record<number, string> = {
  0: 'CONS',
  1: 'SUB_CONS',
  2: 'VOW',
  3: 'TSEK',
  4: 'PUNCT',
  5: 'SPECIAL_PUNCT',
  6: 'NUM',
  7: 'SYM',
  8: 'MARK',
  9: 'OTHER',
  10: 'SKRT_CONS',
  11: 'SKRT_SUB_CONS',
  12: 'SKRT_VOW',
  13: 'SPACE',
  14: 'LATIN',
  15: 'CJK',
  16: 'NON_BO_NON_SKRT',
  17: 'NFC'
};

// Mapping for word markers to string values
export const WORD_VALUES: Record<number, string> = {
  100: 'WORD',
  101: 'NON_WORD',
  102: 'NO_POS'
};

// Error messages
export const ERRORS = {
  INVALID_CONFIG: 'Invalid configuration provided',
  MISSING_RESOURCES: 'Required resource files not found',
  INVALID_TEXT: 'Invalid text input provided',
  TRIE_BUILD_FAILED: 'Failed to build dictionary trie',
  RESOURCE_LOAD_FAILED: 'Failed to load resource files'
};