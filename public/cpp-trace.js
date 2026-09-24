// Records a C++ run for the Visualize tab. C++ has no sys.settrace, so the learner's source is
// rewritten before it compiles: tree-sitter finds the statements, functions and classes, and
// the rewrite calls into HEADER, which serializes every variable in scope and hands each
// snapshot to JavaScript through a wasm import. The snapshots have the same shape as Python's
// (public/inspect.py), so lib/viz/trace-events.ts turns both into steps.
// Shared by public/cpp.worker.js and lib/viz/trace-cpp.test.ts. See docs/adr/0004-tracing-cpp.md.
import { compile, compileError, crashMessage, execute } from "./cpp-run.js"

export const STEPS = 500

const LIMIT = new Error("step limit")

export const HEADER = String.raw`#pragma once
#include <cmath>
#include <cstdio>
#include <initializer_list>
#include <iostream>
#include <string>
#include <string_view>
#include <type_traits>
#include <utility>
#include <vector>

extern "C" __attribute__((import_module("viz"), import_name("snap"))) void __viz_snap(const char *, unsigned long);

namespace __viz {
constexpr int ITEMS = 50;

inline void quote(std::string &o, std::string_view s) {
  o += '"';
  for (unsigned char c : s) {
    if (c == '"' || c == '\\') { o += '\\'; o += char(c); }
    else if (c == '\n') o += "\\n";
    else if (c == '\t') o += "\\t";
    else if (c < 0x20) { char b[8]; std::snprintf(b, sizeof b, "\\u%04x", c); o += b; }
    else o += char(c);
  }
  o += '"';
}

template <class T> std::string tname() {
  std::string_view f = __PRETTY_FUNCTION__;
  auto a = f.find("T = ") + 4;
  std::string t(f.substr(a, f.rfind(']') - a));
  for (std::string_view s : {"std::basic_string<char>", "std::__1::basic_string<char>"})
    for (auto i = t.find(s); i != std::string::npos; i = t.find(s)) t.replace(i, s.size(), "std::string");
  return t;
}

template <class T> struct is_vec : std::false_type {};
template <class T, class A> struct is_vec<std::vector<T, A>> : std::true_type {};

// Generated __viz_fields(F&, const T&) overloads (one per struct or class) fill this in.
struct F {
  std::string s;
  template <class T> void field(const char *name, const T &v);
};

/** A value as C++ would spell it: true, 'x', "hi", {1, 2}, Book{title: "Dune", pages: 412}. */
template <class T> std::string repr(const T &v) {
  using U = std::remove_cvref_t<T>;
  if constexpr (std::is_same_v<U, bool>) return v ? "true" : "false";
  else if constexpr (std::is_same_v<U, char>) return std::string("'") + v + "'";
  else if constexpr (std::is_integral_v<U>) return std::to_string(v);
  else if constexpr (std::is_floating_point_v<U>) {
    char b[32];
    std::snprintf(b, sizeof b, "%g", double(v));
    return b;
  } else if constexpr (std::is_convertible_v<const U &, std::string_view>) {
    if constexpr (std::is_pointer_v<U>) if (!v) return "nullptr";
    return "\"" + std::string(std::string_view(v)) + "\"";
  } else if constexpr (is_vec<U>::value || std::is_array_v<U>) {
    std::string o = "{";
    int n = 0;
    for (const auto &x : v) {
      if (n) o += ", ";
      if (++n > ITEMS) { o += "..."; break; }
      o += repr(x);
    }
    return o + "}";
  } else if constexpr (std::is_pointer_v<U>) {
    if (!v) return "nullptr";
    char b[24];
    std::snprintf(b, sizeof b, "%p", (const void *)v);
    return b;
  } else if constexpr (requires(F &f, const U &x) { __viz_fields(f, x); }) {
    F f;
    __viz_fields(f, v);
    return tname<U>() + "{" + f.s + "}";
  } else return tname<U>() + "{...}";
}

template <class T> void F::field(const char *name, const T &v) {
  if (!s.empty()) s += ", ";
  s += name;
  s += ": ";
  s += repr(v);
}

inline void card(std::string &o, std::string text, std::string_view type) {
  if (text.size() > 80) text = text.substr(0, 77) + "...";
  o += "{\"repr\":";
  quote(o, text);
  o += ",\"type\":";
  quote(o, type);
  o += "}";
}

/** One snapshot's JSON: vectors go into lists once, keyed by address, like Python's id(). */
struct W {
  std::string lists;
  std::vector<const void *> seen;
};

template <class T> void val(W &w, std::string &o, const T &v, bool top) {
  using U = std::remove_cvref_t<T>;
  if constexpr (std::is_same_v<U, bool>) card(o, repr(v), "bool");
  else if constexpr (std::is_same_v<U, char>) card(o, repr(v), "char");
  else if constexpr (std::is_integral_v<U>) {
    if (v >= U(0) ? (unsigned long long)v <= (1ULL << 53) : (long long)v >= -(1LL << 53)) o += std::to_string(v);
    else card(o, repr(v), tname<U>());
  } else if constexpr (std::is_floating_point_v<U>) {
    if (std::isfinite(v)) {
      char b[32];
      std::snprintf(b, sizeof b, "%.17g", double(v));
      o += b;
    } else card(o, repr(v), tname<U>());
  } else if constexpr (std::is_convertible_v<const U &, std::string_view>) card(o, repr(v), "string");
  else if constexpr (is_vec<U>::value || std::is_array_v<U>) {
    // a vector inside a vector (or a struct) is a card: nested structures are out of v1
    if (!top) return card(o, repr(v), tname<U>());
    char key[24];
    std::snprintf(key, sizeof key, "%p", (const void *)&v);
    o += "{\"ref\":";
    quote(o, key);
    o += "}";
    for (auto p : w.seen) if (p == &v) return;
    w.seen.push_back(&v);
    std::string items = "[";
    int n = 0;
    for (const auto &x : v) {
      if (n < ITEMS) {
        if (n) items += ",";
        val(w, items, x, false);
      }
      ++n;
    }
    if (!w.lists.empty()) w.lists += ",";
    quote(w.lists, key);
    w.lists += ":{\"items\":" + items + "],\"more\":" + std::to_string(n > ITEMS ? n - ITEMS : 0) + "}";
  } else card(o, repr(v), tname<U>());
}

/** A variable in scope: where it lives and how to write it. */
struct Var {
  const char *name;
  const void *p;
  void (*put)(W &, std::string &, const void *);
};
template <class T> void put(W &w, std::string &o, const void *p) { val(w, o, *static_cast<const T *>(p), true); }
template <class T> Var var(const char *name, const T &v) { return {name, &v, &put<T>}; }

struct Frame;
inline std::vector<Frame *> stack; // [0] holds the globals
inline bool ready = false;         // false until the globals frame exists (static initialization)
inline void snap(const char *event, int line, const std::string *ret = nullptr);

struct Frame {
  struct Global {};
  const char *fn;
  std::vector<Var> vars;
  int line;
  int end = 0;           // the closing brace: where a function without a return statement ends
  bool returned = false; // left through a return statement (on this->line)
  std::string ret;
  std::vector<Var> args;           // this and the parameters: alive until the caller resumes
  std::vector<std::string> pieces; // each var's JSON at the last snapshot
  bool ending = false;
  bool owned = true;

  Frame(const char *fn, int line, int end, std::initializer_list<Var> params, const char *ret)
      : fn(fn), vars(params), line(line), end(end), ret(ret), args(params) {
    stack.push_back(this);
    snap("call", line);
  }
  Frame(Global, std::initializer_list<Var> globals) : fn("<globals>"), vars(globals), line(0), owned(false) {
    stack.insert(stack.begin(), this);
    ready = true;
  }
  // By now the body's locals are gone: they show as they were at the last snapshot, while
  // this and the parameters are still read live (a method's last change to *this counts).
  ~Frame() {
    if (!owned) return;
    ending = true;
    snap("return", returned ? line : end, &ret);
    stack.pop_back();
  }

  std::string json(W &w) {
    pieces.resize(vars.size());
    std::string o = "[";
    for (size_t i = 0; i < vars.size(); i++) {
      bool live = !ending;
      for (const Var &a : args) live = live || a.p == vars[i].p;
      if (live) {
        pieces[i].clear();
        vars[i].put(w, pieces[i], vars[i].p);
      }
      if (i) o += ",";
      o += "[";
      quote(o, vars[i].name);
      o += "," + pieces[i] + "]";
    }
    return o + "]";
  }

  /** return e;  →  return __vf.result(e);  records e while the locals still exist. */
  template <class T> T &&result(T &&v) {
    W w;
    returned = true;
    ret.clear();
    val(w, ret, v, false);
    json(w);
    return std::forward<T>(v);
  }
};

inline void snap(const char *event, int line, const std::string *ret) {
  if (!ready) return;
  W w;
  std::string o = "{\"line\":" + std::to_string(line) + ",\"event\":\"" + event + "\",\"frames\":[";
  for (size_t i = 0; i < stack.size(); i++) {
    Frame *f = stack[i];
    if (i) o += ",";
    o += "{\"fn\":";
    quote(o, f->fn);
    o += ",\"vars\":";
    o += f->json(w);
    o += "}";
  }
  o += "],\"lists\":{" + w.lists + "}";
  if (ret) o += ",\"ret\":" + *ret;
  o += "}";
  std::cout.flush();
  std::fflush(stdout);
  __viz_snap(o.data(), o.size());
}

/** Before each statement: the variables now in scope, and a snapshot. */
inline void line(int n, std::initializer_list<Var> vars) {
  Frame *f = stack.back();
  f->vars.assign(vars);
  f->line = n;
  snap("line", n);
}
} // namespace __viz
`

