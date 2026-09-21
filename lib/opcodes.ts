/** Plain-English meaning of CPython 3.14 bytecode instructions (shown on hover in the Inspect tab). */
export const OPCODES: Record<string, string> = {
  // loading & storing names
  LOAD_CONST:
    "Push a constant from the code object's constant table (numbers, strings, None…).",
  LOAD_SMALL_INT:
    "Push a small integer (0–255) straight from the instruction. No lookup needed.",
  LOAD_COMMON_CONSTANT:
    "Push a built-in constant object such as AssertionError.",
  LOAD_NAME:
    "Look a name up at module level: locals, then globals, then builtins.",
  STORE_NAME: "Bind a name at module level to the value on top of the stack.",
  LOAD_GLOBAL:
    "Read a global (or builtin like print/len) from inside a function.",
  STORE_GLOBAL:
    "Rebind a global from inside a function (the `global` statement).",
  LOAD_FAST: "Read a local variable. Locals live in a fast array, not a dict.",
  LOAD_FAST_BORROW:
    "Read a local variable without bumping its reference count (a 3.14 speed-up).",
  LOAD_FAST_LOAD_FAST: "Read two local variables in one instruction.",
  LOAD_FAST_BORROW_LOAD_FAST_BORROW:
    "Read two locals at once, without touching reference counts.",
  LOAD_FAST_AND_CLEAR:
    "Save a local (used around inlined comprehensions so they don't leak variables).",
  LOAD_FAST_CHECK:
    "Read a local that might not be assigned yet (can raise UnboundLocalError).",
  STORE_FAST: "Store into a local variable slot.",
  STORE_FAST_STORE_FAST:
    "Store two local variables in one instruction (e.g. `a, b = …`).",
  STORE_FAST_LOAD_FAST: "Store one local and immediately read another.",
  DELETE_NAME: "Remove a name binding (the `del` statement).",
  DELETE_FAST: "Remove a local variable binding (`del x` in a function).",
  LOAD_DEREF: "Read a variable from an enclosing function (a closure cell).",
  STORE_DEREF: "Write a variable in an enclosing function's cell (`nonlocal`).",
  MAKE_CELL:
    "Wrap a local in a cell so inner functions can share it (closures).",
  COPY_FREE_VARS:
    "Copy the closure cells an inner function captured into its frame.",
  LOAD_ATTR: "Get an attribute or method: `obj.name`.",
  STORE_ATTR: "Set an attribute: `obj.name = value`.",
  LOAD_SUPER_ATTR: "Resolve `super().name` along the class's MRO.",
  LOAD_LOCALS:
    "Push the current local namespace (used while building a class body).",
  LOAD_BUILD_CLASS:
    "Push the builtin that runs a class body and creates the class.",
  LOAD_SPECIAL:
    "Look up a special method such as __enter__/__exit__ for a `with` block.",

  // operators
  BINARY_OP:
    "Apply a binary operator (+ - * / // % ** [] …) by calling the operands' dunder methods.",
  COMPARE_OP: "Compare two values (<, ==, >=…) via __lt__/__eq__/….",
  IS_OP:
    "Identity test: are both names the very same object? (`is` / `is not`).",
  CONTAINS_OP: "Membership test via __contains__ (`in` / `not in`).",
  UNARY_NEGATIVE: "Negate the value on top of the stack (`-x`).",
  UNARY_NOT: "Logical not (`not x`).",
  UNARY_INVERT: "Bitwise invert (`~x`).",
  TO_BOOL: "Convert a value to True/False (its truthiness) before a branch.",
  BINARY_SLICE: "Take a slice: `seq[a:b]`.",
  STORE_SLICE: "Assign to a slice: `seq[a:b] = …`.",
  BUILD_SLICE: "Create a slice object for `seq[a:b:c]`.",
  STORE_SUBSCR: "Item assignment: `obj[key] = value` (calls __setitem__).",
  DELETE_SUBSCR: "Item deletion: `del obj[key]`.",

  // building values
  BUILD_LIST: "Create a new list from the items on the stack.",
  BUILD_TUPLE: "Create a new tuple from the items on the stack.",
  BUILD_SET: "Create a new set from the items on the stack.",
  BUILD_MAP: "Create a new dict from key/value pairs on the stack.",
  BUILD_STRING: "Join the pieces of an f-string into one string.",
  LIST_APPEND: "Append to the list being built (list comprehensions).",
  LIST_EXTEND:
    "Extend a list with an iterable (literals like [1, 2, 3], or [*a]).",
  SET_ADD: "Add to the set being built (set comprehensions).",
  SET_UPDATE: "Add many items to a set being built.",
  MAP_ADD: "Add a key/value to the dict being built (dict comprehensions).",
  DICT_UPDATE: "Merge a mapping into a dict being built (`{**a}`).",
  DICT_MERGE: "Merge keyword arguments (`f(**kw)`).",
  FORMAT_SIMPLE:
    "Format a value for an f-string with no format spec (calls format()).",
  FORMAT_WITH_SPEC: "Format a value for an f-string using a spec like `:.2f`.",
  CONVERT_VALUE: "Apply !r / !s / !a inside an f-string.",
  UNPACK_SEQUENCE: "Unpack an iterable into N values (`a, b = pair`).",
  UNPACK_EX: "Unpack with a starred target (`first, *rest = items`).",

  // calls & functions
  PUSH_NULL:
    "Push a placeholder that CALL uses to tell functions from bound methods.",
  CALL: "Call a function or method with the arguments on the stack.",
  CALL_KW: "Call with keyword arguments.",
  CALL_FUNCTION_EX: "Call with *args / **kwargs unpacking.",
  CALL_INTRINSIC_1:
    "Run an internal helper (e.g. print for the REPL, unary +, import *).",
  CALL_INTRINSIC_2: "Run an internal two-argument helper.",
  MAKE_FUNCTION:
    "Create a function object from compiled code (runs when `def` executes).",
  SET_FUNCTION_ATTRIBUTE:
    "Attach defaults, annotations or closure cells to a new function.",
  RETURN_VALUE:
    "Return the top of the stack to the caller and discard this frame.",
  RETURN_CONST: "Return a constant (often None) to the caller.",

  // control flow
  POP_TOP:
    "Throw away the value on top of the stack (e.g. print()'s None result).",
  COPY: "Duplicate a stack item.",
  SWAP: "Swap two stack items.",
  NOP: "Do nothing.",
  NOT_TAKEN:
    "Marks the not-taken side of a branch (used for tracing and statistics).",
  JUMP_FORWARD: "Jump forward to another instruction.",
  JUMP_BACKWARD: "Jump backward: this is the bottom of a loop.",
  JUMP_BACKWARD_NO_INTERRUPT:
    "Jump backward without checking for interrupts (inside `await`/`yield from`).",
  POP_JUMP_IF_FALSE: "Jump if the value is False (the `if` didn't match).",
  POP_JUMP_IF_TRUE: "Jump if the value is True.",
  POP_JUMP_IF_NONE: "Jump if the value is None.",
  POP_JUMP_IF_NOT_NONE: "Jump if the value is not None.",
  GET_ITER: "Call iter() on a value to get an iterator (start of a for loop).",
  FOR_ITER:
    "Call next() on the iterator; jump out of the loop when it's exhausted.",
  END_FOR: "Clean up after a for loop finishes.",
  POP_ITER: "Discard the loop's iterator.",
  EXTENDED_ARG: "Prefix for an argument too large for one byte.",

  // generators & async
  RETURN_GENERATOR:
    "Create a generator object instead of running the body right away.",
  YIELD_VALUE: "Pause the generator and hand a value to whoever called next().",
  SEND: "Send a value into a sub-generator (`yield from` / `await`).",
  END_SEND: "Finish a `yield from` / `await` step.",
  GET_YIELD_FROM_ITER: "Get the iterator for `yield from`.",
  CLEANUP_THROW: "Handle an exception thrown into a sub-generator.",

  // exceptions & with
  PUSH_EXC_INFO: "Save the current exception when entering an except block.",
  POP_EXCEPT:
    "Restore the previous exception state when leaving an except block.",
  CHECK_EXC_MATCH: "Test whether the exception matches `except SomeError`.",
  RERAISE:
    "Re-raise the current exception (no handler matched, or `finally` ran).",
  RAISE_VARARGS: "Raise an exception (the `raise` statement).",
  WITH_EXCEPT_START:
    "Call __exit__ with the exception that escaped a `with` block.",
  LOAD_ASSERTION_ERROR: "Push AssertionError for a failing `assert`.",

  // imports
  IMPORT_NAME: "Import a module (runs it once, then caches it in sys.modules).",
  IMPORT_FROM: "Get one name out of an imported module (`from x import y`).",
}

export const opcodeHelp = (op: string) =>
  OPCODES[op] ?? "A CPython bytecode instruction."
