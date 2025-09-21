/**
 * ChunkFramework - Framework for chunking Tibetan text
 * Ported from botok/chunks/chunkframework.py
 */

import { BoString } from '../textunits/BoString';
import { CharMarkers, ChunkMarkers, TextChunk } from '../types';

/**
 * Base class for chunk operations
 */
abstract class ChunkFrameworkBase {
  protected bs: BoString;

  constructor(text: string, ignoreChars: string[] = []) {
    this.bs = new BoString(text, ignoreChars);
  }

  /**
   * Generic chunking method using a test function
   */
  protected chunkUsing(
    testFn: (index: number) => boolean,
    start = 0,
    end = this.bs.length,
    yesValue = ChunkMarkers.TEXT,
    noValue = ChunkMarkers.OTHER
  ): Array<[ChunkMarkers, number, number]> {
    const chunks: Array<[ChunkMarkers, number, number]> = [];
    let currentStart = start;
    let currentType: ChunkMarkers | null = null;

    for (let i = start; i < end; i++) {
      const matches = testFn(i);
      const expectedType = matches ? yesValue : noValue;

      if (currentType === null) {
        currentType = expectedType;
        currentStart = i;
      } else if (currentType !== expectedType) {
        // Chunk boundary found
        chunks.push([currentType, currentStart, i - currentStart]);
        currentType = expectedType;
        currentStart = i;
      }
    }

    // Add final chunk
    if (currentType !== null && currentStart < end) {
      chunks.push([currentType, currentStart, end - currentStart]);
    }

    return chunks;
  }

  /**
   * Generic chunk method
   */
  protected chunk(
    start: number,
    end: number,
    testFn: (index: number) => boolean
  ): Array<[boolean, number, number]> {
    const result: Array<[boolean, number, number]> = [];
    let currentStart = start;
    let currentMatches: boolean | null = null;

    for (let i = start; i < end; i++) {
      const matches = testFn(i);

      if (currentMatches === null) {
        currentMatches = matches;
        currentStart = i;
      } else if (currentMatches !== matches) {
        result.push([currentMatches, currentStart, i - currentStart]);
        currentMatches = matches;
        currentStart = i;
      }
    }

    // Add final chunk
    if (currentMatches !== null && currentStart < end) {
      result.push([currentMatches, currentStart, end - currentStart]);
    }

    return result;
  }
}

/**
 * Framework for chunking Tibetan text into meaningful segments
 */
export class ChunkFramework extends ChunkFrameworkBase {
  public readonly text: string;
  public chunks: Array<[number[] | null, [ChunkMarkers, number, number]]> = [];
  private spacesAsPunct: boolean;
  
  constructor(text: string, ignoreChars: string[] = [], spacesAsPunct: boolean = false) {
    super(text, ignoreChars);
    this.text = text;
    this.spacesAsPunct = spacesAsPunct;
  }

  /**
   * Chunk text into Tibetan vs non-Tibetan
   */
  public chunkBoText(
    start = 0, 
    end = this.bs.length,
    yesValue = ChunkMarkers.BO,
    noValue = ChunkMarkers.OTHER
  ): Array<[ChunkMarkers, number, number]> {
    return this.chunkUsing(
      (i) => this.isBoUnicode(i),
      start, 
      end, 
      yesValue, 
      noValue
    );
  }

  /**
   * Chunk text into punctuation vs non-punctuation
   */
  public chunkPunctuation(
    start = 0,
    end = this.bs.length,
    yesValue = ChunkMarkers.PUNCT,
    noValue = ChunkMarkers.NON_PUNCT
  ): Array<[ChunkMarkers, number, number]> {
    return this.chunkUsing(
      (i) => this.isPunctuation(i),
      start,
      end,
      yesValue,
      noValue
    );
  }

  /**
   * Chunk text into numbers vs non-numbers
   */
  public chunkNumbers(
    start = 0,
    end = this.bs.length,
    yesValue = ChunkMarkers.NUM,
    noValue = ChunkMarkers.NON_NUM
  ): Array<[ChunkMarkers, number, number]> {
    return this.chunkUsing(
      (i) => this.isNumber(i),
      start,
      end,
      yesValue,
      noValue
    );
  }

