#!/usr/bin/env node
/**
 * Botok-JS CLI - Command-line interface for Tibetan text tokenization
 */

import * as fs from 'fs';
import { WordTokenizer } from './tokenizers/WordTokenizer';
import { Config } from './config/Config';

const args = process.argv.slice(2);

function printUsage(): void {
  console.log('Usage: botok-js [options] <text>');
  console.log('');
  console.log('Options:');
  console.log('  -f <file>    Process input file');
  console.log('  -o <file>    Output to file');
  console.log('  -d <dialect> Use specific dialect (default: general)');
  console.log('  --json       Output as JSON');
  console.log('  --help       Show this help');
}

if (args.length === 0 || args.includes('--help')) {
  printUsage();
  process.exit(0);
}

let inputText = '';
let outputFile = '';
let dialect = 'general';
let jsonOutput = false;
let inputFile = '';

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '-f':
      inputFile = args[++i] || '';
      break;
    case '-o':
      outputFile = args[++i] || '';
      break;
    case '-d':
      dialect = args[++i] || 'general';
      break;
    case '--json':
      jsonOutput = true;
      break;
    default:
      if (!args[i].startsWith('-')) {
        inputText = args[i];
      }
  }
}

if (inputFile) {
  try {
    inputText = fs.readFileSync(inputFile, 'utf-8');
  } catch (err) {
    console.error(`Error reading file: ${inputFile}`);
    process.exit(1);
  }
}

if (!inputText) {
  console.error('Error: No input text provided');
  printUsage();
  process.exit(1);
}

const config = new Config(dialect);
const tokenizer = new WordTokenizer(config);
const tokens = tokenizer.tokenize(inputText);

if (jsonOutput) {
  const output = JSON.stringify(tokens.map(t => t.toJSON()), null, 2);
  if (outputFile) {
    fs.writeFileSync(outputFile, output);
    console.log(`Output written to ${outputFile}`);
  } else {
    console.log(output);
  }
} else {
  const lines: string[] = [];
  for (const token of tokens) {
    const pos = token.pos ? ` (${token.pos})` : '';
    const line = `${token.text}${pos}`;
    console.log(line);
    lines.push(line);
  }
  if (outputFile) {
    fs.writeFileSync(outputFile, lines.join('\n'));
    console.log(`Output written to ${outputFile}`);
  }
}
