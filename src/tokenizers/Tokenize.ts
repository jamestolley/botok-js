/**
 * Tokenize - Core tokenization engine
 * Ported from botok/tokenizers/tokenize.py
 */

import { Token } from './Token';
import { BasicTrie, TrieNode } from '../tries/BasicTrie';
import { ChunkFramework } from '../chunks/ChunkFramework';
import { ChunkMarkers, WordMarkers, CharMarkers } from '../types';
import { CHUNK_VALUES, CHAR_VALUES, WORD_VALUES } from '../utils/constants';

/**
 * Main tokenization engine that walks through pre-processed text chunks
 * and matches against dictionary entries in a trie structure
 */
export class Tokenize {
  private preProcessed: ChunkFramework | null = null;
  private readonly trie: BasicTrie;

  constructor(trie: BasicTrie) {
    this.trie = trie;
  }

  /**
   * Main tokenization method
   * @param preProcessed - Pre-processed text chunks
   * @param debug - Enable debug output
   * @returns Array of Token objects
   */
  public tokenize(preProcessed: ChunkFramework, debug: boolean = false): Token[] {
    this.preProcessed = preProcessed;
    const tokens: Token[] = [];

    let cIdx = 0;
    while (cIdx < this.preProcessed.chunks.length) {
      let walker = cIdx;
      const syls: number[] = [];
      const maxMatch: number[][] = [];
      const matchData: Record<number, any> = {};
      let currentNode: TrieNode | null = null;
      let foundMaxMatch = false;

      while (true) {
        const curSyl = this.preProcessed.chunks[walker]?.[0];
        
        // CHUNK IS SYLLABLE
        if (curSyl) {
          const syl = curSyl.map(i => this.preProcessed!.text[i]).join('');
          currentNode = this.trie.walk(syl, currentNode);
          
          if (currentNode) {
            syls.push(walker);
            
            if (currentNode.isMatch()) {
              matchData[walker] = currentNode.data;
              maxMatch.push([...syls]);
              
              // Check if the match is at end of text
              if (walker + 1 === this.preProcessed.chunks.length) {
                foundMaxMatch = true;
              }
            } else {
              if (walker + 1 === this.preProcessed.chunks.length) {
                if (maxMatch.length > 0) {
                  foundMaxMatch = true;
                } else {
                  // OOV syllables are turned into independent tokens
                  this.addFoundWordOrNonWord(walker, matchData, syls, tokens);
                  cIdx += syls.length;
                  break;
                }
              }
            }
          }
          // CAN'T CONTINUE WALKING
          else {
            // max_match followed by syllable
            if (maxMatch.length > 0) {
              foundMaxMatch = true;
            } else {
              // check if syllables is NO_POS or Non-word
              if (syls.length > 0) {
                this.addFoundWordOrNonWord(walker, matchData, syls, tokens);
                if (syls.length === 1) {
                  cIdx += 1;
                }
                break;
              }
              // non-syllable are turned into independent tokens
              else {
                tokens.push(this.chunksToToken([cIdx], {}));
                cIdx += 1;
                break;
              }
            }
          }
        }
        // NON-SYLLABLE CHUNK
        else {
          if (maxMatch.length > 0) {
            foundMaxMatch = true;
          } else {
            // check if syllables is NO_POS or Non-word
            if (syls.length > 0) {
              this.addFoundWordOrNonWord(walker, matchData, syls, tokens);
              if (syls.length === 1) {
                cIdx += 1;
              }
              break;
            }
            // non-syllable are turned into independent tokens
            else {
              tokens.push(this.chunksToToken([cIdx], {}));
              cIdx += 1;
              break;
            }
          }
        }

        if (foundMaxMatch) {
          this.addFoundWordOrNonWord(
            cIdx + maxMatch[maxMatch.length - 1].length - 1,
            matchData,
            maxMatch[maxMatch.length - 1],
            tokens
          );
          cIdx += maxMatch[maxMatch.length - 1].length;
          break;
        }

        walker += 1;
      }
    }

    this.preProcessed = null;
    return tokens;
  }

  /**
   * Add a found word or mark as non-word
   */
  private addFoundWordOrNonWord(
    cIdx: number,
    matchData: Record<number, any>,
    syls: number[],
    tokens: Token[],
    hasDecremented: boolean = false
  ): number {
    // There is a match
    if (cIdx in matchData) {
      const data = matchData[cIdx];
      const ttype = (!data.senses || data.senses.every((m: any) => !m.pos)) 
        ? 'NO_POS'
        : undefined;
      tokens.push(this.chunksToToken(syls, data, ttype));
    } else if (Object.values(matchData).some(v => v)) {
      // Find non-max match
      const nonMaxIdx = Math.max(...Object.keys(matchData).map(Number));
      const nonMaxSyls: number[] = [];
      
      for (const syl of syls) {
        if (syl <= nonMaxIdx) {
          nonMaxSyls.push(syl);
        }
      }
      
      const data = matchData[nonMaxIdx];
      const ttype = (!data.senses || data.senses.every((m: any) => !m.pos)) 
        ? 'NO_POS'
        : undefined;
      tokens.push(this.chunksToToken(nonMaxSyls, data, ttype));
      cIdx = nonMaxIdx;
    } else {
      // Add first syllable as non-word
      tokens.push(this.chunksToToken([syls[0]], {}, 'NO_POS'));
      
      // Decrement chunk-idx for new attempt to find match
      if (syls.length > 1 && syls.slice(1).length > 0) {
        cIdx -= syls.slice(1).length - 1;
      }
      
      if (hasDecremented ||
          (cIdx < this.preProcessed!.chunks.length &&
           this.preProcessed!.chunks[cIdx][0] === null) ||
          syls.length > 1) {
        cIdx -= 1;
      }
    }
    
    return cIdx;
  }

