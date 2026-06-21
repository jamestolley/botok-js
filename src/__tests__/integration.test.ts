/**
 * Integration tests - End-to-end tokenization pipeline
 * Mirrors botok/tests/test_bugs.py (self-contained tests)
 * and botok/tests/tokenizers/test_bugs_missing_tokens.py (syllable-level)
 *
 * These tests exercise the full pipeline:
 * ChunkFramework → serveSylsToTrie → Tokenize → tokens
 * with a manually-populated trie (no external dialect pack).
 */

import { Tokenize } from '../tokenizers/Tokenize';
import { BasicTrie } from '../tries/BasicTrie';
import { ChunkFramework } from '../chunks/ChunkFramework';
import { WordTokenizer } from '../tokenizers/WordTokenizer';
import { Token } from '../tokenizers/Token';

/**
 * Helper: tokenize with a manually-populated trie
 */
function tokenizeWithTrie(
  trieWords: { syllables: string[]; data?: Record<string, any> }[],
  inputText: string
): Token[] {
  const trie = new BasicTrie();
  for (const entry of trieWords) {
    trie.add(entry.syllables, entry.data || {});
  }
  const tok = new Tokenize(trie);
  const preproc = new ChunkFramework(inputText);
  preproc.serveSylsToTrie();
  return tok.tokenize(preproc);
}

describe('Integration - Full pipeline with known words', () => {
  test('should tokenize two known words in sequence', () => {
    const tokens = tokenizeWithTrie(
      [
        { syllables: ['བཀྲ', 'ཤིས'], data: { pos: 'NOUN' } },
        { syllables: ['བདེ', 'ལེགས'], data: { pos: 'NOUN' } }
      ],
      'བཀྲ་ཤིས་བདེ་ལེགས།'
    );

    const textTokens = tokens.filter(t => t.chunkType === 'TEXT');
    expect(textTokens.length).toBe(2);
    expect(textTokens[0].senses![0].pos).toBe('NOUN');
    expect(textTokens[1].senses![0].pos).toBe('NOUN');
  });

  test('should handle known word followed by OOV followed by known word', () => {
    const tokens = tokenizeWithTrie(
      [
        { syllables: ['བཀྲ', 'ཤིས'], data: { pos: 'NOUN' } },
        { syllables: ['བདེ', 'ལེགས'], data: { pos: 'NOUN' } }
      ],
      'བཀྲ་ཤིས་ཀཀ་བདེ་ལེགས'
    );

    const textTokens = tokens.filter(t => t.chunkType === 'TEXT');
    // Known + OOV + Known = 3 text tokens
    expect(textTokens.length).toBe(3);
  });
});

describe('Integration - Syllable-level tokenization (no trie)', () => {
  /**
   * With an empty trie, the tokenizer should split text into
   * individual syllables. This mirrors the "missing token" bugs
   * from botok — ensuring no syllables are lost.
   */

  test('should not lose any syllables in basic two-syllable input', () => {
    const tokens = tokenizeWithTrie([], 'འཐུང་བུད་');
    const textTokens = tokens.filter(t => t.chunkType === 'TEXT');
    const texts = textTokens.map(t => t.text);
    expect(texts).toEqual(['འཐུང་', 'བུད་']);
  });

  test('should not lose syllables in four-syllable input', () => {
    const tokens = tokenizeWithTrie([], 'ཨ་དྷྱིད་ཤུ་ཀ་ར་');
    const textTokens = tokens.filter(t => t.chunkType === 'TEXT');
    expect(textTokens.length).toBeGreaterThanOrEqual(3);
    // All text content should be accounted for
    const allText = textTokens.map(t => t.text).join('');
    expect(allText).toContain('ཨ');
    expect(allText).toContain('ཤུ');
  });

  test('should handle syllables with special stacks', () => {
    const tokens = tokenizeWithTrie([], 'བཟླས་བྱས་');
    const textTokens = tokens.filter(t => t.chunkType === 'TEXT');
    expect(textTokens.length).toBe(2);
  });

  test('should handle syllable followed by punctuation', () => {
    const tokens = tokenizeWithTrie([], 'རབ་བསྐུས་ནས།');
    const textTokens = tokens.filter(t => t.chunkType === 'TEXT');
    const punctTokens = tokens.filter(t => t.chunkType === 'PUNCT');
    expect(textTokens.length).toBeGreaterThanOrEqual(2);
    expect(punctTokens.length).toBeGreaterThan(0);
  });

  test('should handle shad between Tibetan words', () => {
    const tokens = tokenizeWithTrie([], 'གདབ། །ཨོཾ་ན་');
    const textTokens = tokens.filter(t => t.chunkType === 'TEXT');
    const punctTokens = tokens.filter(t => t.chunkType === 'PUNCT');
    expect(textTokens.length).toBeGreaterThanOrEqual(2);
    expect(punctTokens.length).toBeGreaterThan(0);
  });
});

