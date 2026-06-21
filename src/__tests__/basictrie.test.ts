/**
 * BasicTrie - Trie data structure tests
 * Mirrors botok/tests/tries/test_basictrie.py
 */

import { BasicTrie } from '../tries/BasicTrie';

describe('BasicTrie - Basic operations', () => {
  test('should add and find words using string arrays', () => {
    const trie = new BasicTrie();

    const words = 'hello goo good goodbye help gerald gold tea ted team to too tom stan standard money';
    for (const w of words.split(' ')) {
      trie.add(w);
    }

    // has_word returns exists + data
    const result = trie.hasWord('goodbye');
    expect(result.exists).toBe(true);
    expect(result.data._).toBeDefined();
  });

  test('should add data to existing words', () => {
    const trie = new BasicTrie();

    trie.add('goodbye');

    // Add pos data
    trie.addData('goodbye', { pos: 'NOUN' });
    const result = trie.hasWord('goodbye');
    expect(result.exists).toBe(true);
    expect(result.data.senses).toBeDefined();
    expect(result.data.senses![0].pos).toBe('NOUN');
  });

  test('should accumulate senses when adding data multiple times', () => {
    const trie = new BasicTrie();

    trie.add('goodbye');
    trie.addData('goodbye', { pos: 'NOUN' });

    // Adding empty dict adds an empty sense object
    trie.addData('goodbye', {});
    const result = trie.hasWord('goodbye');
    expect(result.data.senses).toBeDefined();
    expect(result.data.senses!.length).toBe(2);
    expect(result.data.senses![0].pos).toBe('NOUN');
  });

  test('should accumulate multiple senses', () => {
    const trie = new BasicTrie();

    trie.add('goodbye');
    trie.addData('goodbye', { pos: 'NOUN' });
    trie.addData('goodbye', { pos: 'VERB', lemma: 'goodbye' });

    const result = trie.hasWord('goodbye');
    expect(result.data.senses!.length).toBe(2);
    expect(result.data.senses![0].pos).toBe('NOUN');
    expect(result.data.senses![1].pos).toBe('VERB');
    expect(result.data.senses![1].lemma).toBe('goodbye');
  });

  test('should deactivate and reactivate words', () => {
    const trie = new BasicTrie();

    trie.add('goodbye');
    trie.addData('goodbye', { pos: 'NOUN' });
    trie.addData('goodbye', { pos: 'VERB', lemma: 'goodbye' });

    // Deactivate
    trie.deactivate('goodbye');
    let result = trie.hasWord('goodbye');
    expect(result.exists).toBe(false);
    // Data should still be there even when deactivated
    expect(result.data.senses!.length).toBe(2);

    // Reactivate
    trie.deactivate('goodbye', true);
    result = trie.hasWord('goodbye');
    expect(result.exists).toBe(true);
    expect(result.data.senses!.length).toBe(2);
  });

  test('should support walking through the trie with string keys', () => {
    const trie = new BasicTrie();

    // The trie uses whole strings as keys (syllable-level), not char-by-char
    trie.add(['hello', 'world']);
    trie.addData(['hello', 'world'], { pos: 'NOUN' });

    let currentNode = trie.walk('hello');
    expect(currentNode).not.toBeNull();
    expect(currentNode!.label).toBe('hello');
    expect(currentNode!.leaf).toBe(false);

    currentNode = trie.walk('world', currentNode!);
    expect(currentNode).not.toBeNull();
    expect(currentNode!.label).toBe('world');
    expect(currentNode!.leaf).toBe(true);
    expect(currentNode!.data.senses!.length).toBe(1);
  });
});

