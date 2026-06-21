/**
 * Token - Token data model tests
 * Mirrors botok/tests/tokenizers/test_token.py
 */

import { Token } from '../tokenizers/Token';

describe('Token - Basic properties', () => {
  test('should create token with basic properties', () => {
    const token = new Token({
      text: 'བཀྲ་ཤིས',
      start: 0,
      length: 6,
      chunkType: 'TEXT'
    });

    expect(token.text).toBe('བཀྲ་ཤིས');
    expect(token.start).toBe(0);
    expect(token.length).toBe(6);
    expect(token.chunkType).toBe('TEXT');
  });

  test('should support dictionary-style access via set/get', () => {
    const token = new Token();
    token.text = 'test';

    // set and get
    token.set('pos', 'NOUN');
    expect(token.get('pos')).toBe('NOUN');
    expect(token.pos).toBe('NOUN');
  });
});

describe('Token - POS handling', () => {
  test('should handle POS information', () => {
    const token = new Token({
      text: 'བཀྲ་ཤིས',
      pos: 'NOUN',
      chunkType: 'TEXT'
    });

    expect(token.hasPos()).toBe(true);
    expect(token.matchesPos('NOUN')).toBe(true);
    expect(token.matchesPos('VERB')).toBe(false);
  });

  test('NO_POS should count as not having POS', () => {
    const token = new Token({ pos: 'NO_POS', chunkType: 'TEXT' });
    expect(token.hasPos()).toBe(false);
  });

  test('NON_WORD should count as not having POS', () => {
    const token = new Token({ pos: 'NON_WORD', chunkType: 'TEXT' });
    expect(token.hasPos()).toBe(false);
  });

  test('getAllPos should collect from token and senses', () => {
    const token = new Token({
      pos: 'NOUN',
      chunkType: 'TEXT',
      senses: [
        { pos: 'NOUN', freq: 100 },
        { pos: 'VERB', freq: 50 }
      ]
    });

    const allPos = token.getAllPos();
    expect(allPos).toContain('NOUN');
    expect(allPos).toContain('VERB');
    expect(allPos.length).toBe(2); // no duplicates
  });
});

describe('Token - Type identification', () => {
  test('should identify word tokens', () => {
    const wordToken = new Token({ chunkType: 'TEXT' });
    expect(wordToken.isWord()).toBe(true);
    expect(wordToken.isPunctuation()).toBe(false);
  });

  test('should identify punctuation tokens', () => {
    const punctToken = new Token({ chunkType: 'PUNCT' });
    expect(punctToken.isPunctuation()).toBe(true);
    expect(punctToken.isWord()).toBe(false);
  });

  test('should identify non-Tibetan tokens', () => {
    const nonBoToken = new Token({ chunkType: 'NON_BO' });
    expect(nonBoToken.isNonTibetan()).toBe(true);
  });

  test('should identify numeric tokens', () => {
    const numToken = new Token({ chunkType: 'NUM' });
    expect(numToken.isNumeric()).toBe(true);
  });
});

describe('Token - Serialization', () => {
  test('should convert to/from JSON', () => {
    const original = new Token({
      text: 'བཀྲ་ཤིས',
      pos: 'NOUN',
      start: 0,
      length: 6,
      chunkType: 'TEXT',
      senses: [{ pos: 'NOUN', freq: 100 }]
    });

    const json = original.toJSON();
    const restored = Token.fromJSON(json);

    expect(restored.text).toBe(original.text);
    expect(restored.pos).toBe(original.pos);
    expect(restored.start).toBe(original.start);
    expect(restored.length).toBe(original.length);
    expect(restored.chunkType).toBe(original.chunkType);
    expect(restored.senses).toEqual(original.senses);
  });

  test('should include optional properties in JSON only when set', () => {
    const minimalToken = new Token({
      text: 'test',
      start: 0,
      length: 4,
      chunkType: 'TEXT'
    });

    const json = minimalToken.toJSON();
    expect(json.text).toBe('test');
    expect(json.pos).toBeUndefined();
    expect(json.lemma).toBeUndefined();
    expect(json.senses).toBeUndefined();
  });

  test('should preserve all optional fields in JSON round-trip', () => {
    const token = new Token({
      text: 'མཐའི་',
      textCleaned: 'མཐའི་',
      textUnaffixed: 'མཐའ་',
      pos: 'NOUN',
      lemma: 'མཐའ་',
      freq: 45097,
      start: 0,
      length: 5,
      chunkType: 'TEXT',
      senses: [{ pos: 'NOUN', freq: 45097, affixed: true }],
      affix: false,
      affixHost: true
    });

    const json = token.toJSON();
    expect(json.textCleaned).toBe('མཐའི་');
    expect(json.textUnaffixed).toBe('མཐའ་');
    expect(json.lemma).toBe('མཐའ་');
    expect(json.freq).toBe(45097);
    expect(json.affixHost).toBe(true);
  });
});

