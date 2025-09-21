/**
 * Basic tests for core data structures and tokenization engine
 */

import { BoString } from '../textunits/BoString';
import { ChunkFramework } from '../chunks/ChunkFramework';
import { BasicTrie } from '../tries/BasicTrie';
import { Token } from '../tokenizers/Token';
import { WordTokenizer } from '../tokenizers/WordTokenizer';
import { Tokenize } from '../tokenizers/Tokenize';
import { Config } from '../config/Config';
import { CharMarkers, ChunkMarkers } from '../types';

describe('BoString', () => {
  test('should classify Tibetan characters correctly', () => {
    const text = 'བཀྲ་ཤིས་';
    const bs = new BoString(text);
    
    expect(bs.length).toBe(8);
    expect(bs.getCharType(0)).toBe(CharMarkers.CONS); // བ U+0F56
    expect(bs.getCharType(1)).toBe(CharMarkers.CONS); // ཀ U+0F40
    expect(bs.getCharType(2)).toBe(CharMarkers.SUB_CONS); // ྲ U+0FB2
    expect(bs.getCharType(3)).toBe(CharMarkers.TSEK); // ་ U+0F0B
    expect(bs.getCharType(4)).toBe(CharMarkers.CONS); // ཤ U+0F64
    expect(bs.getCharType(5)).toBe(CharMarkers.VOW); // ི U+0F72
    expect(bs.getCharType(6)).toBe(CharMarkers.CONS); // ས U+0F66
    expect(bs.getCharType(7)).toBe(CharMarkers.TSEK); // ་ U+0F0B
  });

  test('should identify Tibetan vs non-Tibetan text', () => {
    const text = 'བཀྲ་ ABC ཤིས་';
    const bs = new BoString(text);
    
    expect(bs.isTibetan(0)).toBe(true); // བ
    expect(bs.isTibetan(4)).toBe(false); // space
    expect(bs.isTibetan(5)).toBe(false); // A
    expect(bs.isTibetan(9)).toBe(true); // ཤ
  });

  test('should handle punctuation correctly', () => {
    const text = 'བཀྲ་ཤིས།';
    const bs = new BoString(text);
    
    expect(bs.isPunctuation(bs.length - 1)).toBe(true); // །
  });
});

describe('ChunkFramework', () => {
  test('should chunk Tibetan vs non-Tibetan text', () => {
    const text = 'བཀྲ་ ABC ཤིས་';
    const cf = new ChunkFramework(text);
    
    const chunks = cf.chunkBoText();
    expect(chunks.length).toBeGreaterThan(1);
    
    // First chunk should be Tibetan
    expect(chunks[0][0]).toBe(ChunkMarkers.BO);
  });

  test('should create readable chunks', () => {
    const text = 'བཀྲ་ཤིས།';
    const cf = new ChunkFramework(text);
    
    const chunks = cf.chunkBoText();
    const readable = cf.getReadable(chunks);
    
    expect(readable.length).toBeGreaterThan(0);
    expect(readable[0][0]).toBe('bo');
    expect(readable[0][1]).toBe(text);
  });

  test('should syllabify text correctly', () => {
    const text = 'བཀྲ་ཤིས་';
    const cf = new ChunkFramework(text);
    
    const syllables = cf.syllabify();
    expect(syllables.length).toBe(2); // Two syllables
  });
});

describe('BasicTrie', () => {
  test('should add and find words', () => {
    const trie = new BasicTrie();
    
    trie.add(['བཀྲ', 'ཤིས'], { pos: 'NOUN' });
    
    const result = trie.hasWord(['བཀྲ', 'ཤིས']);
    expect(result.exists).toBe(true);
    expect(result.data.senses).toBeDefined();
  });

  test('should handle word walking', () => {
    const trie = new BasicTrie();
    
    trie.add(['བཀྲ', 'ཤིས']);
    
    let currentNode = trie.walk('བཀྲ');
    expect(currentNode).not.toBeNull();
    
    currentNode = trie.walk('ཤིས', currentNode!);
    expect(currentNode).not.toBeNull();
    expect(currentNode!.isMatch()).toBe(true);
  });

  test('should add data to existing words', () => {
    const trie = new BasicTrie();
    
    trie.add(['ཤིས']);
    const success = trie.addData(['ཤིས'], { pos: 'NOUN', freq: 100 });
    
    expect(success).toBe(true);
    
    const result = trie.hasWord(['ཤིས']);
    expect(result.data.senses).toBeDefined();
    expect(result.data.senses![0].pos).toBe('NOUN');
  });

  test('should deactivate words', () => {
    const trie = new BasicTrie();
    
    trie.add(['test']);
    expect(trie.hasWord(['test']).exists).toBe(true);
    
    trie.deactivate(['test']);
    expect(trie.hasWord(['test']).exists).toBe(false);
    
    trie.deactivate(['test'], true); // reactivate
    expect(trie.hasWord(['test']).exists).toBe(true);
  });
});

describe('Token', () => {
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

  test('should identify token types', () => {
    const wordToken = new Token({ chunkType: 'TEXT' });
    const punctToken = new Token({ chunkType: 'PUNCT' });
    
    expect(wordToken.isWord()).toBe(true);
    expect(punctToken.isPunctuation()).toBe(true);
  });

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
    expect(restored.senses).toEqual(original.senses);
  });

  test('should provide string representation', () => {
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
});

describe('WordTokenizer', () => {
  test('should initialize with default config', () => {
    const tokenizer = new WordTokenizer();
    expect(tokenizer.getConfig()).toBeInstanceOf(Config);
  });

  test('should tokenize simple Tibetan text', () => {
    const tokenizer = new WordTokenizer();
    const text = 'བཀྲ་ཤིས།';
    
    const tokens = tokenizer.tokenize(text);
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens[0]).toBeInstanceOf(Token);
  });

  test('should handle empty text', () => {
    const tokenizer = new WordTokenizer();
    const tokens = tokenizer.tokenize('');
    expect(tokens).toEqual([]);
  });
});

describe('Tokenize', () => {
  test('should initialize with trie', () => {
    const trie = new BasicTrie();
    const tokenizer = new Tokenize(trie);
    expect(tokenizer).toBeInstanceOf(Tokenize);
  });
});