describe('Integration - Text reconstruction', () => {
  test('should reconstruct original text from all tokens', () => {
    const input = 'བཀྲ་ཤིས་བདེ་ལེགས། hello 这是';
    const tokens = tokenizeWithTrie(
      [
        { syllables: ['བཀྲ', 'ཤིས'], data: { pos: 'NOUN' } },
        { syllables: ['བདེ', 'ལེགས'], data: { pos: 'NOUN' } }
      ],
      input
    );

    const reconstructed = tokens.map(t => t.text).join('');
    expect(reconstructed).toBe(input);
  });

  test('should reconstruct text for complex mixed input', () => {
    const input = ' མཐའི་རྒྱ་མཚོའི་གླིང་། ཤི་བཀྲ་ཤིས་  tr བདེ་་ལེ གས། བཀྲ་ཤིས་བདེ་ལེགས་ཀཀ';
    const tokens = tokenizeWithTrie(
      [
        { syllables: ['བཀྲ', 'ཤིས'], data: { pos: 'NOUN' } },
        { syllables: ['བདེ', 'ལེགས'], data: { pos: 'NOUN' } }
      ],
      input
    );

    const reconstructed = tokens.map(t => t.text).join('');
    expect(reconstructed).toBe(input);
  });
});

describe('Integration - Segmentation consistency', () => {
  test('should segment repeated two-syllable words consistently', () => {
    const wt = new WordTokenizer();
    // With empty trie, repeated patterns should always produce same count
    const tokens1 = wt.tokenize('ལ་པོ་ལ་པོ་ལ་པོ་', false);
    const textTokens1 = tokens1.filter(t => t.chunkType === 'TEXT');
    // Should be 6 syllables (3 × 2)
    expect(textTokens1.length).toBe(6);

    const tokens2 = wt.tokenize('ལ་མོ་ལ་མོ་ལ་མོ་', false);
    const textTokens2 = tokens2.filter(t => t.chunkType === 'TEXT');
    expect(textTokens2.length).toBe(6);
  });

  test('should produce consistent results for long repeated input', () => {
    const wt = new WordTokenizer();
    const tokens = wt.tokenize(
      'བདག་པོ་བདག་པོ་བདག་པོ་བདག་པོ་བདག་པོ་བདག་པོ་བདག་པོ་བདག་པོ་བདག་པོ་',
      false
    );
    const textTokens = tokens.filter(t => t.chunkType === 'TEXT');
    // 9 × 2 syllables = 18
    expect(textTokens.length).toBe(18);
  });
});

describe('Integration - Multiple shads and spaces', () => {
  test('should handle various shad-space patterns', () => {
    const wt = new WordTokenizer();

    // Single shad
    let tokens = wt.tokenize('བཀྲ།', false);
    expect(tokens.length).toBeGreaterThan(0);

    // Double shad with space
    tokens = wt.tokenize('བཀྲ།། །།', false);
    expect(tokens.length).toBeGreaterThan(0);

    // Shad between words
    tokens = wt.tokenize('བཀྲ། བདེ', false);
    expect(tokens.length).toBeGreaterThan(0);
  });

  test('should handle multiple spaces between syllables', () => {
    const wt = new WordTokenizer();
    const tokens = wt.tokenize('ཁྱོ ད་ད  ང་', false);

    // All text should be accounted for
    const reconstructed = tokens.map(t => t.text).join('');
    expect(reconstructed).toBe('ཁྱོ ད་ད  ང་');
  });
});

describe('Integration - Position tracking', () => {
  test('should track positions correctly through mixed content', () => {
    const input = 'བཀྲ་ hello བདེ།';
    const tokens = tokenizeWithTrie(
      [
        { syllables: ['བཀྲ'], data: { pos: 'NOUN' } },
        { syllables: ['བདེ'], data: { pos: 'NOUN' } }
      ],
      input
    );

    // Every token's start should be >= 0
    for (const t of tokens) {
      expect(t.start).toBeGreaterThanOrEqual(0);
      expect(t.length).toBeGreaterThan(0);
    }

    // Tokens should appear in order
    for (let i = 1; i < tokens.length; i++) {
      expect(tokens[i].start).toBeGreaterThanOrEqual(
        tokens[i - 1].start
      );
    }
  });
});

describe('Integration - Full complex string (mirrors test_syl_tokenize)', () => {
  test('should handle complex mixed input with Latin and double tseks', () => {
    const input = ' མཐའི་རྒྱ་མཚོའི་གླིང་། ཤི་བཀྲ་ཤིས་  tr བདེ་་ལེ གས། བཀྲ་ཤིས་བདེ་ལེགས་ཀཀ';
    const tokens = tokenizeWithTrie(
      [
        { syllables: ['མཐའི'], data: { pos: 'NOUN' } },
        { syllables: ['རྒྱ', 'མཚོའི'], data: { pos: 'NOUN' } },
        { syllables: ['གླིང'], data: { pos: 'NOUN' } },
        { syllables: ['བཀྲ', 'ཤིས'], data: { pos: 'NOUN' } },
        { syllables: ['བདེ', 'ལེགས'], data: { pos: 'NOUN' } }
      ],
      input
    );

    // Should have multiple text tokens, punct tokens, and a Latin token
    const textTokens = tokens.filter(t => t.chunkType === 'TEXT');
    const punctTokens = tokens.filter(t => t.chunkType === 'PUNCT');
    // Non-BO text (Latin, CJK) gets chunkType 'OTHER'
    const otherTokens = tokens.filter(t => t.chunkType === 'OTHER');

    expect(textTokens.length).toBeGreaterThan(0);
    expect(punctTokens.length).toBeGreaterThan(0);
    expect(otherTokens.length).toBeGreaterThan(0);

    // Non-BO token should contain "tr"
    expect(otherTokens.some(t => t.text.includes('tr'))).toBe(true);

    // Text should be fully reconstructable
    const reconstructed = tokens.map(t => t.text).join('');
    expect(reconstructed).toBe(input);
  });
});
