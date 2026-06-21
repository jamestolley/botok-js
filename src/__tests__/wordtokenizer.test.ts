/**
 * WordTokenizer - High-level tokenizer tests
 * Mirrors botok/tests/tokenizers/test_wordtokenizer.py and test_bugs.py
 *
 * Note: botok-js WordTokenizer currently uses an empty trie (no dialect pack loading),
 * so these tests focus on the high-level pipeline behavior:
 * - Syllable segmentation
 * - Punctuation separation
 * - Mixed script handling
 * - Token metadata generation
 * - Lemma/POS assignment for manually-loaded trie entries
 */

import { WordTokenizer } from '../tokenizers/WordTokenizer';
import { Token } from '../tokenizers/Token';
import { Config } from '../config/Config';

describe('WordTokenizer - Initialization', () => {
  test('should initialize with default config', () => {
    const wt = new WordTokenizer();
    expect(wt.getConfig()).toBeInstanceOf(Config);
  });

  test('should initialize with custom config', () => {
    const config = new Config('test-profile', '/test/path');
    const wt = new WordTokenizer(config);
    expect(wt.getConfig().profile).toBe('test-profile');
  });

  test('should expose the internal tokenizer', () => {
    const wt = new WordTokenizer();
    expect(wt.getTokenizer()).toBeDefined();
  });
});

describe('WordTokenizer - Empty text', () => {
  test('should handle empty string', () => {
    const wt = new WordTokenizer();
    const tokens = wt.tokenize('');
    expect(tokens).toEqual([]);
  });
});

describe('WordTokenizer - Syllable segmentation (no trie)', () => {
  test('should segment each syllable independently with empty trie', () => {
    const wt = new WordTokenizer();
    const tokens = wt.tokenize('བཀྲ་ཤིས་བདེ་ལེགས', false);

    const textTokens = tokens.filter(t => t.chunkType === 'TEXT');
    // With empty trie, each syllable should be a separate token
    expect(textTokens.length).toBe(4);
  });

  test('should produce Token instances', () => {
    const wt = new WordTokenizer();
    const tokens = wt.tokenize('བཀྲ་ཤིས།');

    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens[0]).toBeInstanceOf(Token);
  });
});

describe('WordTokenizer - Punctuation separation', () => {
  test('should separate shad from syllables', () => {
    const wt = new WordTokenizer();
    const tokens = wt.tokenize('བཀྲ་ཤིས།', false);

    const punctTokens = tokens.filter(t => t.chunkType === 'PUNCT');
    expect(punctTokens.length).toBeGreaterThan(0);
    expect(punctTokens.some(t => t.text.includes('།'))).toBe(true);
  });

  test('should handle double shad', () => {
    const wt = new WordTokenizer();
    const tokens = wt.tokenize('བཀྲ།། །།', false);

    const punctTokens = tokens.filter(t => t.chunkType === 'PUNCT');
    expect(punctTokens.length).toBeGreaterThan(0);
  });

  test('should handle shad between words', () => {
    const wt = new WordTokenizer();
    const tokens = wt.tokenize('གདབ། །ཨོཾ་ན་', false);

    // Should have text, punct, text tokens
    const chunkTypes = tokens.map(t => t.chunkType);
    expect(chunkTypes).toContain('TEXT');
    expect(chunkTypes).toContain('PUNCT');
  });
});

describe('WordTokenizer - Mixed script handling', () => {
  test('should handle Tibetan mixed with Latin', () => {
    const wt = new WordTokenizer();
    const tokens = wt.tokenize('བཀྲ་ཤིས་ hello བདེ་ལེགས', false);

    const textTokens = tokens.filter(t => t.chunkType === 'TEXT');
    // Non-BO text (Latin, CJK) gets chunkType 'OTHER'
    const otherTokens = tokens.filter(t => t.chunkType === 'OTHER');

    expect(textTokens.length).toBeGreaterThan(0);
    expect(otherTokens.length).toBeGreaterThan(0);
  });

  test('should produce non-empty non-BO tokens for Latin text', () => {
    const wt = new WordTokenizer();
    const tokens = wt.tokenize('བཀྲ་ Hello བདེ་', false);

    const otherTokens = tokens.filter(t => t.chunkType === 'OTHER');
    expect(otherTokens.length).toBeGreaterThan(0);
    for (const ot of otherTokens) {
      expect(ot.text.trim().length).toBeGreaterThan(0);
    }
  });

  test('should handle Tibetan mixed with CJK', () => {
    const wt = new WordTokenizer();
    const tokens = wt.tokenize('བཀྲ་ 这是什么', false);

    // CJK gets chunkType 'OTHER'
    const otherTokens = tokens.filter(t => t.chunkType === 'OTHER');
    expect(otherTokens.length).toBeGreaterThan(0);
    expect(otherTokens.some(t => t.text.includes('这'))).toBe(true);
  });

  test('should handle complex mixed script', () => {
    const wt = new WordTokenizer();
    const input = 'བཀྲ་ཤིས་བདེ་ལེགས། hello 这是 กขฃค';
    const tokens = wt.tokenize(input, false);

    // Should have multiple chunk types
    const types = new Set(tokens.map(t => t.chunkType));
    expect(types.has('TEXT')).toBe(true);
    expect(types.size).toBeGreaterThan(1);
  });
});

