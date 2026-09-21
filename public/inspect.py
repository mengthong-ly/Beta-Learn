# Collects what the Inspect tab shows: the bytecode Python compiled your code into,
# and every variable your code left behind (type, identity, reference count, size).
# Loaded once into Pyodide's own globals by python.worker.js and by the content checker.
import dis as _dis
import json as _json
import sys as _sys
import types as _types

_IMMUTABLE = (int, float, complex, bool, str, bytes, tuple, frozenset, range, type(None))


def __inspect__(ns, code):
    blocks = []
    queue = [(code, "<module>")]
    while queue:
        co, name = queue.pop(0)
        ops = []
        for ins in _dis.get_instructions(co):
            if ins.opname in ("CACHE", "RESUME", "NOP"):
                continue
            line = ins.positions.lineno if ins.positions else None
            ops.append([ins.offset, ins.opname, ins.argrepr, line])
        blocks.append({"name": name, "ops": ops})
        for const in co.co_consts:
            if isinstance(const, _types.CodeType):
                queue.append((const, const.co_qualname))

    variables = []
    for name in [k for k in ns if not k.startswith("__")]:
        value = ns[name]
        if isinstance(value, _types.ModuleType):
            continue
        text = repr(value)
        variables.append({
            "name": name,
            "type": type(value).__name__,
            "repr": text if len(text) <= 80 else text[:77] + "...",
            "id": hex(id(value)),
            # 3.14 borrows the local `value`, so getrefcount only adds its own argument.
            # Immortal objects (small ints, interned strings, None) report ~2**30+.
            "refs": _sys.getrefcount(value) - 1,
            "size": _sys.getsizeof(value),
            "mutable": not isinstance(value, _IMMUTABLE)
            and not callable(value),
        })
    return _json.dumps({"bytecode": blocks, "vars": variables})
