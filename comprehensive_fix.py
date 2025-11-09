#!/usr/bin/env python3
"""
Comprehensive script to fix ALL TypeScript errors in test files
"""

import os
import re
from pathlib import Path

def fix_content(content, filepath):
    """Apply all fixes to content"""
    original = content

    # 1. Fix unused variables with underscore prefix - remove them
    content = re.sub(r'const _\w+ = [^;]+;\n\s*\n', '\n', content)

    # 2. Fix array[0].property -> array[0]?.property (Object possibly undefined)
    content = re.sub(r'(\w+)\[(\d+)\]\.(\w+)', r'\1[\2]?.\3', content)

    # 3. Fix function returns in callbacks: (x) => arr.push(x) -> (x) => { arr.push(x); }
    # Already done by previous script

    # 4. Fix: (x) => count++ -> (x) => { count++; }
    content = re.sub(r'\(([^)]*)\)\s*=>\s*(\w+)\+\+', r'(\1) => {\n        \2++;\n      }', content)

    # 5. Fix 'as unknown first' for type conversions
    # Pattern: ... as { props: { ... } } -> ... as unknown as { props: { ... } }
    content = re.sub(
        r"(as\s+\{\s*props:\s*\{[^}]+\}\s*;\s*\})",
        r"as unknown \1",
        content
    )

    # 6. Fix null arguments - add non-null assertion
    # Pattern: func(data[0]) where data[0] could be null
    content = re.sub(r'\.find\([^)]+\)\)', r'.find(...)!)', content)

    # 7. Fix exactOptionalPropertyTypes - remove explicit undefined
    # Pattern: color: string | undefined in object literal
    # This needs context-specific fixes

    # 8. Fix index signature access - already context-specific

    # 9. Fix 'possibly undefined' with non-null assertion for specific patterns
    # bars[1].x -> bars[1]!.x (already done above with regex)

    return content

def process_file(filepath):
    """Process a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original = content
        content = fix_content(content, filepath)

        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

    return False

def main():
    """Main function"""
    src_dir = Path('src')
    e2e_dir = Path('e2e')
    files_fixed = 0

    # Process all test files
    for directory in [src_dir, e2e_dir]:
        if directory.exists():
            for filepath in directory.rglob('*.test.ts'):
                if process_file(filepath):
                    print(f'Fixed: {filepath}')
                    files_fixed += 1

            for filepath in directory.rglob('*.spec.ts'):
                if process_file(filepath):
                    print(f'Fixed: {filepath}')
                    files_fixed += 1

            for filepath in directory.rglob('*.stories.ts'):
                if process_file(filepath):
                    print(f'Fixed: {filepath}')
                    files_fixed += 1

    print(f'\nTotal files fixed: {files_fixed}')

if __name__ == '__main__':
    main()
