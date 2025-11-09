#!/usr/bin/env python3
"""
Safe, targeted fixes for remaining TypeScript errors
"""

import re
from pathlib import Path

def safe_fixes(content, filepath):
    """Apply safe, targeted fixes"""
    original = content

    # 1. Fix unused _variable declarations - remove the line
    lines = content.split('\n')
    new_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        # Check if this is an unused _variable declaration
        if re.match(r'\s*const _\w+ = ', line):
            # Check if next line is blank, skip both
            if i + 1 < len(lines) and lines[i + 1].strip() == '':
                i += 2
                continue
        new_lines.append(line)
        i += 1
    content = '\n'.join(new_lines)

    # 2. Fix index signature access - property.name -> property['name']
    # But only for specific known problematic properties
    problematic_props = ['cpu', 'memory', 'sessionId', 'userId', 'tenantId', 'className', 'id', 'payload', 'source', 'timestamp']
    for prop in problematic_props:
        content = re.sub(rf'\.metadata\.{prop}\b', rf".metadata['{prop}']", content)
        content = re.sub(rf'\.data\.{prop}\b', rf".data['{prop}']", content)
        content = re.sub(rf'\.props\.{prop}\b', rf".props['{prop}']", content)

    # 3. Fix null arguments in function calls - add ! assertion
    # Pattern: func(array.find(...)) -> func(array.find(...)!)
    # But be very specific to avoid breaking things
    content = re.sub(r'chart\.selectDataPoint\(mockData\.find\(([^)]+)\)\)', r'chart.selectDataPoint(mockData.find(\1)!)', content)
    content = re.sub(r'chart\.hoverDataPoint\(mockData\.find\(([^)]+)\)\)', r'chart.hoverDataPoint(mockData.find(\1)!)', content)

    # 4. Fix type conversions with 'as unknown as' pattern
    # vdom as { props: { x } } -> vdom as unknown as { props: { x } }
    content = re.sub(
        r'(\w+)\s+as\s+\{\s*props:\s*\{',
        r'\1 as unknown as { props: {',
        content
    )

    # 5. Fix cell.payload is unknown - add type assertion
    content = re.sub(r'cell\.payload\.(\w+)', r'(cell.payload as any).\1', content)
    content = re.sub(r'request\.payload\.(\w+)', r'(request.payload as any).\1', content)
    content = re.sub(r'msg1?\.payload\.(\w+)', r'(msg1.payload as any).\1', content)
    content = re.sub(r'msg2\.payload\.(\w+)', r'(msg2.payload as any).\1', content)

    # 6. Fix array access potentially undefined
    # But more carefully than before - only for specific test patterns
    content = re.sub(r'sliceAngles\[(\d+)\]\.', r'sliceAngles[\1]?.', content)

    return content

def process_file(filepath):
    """Process a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original = content
        content = safe_fixes(content, filepath)

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

    # Process all test files
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