describe('BasicTrie - Tibetan syllable arrays', () => {
  test('should add and find multi-syllable Tibetan words', () => {
    const trie = new BasicTrie();

    trie.add(['བཀྲ', 'ཤིས'], { pos: 'NOUN' });

    const result = trie.hasWord(['བཀྲ', 'ཤིས']);
    expect(result.exists).toBe(true);
    expect(result.data.senses).toBeDefined();
    expect(result.data.senses![0].pos).toBe('NOUN');
  });

  test('should walk through multi-syllable Tibetan words', () => {
    const trie = new BasicTrie();

    trie.add(['བཀྲ', 'ཤིས']);

    let currentNode = trie.walk('བཀྲ');
    expect(currentNode).not.toBeNull();

    currentNode = trie.walk('ཤིས', currentNode!);
    expect(currentNode).not.toBeNull();
    expect(currentNode!.isMatch()).toBe(true);
  });

  test('should not find partial matches as complete words', () => {
    const trie = new BasicTrie();

    trie.add(['བཀྲ', 'ཤིས']);

    // Only the first syllable should not be a complete word
    const result = trie.hasWord(['བཀྲ']);
    expect(result.exists).toBe(false);
  });

  test('should handle single-syllable words', () => {
    const trie = new BasicTrie();

    trie.add(['ཤིས']);
    const success = trie.addData(['ཤིས'], { pos: 'NOUN', freq: 100 });

    expect(success).toBe(true);

    const result = trie.hasWord(['ཤིས']);
    expect(result.data.senses).toBeDefined();
    expect(result.data.senses![0].pos).toBe('NOUN');
  });
});

describe('BasicTrie - getStats', () => {
  test('should count nodes and words correctly', () => {
    const trie = new BasicTrie();

    // Trie uses whole strings as keys (not char-by-char)
    // add('cat') creates: head -> 'cat' (1 child node)
    trie.add('cat');
    trie.add('car');
    trie.add('card');

    const stats = trie.getStats();
    expect(stats.wordCount).toBe(3);
    // head + cat + car + card = 4 nodes
    expect(stats.nodeCount).toBe(4);
  });

  test('should count nodes for multi-syllable words', () => {
    const trie = new BasicTrie();

    trie.add(['བཀྲ', 'ཤིས']);
    trie.add(['བཀྲ', 'ཤིས', 'བདེ', 'ལེགས']);

    const stats = trie.getStats();
    expect(stats.wordCount).toBe(2);
    // head -> བཀྲ -> ཤིས -> བདེ -> ལེགས = 5 nodes
    expect(stats.nodeCount).toBe(5);
  });
});

describe('BasicTrie - clear', () => {
  test('should clear the trie', () => {
    const trie = new BasicTrie();

    trie.add('hello');
    trie.add('world');
    expect(trie.hasWord('hello').exists).toBe(true);

    trie.clear();
    expect(trie.hasWord('hello').exists).toBe(false);

    const stats = trie.getStats();
    expect(stats.wordCount).toBe(0);
  });
});

describe('BasicTrie - Error handling', () => {
  test('should throw on empty word for hasWord', () => {
    const trie = new BasicTrie();
    expect(() => trie.hasWord([])).toThrow();
  });

  test('should throw on empty word for addData', () => {
    const trie = new BasicTrie();
    expect(() => trie.addData([], { pos: 'NOUN' })).toThrow();
  });

  test('should return false when adding data to non-existent word', () => {
    const trie = new BasicTrie();
    const result = trie.addData('nonexistent', { pos: 'NOUN' });
    expect(result).toBe(false);
  });

  test('should return false when deactivating non-existent word', () => {
    const trie = new BasicTrie();
    const result = trie.deactivate('nonexistent');
    expect(result).toBe(false);
  });
});

describe('BasicTrie - Duplicate sense prevention', () => {
  test('should not add duplicate identical senses', () => {
    const trie = new BasicTrie();

    trie.add('test');
    trie.addData('test', { pos: 'NOUN', freq: 100 });
    trie.addData('test', { pos: 'NOUN', freq: 100 });

    const result = trie.hasWord('test');
    // Should have only 1 sense (not 2)
    expect(result.data.senses!.length).toBe(1);
  });

  test('should add different senses for same word', () => {
    const trie = new BasicTrie();

    trie.add('test');
    trie.addData('test', { pos: 'NOUN', freq: 100 });
    trie.addData('test', { pos: 'VERB', freq: 200 });

    const result = trie.hasWord('test');
    expect(result.data.senses!.length).toBe(2);
  });
});