describe('Token - String representation', () => {
  test('should provide string representation with key fields', () => {
    const token = new Token({
      text: 'བཀྲ་ཤིས',
      pos: 'NOUN',
      chunkType: 'TEXT'
    });

    const str = token.toString();
    expect(str).toContain('text: "བཀྲ་ཤིས"');
    expect(str).toContain('pos: NOUN');
    expect(str).toContain('chunk_type: TEXT');
  });

  test('should include senses in string representation', () => {
    const token = new Token({
      text: 'test',
      chunkType: 'TEXT',
      senses: [{ pos: 'NOUN', freq: 100 }]
    });

    const str = token.toString();
    expect(str).toContain('senses:');
    expect(str).toContain('pos: NOUN');
    expect(str).toContain('freq: 100');
  });
});

describe('Token - Clone', () => {
  test('should create an independent clone', () => {
    const original = new Token({
      text: 'test',
      pos: 'NOUN',
      start: 5,
      length: 4,
      chunkType: 'TEXT',
      senses: [{ pos: 'NOUN' }]
    });

    const clone = original.clone();

    // Should be equal
    expect(clone.text).toBe(original.text);
    expect(clone.pos).toBe(original.pos);

    // Should be independent
    clone.pos = 'VERB';
    expect(original.pos).toBe('NOUN');
  });
});

describe('Token - Text accessors', () => {
  test('getCleanText should normalize whitespace and tseks', () => {
    const token = new Token({
      text: 'བདེ་་ལེ གས',
      chunkType: 'TEXT'
    });

    const clean = token.getCleanText();
    // Should collapse double tseks and extra spaces
    expect(clean).not.toContain('  ');
    expect(clean).not.toContain('་་');
  });

  test('getCleanText should return textCleaned when available', () => {
    const token = new Token({
      text: 'བདེ་་ལེ གས',
      textCleaned: 'བདེ་ལེགས་',
      chunkType: 'TEXT'
    });

    expect(token.getCleanText()).toBe('བདེ་ལེགས་');
  });

  test('getUnaffixedText should return textUnaffixed when available', () => {
    const token = new Token({
      text: 'མཐའི་',
      textUnaffixed: 'མཐའ་',
      chunkType: 'TEXT'
    });

    expect(token.getUnaffixedText()).toBe('མཐའ་');
  });

  test('getLemma should check senses when token.lemma is unset', () => {
    const token = new Token({
      text: 'test',
      chunkType: 'TEXT',
      senses: [{ pos: 'NOUN', lemma: 'test_lemma' }]
    });

    expect(token.getLemma()).toBe('test_lemma');
  });

  test('getFrequency should check senses when token.freq is unset', () => {
    const token = new Token({
      text: 'test',
      chunkType: 'TEXT',
      senses: [{ pos: 'NOUN', freq: 42 }]
    });

    expect(token.getFrequency()).toBe(42);
  });
});

describe('Token - Aliases', () => {
  test('content should alias text', () => {
    const token = new Token({ text: 'hello', chunkType: 'TEXT' });
    expect(token.content).toBe('hello');
  });

  test('len should alias length', () => {
    const token = new Token({ text: 'hello', length: 5, chunkType: 'TEXT' });
    expect(token.len).toBe(5);
  });

  test('tag should alias pos', () => {
    const token = new Token({ pos: 'NOUN', chunkType: 'TEXT' });
    expect(token.tag).toBe('NOUN');
    token.tag = 'VERB';
    expect(token.pos).toBe('VERB');
  });

  test('type should alias chunkType', () => {
    const token = new Token({ chunkType: 'TEXT' });
    expect(token.type).toBe('TEXT');
    token.type = 'PUNCT';
    expect(token.chunkType).toBe('PUNCT');
  });
});