describe('WordTokenizer - Token text integrity', () => {
  test('should preserve complete text across all tokens', () => {
    const wt = new WordTokenizer();
    const input = 'བཀྲ་ཤིས་བདེ་ལེགས།';
    const tokens = wt.tokenize(input, false);

    // Concatenate all token texts — should reconstruct the original
    const reconstructed = tokens.map(t => t.text).join('');
    expect(reconstructed).toBe(input);
  });

  test('should preserve text for multi-syllable strings', () => {
    const wt = new WordTokenizer();
    const input = 'མཐའི་རྒྱ་མཚོའི་གླིང་།';
    const tokens = wt.tokenize(input, false);

    const reconstructed = tokens.map(t => t.text).join('');
    expect(reconstructed).toBe(input);
  });

  test('token start+length should match token text', () => {
    const wt = new WordTokenizer();
    const input = 'བཀྲ་ཤིས་བདེ་ལེགས།';
    const tokens = wt.tokenize(input, false);

    for (const token of tokens) {
      const extracted = input.substring(token.start, token.start + token.length);
      expect(extracted).toBe(token.text);
    }
  });
});

describe('WordTokenizer - Repeated words', () => {
  test('should correctly segment repeated words', () => {
    const wt = new WordTokenizer();
    const tokens = wt.tokenize('བཀྲ་བཀྲ་བཀྲ་', false);

    const textTokens = tokens.filter(t => t.chunkType === 'TEXT');
    expect(textTokens.length).toBe(3);
    for (const t of textTokens) {
      expect(t.text).toContain('བཀྲ');
    }
  });
});

describe('WordTokenizer - Special characters', () => {
  test('should handle Tibetan numerals', () => {
    const wt = new WordTokenizer();
    const tokens = wt.tokenize('བཀྲ་ ༡༢༣', false);

    expect(tokens.length).toBeGreaterThan(0);
  });

  test('should handle special Tibetan punctuation (༆)', () => {
    const wt = new WordTokenizer();
    const tokens = wt.tokenize('༆ བཀྲ་ཤིས་', false);

    // The ༆ should be separated as punctuation
    expect(tokens.length).toBeGreaterThan(0);
  });
});

describe('WordTokenizer - Token counts for known patterns', () => {
  /**
   * These tests verify that specific input patterns produce
   * the expected number of tokens (text + punct + other).
   */

  test('single syllable + shad = 2 tokens', () => {
    const wt = new WordTokenizer();
    const tokens = wt.tokenize('བཀྲ།', false);

    // 1 text + 1 punct
    expect(tokens.length).toBe(2);
  });

  test('two syllables + shad = 3 tokens', () => {
    const wt = new WordTokenizer();
    const tokens = wt.tokenize('བཀྲ་ཤིས།', false);

    // 2 text + 1 punct
    expect(tokens.length).toBe(3);
  });

  test('four syllables without punct = 4 tokens', () => {
    const wt = new WordTokenizer();
    const tokens = wt.tokenize('བཀྲ་ཤིས་བདེ་ལེགས', false);

    const textTokens = tokens.filter(t => t.chunkType === 'TEXT');
    expect(textTokens.length).toBe(4);
  });
});

describe('WordTokenizer - Sanskrit detection', () => {
  test('should detect Sanskrit syllable pattern ྲྀ in tokens', () => {
    const wt = new WordTokenizer();
    // ྲྀ (U+0FB2 + U+0F80) is a known Sanskrit pattern checked by hasSanskritSyllable
    const tokens = wt.tokenize('སྲྀ་', false);

    const textTokens = tokens.filter(t => t.chunkType === 'TEXT');
    expect(textTokens.length).toBeGreaterThan(0);
    expect(textTokens[0].skrt).toBe(true);
  });

  test('should not flag regular Tibetan as Sanskrit', () => {
    const wt = new WordTokenizer();
    const tokens = wt.tokenize('བཀྲ་ཤིས་', false);

    const textTokens = tokens.filter(t => t.chunkType === 'TEXT');
    for (const t of textTokens) {
      expect(t.skrt).toBe(false);
    }
  });
});

describe('WordTokenizer - chooseDefaultEntry', () => {
  test('should not crash when processing tokens with senses', () => {
    const wt = new WordTokenizer();

    // The chooseDefaultEntry logic runs as part of tokenization
    // We test via the public interface by checking the pipeline
    // doesn't crash and produces reasonable output
    const tokens = wt.tokenize('བཀྲ་', false);
    expect(tokens.length).toBeGreaterThan(0);
  });
});
