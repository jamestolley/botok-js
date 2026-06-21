/**
 * ChunkFramework - Chunking and syllabification tests
 * Mirrors botok/tests/chunks/test_chunkframework.py and test_chunks.py
 */

import { ChunkFramework } from '../chunks/ChunkFramework';
import { ChunkMarkers } from '../types';

describe('ChunkFramework - BO / non-BO chunking', () => {
  test('should separate Tibetan from non-Tibetan text', () => {
    const string = 'བཀྲ་་ཤིས་བདེ་ལེགས། 23PIEIUZLDVéjoldvép';
    const cb = new ChunkFramework(string);
    const chunks = cb.chunkBoText();
    const output = cb.getReadable(chunks);

    // Should have Tibetan chunk followed by non-Tibetan
    expect(output.length).toBeGreaterThanOrEqual(2);
    expect(output[0][0]).toBe('bo');
    // The last chunk should be non-Tibetan
    expect(output[output.length - 1][0]).toBe('other');
  });
});

describe('ChunkFramework - Punctuation chunking', () => {
  test('should separate punctuation from non-punctuation', () => {
    const string = '༆ བཀྲ་ཤིས་བདེ་ལེགས།། །།';
    const cb = new ChunkFramework(string);
    const chunks = cb.chunkPunctuation();
    const output = cb.getReadable(chunks);

    // First chunk should be punctuation (༆ )
    expect(output[0][0]).toBe('punct');
    // There should be non-punctuation text in the middle
    const hasNonPunct = output.some(c => c[0] === 'non-punct');
    expect(hasNonPunct).toBe(true);
  });
});

describe('ChunkFramework - Number chunking', () => {
  test('should separate numbers from non-numbers', () => {
    const string = 'བཀྲ་ཤིས་བདེ་ལེགས།  ༡༢༣༠༩༨';
    const cb = new ChunkFramework(string);
    const chunks = cb.chunkNumbers();
    const output = cb.getReadable(chunks);

    const hasNum = output.some(c => c[0] === 'num');
    expect(hasNum).toBe(true);
  });
});

describe('ChunkFramework - Symbol chunking', () => {
  test('should separate symbols from non-symbols', () => {
    const string = 'བཀྲ་ཤིས་བདེ་ལེགས། ༪༫༝༜༛༚';
    const cb = new ChunkFramework(string);
    const chunks = cb.chunkSymbols();
    const output = cb.getReadable(chunks);

    const hasSym = output.some(c => c[0] === 'sym');
    expect(hasSym).toBe(true);
  });
});

describe('ChunkFramework - Latin chunking', () => {
  test('should separate Latin text from non-Latin', () => {
    const string = 'བཀྲ་ཤིས་བདེ་ལེགས This is a test.';
    const cb = new ChunkFramework(string);
    const chunks = cb.chunkLatin();
    const output = cb.getReadable(chunks);

    const hasLatin = output.some(c => c[0] === 'latin');
    expect(hasLatin).toBe(true);
    // The Latin chunk should contain the English text
    const latinChunk = output.find(c => c[0] === 'latin');
    expect(latinChunk![1]).toContain('This is a test');
  });
});

describe('ChunkFramework - CJK chunking', () => {
  test('should separate CJK text from non-CJK', () => {
    const string = 'བཀྲ་ཤིས་བདེ་ལེགས 这是  什么';
    const cb = new ChunkFramework(string);
    const chunks = cb.chunkCjk();
    const output = cb.getReadable(chunks);

    const hasCjk = output.some(c => c[0] === 'cjk');
    expect(hasCjk).toBe(true);
  });
});

describe('ChunkFramework - Syllabification', () => {
  test('should syllabify basic Tibetan text', () => {
    const string = 'བཀྲ་ཤིས་བདེ་ལེགས';
    const cb = new ChunkFramework(string);
    const syllables = cb.syllabify();
    const output = cb.getReadable(syllables);

    // Should produce 4 syllables
    expect(output).toEqual([
      ['TEXT', 'བཀྲ་'],
      ['TEXT', 'ཤིས་'],
      ['TEXT', 'བདེ་'],
      ['TEXT', 'ལེགས'],
    ]);
  });

  test('should handle text with multiple tseks/spaces', () => {
    const string = ' ཤི་བཀྲ་ཤིས་  བདེ་་ལ             ེ       གས་ བཀྲ་ཤིས་བདེ་ལེགས';
    const cb = new ChunkFramework(string);
    const syllables = cb.syllabify();
    const output = cb.getReadable(syllables);

    // Each syllable should be a TEXT chunk
    for (const [type] of output) {
      expect(type).toBe('TEXT');
    }
    // Should produce multiple syllables
    expect(output.length).toBeGreaterThan(4);
  });

  test('should handle two-syllable word', () => {
    const string = 'བཀྲ་ཤིས་';
    const cb = new ChunkFramework(string);
    const syllables = cb.syllabify();
    expect(syllables.length).toBe(2);
  });
});

