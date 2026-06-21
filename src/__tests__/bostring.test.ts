/**
 * BoString - Tibetan text character classification tests
 * Mirrors botok/tests/textunits/test_bostring.py
 */

import { BoString } from '../textunits/BoString';
import { CharMarkers } from '../types';

const boStr = 'བཀྲ་ཤིས་ ༡༢༣ tr  就到 郊外玩བདེ་ལེགས།';

describe('BoString - Character Classification', () => {
  test('should classify mixed Tibetan/non-Tibetan string correctly', () => {
    const bs = new BoString(boStr);

    // བ is a consonant
    expect(boStr[0]).toBe('བ');
    expect(bs.baseStructure[0]).toBe(CharMarkers.CONS);

    // ྲ is a subjoined consonant
    expect(boStr[2]).toBe('ྲ');
    expect(bs.baseStructure[2]).toBe(CharMarkers.SUB_CONS);

    // ་ is a tsek
    expect(boStr[3]).toBe('་');
    expect(bs.baseStructure[3]).toBe(CharMarkers.TSEK);

    // ི is a vowel
    expect(boStr[5]).toBe('ི');
    expect(bs.baseStructure[5]).toBe(CharMarkers.VOW);
  });

  test('should classify Tibetan numerals', () => {
    const bs = new BoString(boStr);
    // Find the numeral ༡ in the string
    const idx = boStr.indexOf('༡');
    expect(bs.baseStructure[idx]).toBe(CharMarkers.NUMERAL);
  });

  test('should classify Latin characters', () => {
    const bs = new BoString(boStr);
    const idx = boStr.indexOf('t');
    expect(bs.baseStructure[idx]).toBe(CharMarkers.LATIN);
  });

  test('should classify CJK characters', () => {
    const bs = new BoString(boStr);
    const idx = boStr.indexOf('就');
    expect(bs.baseStructure[idx]).toBe(CharMarkers.CJK);
  });

  test('should classify spaces as transparent', () => {
    const bs = new BoString(boStr);
    const idx = boStr.indexOf(' ');
    expect(bs.baseStructure[idx]).toBe(CharMarkers.TRANSPARENT);
  });

  test('should classify shad as punctuation', () => {
    const bs = new BoString(boStr);
    const idx = boStr.indexOf('།');
    expect(bs.isPunctuation(idx)).toBe(true);
  });
});

describe('BoString - isTibetan', () => {
  test('should identify Tibetan vs non-Tibetan characters', () => {
    const text = 'བཀྲ་ ABC ཤིས་';
    const bs = new BoString(text);

    expect(bs.isTibetan(0)).toBe(true);  // བ
    expect(bs.isTibetan(4)).toBe(false); // space
    expect(bs.isTibetan(5)).toBe(false); // A
    expect(bs.isTibetan(9)).toBe(true);  // ཤ
  });
});

describe('BoString - isPunctuation', () => {
  test('should identify punctuation characters', () => {
    const text = 'བཀྲ་ཤིས།';
    const bs = new BoString(text);
    expect(bs.isPunctuation(bs.length - 1)).toBe(true);
  });

  test('should not identify consonants as punctuation', () => {
    const text = 'བཀྲ་ཤིས།';
    const bs = new BoString(text);
    expect(bs.isPunctuation(0)).toBe(false);
  });
});

describe('BoString - isSanskrit', () => {
  test('should identify Sanskrit characters in Devanagari range', () => {
    // Devanagari consonant
    const text = 'क';
    const bs = new BoString(text);
    expect(bs.isSanskrit(0)).toBe(true);
  });
});

describe('BoString - Character type edge cases', () => {
  test('should handle empty string', () => {
    const bs = new BoString('');
    expect(bs.length).toBe(0);
    expect(bs.baseStructure.length).toBe(0);
  });

  test('should handle string with only spaces', () => {
    const bs = new BoString('   ');
    expect(bs.length).toBe(3);
    for (let i = 0; i < bs.length; i++) {
      expect(bs.baseStructure[i]).toBe(CharMarkers.TRANSPARENT);
    }
  });

  test('should handle string with only Tibetan text', () => {
    const text = 'བཀྲ་ཤིས་བདེ་ལེགས';
    const bs = new BoString(text);
    for (let i = 0; i < bs.length; i++) {
      expect(bs.isTibetan(i)).toBe(true);
    }
  });

  test('should handle special Tibetan punctuation (༆)', () => {
    const bs = new BoString('༆');
    expect(bs.baseStructure[0]).toBe(CharMarkers.SPECIAL_PUNCT);
    expect(bs.isPunctuation(0)).toBe(true);
  });

  test('should handle Tibetan symbols', () => {
    // ༝ (U+0F1D) is in the symbol range
    const bs = new BoString('༝');
    expect(bs.baseStructure[0]).toBe(CharMarkers.SYMBOL);
  });

  test('should classify all Tibetan vowel signs', () => {
    const vowels = ['ི', 'ུ', 'ེ', 'ོ'];
    for (const v of vowels) {
      const bs = new BoString(v);
      expect(bs.baseStructure[0]).toBe(CharMarkers.VOW);
    }
  });

  test('should classify subjoined consonants', () => {
    // ྱ (U+0FB1), ྲ (U+0FB2), ླ (U+0FB3)
    const subconsText = 'ྱྲླ';
    const bs = new BoString(subconsText);
    for (let i = 0; i < bs.length; i++) {
      expect(bs.baseStructure[i]).toBe(CharMarkers.SUB_CONS);
    }
  });

  test('should handle ignore characters', () => {
    const text = 'བཀྲ་ཤིས་';
    const bs = new BoString(text, ['་']);
    // Tseks should be marked as transparent when ignored
    expect(bs.baseStructure[3]).toBe(CharMarkers.TRANSPARENT);
  });

  test('getReadableCharTypes should return readable labels', () => {
    const text = 'བི་';
    const bs = new BoString(text);
    const readable = bs.getReadableCharTypes();
    expect(readable[0]).toBe('cons');
    expect(readable[1]).toBe('vow');
    expect(readable[2]).toBe('tsek');
  });

  test('toString should produce char:type pairs', () => {
    const text = 'བི';
    const bs = new BoString(text);
    const str = bs.toString();
    expect(str).toContain('བ');
    expect(str).toContain('cons');
  });
});