  /**
   * Convert chunk syllables to Token
   */
  private chunksToToken(syls: number[], data: any, ttype?: string): Token {
    if (syls.length === 0) {
      throw new Error('syls should contain at least 1 token');
    }

    if (syls.length === 1) {
      // Single syllable chunk
      const chunkData = this.preProcessed!.chunks[syls[0]];
      const tokenSyls = [chunkData[0]];
      const tokenType = chunkData[1][0];
      // Use syllable boundaries (chunkData[0]) instead of chunk boundaries (chunkData[1])
      const tokenStart = chunkData[0]?.[1] ?? 0;
      const tokenLength = chunkData[0]?.[2] ?? 0;
      const sylStartEnd = [{
        start: chunkData[0]?.[1] ?? 0,
        end: (chunkData[0]?.[1] ?? 0) + (chunkData[0]?.[2] ?? 0)
      }];

      if (ttype) {
        if (!data.senses) {
          data.senses = [{ pos: ttype }];
        } else {
          for (const m of data.senses) {
            if (!m.pos) {
              m.pos = ttype;
            }
          }
        }
      }

      return this.createToken(tokenType, tokenStart, tokenLength, tokenSyls, sylStartEnd, data);
    } else {
      // Multi-syllable token
      const tokenSyls = syls.map(idx => this.preProcessed!.chunks[idx][0]);
      const tokenType = this.preProcessed!.chunks[syls[syls.length - 1]][1][0];
      // Use syllable boundaries for multi-syllable tokens
      const firstChunk = this.preProcessed!.chunks[syls[0]];
      const tokenStart = firstChunk[0]?.[1] ?? 0;
      let tokenLength = 0;
      const sylStartEnd: { start: number; end: number }[] = [];

      for (const i of syls) {
        const chunkData = this.preProcessed!.chunks[i];
        // Use syllable data (chunkData[0]) instead of chunk data (chunkData[1])
        if (chunkData[0]) {
          tokenLength += chunkData[0][2];
          sylStartEnd.push({
            start: chunkData[0][1],
            end: chunkData[0][1] + chunkData[0][2]
          });
        }
      }

      if (ttype) {
        if (!data.senses) {
          data.senses = [{ pos: ttype }];
        } else {
          for (const m of data.senses) {
            if (!m.pos) {
              m.pos = ttype;
            }
          }
        }
      }

      return this.createToken(tokenType, tokenStart, tokenLength, tokenSyls, sylStartEnd, data);
    }
  }

  /**
   * Create a Token object with all metadata
   */
  private createToken(
    ttype: ChunkMarkers,
    start: number,
    length: number,
    syls: (number[] | null)[],
    sylStartEnd: { start: number; end: number }[],
    data: any
  ): Token {
    const token = new Token({
      text: this.preProcessed!.text.substring(start, start + length),
      chunkType: CHUNK_VALUES[ttype] || 'TEXT',
      start,
      length
    });

    if (syls[0] !== null) {
      // Convert syllable indices to be relative to token start
      token.sylsIdx = syls
        .filter(syl => syl !== null)
        .map(syl => syl!.map(s => s - start));
      
      token.sylsStartEnd = sylStartEnd.map(({ start: s, end: e }) => ({
        start: s - start,
        end: e - start
      }));
    }

    // Get character types for the token
    const charTypes: CharMarkers[] = [];
    for (let i = 0; i < length; i++) {
      const char = this.preProcessed!.text[start + i];
      const charType = this.preProcessed!.getCharType(start + i);
      charTypes.push(charType);
    }
    token.charTypes = charTypes;

    // Copy data properties to token
    Object.assign(token, data);

    // Check if token contains Sanskrit characters
    token.skrt = this.isSanskrit(charTypes, token.text);

    return token;
  }

  /**
   * Check if text contains Sanskrit characters
   */
  private isSanskrit(charTypes: CharMarkers[], word: string): boolean {
    return this.hasSanskritChar(charTypes) || this.hasSanskritSyllable(word);
  }

  /**
   * Check if character types include Sanskrit markers
   */
  private hasSanskritChar(charTypes: CharMarkers[]): boolean {
    return charTypes.some(ct => 
      ct === CharMarkers.SKRT_VOW ||
      ct === CharMarkers.SKRT_CONS ||
      ct === CharMarkers.SKRT_SUB_CONS
    );
  }

  /**
   * Check if word contains Sanskrit syllables
   * (Simplified implementation - could be enhanced with more detailed Sanskrit detection)
   */
  private hasSanskritSyllable(word: string): boolean {
    // Sanskrit syllables often contain specific patterns
    // This is a simplified check - a full implementation would check against
    // known Sanskrit syllable patterns
    return word.includes('ཱི') || word.includes('ཱུ') || word.includes('ྲྀ');
  }

  /**
   * Debug logging helper
   */
  private static debug(debug: boolean, message: string): void {
    if (debug) {
      console.log(message);
    }
  }
}