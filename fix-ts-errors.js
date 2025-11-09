#!/usr/bin/env node
/**
 * Script to automatically fix common TypeScript errors in test files
 */

const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix 1: Wrap arrow functions that return numbers in void context
  // Pattern: (cell) => array.push(cell) -> (cell) => { array.push(cell); }
  const pushPattern = /\(([\w]+)\)\s*=>\s*([\w]+)\.push\(\1\)/g;
  const newContent = content.replace(pushPattern, (match, param, array) => {
    modified = true;
    return `(${param}) => {\n        ${array}.push(${param});\n      }`;
  });

  if (modified) {
    content = newContent;
  }

  // Fix 2: Add optional chaining for potentially undefined array access
  // Pattern: array[0].property -> array[0]?.property
  // This is more complex and needs careful handling

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
    return true;
  }

  return false;
}

// Get all test files
const testDirs = [
  'src/circulatory/__tests__',
  'src/immune/__tests__',
  'src/muscular/__tests__',
  'src/respiratory/__tests__',
  'src/skeletal/__tests__',
  'src/tools/__tests__',
  'src/visualization/__tests__',
];

let totalFixed = 0;
testDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.test.ts'));
    files.forEach(file => {
      const filePath = path.join(fullPath, file);
      if (fixFile(filePath)) {
        totalFixed++;
      }
    });
  }
});

console.log(`\nTotal files fixed: ${totalFixed}`);
