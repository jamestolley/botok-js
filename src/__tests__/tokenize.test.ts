/**
 * Tokenize - Core tokenization engine tests
 * Mirrors botok/tests/tokenizers/test_tokenize.py and parts of test_bugs.py
 */

import { Tokenize } from '../tokenizers/Tokenize';
import { BasicTrie } from '../tries/BasicTrie';
import { ChunkFramework } from '../chunks/ChunkFramework';
import { Token } from '../tokenizers/Token';

/**
 * Helper: populate a trie with words and tokenize input text.
 * Since botok-js doesn't have Trie.inflect_n_modify_trie(),
 * we manually add words using syllable arrays.
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

describe('Tokenize - Basic tokenization with trie', () => {
  test('should match a known two-syllable word in the trie', () => {
    const tokens = tokenizeWithTrie(
      [{ syllables: ['བཀྲ', 'ཤིས'], data: { pos: 'NOUN' } }],
      'བཀྲ་ཤིས་'
    );

    // Should produce one text token for the matched word
    const textTokens = tokens.filter(t => t.chunkType === 'TEXT');
    expect(textTokens.length).toBe(1);
    expect(textTokens[0].text).toContain('བཀྲ');
    expect(textTokens[0].text).toContain('ཤིས');
  });

  test('should produce OOV tokens for unknown syllables', () => {
    const tokens = tokenizeWithTrie(
      [{ syllables: ['བཀྲ', 'ཤིས'], data: { pos: 'NOUN' } }],
      'ཀཀ་'
    );

    // ཀཀ is not in trie — should be a single OOV token
    const textTokens = tokens.filter(t => t.chunkType === 'TEXT');
    expect(textTokens.length).toBe(1);
  });

  test('should handle mixed known and unknown words', () => {
    const tokens = tokenizeWithTrie(
      [{ syllables: ['བཀྲ', 'ཤིས'], data: { pos: 'NOUN' } }],
      'བཀྲ་ཤིས་ཀཀ'
    );

    const textTokens = tokens.filter(t => t.chunkType === 'TEXT');
    // Should have matched word + OOV syllable
    expect(textTokens.length).toBe(2);
  });
});

describe('Tokenize - Punctuation handling', () => {
  test('should separate shad as punctuation token', () => {
    const tokens = tokenizeWithTrie(
      [{ syllables: ['བཀྲ', 'ཤིས'], data: { pos: 'NOUN' } }],
      'བཀྲ་ཤིས།'
    );

    const punctTokens = tokens.filter(t => t.chunkType === 'PUNCT');
    expect(punctTokens.length).toBeGreaterThan(0);
    expect(punctTokens.some(t => t.text.includes('།'))).toBe(true);
  });

  test('should handle double shad with space', () => {
    const tokens = tokenizeWithTrie(
      [{ syllables: ['བཀྲ'], data: { pos: 'NOUN' } }],
      'བཀྲ།། །།'
    );

    // Punct should be separated
    const punctTokens = tokens.filter(t => t.chunkType === 'PUNCT');
    expect(punctTokens.length).toBeGreaterThan(0);
  });
});

describe('Tokenize - Mixed script handling', () => {
  test('should handle Tibetan text followed by Latin', () => {
    const tokens = tokenizeWithTrie(
      [{ syllables: ['བཀྲ', 'ཤིས'], data: { pos: 'NOUN' } }],
      'བཀྲ་ཤིས་ hello'
    );

    // Non-Tibetan text (Latin, CJK, etc.) gets chunkType 'OTHER'
    const textTokens = tokens.filter(t => t.chunkType === 'TEXT');
    const otherTokens = tokens.filter(t => t.chunkType === 'OTHER');

    expect(textTokens.length).toBeGreaterThan(0);
    expect(otherTokens.length).toBeGreaterThan(0);
    expect(otherTokens.some(t => t.text.includes('hello'))).toBe(true);
  });

  test('should handle Tibetan mixed with CJK', () => {
    const tokens = tokenizeWithTrie(
      [{ syllables: ['བཀྲ'], data: { pos: 'NOUN' } }],
      'བཀྲ་ 这是什么'
    );

    // CJK text gets chunkType 'OTHER'
    const otherTokens = tokens.filter(t => t.chunkType === 'OTHER');
    expect(otherTokens.length).toBeGreaterThan(0);
    expect(otherTokens.some(t => t.text.includes('这'))).toBe(true);
  });

  test('should produce non-empty token for Latin text between Tibetan', () => {
    const tokens = tokenizeWithTrie(
      [{ syllables: ['བཀྲ', 'ཤིས'], data: { pos: 'NOUN' } },
       { syllables: ['བདེ', 'ལེགས'], data: { pos: 'NOUN' } }],
      'བཀྲ་ཤིས་ Hello བདེ་ལེགས།'
    );

    // Non-Tibetan text gets chunkType 'OTHER'
    const otherTokens = tokens.filter(t => t.chunkType === 'OTHER');
    expect(otherTokens.length).toBeGreaterThan(0);
    for (const ot of otherTokens) {
      expect(ot.text.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('Tokenize - Non-maximal matching', () => {
  test('should prefer non-max match when max match fails', () => {
    // Add both "བཀྲ་ཤིས" and "བཀྲ་ཤིས་བདེ་ལེགས" to trie
    // When input is "བཀྲ་ཤིས་བདེ་བཀྲ", the longer match fails
    // so it should fall back to the shorter match
    const tokens = tokenizeWithTrie(
      [
        { syllables: ['བཀྲ', 'ཤིས'], data: { pos: 'NOUN' } },
        { syllables: ['བཀྲ', 'ཤིས', 'བདེ', 'ལེགས'], data: {} }
      ],
      'བཀྲ་ཤིས་བདེ་བཀྲ་'
    );

    // First token should be the 2-syllable match "བཀྲ་ཤིས"
    const textTokens = tokens.filter(t => t.chunkType === 'TEXT');
    expect(textTokens[0].text).toContain('བཀྲ');
    expect(textTokens[0].text).toContain('ཤིས');
    // The remaining syllables should be separate tokens
    expect(textTokens.length).toBe(3); // བཀྲ་ཤིས + བདེ + བཀྲ
  });

  test('should handle non-max match at end of string', () => {
    const tokens = tokenizeWithTrie(
      [
        { syllables: ['བཀྲ', 'ཤིས'], data: {} },
        { syllables: ['བཀྲ', 'ཤིས', 'བདེ', 'ལེགས'], data: {} }
      ],
      'བཀྲ་ཤིས་བདེ་'
    );

    const textTokens = tokens.filter(t => t.chunkType === 'TEXT');
    // Should match "བཀྲ་ཤིས" then have "བདེ" as separate
    expect(textTokens[0].text).toContain('བཀྲ');
    expect(textTokens.length).toBe(2);
  });
});

describe('Tokenize - Token metadata', () => {
  test('should set chunk_type correctly for TEXT tokens', () => {
    const tokens = tokenizeWithTrie(
      [{ syllables: ['བཀྲ', 'ཤིས'], data: { pos: 'NOUN' } }],
      'བཀྲ་ཤིས་'
    );

    const textTokens = tokens.filter(t => t.chunkType === 'TEXT');
    expect(textTokens.length).toBeGreaterThan(0);
    expect(textTokens[0].chunkType).toBe('TEXT');
  });

  test('should carry senses data from trie to token', () => {
    const tokens = tokenizeWithTrie(
      [{ syllables: ['བཀྲ', 'ཤིས'], data: { pos: 'NOUN', freq: 17500 } }],
      'བཀྲ་ཤིས་'
    );

    const textTokens = tokens.filter(t => t.chunkType === 'TEXT');
    const matched = textTokens[0];
    expect(matched.senses).toBeDefined();
    expect(matched.senses!.length).toBeGreaterThan(0);
    expect(matched.senses![0].pos).toBe('NOUN');
  });

  test('should set start and length correctly', () => {
    const input = 'བཀྲ་ཤིས་';
    const tokens = tokenizeWithTrie(
      [{ syllables: ['བཀྲ', 'ཤིས'], data: { pos: 'NOUN' } }],
      input
    );

    const textTokens = tokens.filter(t => t.chunkType === 'TEXT');
    expect(textTokens[0].start).toBe(0);
    expect(textTokens[0].length).toBeGreaterThan(0);
    // The text extracted via start+length should match
    expect(input.substring(textTokens[0].start, textTokens[0].start + textTokens[0].length))
      .toBe(textTokens[0].text);
  });

  test('should generate syllable indices', () => {
    const tokens = tokenizeWithTrie(
      [{ syllables: ['བཀྲ', 'ཤིས'], data: { pos: 'NOUN' } }],
      'བཀྲ་ཤིས་'
    );

    const textTokens = tokens.filter(t => t.chunkType === 'TEXT');
    const matched = textTokens[0];
    expect(matched.syllableIndices).toBeDefined();
    // Two syllables
    expect(matched.syllableIndices!.length).toBe(2);
  });

  test('should generate char_types for tokens', () => {
    const tokens = tokenizeWithTrie(
      [{ syllables: ['བཀྲ', 'ཤིས'], data: { pos: 'NOUN' } }],
      'བཀྲ་ཤིས་'
    );

    const textTokens = tokens.filter(t => t.chunkType === 'TEXT');
    expect(textTokens[0].charTypes).toBeDefined();
    expect(textTokens[0].charTypes!.length).toBeGreaterThan(0);
    // First char བ should be CONS, ྲ should be SUB_CONS, etc.
    expect(textTokens[0].charTypes!).toContain('CONS');
    expect(textTokens[0].charTypes!).toContain('SUB_CONS');
    expect(textTokens[0].charTypes!).toContain('TSEK');
  });
});

describe('Tokenize - Empty trie (all OOV)', () => {
  test('should tokenize each syllable independently with empty trie', () => {
    const trie = new BasicTrie();
    const tok = new Tokenize(trie);
    const preproc = new ChunkFramework('བཀྲ་ཤིས་བདེ་ལེགས');
    preproc.serveSylsToTrie();
    const tokens = tok.tokenize(preproc);

    // With empty trie, each syllable should be a separate token
    const textTokens = tokens.filter(t => t.chunkType === 'TEXT');
    expect(textTokens.length).toBe(4);
  });
});

describe('Tokenize - Edge cases', () => {
  test('should handle single-syllable input', () => {
    const tokens = tokenizeWithTrie(
      [{ syllables: ['བཀྲ'], data: { pos: 'NOUN' } }],
      'བཀྲ་'
    );

    const textTokens = tokens.filter(t => t.chunkType === 'TEXT');
    expect(textTokens.length).toBe(1);
  });

  test('should handle input with only punctuation', () => {
    const tokens = tokenizeWithTrie([], '།། །།');
    const punctTokens = tokens.filter(t => t.chunkType === 'PUNCT');
    expect(punctTokens.length).toBeGreaterThan(0);
  });

  test('should handle input with only Latin text', () => {
    const tokens = tokenizeWithTrie([], 'hello world');
    expect(tokens.length).toBeGreaterThan(0);
    // Non-BO text gets chunkType 'OTHER'
    const otherTokens = tokens.filter(t => t.chunkType === 'OTHER');
    expect(otherTokens.length).toBeGreaterThan(0);
  });

  test('should handle consecutive matched words', () => {
    const tokens = tokenizeWithTrie(
      [
        { syllables: ['བཀྲ', 'ཤིས'], data: { pos: 'NOUN' } },
        { syllables: ['བདེ', 'ལེགས'], data: { pos: 'NOUN' } }
      ],
      'བཀྲ་ཤིས་བདེ་ལེགས'
    );

    const textTokens = tokens.filter(t => t.chunkType === 'TEXT');
    expect(textTokens.length).toBe(2);
  });

  test('should preserve text positions across all tokens', () => {
    const input = 'བཀྲ་ཤིས། བདེ་ལེགས';
    const tokens = tokenizeWithTrie(
      [
        { syllables: ['བཀྲ', 'ཤིས'], data: { pos: 'NOUN' } },
        { syllables: ['བདེ', 'ལེགས'], data: { pos: 'NOUN' } }
      ],
      input
    );

    // Each token's text should correspond to its start+length in the original
    for (const token of tokens) {
      const extracted = input.substring(token.start, token.start + token.length);
      expect(extracted).toBe(token.text);
    }
  });
});