/** The names a declarator declares: x in `x`, `*x`, `&x`, `x[3]`, `x = 1`, `[a, b]`. */
function declared(d) {
  if (!d) return []
  switch (d.type) {
    case "identifier":
    case "field_identifier":
      return [d.text]
    case "init_declarator":
      // a lambda would be a card saying "(lambda at main.cpp:3:12)"
      return d.childForFieldName("value")?.type === "lambda_expression"
        ? []
        : declared(d.childForFieldName("declarator"))
    case "structured_binding_declarator":
      return d.namedChildren.filter((c) => c.type === "identifier").map((c) => c.text)
    case "pointer_declarator":
    case "reference_declarator":
    case "array_declarator":
    case "parenthesized_declarator":
      return declared(
        d.childForFieldName("declarator") ??
          d.namedChildren.find((c) => c.type.endsWith("declarator") || c.type.endsWith("identifier"))
      )
    default:
      return [] // function_declarator: a function, not a variable
  }
}

const hasChild = (node, type, text) =>
  node.children.some((c) => c.type === type && (text === undefined || c.text === text))

const declNames = (decl) =>
  hasChild(decl, "storage_class_specifier", "extern")
    ? []
    : decl.childrenForFieldName("declarator").flatMap(declared)

/** The function_declarator inside `int f()`, `int& f()`, `int* f()`. */
function functionDeclarator(d) {
  while (d && d.type !== "function_declarator")
    d = d.childForFieldName("declarator") ?? d.namedChildren.find((c) => c.type.endsWith("declarator"))
  return d
}

