/**
 * WordTokenizer - High-level Tibetan word tokenizer
 * Ported from botok/tokenizers/wordtokenizer.py
 */

import { Token } from './Token';
import { Tokenize } from './Tokenize';
import { ChunkFramework } from '../chunks/ChunkFramework';
import { BasicTrie } from '../tries/BasicTrie';
import { Config } from '../config/Config';
import { TSEK, AA } from '../utils/constants';
import { SenseInfo } from '../types';

/**
 * Convenience class to tokenize Tibetan text
 * Provides high-level interface with preprocessing, tokenization, and post-processing
 */
export class WordTokenizer {
  private readonly config: Config;
  private readonly tokenizer: Tokenize;
  private readonly ignoreChars: Set<string>;
  private readonly partLemmas: Record<string, string>;

  constructor(config?: Config, ignoreChars?: string[]) {
    this.config = config || new Config();
    this.ignoreChars = new Set(ignoreChars || []);
    
    // Initialize trie and tokenizer
    // For now, we'll use an empty trie - this will be enhanced when we add resource loading
    this.tokenizer = new Tokenize(new BasicTrie());
    
    // Initialize particle lemmas (simplified for now)
    this.partLemmas = this.getPartLemmas();
  }

  /**
   * Main tokenization method
   * @param text - Input text to tokenize
   * @param splitAffixes - Whether to split affixed particles into separate tokens
   * @param spacesAsPunct - Whether to treat spaces as punctuation
   * @param debug - Enable debug output
   * @returns Array of Token objects
   */
  public tokenize(
    text: string,
    splitAffixes: boolean = true,
    spacesAsPunct: boolean = false,
    debug: boolean = false
  ): Token[] {
    // Preprocess text into chunks
    const preprocessed = new ChunkFramework(text, Array.from(this.ignoreChars), spacesAsPunct);
    preprocessed.serveSylsToTrie();

    // Tokenize chunks
    let tokens = this.tokenizer.tokenize(preprocessed, debug);

    // Split affixed particles if requested
    if (splitAffixes) {
      tokens = this.splitAffixed(tokens);
    }

    // Add default lemmas
    this.getDefaultLemma(tokens);

    // Choose default entries for tokens with multiple senses
    this.chooseDefaultEntry(tokens);

    // TODO: Merge pa/po/ba/bo tokens with previous ones (MergeDagdra)
    // TODO: Apply adjustments

    return tokens;
  }

  /**
   * Split affixed particles into separate tokens
   */
  private splitAffixed(tokens: Token[]): Token[] {
    // Simplified implementation - this would need more sophisticated
    // affix detection logic in a full implementation
    const result: Token[] = [];
    
    for (const token of tokens) {
      if (this.hasAffix(token)) {
        const splitTokens = this.splitTokenAffix(token);
        result.push(...splitTokens);
      } else {
        result.push(token);
      }
    }
    
    return result;
  }

  /**
   * Check if a token has affixes that should be split
   */
  private hasAffix(token: Token): boolean {
    // Simplified check for common Tibetan affixes
    if (!token.text || token.chunkType !== 'TEXT') {
      return false;
    }
    
    const text = token.text;
    const affixes = ['འི', 'ས', 'འང', 'ག', 'གི', 'གིས', 'ཀྱི', 'ཀྱིས', 'ལ', 'ར', 'རུ', 'ན', 'ནས', 'འམ', 'ཡང', 'མ'];
    
    return affixes.some(affix => text.endsWith(affix + '་') || text.endsWith(affix));
  }

  /**
   * Split a token's affix into separate tokens
   */
  private splitTokenAffix(token: Token): Token[] {
    // This is a simplified implementation
    // A full implementation would use more sophisticated parsing
    
    if (!this.hasAffix(token)) {
      return [token];
    }
    
    // For now, just return the original token
    // TODO: Implement proper affix splitting logic
    return [token];
  }

