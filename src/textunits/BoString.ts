/**
 * BoString - Tibetan text character classification
 * Ported from botok/textunits/bostring.py
 */

import { CharMarkers } from '../types';
import { TIBETAN_RANGE, SANSKRIT_RANGES } from '../utils/constants';

/**
 * Character classification for Tibetan text processing
 * Provides the foundational building block for text analysis
 */
export class BoString {
  public readonly text: string;
  public readonly length: number;
  public readonly baseStructure: CharMarkers[];
  public readonly charMarkers: Record<number, string>;
  private readonly ignoreChars: Set<string>;

  constructor(text: string, ignoreChars: string[] = []) {
    this.text = text;
    this.length = text.length;
    this.ignoreChars = new Set(ignoreChars);
    this.baseStructure = new Array(this.length);
    this.charMarkers = this.createCharMarkers();
    
    this.classifyCharacters();
  }

  /**
   * Create human-readable character type markers
   */
  private createCharMarkers(): Record<number, string> {
    return {
      [CharMarkers.CONS]: 'cons',
      [CharMarkers.SUB_CONS]: 'sub-cons',
      [CharMarkers.VOW]: 'vow',
      [CharMarkers.TSEK]: 'tsek',
      [CharMarkers.NORMAL_PUNCT]: 'punct',
      [CharMarkers.SPECIAL_PUNCT]: 'punct',
      [CharMarkers.NUMERAL]: 'num',
      [CharMarkers.SYMBOL]: 'sym',
      [CharMarkers.IN_SYL_MARK]: 'mark',
      [CharMarkers.NON_BO_NON_SKRT]: 'other',
      [CharMarkers.SKRT_CONS]: 'skrt-cons',
      [CharMarkers.SKRT_SUB_CONS]: 'skrt-sub-cons',
      [CharMarkers.SKRT_VOW]: 'skrt-vow',
      [CharMarkers.TRANSPARENT]: 'space',
      [CharMarkers.LATIN]: 'latin',
      [CharMarkers.CJK]: 'cjk',
      [CharMarkers.OTHER]: 'other',
      [CharMarkers.NFC]: 'nfc'
    };
  }

  /**
   * Classify all characters in the text
   */
  private classifyCharacters(): void {
    for (let i = 0; i < this.length; i++) {
      const char = this.text[i];
      const codePoint = char.codePointAt(0)!;
      
      if (this.ignoreChars.has(char)) {
        this.baseStructure[i] = CharMarkers.TRANSPARENT;
        continue;
      }

      this.baseStructure[i] = this.classifyCharacter(char, codePoint);
    }
  }

  /**
   * Classify a single character
   */
  private classifyCharacter(char: string, codePoint: number): CharMarkers {
    // Tibetan Unicode block (0x0F00 - 0x0FFF)
    if (codePoint >= TIBETAN_RANGE.start && codePoint <= TIBETAN_RANGE.end) {
      return this.classifyTibetanCharacter(char, codePoint);
    }

    // Sanskrit characters
    for (const range of SANSKRIT_RANGES) {
      if (codePoint >= range.start && codePoint <= range.end) {
        return this.classifySanskritCharacter(char, codePoint);
      }
    }

    // Latin characters
    if ((codePoint >= 0x0041 && codePoint <= 0x005A) ||  // A-Z
        (codePoint >= 0x0061 && codePoint <= 0x007A)) {  // a-z
      return CharMarkers.LATIN;
    }

    // CJK characters
    if ((codePoint >= 0x4E00 && codePoint <= 0x9FFF) ||  // CJK Unified Ideographs
        (codePoint >= 0x3400 && codePoint <= 0x4DBF)) {  // CJK Extension A
      return CharMarkers.CJK;
    }

    // Space characters
    if (char === ' ' || char === '\t' || char === '\n' || char === '\r' ||
        codePoint === 0x00A0 || // Non-breaking space
        codePoint === 0x2000 || codePoint === 0x2001 || codePoint === 0x2002 ||
        codePoint === 0x2003 || codePoint === 0x2004 || codePoint === 0x2005) {
      return CharMarkers.TRANSPARENT;
    }

    return CharMarkers.OTHER;
  }

