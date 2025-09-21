/**
 * Token - Represents a tokenized unit of Tibetan text
 * Ported from botok/tokenizers/token.py
 */

import { Token as IToken, SenseInfo, AffixationInfo } from '../types';
import { TSEK, AA } from '../utils/constants';

/**
 * Token class representing a tokenized unit with metadata
 */
export class Token implements IToken {
  public text: string = '';
  public textCleaned?: string;
  public textUnaffixed?: string;
  public pos?: string;
  public lemma?: string;
  public freq?: number;
  public start: number = 0;
  public length: number = 0;
  public charTypes?: string[];
  public chunkType: string = '';
  public syllables?: string[];
  public syllableIndices?: number[][];
  public syllableStartEnd?: Array<{ start: number; end: number }>;
  public senses?: SenseInfo[];
  public sanskrit?: boolean;
  public affix?: boolean;
  public affixHost?: boolean;
  public affixation?: AffixationInfo;

  constructor(data?: Partial<IToken>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  /**
   * Set property value using dictionary-style access
   */
  public set(key: string, value: any): void {
    (this as any)[key] = value;
  }

  /**
   * Get property value using dictionary-style access
   */
  public get(key: string): any {
    return (this as any)[key];
  }

  /**
   * Dictionary-style property access
   */
  [key: string]: any;

  /**
   * Get content (alias for text)
   */
  public get content(): string {
    return this.text;
  }

  /**
   * Get length (alias for length property)
   */
  public get len(): number {
    return this.length;
  }

  /**
   * Get syllable representation
   */
  public get syls(): string[][] | string {
    if (this.sylsIdx && this.text) {
      return this.sylsIdx.map(syl => 
        syl.map(i => this.text[i])
      );
    }
    return '';
  }

  public set syls(value: string[] | undefined) {
    this.syllables = value;
  }

  /**
   * Get syllable indices
   */
  public get sylsIdx(): number[][] | undefined {
    return this.syllableIndices;
  }

  public set sylsIdx(value: number[][] | undefined) {
    this.syllableIndices = value;
  }

  /**
   * Get syllable start/end positions
   */
  public get sylsStartEnd(): Array<{ start: number; end: number }> | undefined {
    return this.syllableStartEnd;
  }

  public set sylsStartEnd(value: Array<{ start: number; end: number }> | undefined) {
    this.syllableStartEnd = value;
  }

  /**
   * Get whether this is Sanskrit
   */
  public get skrt(): boolean {
    return this.sanskrit || false;
  }

  public set skrt(value: boolean) {
    this.sanskrit = value;
  }

  /**
   * Get tag (alias for pos)
   */
  public get tag(): string | undefined {
    return this.pos;
  }

  public set tag(value: string | undefined) {
    this.pos = value;
  }

  /**
   * Get token type (alias for chunkType)
   */
  public get type(): string {
    return this.chunkType;
  }

  public set type(value: string) {
    this.chunkType = value;
  }

  /**
   * Check if token has POS information
   */
  public hasPos(): boolean {
    return !!(this.pos && this.pos !== 'NO_POS' && this.pos !== 'NON_WORD');
  }

  /**
   * Check if token is a word (has text type)
   */
  public isWord(): boolean {
    return this.chunkType === 'TEXT';
  }

  /**
   * Check if token is punctuation
   */
  public isPunctuation(): boolean {
    return this.chunkType === 'PUNCT' || this.pos === 'PUNCT';
  }

  /**
   * Check if token is non-Tibetan
   */
  public isNonTibetan(): boolean {
    return this.chunkType === 'NON_BO';
  }

  /**
   * Check if token is numeric
   */
  public isNumeric(): boolean {
    return this.chunkType === 'NUM';
  }

  /**
   * Get clean text without multiple spaces/tseks
   */
  public getCleanText(): string {
    if (this.textCleaned) {
      return this.textCleaned;
    }

    // Basic cleanup
    let cleaned = this.text
      .replace(/\s+/g, ' ')  // Multiple spaces to single
      .replace(/་+/g, '་')   // Multiple tseks to single
      .trim();

    return cleaned;
  }

  /**
   * Get unaffixed form (root form)
   */
  public getUnaffixedText(): string {
    if (this.textUnaffixed) {
      return this.textUnaffixed;
    }

    // If no unaffixed form, return cleaned text
    return this.getCleanText();
  }

  /**
   * Get lemma form
   */
  public getLemma(): string | undefined {
    if (this.lemma) {
      return this.lemma;
    }

    // Try to get lemma from senses
    if (this.senses && this.senses.length > 0) {
      for (const sense of this.senses) {
        if (sense.lemma) {
          return sense.lemma;
        }
      }
    }

    return undefined;
  }

  /**
   * Get frequency information
   */
  public getFrequency(): number | undefined {
    if (this.freq !== undefined) {
      return this.freq;
    }

    // Try to get frequency from senses
    if (this.senses && this.senses.length > 0) {
      for (const sense of this.senses) {
        if (sense.freq !== undefined) {
          return sense.freq;
        }
      }
    }

    return undefined;
  }

  /**
   * Get all POS tags
   */
  public getAllPos(): string[] {
    const poses: string[] = [];
    
    if (this.pos) {
      poses.push(this.pos);
    }

    if (this.senses) {
      for (const sense of this.senses) {
        if (sense.pos && !poses.includes(sense.pos)) {
          poses.push(sense.pos);
        }
      }
    }

    return poses;
  }

  /**
   * Check if token matches a POS tag
   */
  public matchesPos(posTag: string): boolean {
    return this.getAllPos().includes(posTag);
  }

  /**
   * Convert to string representation
   */
  public toString(): string {
    const parts: string[] = [];
    
    parts.push(`text: "${this.text}"`);
    
    if (this.textCleaned && this.textCleaned !== this.text) {
      parts.push(`text_cleaned: "${this.textCleaned}"`);
    }
    
    if (this.textUnaffixed && this.textUnaffixed !== this.text) {
      parts.push(`text_unaffixed: "${this.textUnaffixed}"`);
    }
    
    if (this.syllables && this.syllables.length > 0) {
      parts.push(`syls: [${this.syllables.map(s => `"${s}"`).join(', ')}]`);
    }
    
    if (this.pos) {
      parts.push(`pos: ${this.pos}`);
    }
    
    if (this.lemma) {
      parts.push(`lemma: ${this.lemma}`);
    }
    
    if (this.senses && this.senses.length > 0) {
      const senseStr = this.senses.map(s => {
        const senseInfo: string[] = [];
        if (s.pos) senseInfo.push(`pos: ${s.pos}`);
        if (s.freq !== undefined) senseInfo.push(`freq: ${s.freq}`);
        if (s.lemma) senseInfo.push(`lemma: ${s.lemma}`);
        if (s.sense) senseInfo.push(`sense: ${s.sense}`);
        if (s.affixed !== undefined) senseInfo.push(`affixed: ${s.affixed}`);
        return senseInfo.join(', ');
      }).join(' | ');
      parts.push(`senses: | ${senseStr} |`);
    }
    
    if (this.charTypes && this.charTypes.length > 0) {
      parts.push(`char_types: |${this.charTypes.join('|')}|`);
    }
    
    parts.push(`chunk_type: ${this.chunkType}`);
    
    if (this.freq !== undefined) {
      parts.push(`freq: ${this.freq}`);
    }
    
    if (this.affixHost) {
      parts.push(`affix_host: ${this.affixHost}`);
    }
    
    if (this.syllableIndices && this.syllableIndices.length > 0) {
      const idxStr = this.syllableIndices.map(idx => `[${idx.join(', ')}]`).join(', ');
      parts.push(`syls_idx: [${idxStr}]`);
    }
    
    if (this.syllableStartEnd && this.syllableStartEnd.length > 0) {
      const seStr = this.syllableStartEnd.map(se => `{'start': ${se.start}, 'end': ${se.end}}`).join(', ');
      parts.push(`syls_start_end: [${seStr}]`);
    }
    
    parts.push(`start: ${this.start}`);
    parts.push(`len: ${this.length}`);
    
    return parts.join('\n');
  }

  /**
   * Convert to JSON representation
   */
  public toJSON(): Record<string, any> {
    const json: Record<string, any> = {
      text: this.text,
      start: this.start,
      length: this.length,
      chunkType: this.chunkType
    };

    // Add optional properties
    if (this.textCleaned) json.textCleaned = this.textCleaned;
    if (this.textUnaffixed) json.textUnaffixed = this.textUnaffixed;
    if (this.pos) json.pos = this.pos;
    if (this.lemma) json.lemma = this.lemma;
    if (this.freq !== undefined) json.freq = this.freq;
    if (this.charTypes) json.charTypes = this.charTypes;
    if (this.syllables) json.syllables = this.syllables;
    if (this.syllableIndices) json.syllableIndices = this.syllableIndices;
    if (this.syllableStartEnd) json.syllableStartEnd = this.syllableStartEnd;
    if (this.senses) json.senses = this.senses;
    if (this.sanskrit) json.sanskrit = this.sanskrit;
    if (this.affix) json.affix = this.affix;
    if (this.affixHost) json.affixHost = this.affixHost;
    if (this.affixation) json.affixation = this.affixation;

    return json;
  }

  /**
   * Create Token from JSON
   */
  public static fromJSON(json: Record<string, any>): Token {
    return new Token(json as Partial<IToken>);
  }

  /**
   * Clone the token
   */
  public clone(): Token {
    return Token.fromJSON(this.toJSON());
  }
}