  /**
   * Chunk text into symbols vs non-symbols
   */
  public chunkSymbols(
    start = 0,
    end = this.bs.length,
    yesValue = ChunkMarkers.SYM,
    noValue = ChunkMarkers.NON_SYM
  ): Array<[ChunkMarkers, number, number]> {
    return this.chunkUsing(
      (i) => this.isSymbol(i),
      start,
      end,
      yesValue,
      noValue
    );
  }

  /**
   * Chunk text into Latin vs non-Latin
   */
  public chunkLatin(
    start = 0,
    end = this.bs.length,
    yesValue = ChunkMarkers.LATIN,
    noValue = ChunkMarkers.OTHER
  ): Array<[ChunkMarkers, number, number]> {
    return this.chunkUsing(
      (i) => this.isLatin(i),
      start,
      end,
      yesValue,
      noValue
    );
  }

  /**
   * Chunk text into CJK vs non-CJK
   */
  public chunkCjk(
    start = 0,
    end = this.bs.length,
    yesValue = ChunkMarkers.CJK,
    noValue = ChunkMarkers.OTHER
  ): Array<[ChunkMarkers, number, number]> {
    return this.chunkUsing(
      (i) => this.isCjk(i),
      start,
      end,
      yesValue,
      noValue
    );
  }

  /**
   * Split text into syllables (tsek-separated units)
   */
  public syllabify(
    start = 0,
    end = this.bs.length,
    yesValue = ChunkMarkers.TEXT
  ): Array<[ChunkMarkers, number, number]> {
    const indices = this.chunk(start, end, (i) => this.isTsekOrLongSkrtVowel(i));
    
    // Merge adjacent non-tsek chunks
    for (let i = 0; i < indices.length; i++) {
      if (indices[i][0] && i > 0 && !indices[i - 1][0]) {
        indices[i - 1] = [
          indices[i - 1][0],
          indices[i - 1][1],
          indices[i - 1][2] + indices[i][2]
        ];
      }
    }

    return indices
      .filter(chunk => !chunk[0])
      .map(chunk => [yesValue, chunk[1], chunk[2]] as [ChunkMarkers, number, number]);
  }

  // Character type test methods
  
  private isBoUnicode(charIndex: number): boolean {
    const charType = this.bs.getCharType(charIndex);
    return charType !== undefined && 
           charType !== CharMarkers.OTHER &&
           charType !== CharMarkers.LATIN &&
           charType !== CharMarkers.CJK;
  }

  private isPunctuation(charIndex: number): boolean {
    const charType = this.bs.getCharType(charIndex);
    
    // Check for special case: space after certain punctuation
    if (charIndex > 0 && 
        (this.bs.getCharType(charIndex - 1) === CharMarkers.SYMBOL ||
         this.bs.getCharType(charIndex - 1) === CharMarkers.NUMERAL ||
         this.bs.getCharType(charIndex - 1) === CharMarkers.OTHER ||
         this.bs.getCharType(charIndex - 1) === CharMarkers.NORMAL_PUNCT ||
         this.bs.getCharType(charIndex - 1) === CharMarkers.SPECIAL_PUNCT ||
         this.bs.getCharType(charIndex - 1) === CharMarkers.TSEK ||
         this.bs.getCharType(charIndex - 1) === CharMarkers.TRANSPARENT) &&
        (charType === CharMarkers.TSEK || charType === CharMarkers.TRANSPARENT ||
         charType === CharMarkers.NORMAL_PUNCT)) {
      return true;
    }

    return charType === CharMarkers.NORMAL_PUNCT ||
           charType === CharMarkers.SPECIAL_PUNCT ||
           charType === CharMarkers.TRANSPARENT;
  }

  private isNumber(charIndex: number): boolean {
    const charType = this.bs.getCharType(charIndex);
    return charType === CharMarkers.NUMERAL || 
           charType === CharMarkers.TRANSPARENT;
  }

  private isSymbol(charIndex: number): boolean {
    const charType = this.bs.getCharType(charIndex);
    return charType === CharMarkers.SYMBOL ||
           charType === CharMarkers.TRANSPARENT ||
           charType === CharMarkers.NFC;
  }

  private isLatin(charIndex: number): boolean {
    const charType = this.bs.getCharType(charIndex);
    return charType === CharMarkers.LATIN ||
           charType === CharMarkers.TRANSPARENT;
  }

