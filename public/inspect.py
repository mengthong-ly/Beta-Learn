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


# --- __trace__: records a run for the Visualize tab (lib/viz/trace-events.ts turns it into steps) ---
import contextlib as _contextlib
import io as _io
import math as _math
import traceback as _traceback


class _TraceLimit(BaseException):
    """Ends a traced run at the step cap. A BaseException, so `except Exception` can't swallow it."""


_TRACE_STEPS = 500
_TRACE_ITEMS = 50
_SKIP = (_types.ModuleType, _types.FunctionType, _types.BuiltinFunctionType, _types.MethodType, type)


def _trace_repr(v):
    try:
        text = repr(v)
    except Exception:
        text = f"<{type(v).__name__}>"
    return {"repr": text if len(text) <= 80 else text[:77] + "...", "type": type(v).__name__}


def _trace_value(v, lists):
    """A value as JSON: plain for None/bool/int/float/str, {"ref"} for a list, a repr card for the rest."""
    if v is None or isinstance(v, bool):
        return v
    if isinstance(v, str):
        return v[:80]
    if isinstance(v, int):
        return v if abs(v) <= 2**53 else _trace_repr(v)
    if isinstance(v, float):
        return v if _math.isfinite(v) else _trace_repr(v)
    if type(v) is list and lists is not None:
        key = hex(id(v))
        if key not in lists:
            lists[key] = {
                # a list inside a list is a card: nested structures are out of v1
                "items": [_trace_repr(x) if type(x) is list else _trace_value(x, None) for x in v[:_TRACE_ITEMS]],
                "more": max(0, len(v) - _TRACE_ITEMS),
            }
        return {"ref": key}
    return _trace_repr(v)


def __trace__(ns, code):
    # The learner's code objects. Lambdas and generator expressions (<lambda>, <genexpr>) run
    # inside one line, so they don't get frames of their own.
    learner = set()
    todo = [code]
    while todo:
        co = todo.pop()
        if co is code or not co.co_name.startswith("<"):
            learner.add(co)
        todo.extend(c for c in co.co_consts if isinstance(c, _types.CodeType))

    snaps = []
    out = _io.StringIO()

    def record(frame, event, arg):
        if len(snaps) >= _TRACE_STEPS:
            raise _TraceLimit
        chain = []
        f = frame
        while f is not None:
            if f.f_code in learner:
                chain.append(f)
            f = f.f_back
        lists = {}
        frames = []
        for fr in reversed(chain):
            names = []
            for name, v in list(fr.f_locals.items()):
                if name.startswith("__") or isinstance(v, _SKIP):
                    continue
                names.append([name, _trace_value(v, lists)])
            frames.append({"fn": "<module>" if fr.f_code is code else fr.f_code.co_name, "vars": names})
        snap = {"line": frame.f_lineno, "event": event, "frames": frames, "lists": lists, "out": out.tell()}
        if event == "return":
            snap["ret"] = _trace_value(arg, lists)
        snaps.append(snap)

    def local(frame, event, arg):
        if event in ("line", "return", "exception"):
            record(frame, event, arg)
        return local

    def tracer(frame, event, arg):
        # 'call': the return value becomes this frame's local tracer (None: don't trace it).
        if frame.f_code not in learner:
            return None
        record(frame, event, arg)
        return local

    truncated = False
    error = None
    with _contextlib.redirect_stdout(out):
        _sys.settrace(tracer)
        try:
            exec(code, ns)
        except _TraceLimit:
            truncated = True
        except BaseException as e:
            tb = e.__traceback__
            while tb is not None and tb.tb_frame.f_code not in learner:
                tb = tb.tb_next
            error = "".join(_traceback.format_exception(type(e), e, tb))
        finally:
            _sys.settrace(None)
    return _json.dumps({"snaps": snaps, "truncated": truncated, "stdout": out.getvalue(), "error": error})
