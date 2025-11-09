#!/usr/bin/env python3
"""
Ultra-targeted fix for the most common remaining patterns
"""

import re
from pathlib import Path

def ultra_targeted_fixes(content):
    """Apply ultra-targeted fixes for known patterns"""

    # 1. Fix vdom.children is possibly undefined
    content = re.sub(r'vdom\.children\[', r'vdom.children?.[', content)

    # 2. Fix className index signature
    content = re.sub(r"\.props\.className\b", r".props['className']", content)

    # 3. Fix null to non-null for chart functions with ! assertion
    # More specific patterns
    content = re.sub(
        r'chart\.(selectDataPoint|hoverDataPoint|clickDataPoint)\(([^!]+)\)',
        r'chart.\1(\2!)',
        content
    )

    # 4. Fix array[index].property with optional chaining for common patterns
    # Be more targeted
    content = re.sub(r'interactions\[(\d+)\]\.', r'interactions[\1]?.', content)
    content = re.sub(r'events\[(\d+)\]\.', r'events[\1]?.', content)
    content = re.sub(r'bars\[(\d+)\]\.', r'bars[\1]?.', content)

    # 5. Fix 's' is of type unknown for signal tests
    content = re.sub(r'expect\(s\)\.toBe', r'expect(s as any).toBe', content)
    content = re.sub(r'expect\(signal\)\.toBe\(', r'expect(signal as any).toBe(', content)

    # 6. Fix chart data with null - array.find() pattern
    content = re.sub(
        r'mockData\.find\(d => d\.x === (\d+)\)\)',
        r'mockData.find(d => d.x === \1)!)',
        content
    )
    content = re.sub(
        r'mockPieData\.find\(d => d\.label === \'([^\']+)\'\)\)',
        r"mockPieData.find(d => d.label === '\1')!)",
        content
    )

    return content

def process_file(filepath):
    """Process a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original = content
        content = ultra_targeted_fixes(content)

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

    for filepath in src_dir.rglob('*.stories.ts'):
        if process_file(filepath):
            print(f'Fixed: {filepath}')
            files_fixed += 1

    print(f'\nTotal files fixed: {files_fixed}')

if __name__ == '__main__':
    main()