/**
 * Whether `return e;` can become `return __vf.result(e);` without changing what the program
 * does. Wrapping a class-type return turns copy elision into a copy or move, which prints
 * differently in a copy-constructor lesson, so only scalars, strings, vectors, references and
 * pointers qualify.
 */
function recordable(def) {
  const d = def.childForFieldName("declarator")
  if (d?.type === "reference_declarator" || d?.type === "pointer_declarator") return true
  const type = def.childForFieldName("type")
  if (!type) return false
  if (type.type === "primitive_type") return type.text !== "void"
  return (
    type.type === "sized_type_specifier" ||
    /^(std::)?(size_t|ptrdiff_t|u?int(8|16|32|64)_t)$|^std::(string|vector<.*>)$/.test(type.text.replace(/\s+/g, ""))
  )
}

/** What a return shows when its value isn't recorded. */
function unrecorded(def) {
  const type = def.childForFieldName("type")
  if (!type || type.text === "void") return { repr: "void", type: "void" }
  return type.type === "placeholder_type_specifier" ? { repr: "…", type: "auto" } : { repr: `${type.text}{…}`, type: type.text }
}

/**
 * The learner's code with the recording calls added, on the same lines as before.
 * @param {{ parse(code: string): any }} parser a tree-sitter parser set to C++
 */
