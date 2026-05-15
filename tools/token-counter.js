#!/usr/bin/env node
// Simple token counter utility using a crude approximation (byte pair/utf-8 based heuristic).
// Usage: node tools/token-counter.js file.txt

const fs = require('fs');
const path = require('path');

function approxTokens(text) {
  // Heuristic: average token length ~4 chars (approx for English). We'll refine by counting subwords.
  // Better approach: use tiktoken or official tokenizer for the model, but keep no native deps.
  if (!text) return 0;
  const len = text.length;
  return Math.max(1, Math.round(len / 4));
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: token-counter <file-or-string>');
    process.exit(2);
  }
  const input = args.join(' ');
  let text = '';
  if (fs.existsSync(input) && fs.statSync(input).isFile()) {
    text = fs.readFileSync(input, 'utf8');
  } else {
    text = input;
  }
  const tokens = approxTokens(text);
  console.log(JSON.stringify({ tokens, chars: text.length }, null, 2));
}

if (require.main === module) main();