  /**
   * Classify Tibetan Unicode characters
   */
  private classifyTibetanCharacter(char: string, codePoint: number): CharMarkers {
    // Tibetan consonants (0x0F40-0x0F6C)
    if (codePoint >= 0x0F40 && codePoint <= 0x0F6C) {
      return CharMarkers.CONS;
    }

    // Tibetan subjoined consonants (0x0F90-0x0FBC)
    if (codePoint >= 0x0F90 && codePoint <= 0x0FBC) {
      return CharMarkers.SUB_CONS;
    }

    // Tibetan vowel signs (0x0F71-0x0F84)
    if (codePoint >= 0x0F71 && codePoint <= 0x0F84) {
      return CharMarkers.VOW;
    }

    // Tsek (syllable separator)
    if (codePoint === 0x0F0B) {
      return CharMarkers.TSEK;
    }

    // Tibetan digits (0x0F20-0x0F33)
    if (codePoint >= 0x0F20 && codePoint <= 0x0F33) {
      return CharMarkers.NUMERAL;
    }

    // Tibetan punctuation
    if (codePoint === 0x0F0D || codePoint === 0x0F0E ||  // Shad marks
        codePoint === 0x0F0F || codePoint === 0x0F10 ||  // Other marks
        codePoint === 0x0F11 || codePoint === 0x0F12) {
      return CharMarkers.NORMAL_PUNCT;
    }

    // Special Tibetan punctuation
    if (codePoint >= 0x0F00 && codePoint <= 0x0F17) {
      return CharMarkers.SPECIAL_PUNCT;
    }

    // Tibetan symbols
    if (codePoint >= 0x0F1A && codePoint <= 0x0F1F) {
      return CharMarkers.SYMBOL;
    }

    // Sanskrit-related marks in Tibetan block
    if (codePoint === 0x0F7F ||  // Rnam bcad
        codePoint >= 0x0F86 && codePoint <= 0x0F8B) {
      return CharMarkers.IN_SYL_MARK;
    }

    return CharMarkers.OTHER;
  }

  /**
   * Classify Sanskrit characters
   */
  private classifySanskritCharacter(char: string, codePoint: number): CharMarkers {
    // Devanagari consonants
    if (codePoint >= 0x0915 && codePoint <= 0x0939) {
      return CharMarkers.SKRT_CONS;
    }

    // Devanagari vowels
    if (codePoint >= 0x093E && codePoint <= 0x094C) {
      return CharMarkers.SKRT_VOW;
    }

    // Devanagari subjoined consonants (conjuncts)
    if (codePoint >= 0x0958 && codePoint <= 0x095F) {
      return CharMarkers.SKRT_SUB_CONS;
    }

    return CharMarkers.OTHER;
  }

  /**
   * Export character groups for a substring
   */
  public exportGroups(start: number, length: number, forSubstring = false): Record<number, CharMarkers> {
    const groups: Record<number, CharMarkers> = {};
    const end = Math.min(start + length, this.length);
    
    for (let i = start; i < end; i++) {
      const key = forSubstring ? i - start : i;
      groups[key] = this.baseStructure[i];
    }
    
    return groups;
  }

  /**
   * Get character at index
   */
  public charAt(index: number): string {
    return this.text[index] || '';
  }

  /**
   * Get character type at index
   */
  public getCharType(index: number): CharMarkers | undefined {
    return this.baseStructure[index];
  }

  /**
   * Get substring
   */
  public substring(start: number, end?: number): string {
    return this.text.substring(start, end);
  }

  /**
   * Check if character is Tibetan
   */
  public isTibetan(index: number): boolean {
    const charType = this.baseStructure[index];
    return charType !== undefined && 
           charType !== CharMarkers.LATIN && 
           charType !== CharMarkers.CJK &&
           charType !== CharMarkers.OTHER &&
           charType !== CharMarkers.TRANSPARENT;
  }

  /**
   * Check if character is punctuation
   */
  public isPunctuation(index: number): boolean {
    const charType = this.baseStructure[index];
    return charType === CharMarkers.NORMAL_PUNCT || 
           charType === CharMarkers.SPECIAL_PUNCT;
  }

  /**
   * Check if character is Sanskrit
   */
  public isSanskrit(index: number): boolean {
    const charType = this.baseStructure[index];
    return charType === CharMarkers.SKRT_CONS ||
           charType === CharMarkers.SKRT_SUB_CONS ||
           charType === CharMarkers.SKRT_VOW;
  }

  /**
   * Get readable representation of character types
   */
  public getReadableCharTypes(): string[] {
    return this.baseStructure.map(type => this.charMarkers[type] || 'unknown');
  }

  /**
   * Debug representation
   */
  public toString(): string {
    const chars = Array.from(this.text);
    const types = this.getReadableCharTypes();
    
    return chars.map((char, i) => `'${char}':${types[i]}`).join(', ');
  }
}