export function instrument(parser, code) {
  const root = parser.parse(code).rootNode
  const edits = [] // [index, text], applied in order at equal indexes
  const add = (index, text) => edits.push([index, text])
  const classes = new Set()
  const printers = []
  const globals = []

  const at = (node) => node.startPosition.row + 1
  const vars = (scope) => {
    const names = scope.filter((n, i) => scope.lastIndexOf(n) === i) // an inner x shadows an outer one
    return `{${names.map((n) => (n === "this" ? `__viz::var("this", *this)` : `__viz::var("${n}", ${n})`)).join(", ")}}`
  }
  const snap = (line, scope) => `__viz::line(${line}, ${vars(scope)});`

  /** `(cond)` → `((__viz::line(L, …), (cond)))`, so a loop's header lights on every pass. */
  const header = (paren, line, scope) => {
    if (!paren || paren.childForFieldName("value")?.type === "declaration") return
    add(paren.startIndex + 1, `(__viz::line(${line}, ${vars(scope)}), (`)
    add(paren.endIndex - 1, "))")
  }

  /** A loop or if body. A lone statement gets braces so there's room for a snapshot. `after`: one more at its end. */
  const body = (s, scope, after) => {
    if (!s) return
    if (s.type === "compound_statement") {
      block(s, scope)
      if (after) add(s.endIndex - 1, ` ${after} `)
      return
    }
    add(s.startIndex, `{ ${snap(at(s), scope)} `)
    stmt(s, scope)
    add(s.endIndex, after ? ` ${after} }` : " }")
  }

  const sequence = (statements, scope) => {
    scope = [...scope]
    for (const c of statements) {
      if (c.type === "comment") continue
      if (c.type === "case_statement") {
        const value = c.childForFieldName("value")
        sequence(c.namedChildren.filter((x) => !value || x.id !== value.id), scope)
        continue
      }
      add(c.startIndex, `${snap(at(c), scope)} `)
      stmt(c, scope)
      if (c.type === "declaration") scope.push(...declNames(c))
    }
  }
  const block = (b, scope) => sequence(b.namedChildren, scope)

  let recording = false // whether the function being rewritten records its returns

  function stmt(s, scope) {
    switch (s.type) {
      case "compound_statement":
        return block(s, scope)
      case "labeled_statement":
        return stmt(s.namedChildren.at(-1), scope)
      case "if_statement": {
        body(s.childForFieldName("consequence"), scope)
        const alt = s.childForFieldName("alternative")
        return alt && body(alt.namedChildren.at(-1), scope)
      }
      case "for_statement": {
        const init = s.childForFieldName("initializer")
        const inner = init?.type === "declaration" ? [...scope, ...declNames(init)] : scope
        const cond = s.childForFieldName("condition")
        if (cond) {
          add(cond.startIndex, `(__viz::line(${at(s)}, ${vars(inner)}), (`)
          add(cond.endIndex, "))")
        }
        // the end-of-body snapshot puts the update (i++) on the header's line, not the body's last
        return body(s.childForFieldName("body"), inner, snap(at(s), inner))
      }
      case "for_range_loop": {
        const inner = [...scope, ...declared(s.childForFieldName("declarator"))]
        return body(s.childForFieldName("body"), inner, snap(at(s), inner))
      }
      case "while_statement":
        header(s.childForFieldName("condition"), at(s), scope)
        return body(s.childForFieldName("body"), scope)
      case "do_statement": {
        const cond = s.childForFieldName("condition")
        body(s.childForFieldName("body"), scope)
        return cond && header(cond, at(cond), scope)
      }
      case "switch_statement":
        return block(s.childForFieldName("body"), scope)
      case "return_statement": {
        const e = s.namedChildren[0]
        if (recording && e && e.type !== "initializer_list" && e.type !== "comment") {
          add(e.startIndex, "__vf.result(")
          add(e.endIndex, ")")
        } else add(s.startIndex, "__vf.returned = true; ") // statement position: after its snapshot
      }
    }
  }

  /** A function definition: a frame for the call, then every statement. `cls`: the class it's written in. */
  function fn(def, cls) {
    const b = def.childForFieldName("body")
    const f = functionDeclarator(def.childForFieldName("declarator"))
    if (!b || b.type !== "compound_statement" || !f) return
    // A snapshot isn't a constant expression, so constexpr functions run unrecorded.
    if (def.children.some((c) => c.text === "constexpr" || c.text === "consteval")) return
    const nameNode = f.childForFieldName("declarator")
    const name = nameNode.text.replace(/\s+/g, "")
    const outOfLine = nameNode.type === "qualified_identifier" && classes.has(name.slice(0, name.lastIndexOf("::")))
    const method = (cls || outOfLine) && !hasChild(def, "storage_class_specifier", "static")
    const params = (f.childForFieldName("parameters")?.namedChildren ?? [])
      .filter((p) => p.type === "parameter_declaration" || p.type === "optional_parameter_declaration")
      .flatMap((p) => declared(p.childForFieldName("declarator")))
    const scope = [...(method ? ["this"] : []), ...params]
    const label = cls ? `${cls}::${name}` : name
    const ret = name === "main" && !cls ? 0 : unrecorded(def)
    const end = b.endPosition.row + 1
    add(b.startIndex + 1, ` __viz::Frame __vf("${label}", ${at(def)}, ${end}, ${vars(scope)}, ${JSON.stringify(JSON.stringify(ret))});`)
    recording = recordable(def)
    block(b, scope)
  }

  /** A class or struct: its methods, and a printer that lists its fields (a friend, so private ones too). */
  function cls(spec, outer, printable) {
    const name = spec.childForFieldName("name")?.text
    const b = spec.childForFieldName("body")
    if (!name || !b) return
    const full = outer ? `${outer}::${name}` : name
    classes.add(full)
    const fields = []
    for (const m of b.namedChildren) {
      if (m.type === "function_definition") fn(m, full)
      else if (m.type === "template_declaration") {
        const d = m.namedChildren.find((c) => c.type === "function_definition")
        if (d) fn(d, full)
      } else if (m.type === "field_declaration") {
        const type = m.childForFieldName("type")
        if (type?.type === "struct_specifier" || type?.type === "class_specifier") cls(type, full, printable)
        if (!hasChild(m, "storage_class_specifier")) fields.push(...m.childrenForFieldName("declarator").flatMap(declared))
      }
    }
    if (!printable) return
    add(b.startIndex + 1, ` friend void __viz_fields(__viz::F&, const ${full}&);`)
    printers.push(
      `inline void __viz_fields(__viz::F& f, const ${full}& v) { ${fields.map((n) => `f.field("${n}", v.${n});`).join(" ")} }`
    )
  }

  /** Top level (and inside namespaces, where only functions are followed). */
  function top(nodes, inNamespace) {
    for (const n of nodes) {
      switch (n.type) {
        case "function_definition":
          fn(n)
          break
        case "template_declaration":
          for (const c of n.namedChildren) {
            if (c.type === "function_definition") fn(c)
            if (c.type === "struct_specifier" || c.type === "class_specifier") cls(c, undefined, false)
          }
          break
        case "struct_specifier":
        case "class_specifier":
          cls(n, undefined, !inNamespace)
          break
        case "declaration": {
          const type = n.childForFieldName("type")
          if (type?.type === "struct_specifier" || type?.type === "class_specifier") cls(type, undefined, !inNamespace)
          if (!inNamespace) globals.push(...declNames(n))
          break
        }
        case "namespace_definition":
          top(n.childForFieldName("body")?.namedChildren ?? [], true)
      }
    }
  }
  top(root.namedChildren, false)

  let out = ""
  let from = 0
  edits
    .map((e, i) => [...e, i])
    .sort((a, b) => a[0] - b[0] || a[2] - b[2])
    .forEach(([index, text]) => {
      out += code.slice(from, index) + text
      from = index
    })
  out += code.slice(from)
  return `#include "__viz.hpp"\n#line 1\n${out}\n${printers.join("\n")}\nstatic __viz::Frame __viz_globals{__viz::Frame::Global{}, ${vars(globals)}};\n`
}