  /**
   * Add default lemmas to tokens
   */
  private getDefaultLemma(tokens: Token[]): void {
    for (const token of tokens) {
      // Skip non-words
      if (!token.textUnaffixed) {
        continue;
      }

      let lemma: string;
      
      if (token.affix && !token.affixHost) {
        // Particle/affix
        const part = token.syls ? 
          (Array.isArray(token.syls[0]) ? 
            (token.syls as string[][]).map(syl => syl.join('')).join('') : 
            (token.syls as string).toString()) : 
          token.text;
        lemma = this.partLemmas[part] || part;
        lemma += TSEK;
      } else if (!token.affix && token.affixHost) {
        // Affix host
        lemma = token.textUnaffixed;
        if (token.affixation?.aa) {
          lemma += AA;
        }
        lemma += TSEK;
      } else {
        // Regular word
        lemma = token.textUnaffixed;
        if (!lemma.endsWith(TSEK)) {
          lemma += TSEK;
        }
      }

      // Add lemma to all senses that don't have one
      if (token.senses) {
        for (const sense of token.senses) {
          if (!sense.lemma && sense.pos && sense.pos !== 'NON_WORD') {
            sense.lemma = lemma;
          }
        }
      }
      
      // If no senses, create one with the lemma
      if (!token.senses || token.senses.length === 0) {
        token.senses = [{ lemma }];
      }
    }
  }

  /**
   * Choose default entry for tokens with multiple senses
   */
  private chooseDefaultEntry(tokens: Token[]): void {
    for (const token of tokens) {
      if (token.senses && token.senses.length > 0) {
        // Categorize senses into three groups
        const affixed: SenseInfo[] = [];
        const nonAffixed: SenseInfo[] = [];
        const noAffixInfo: SenseInfo[] = [];

        for (const sense of token.senses) {
          if ('affixed' in sense) {
            if (sense.affixed) {
              affixed.push(sense);
            } else {
              nonAffixed.push(sense);
            }
          } else {
            noAffixInfo.push(sense);
          }
        }

        // Choose the best sense in order: non_affixed, no_affix_info, affixed
        let chosenSense: SenseInfo | null = null;
        
        if (nonAffixed.length > 0) {
          chosenSense = this.chooseBestSense(nonAffixed);
        } else if (noAffixInfo.length > 0) {
          chosenSense = this.chooseBestSense(noAffixInfo);
        } else if (affixed.length > 0) {
          chosenSense = this.chooseBestSense(affixed);
        }

        // Apply chosen sense attributes to token
        if (chosenSense) {
          this.applyChosenSense(token, chosenSense);
        }
      }
    }
  }

  /**
   * Choose the best sense from a list (one with most attributes)
   */
  private chooseBestSense(senses: SenseInfo[]): SenseInfo {
    return senses.sort((a, b) => Object.keys(b).length - Object.keys(a).length)[0];
  }

  /**
   * Apply chosen sense attributes to token
   */
  private applyChosenSense(token: Token, sense: SenseInfo): void {
    const attributes = ['pos', 'lemma', 'freq', 'sense'] as const;
    
    for (const attr of attributes) {
      if (attr in sense) {
        (token as any)[attr] = sense[attr];
      }
    }
  }

  /**
   * Get particle lemmas (simplified implementation)
   */
  private getPartLemmas(): Record<string, string> {
    // This would normally be loaded from a TSV file
    // For now, return a basic mapping
    return {
      'འི': 'གྱི',
      'ས': 'གྱིས',
      'འང': 'ཡང',
      'ག': 'འཕྲང',
      'གི': 'གྱི',
      'གིས': 'གྱིས',
      'ཀྱི': 'གྱི',
      'ཀྱིས': 'གྱིས',
      'ལ': 'ལ',
      'ར': 'ར',
      'རུ': 'རུ',
      'ན': 'ན',
      'ནས': 'ནས',
      'འམ': 'འམ',
      'ཡང': 'ཡང',
      'མ': 'མ'
    };
  }

  /**
   * Get the tokenizer instance for advanced usage
   */
  public getTokenizer(): Tokenize {
    return this.tokenizer;
  }

  /**
   * Get the configuration
   */
  public getConfig(): Config {
    return this.config;
  }
}