  private isCjk(charIndex: number): boolean {
    const charType = this.bs.getCharType(charIndex);
    return charType === CharMarkers.CJK ||
           charType === CharMarkers.TRANSPARENT;
  }

  private isTsekOrLongSkrtVowel(charIndex: number): boolean {
    const charType = this.bs.getCharType(charIndex);
    const char = this.bs.charAt(charIndex);
    
    return charType === CharMarkers.TSEK || 
           char === 'ཿ' ||  // Sanskrit long vowel mark
           char === 'ཱ';    // Another Sanskrit vowel mark
  }

  /**
   * Get readable representation of chunks
   */
  public getReadable(chunks: Array<[ChunkMarkers, number, number]>): Array<[string, string]> {
    const chunkNames: Record<ChunkMarkers, string> = {
      [ChunkMarkers.TEXT]: 'TEXT',
      [ChunkMarkers.PUNCT]: 'punct',
      [ChunkMarkers.NON_BO]: 'non-bo',
      [ChunkMarkers.NON_PUNCT]: 'non-punct',
      [ChunkMarkers.NUM]: 'num',
      [ChunkMarkers.NON_NUM]: 'non-num',
      [ChunkMarkers.SYM]: 'sym',
      [ChunkMarkers.NON_SYM]: 'non-sym',
      [ChunkMarkers.BO]: 'bo',
      [ChunkMarkers.OTHER]: 'other',
      [ChunkMarkers.LATIN]: 'latin',
      [ChunkMarkers.CJK]: 'cjk'
    };

    return chunks.map(([type, start, length]) => [
      chunkNames[type] || 'unknown',
      this.bs.substring(start, start + length)
    ]);
  }

  /**
   * Get chunked content with metadata
   */
  public getChunked(chunks: Array<[ChunkMarkers, number, number]>): TextChunk[] {
    return chunks.map(([type, start, length]) => ({
      type,
      start,
      length,
      content: this.bs.substring(start, start + length)
    }));
  }

  /**
   * Get markers (type, start, content) for chunks
   */
  public getMarkers(chunks: Array<[ChunkMarkers, number, number]>): Array<[string, number, string]> {
    const readable = this.getReadable(chunks);
    return readable.map(([type, content], i) => [
      type,
      chunks[i][1], // start position
      content
    ]);
  }

  /**
   * Pipe multiple chunking operations
   */
  public pipeChunk(
    chunks: Array<[ChunkMarkers, number, number]>,
    chunkFn: (start: number, end: number, yesValue: ChunkMarkers, noValue: ChunkMarkers) => Array<[ChunkMarkers, number, number]>,
    toChunkMarker: ChunkMarkers,
    yesValue: ChunkMarkers
  ): Array<[ChunkMarkers, number, number]> {
    const result: Array<[ChunkMarkers, number, number]> = [];
    
    for (const [type, start, length] of chunks) {
      if (type === toChunkMarker) {
        // Apply chunking function to this segment
        const subChunks = chunkFn(start, start + length, yesValue, type);
        result.push(...subChunks);
      } else {
        // Keep chunk as-is
        result.push([type, start, length]);
      }
    }
    
    return result;
  }

  /**
   * Serve syllables to trie for tokenization
   * This method prepares chunks for the tokenization engine
   */
  public serveSylsToTrie(): void {
    // First, chunk the text into different types
    const boChunks = this.chunkBoText();
    const allChunks: Array<[number[] | null, [ChunkMarkers, number, number]]> = [];
    
    for (const [type, start, length] of boChunks) {
      if (type === ChunkMarkers.BO) {
        // For Tibetan text, further chunk into syllables
        const syllables = this.syllabify(start, start + length);
        for (const syl of syllables) {
          allChunks.push([
            syl,
            [ChunkMarkers.TEXT, start, length] // This is simplified
          ]);
        }
      } else {
        // Non-Tibetan chunks
        allChunks.push([
          null,
          [type, start, length]
        ]);
      }
    }
    
    this.chunks = allChunks;
  }

  /**
   * Get character type at position
   */
  public getCharType(position: number): CharMarkers {
    return this.bs.getCharType(position) || CharMarkers.OTHER;
  }
}