/**
 * Compile the recording build of `code` and run it → { trace?, error?, errorLine? }, where
 * trace is { snaps, truncated, stdout } (see Snap in lib/viz/trace-events.ts).
 * @param {(args: string[], files: any, opts?: any) => any} clang
 * @param {any} wasi the @bjorn3/browser_wasi_shim module
 * @param {{ parse(code: string): any }} parser a tree-sitter parser set to C++
 * @param {() => void} [onRunning]
 * @returns {Promise<{ trace?: { snaps: any[], truncated: boolean, stdout: string }, error?: string, errorLine?: number }>}
 */
export async function traceCpp(clang, wasi, parser, code, onRunning) {
  let source
  try {
    source = instrument(parser, code)
  } catch {
    source = undefined
  }
  const built = source && (await compile(clang, { "main.cpp": source, "__viz.hpp": HEADER }, ["-w", "-o", "prog", "main.cpp"]))
  if (!built?.ok) {
    // Whose fault is it? If the learner's own file doesn't compile, that's the error to show.
    const plain = await compile(clang, { "main.cpp": code }, ["-fsyntax-only", "main.cpp"])
    if (!plain.ok) return compileError(plain.diagnostics)
    return { error: "The visualizer can't follow this program yet. Run still works as usual." }
  }

  onRunning?.()
  const snaps = []
  const decoder = new TextDecoder()
  const { out, exit, crashed } = await execute(wasi, built.prog, (memory, text) => ({
    viz: {
      snap(ptr, len) {
        if (snaps.length >= STEPS) throw LIMIT
        const s = JSON.parse(decoder.decode(new Uint8Array(memory().buffer, ptr, len)))
        s.out = text.out.length
        // just the globals before main's call, so main opens a frame like any other function
        if (!snaps.length) snaps.push({ ...s, event: "line", frames: s.frames.slice(0, 1) })
        snaps.push(s)
      },
    },
  }))
  const truncated = crashed === LIMIT
  const last = snaps.at(-1)
  if (last?.event === "return" && last.frames.length === 2)
    snaps.push({ ...last, event: "line", frames: last.frames.slice(0, 1), ret: undefined, out: out.length })
  const trace = { snaps, truncated, stdout: out }
  if (crashed !== undefined && !truncated) return { trace, error: crashMessage(crashed) }
  if (exit !== 0) return { trace, error: `The program exited with code ${exit}.` }
  return { trace }
}
