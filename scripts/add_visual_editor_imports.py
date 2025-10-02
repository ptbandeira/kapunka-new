import os
import pathlib
import re
import sys


def ensure_import(file_path: str) -> None:
    path = pathlib.Path(file_path)
    lines = path.read_text().split('\n')

    has_attribute_usage = any('getVisualEditorAttributes' in line for line in lines)
    if not has_attribute_usage:
        return

    has_import = any(
        line.strip().startswith('import ') and 'getVisualEditorAttributes' in line
        for line in lines
    )

    if not has_import:
        rel_path = os.path.relpath('utils/stackbitBindings', path.parent).replace('\\', '/')
        if not rel_path.startswith('.'):
            rel_path = './' + rel_path
        import_line = f"import {{ getVisualEditorAttributes }} from '{rel_path}';"

        insert_index = 0
        while insert_index < len(lines) and lines[insert_index].startswith('import '):
            insert_index += 1

        lines.insert(insert_index, import_line)

    lines = normalize_import_position(lines)
    path.write_text('\n'.join(lines))


def normalize_import_position(lines: list[str]) -> list[str]:
    try:
        gvea_index = next(
            i for i, line in enumerate(lines)
            if line.strip().startswith('import ') and 'getVisualEditorAttributes' in line
        )
    except StopIteration:
        return lines

    non_type_indices = [
        i for i, line in enumerate(lines)
        if line.startswith('import ') and not line.startswith('import type ')
    ]

    if non_type_indices:
        target_index = non_type_indices[-1] + 1
        line = lines.pop(gvea_index)
        if gvea_index < target_index:
            target_index -= 1
        lines.insert(target_index, line)
        gvea_index = target_index

    try:
        block_start = next(i for i, line in enumerate(lines) if line.startswith('import type {'))
    except StopIteration:
        return lines

    block_end = block_start
    while block_end < len(lines) and not lines[block_end].strip().endswith("} from '../types';"):
        block_end += 1

    if block_start <= gvea_index <= block_end:
        line = lines.pop(gvea_index)
        lines.insert(block_start, line)

    return lines


if __name__ == '__main__':
    for file_arg in sys.argv[1:]:
        ensure_import(file_arg)
