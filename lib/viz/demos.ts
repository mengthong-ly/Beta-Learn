// The visualizer playground's demos. Hand-written event streams for now; every demo's
// code is run in real Python by demos.test.ts, which checks these events against it.

import type { Demo, Step, VizEvent } from "./events.ts"

const TUTORIAL = "https://docs.python.org/3/tutorial"
const LISTS = { label: "Python tutorial: More on Lists", href: `${TUTORIAL}/datastructures.html#more-on-lists` }

const s = (line: number, event: VizEvent, note: string): Step => ({ line, event, note })
const create = (values = [10, 20, 30]) =>
  s(1, { type: "array.create", name: "numbers", values }, "Python builds a list object on the heap, and the name numbers points at it.")

export const DEMOS: Demo[] = [
  {
    id: "variables",
    title: "Variables",
    summary: "A name is bound to a value; assigning again replaces it.",
    code: "x = 10\ny = x + 5\nx = y * 2\nprint(x)",
    steps: [
      s(1, { type: "var.set", name: "x", value: 10 }, "A new name x appears, bound to 10."),
      s(2, { type: "var.set", name: "y", value: 15 }, "Python reads x (10), adds 5, and binds the result to a new name y."),
      s(3, { type: "var.set", name: "x", value: 30 }, "x is assigned again: the old 10 is replaced by y * 2, which is 30."),
      s(4, { type: "print", text: "30" }, "print() sends the current value of x to the output."),
    ],
    reference: { label: "Python tutorial: Using Python as a calculator", href: `${TUTORIAL}/introduction.html#numbers` },
  },
  {
    id: "array-create",
    title: "Create a list",
    summary: "A list is one object holding values in numbered slots.",
    code: "numbers = [10, 20, 30]\nprint(len(numbers))",
    steps: [
      create(),
      s(2, { type: "print", text: "3" }, "len() counts the slots: 3. Indexes start at 0, so they run 0, 1, 2."),
    ],
    reference: { label: "Python tutorial: Lists", href: `${TUTORIAL}/introduction.html#lists` },
  },
  {
    id: "append",
    title: "Append",
    summary: "append() adds one item to the end of the list.",
    code: "numbers = [10, 20, 30]\nnumbers.append(40)\nprint(numbers)",
    steps: [
      create(),
      s(2, { type: "array.insert", name: "numbers", index: 3, value: 40 }, "append(40) puts 40 in a new slot at the end, index 3. Nothing else moves."),
      s(3, { type: "print", text: "[10, 20, 30, 40]" }, "The same list object now holds four items."),
    ],
    reference: LISTS,
  },
  {
    id: "insert",
    title: "Insert",
    summary: "insert(i, x) opens a gap at index i; everything after it shifts right.",
    code: "numbers = [10, 20, 30]\nnumbers.insert(1, 15)\nprint(numbers)",
    steps: [
      create(),
      s(2, { type: "array.insert", name: "numbers", index: 1, value: 15 }, "insert(1, 15): 20 and 30 shift one slot right to open index 1, then 15 moves in."),
      s(3, { type: "print", text: "[10, 15, 20, 30]" }, "Every item after the gap has a new index: 20 is now at 2, 30 at 3."),
    ],
    reference: LISTS,
  },
  {
    id: "remove",
    title: "Remove (pop)",
    summary: "pop(i) takes the item out, returns it, and closes the gap.",
    code: "numbers = [10, 20, 30, 40]\nremoved = numbers.pop(2)\nprint(numbers, removed)",
    steps: [
      create([10, 20, 30, 40]),
      s(2, { type: "array.remove", name: "numbers", index: 2, into: "removed" }, "pop(2) takes 30 out of index 2 and returns it into removed. 40 shifts left to close the gap."),
      s(3, { type: "print", text: "[10, 20, 40] 30" }, "The list is one shorter, and the removed value lives on in its own variable."),
    ],
    reference: LISTS,
  },
  {
    id: "update",
    title: "Update",
    summary: "numbers[i] = x replaces the value in one slot, in place.",
    code: "numbers = [10, 20, 30]\nnumbers[1] = 99\nprint(numbers)",
    steps: [
      create(),
      s(2, { type: "array.set", name: "numbers", index: 1, value: 99 }, "Assigning to numbers[1] swaps the value in slot 1: 20 is replaced by 99. No other slot moves."),
      s(3, { type: "print", text: "[10, 99, 30]" }, "Same list, same length, one value changed."),
    ],
    reference: { label: "Python tutorial: Lists", href: `${TUTORIAL}/introduction.html#lists` },
  },
  {
    id: "access",
    title: "Access by index",
    summary: "numbers[i] reads a slot without changing the list.",
    code: "numbers = [10, 20, 30]\nfirst = numbers[0]\nlast = numbers[-1]\nprint(first, last)",
    steps: [
      create(),
      s(2, { type: "array.access", name: "numbers", index: 0, into: "first" }, "numbers[0] goes to slot 0 and copies its value into first. The list is unchanged."),
      s(3, { type: "array.access", name: "numbers", index: 2, into: "last" }, "A negative index counts from the end: numbers[-1] is the last slot, index 2."),
      s(4, { type: "print", text: "10 30" }, "Both values were read; the list still holds all three."),
    ],
    reference: { label: "Python tutorial: Lists", href: `${TUTORIAL}/introduction.html#lists` },
  },
  {
    id: "loop",
    title: "Loop over a list",
    summary: "for visits each item in order, one at a time.",
    code: "numbers = [10, 20, 30]\nfor n in numbers:\n    print(n)",
    steps: [
      create(),
      s(2, { type: "loop.iter", array: "numbers", index: 0, variable: "n" }, "The loop starts at slot 0 and binds n to its value, 10."),
      s(3, { type: "print", text: "10" }, "The loop body runs once for this item."),
      s(2, { type: "loop.iter", array: "numbers", index: 1, variable: "n" }, "Back to the top: the loop moves to the next slot and rebinds n to 20."),
      s(3, { type: "print", text: "20" }, "The body runs again with the new n."),
      s(2, { type: "loop.iter", array: "numbers", index: 2, variable: "n" }, "Next slot: n is now 30."),
      s(3, { type: "print", text: "30" }, "The body runs for the last item."),
      s(2, { type: "loop.end", array: "numbers" }, "No slots left, so the loop ends. n keeps the last value it had, 30."),
    ],
    reference: { label: "Python tutorial: for statements", href: `${TUTORIAL}/controlflow.html#for-statements` },
  },
  {
    id: "condition",
    title: "If / else",
    summary: "The condition is evaluated once; only one branch runs.",
    code: 'age = 20\nif age >= 18:\n    print("adult")\nelse:\n    print("minor")',
    steps: [
      s(1, { type: "var.set", name: "age", value: 20 }, "age is bound to 20."),
      s(
        2,
        { type: "cond.eval", id: "c1", expr: "age >= 18", result: true, then: 'print("adult")', otherwise: 'print("minor")' },
        "Python evaluates age >= 18: 20 >= 18 is True, so execution takes the True path."
      ),
      s(3, { type: "print", text: "adult" }, 'Only the True branch runs. print("minor") is skipped entirely.'),
    ],
    reference: { label: "Python tutorial: if statements", href: `${TUTORIAL}/controlflow.html#if-statements` },
  },
  {
    id: "function",
    title: "Function call",
    summary: "Arguments go in, the function runs in its own frame, a value comes out.",
    code: "def add(a, b):\n    return a + b\n\nresult = add(10, 20)\nprint(result)",
    steps: [
      s(4, { type: "call", fn: "add", args: [["a", 10], ["b", 20]] }, "Calling add(10, 20) creates a new frame where a = 10 and b = 20."),
      s(2, { type: "return", fn: "add", value: 30 }, "The body computes a + b = 30. return hands it back and the frame is thrown away."),
      s(4, { type: "var.set", name: "result", value: 30 }, "Back in the caller, the returned 30 is bound to result."),
      s(5, { type: "print", text: "30" }, "print() shows result."),
    ],
    reference: { label: "Python tutorial: Defining functions", href: `${TUTORIAL}/controlflow.html#defining-functions` },
  },
  {
    id: "recursion",
    title: "Recursion",
    summary: "Each call stacks a new frame; returns unwind them top to bottom.",
    code: "def factorial(n):\n    if n == 1:\n        return 1\n    return n * factorial(n - 1)\n\nresult = factorial(4)\nprint(result)",
    steps: [
      s(6, { type: "call", fn: "factorial", args: [["n", 4]] }, "factorial(4) gets a frame with n = 4. n isn't 1, so it needs factorial(3) first."),
      s(4, { type: "call", fn: "factorial", args: [["n", 3]] }, "A second frame stacks on top, with its own n = 3. The first frame waits."),
      s(4, { type: "call", fn: "factorial", args: [["n", 2]] }, "Another frame: n = 2. Three calls are now waiting on the stack."),
      s(4, { type: "call", fn: "factorial", args: [["n", 1]] }, "n = 1: this is the base case. No more calls are needed."),
      s(3, { type: "return", fn: "factorial", value: 1 }, "The top frame returns 1 and is removed. The frame below receives it."),
      s(4, { type: "return", fn: "factorial", value: 2 }, "That frame computes 2 * 1 = 2 and returns it downward."),
      s(4, { type: "return", fn: "factorial", value: 6 }, "3 * 2 = 6, returned to the frame below."),
      s(4, { type: "return", fn: "factorial", value: 24 }, "The first frame computes 4 * 6 = 24. The stack is empty again."),
      s(6, { type: "var.set", name: "result", value: 24 }, "The final value, 24, is bound to result."),
      s(7, { type: "print", text: "24" }, "print() shows 24."),
    ],
    reference: { label: "Python tutorial: Defining functions", href: `${TUTORIAL}/controlflow.html#defining-functions` },
  },
  {
    id: "pipeline",
    title: "From source to running code",
    summary: "A simplified view of what CPython does with your code before it runs.",
    code: "x = 1 + 2\nprint(x)",
    steps: [
      s(1, { type: "pipeline.stage", stage: "source", payload: ["x = 1 + 2", "print(x)"] }, "It starts as plain text. To Python this is just characters, not yet a program."),
      s(
        1,
        {
          type: "pipeline.stage",
          stage: "tokens",
          payload: ["NAME 'x'", "OP '='", "NUMBER '1'", "OP '+'", "NUMBER '2'", "NEWLINE", "NAME 'print'", "OP '('", "NAME 'x'", "OP ')'", "NEWLINE", "ENDMARKER"],
        },
        "The tokenizer cuts the text into tokens: names, operators and numbers."
      ),
      s(
        1,
        { type: "pipeline.stage", stage: "ast", payload: ["Assign x", "  BinOp 1 + 2", "Expr", "  Call print(x)"] },
        "The parser arranges the tokens into a tree (the AST) that records what each line means."
      ),
      s(
        1,
        {
          type: "pipeline.stage",
          stage: "bytecode",
          payload: ["LOAD_SMALL_INT 3", "STORE_NAME x", "LOAD_NAME print", "PUSH_NULL", "LOAD_NAME x", "CALL 1", "POP_TOP", "LOAD_CONST None", "RETURN_VALUE"],
        },
        "The compiler turns the tree into bytecode. It already worked out 1 + 2: the bytecode just loads 3. The last two lines are the implicit end of the module."
      ),
      s(1, { type: "pipeline.stage", stage: "run", payload: ["runs one instruction at a time"] }, "The interpreter runs the bytecode, one instruction at a time."),
      s(1, { type: "var.set", name: "x", value: 3 }, "STORE_NAME binds x to 3 in memory."),
      s(2, { type: "print", text: "3" }, "CALL runs print(x), and 3 reaches the output."),
    ],
    reference: { label: "CPython internals: the compiler", href: "https://github.com/python/cpython/blob/main/InternalDocs/compiler.md" },
  },
]
