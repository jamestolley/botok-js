/**
 * BasicTrie - Basic trie data structure for dictionary lookups
 * Ported from botok/tries/basictrie.py
 */

import { TrieNodeData, SenseInfo } from '../types';

/**
 * Node in the trie structure
 */
export class TrieNode {
  public label: string;
  public children: Map<string, TrieNode>;
  public leaf: boolean;
  public data: TrieNodeData;

  constructor(label = '') {
    this.label = label;
    this.children = new Map();
    this.leaf = false;
    this.data = { _: {} };
  }

  /**
   * Add a child node
   */
  public addChild(label: string): TrieNode {
    if (!this.children.has(label)) {
      this.children.set(label, new TrieNode(label));
    }
    return this.children.get(label)!;
  }

  /**
   * Check if this node marks the end of a word
   */
  public isMatch(): boolean {
    return this.leaf;
  }

  /**
   * Get child node by label
   */
  public getChild(label: string): TrieNode | null {
    return this.children.get(label) || null;
  }

  /**
   * Access child using array notation
   */
  public get(key: string): TrieNode | null {
    return this.children.get(key) || null;
  }
}

/**
 * Basic Trie implementation for word storage and lookup
 */
export class BasicTrie {
  public head: TrieNode;

  constructor() {
    this.head = new TrieNode();
  }

  /**
   * Add a word to the trie
   */
  public add(word: string[] | string, data?: Record<string, any>): void {
    const wordArray = Array.isArray(word) ? word : [word];
    let currentNode = this.head;
    let wordFinished = true;

    // Navigate through existing nodes
    let i = 0;
    for (i = 0; i < wordArray.length; i++) {
      const syllable = wordArray[i];
      if (currentNode.children.has(syllable)) {
        currentNode = currentNode.children.get(syllable)!;
      } else {
        wordFinished = false;
        break;
      }
    }

    // Add remaining syllables
    if (!wordFinished) {
      while (i < wordArray.length) {
        const syllable = wordArray[i];
        currentNode = currentNode.addChild(syllable);
        i++;
      }
    }

    // Mark as word end
    currentNode.leaf = true;

    // Add data to the node
    if (data) {
      this.updateNodeData(currentNode, data);
    } else {
      // Initialize empty senses array if no data provided
      if (!currentNode.data.senses) {
        currentNode.data.senses = [];
      }
    }
  }

  /**
   * Update node data
   */
  private updateNodeData(node: TrieNode, data: Record<string, any>): void {
    if (typeof data === 'object' && data !== null) {
      // Initialize senses array if it doesn't exist
      if (!node.data.senses) {
        node.data.senses = [];
      }
      
      // If data has pos, freq, etc. directly, treat it as a single sense
      if (data.pos || data.lemma || data.freq || data.sense) {
        this.addMeaning(node.data.senses, data as SenseInfo);
      }
      
      // Merge other data objects
      for (const [key, value] of Object.entries(data)) {
        if (key === 'senses' && Array.isArray(value)) {
          // Handle senses array
          for (const sense of value) {
            this.addMeaning(node.data.senses, sense);
          }
        } else if (key !== 'pos' && key !== 'lemma' && key !== 'freq' && key !== 'sense' && key !== 'affixed') {
          // Add non-sense attributes directly to node data
          (node.data as any)[key] = value;
        }
      }
    }
  }

  /**
   * Walk one step through the trie
   */
  public walk(char: string, currentNode?: TrieNode): TrieNode | null {
    if (!currentNode) {
      currentNode = this.head;
    }

    return currentNode.getChild(char);
  }

  /**
   * Check if a word exists in the trie
   */
  public hasWord(word: string[] | string): { exists: boolean; data: TrieNodeData } {
    if (!word || (Array.isArray(word) && word.length === 0)) {
      throw new Error('Word must be non-empty');
    }

    const wordArray = Array.isArray(word) ? word : [word];
    let currentNode = this.head;
    let exists = true;

    // Navigate through the word
    for (const syllable of wordArray) {
      const child = currentNode.getChild(syllable);
      if (child) {
        currentNode = child;
      } else {
        exists = false;
        break;
      }
    }

    // Check if we reached a complete word
    if (exists && !currentNode.leaf) {
      exists = false;
    }

    return {
      exists,
      data: currentNode.data
    };
  }

  /**
   * Add data to an existing word
   */
  public addData(word: string[] | string, data: any): boolean {
    if (!word || (Array.isArray(word) && word.length === 0)) {
      throw new Error('Word must be non-empty');
    }

    const wordArray = Array.isArray(word) ? word : [word];
    let currentNode = this.head;

    // Navigate to the word
    for (const syllable of wordArray) {
      const child = currentNode.getChild(syllable);
      if (child) {
        currentNode = child;
      } else {
        return false; // Word doesn't exist
      }
    }

    // Check if it's a complete word
    if (!currentNode.leaf) {
      return false;
    }

    // Add data
    if (typeof data === 'number') {
      currentNode.data.formFreq = data;
      return true;
    } else if (typeof data === 'object' && data !== null) {
      if (!currentNode.data.senses) {
        currentNode.data.senses = [];
      }
      return this.addMeaning(currentNode.data.senses, data);
    }

    return false;
  }

  /**
   * Add meaning to senses array
   */
  public addMeaning(senses: SenseInfo[], meaning: SenseInfo): boolean {
    // Check if this meaning already exists
    const exists = senses.some(sense => this.isDiffMeaning(sense, meaning));
    
    if (!exists) {
      senses.push(meaning);
      return true;
    }
    
    return false;
  }

  /**
   * Check if two meanings are different
   */
  private isDiffMeaning(m1: SenseInfo, m2: SenseInfo): boolean {
    // Compare key attributes
    return m1.pos === m2.pos &&
           m1.lemma === m2.lemma &&
           m1.freq === m2.freq &&
           m1.sense === m2.sense &&
           m1.affixed === m2.affixed;
  }

  /**
   * Deactivate/reactivate a word
   */
  public deactivate(word: string[] | string, reverse = false): boolean {
    if (!word || (Array.isArray(word) && word.length === 0)) {
      throw new Error('Word must be non-empty');
    }

    const wordArray = Array.isArray(word) ? word : [word];
    let currentNode = this.head;

    // Navigate to the word
    for (const syllable of wordArray) {
      const child = currentNode.getChild(syllable);
      if (child) {
        currentNode = child;
      } else {
        return false; // Word doesn't exist
      }
    }

    // Toggle leaf status
    if (reverse) {
      currentNode.leaf = true;
    } else {
      currentNode.leaf = false;
    }

    return true;
  }

  /**
   * Get array notation access to head children
   */
  public get(key: string): TrieNode | null {
    return this.head.getChild(key);
  }

  /**
   * Get statistics about the trie
   */
  public getStats(): { nodeCount: number; wordCount: number } {
    let nodeCount = 0;
    let wordCount = 0;

    const traverse = (node: TrieNode): void => {
      nodeCount++;
      if (node.leaf) {
        wordCount++;
      }
      for (const child of node.children.values()) {
        traverse(child);
      }
    };

    traverse(this.head);
    return { nodeCount, wordCount };
  }

  /**
   * Clear the trie
   */
  public clear(): void {
    this.head = new TrieNode();
  }
}