describe('ChunkFramework - serveSylsToTrie', () => {
  test('should prepare chunks for tokenization', () => {
    const string = 'བཀྲ་ཤིས་བདེ་ལེགས།';
    const cb = new ChunkFramework(string);
    cb.serveSylsToTrie();

    expect(cb.chunks.length).toBeGreaterThan(0);

    // Syllable chunks should have non-null first element (syllable data)
    // Non-syllable chunks (punct) should have null first element
    const syllableChunks = cb.chunks.filter(c => c[0] !== null);
    const nonSyllableChunks = cb.chunks.filter(c => c[0] === null);

    expect(syllableChunks.length).toBe(4); // 4 syllables
    expect(nonSyllableChunks.length).toBeGreaterThan(0); // at least the shad
  });

  test('should handle mixed Tibetan/Latin/CJK text', () => {
    const string = 'བཀྲ་ཤིས་ hello བདེ་ལེགས 这是';
    const cb = new ChunkFramework(string);
    cb.serveSylsToTrie();

    expect(cb.chunks.length).toBeGreaterThan(0);

    // Non-Tibetan chunks should have null first element
    const nonBoChunks = cb.chunks.filter(c => {
      const chunkType = c[1][0];
      return chunkType === ChunkMarkers.LATIN ||
             chunkType === ChunkMarkers.CJK ||
             chunkType === ChunkMarkers.OTHER;
    });
    for (const chunk of nonBoChunks) {
      expect(chunk[0]).toBeNull();
    }
  });

  test('should produce correct readable output for syllable chunks', () => {
    const string = 'བཀྲ་ཤིས་བདེ་ལེགས།';
    const cb = new ChunkFramework(string);
    cb.serveSylsToTrie();

    // Get readable output for the metadata portion of each chunk
    const readable = cb.chunks.map(c => {
      const [, meta] = c;
      return cb.getReadable([meta])[0];
    });

    // First 4 should be TEXT (syllables)
    expect(readable[0][0]).toBe('TEXT');
    expect(readable[1][0]).toBe('TEXT');
    expect(readable[2][0]).toBe('TEXT');
    expect(readable[3][0]).toBe('TEXT');
  });
});

describe('ChunkFramework - pipeChunk', () => {
  test('should pipe chunking operations on specific chunk types', () => {
    const string = 'བཀྲ་ཤིས་བདེ་ལེགས། hello';
    const cb = new ChunkFramework(string);

    // First: BO vs OTHER
    let chunks = cb.chunkBoText();
    expect(chunks.length).toBeGreaterThan(1);

    // Pipe: within BO chunks, separate punctuation
    chunks = cb.pipeChunk(
      chunks,
      cb.chunkPunctuation.bind(cb),
      ChunkMarkers.BO,
      ChunkMarkers.PUNCT
    );

    // Should now have punct chunk(s) in addition to BO
    const hasPunct = chunks.some(c => c[0] === ChunkMarkers.PUNCT);
    expect(hasPunct).toBe(true);
  });
});

describe('ChunkFramework - getChunked and getMarkers', () => {
  test('getChunked should return TextChunk objects', () => {
    const string = 'བཀྲ་ཤིས་བདེ་ལེགས';
    const cb = new ChunkFramework(string);
    const syllables = cb.syllabify();
    const chunked = cb.getChunked(syllables);

    expect(chunked.length).toBe(4);
    expect(chunked[0].content).toBe('བཀྲ་');
    expect(chunked[0].type).toBe(ChunkMarkers.TEXT);
    expect(chunked[0].start).toBeDefined();
    expect(chunked[0].length).toBeDefined();
  });

  test('getMarkers should return type/start/content tuples', () => {
    const string = 'བཀྲ་ཤིས་';
    const cb = new ChunkFramework(string);
    const syllables = cb.syllabify();
    const markers = cb.getMarkers(syllables);

    expect(markers.length).toBe(2);
    // Each marker: [type, start, content]
    expect(markers[0][0]).toBe('TEXT');
    expect(typeof markers[0][1]).toBe('number');
    expect(markers[0][2]).toBe('བཀྲ་');
  });
});

describe('ChunkFramework - Edge cases', () => {
  test('should handle empty string', () => {
    const cb = new ChunkFramework('');
    const syllables = cb.syllabify();
    expect(syllables.length).toBe(0);
  });

  test('should handle pure punctuation string', () => {
    const cb = new ChunkFramework('།།');
    cb.serveSylsToTrie();
    expect(cb.chunks.length).toBeGreaterThan(0);
    // All chunks should be non-syllable (null first element)
    for (const chunk of cb.chunks) {
      expect(chunk[0]).toBeNull();
    }
  });

  test('should handle pure Latin string', () => {
    const cb = new ChunkFramework('hello world');
    cb.serveSylsToTrie();
    expect(cb.chunks.length).toBeGreaterThan(0);
    // All chunks should be non-syllable (null first element)
    for (const chunk of cb.chunks) {
      expect(chunk[0]).toBeNull();
    }
  });
});
