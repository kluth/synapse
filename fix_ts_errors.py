#!/usr/bin/env python3
"""
Script to fix common TypeScript errors in test files
"""

import os
import re
from pathlib import Path

def fix_push_callbacks(content):
    """Fix (param) => array.push(param) to (param) => { array.push(param); }"""
    # Pattern: (word) => word.push(word)
    pattern = r'\((\w+)\)\s*=>\s*(\w+)\.push\(\1\)'
    replacement = r'(\1) => {\n        \2.push(\1);\n      }'
    return re.sub(pattern, replacement, content)

def fix_increment_callbacks(content):
    """Fix () => count++ to () => { count++; }"""
    pattern = r'\(\)\s*=>\s*(\w+)\+\+'
    replacement = r'() => {\n        \1++;\n      }'
    return re.sub(pattern, replacement, content)

def fix_optional_access(content):
    """Fix array[0].property to array[0]?.property"""
    # This is more complex - look for specific patterns
    replacements = [
        (r'(\w+)\[0\]\.payload', r'\1[0]?.payload'),
        (r'(\w+)\[0\]\.message', r'\1[0]?.message'),
        (r'(\w+)\[0\]\.id', r'\1[0]?.id'),
        (r'(\w+)\[1\]\.payload', r'\1[1]?.payload'),
        (r'(\w+)\[1\]\.message', r'\1[1]?.message'),
    ]

    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content)

    return content

def fix_file(filepath):
    """Fix a single file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Apply fixes
    content = fix_push_callbacks(content)
    content = fix_increment_callbacks(content)

    # Only write if changed
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True

    return False

def main():
    """Main function"""
    src_dir = Path('src')
    files_fixed = 0

    # Find all test and story files
    for filepath in src_dir.rglob('*.test.ts'):
        if fix_file(filepath):
            print(f'Fixed: {filepath}')
            files_fixed += 1

    for filepath in src_dir.rglob('*.stories.ts'):
        if fix_file(filepath):
            print(f'Fixed: {filepath}')
            files_fixed += 1

    print(f'\nTotal files fixed: {files_fixed}')

if __name__ == '__main__':
    main()
