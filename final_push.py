#!/usr/bin/env python3
"""
Final push - fix simple remaining patterns
"""

import re
from pathlib import Path

def final_fixes(content):
    """Apply final simple fixes"""

    # 1. Fix index signature for 'data' property
    content = re.sub(r"\.props\.data\b", r".props['data']", content)

    # 2. Fix 'possibly undefined' for common test patterns
    content = re.sub(r'container\.children\[(\d+)\]\.', r'container.children[\1]?.', content)

    # 3. Fix unused generic type parameters
    content = re.sub(r'<([^,>]+), TInput>', r'<\1, any>', content)

    # 4. Add non-null assertions for specific array access patterns
    content = re.sub(r'sliceAngles\[(\d+)\]([^?])', r'sliceAngles[\1]!\2', content)

    # 5. Fix Type 'number' not assignable to 'Date' - wrap in new Date()
    # This is tricky and needs context

    return content

def process_file(filepath):
    """Process a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original = content
        content = final_fixes(content)

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
    files_fixed = 0

    for filepath in src_dir.rglob('*.test.ts'):
        if process_file(filepath):
            print(f'Fixed: {filepath}')
            files_fixed += 1

    print(f'\nTotal files fixed: {files_fixed}')

if __name__ == '__main__':
    main()
