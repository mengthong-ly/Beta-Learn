"use client"

import { useId } from "react"
import { ArrowRightIcon } from "lucide-react"
import { AnimatePresence, LayoutGroup, motion } from "motion/react"

import { Emoji } from "@/components/emoji"
import { DiagramError, parseDiagram, type Frame, type Item, type Shape, type TreeNode } from "@/lib/diagram"
import { cn } from "@/lib/utils"

const pop = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { type: "spring", bounce: 0.15, duration: 0.45 },
} as const

/** One icon card. `k` is its layoutId: the same k in the next scene frame animates into place. */
function Card({ item, k, dim, row }: { item: Item; k: string; dim?: boolean; row?: boolean }) {
  return (
    <motion.div
      layout
      layoutId={k}
      {...pop}
      className={cn(
        "flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-xs",
        row ? "flex-row" : "min-w-20 flex-col text-center",
        dim && "border-dashed bg-transparent text-muted-foreground"
      )}
    >
      {item.icon && <Emoji char={item.icon} label={item.label ? "" : item.icon} className={row ? "size-6" : "size-10"} />}
      {item.label && <span className="[overflow-wrap:anywhere]">{item.label}</span>}
    </motion.div>
  )
}

const Arrow = ({ down }: { down?: boolean }) => (
  <ArrowRightIcon aria-hidden className={cn("size-4 shrink-0 text-muted-foreground", down && "rotate-90 sm:rotate-0")} />
)

/** `path` is the label path from the root, so equal labels in different branches stay distinct. */
function Tree({ node, path = "" }: { node: TreeNode; path?: string }) {
  const here = `${path}/${node.label}`
  return (
    <li className="flex flex-col gap-2">
      <Card item={node} k={`tree:${here}`} row />
      {node.children.length > 0 && (
        <ul className="ml-4 flex flex-col gap-2 border-l pl-4">
          {node.children.map((c) => <Tree key={`${here}/${c.label}`} node={c} path={here} />)}
        </ul>
      )}
    </li>
  )
}

function ShapeView({ shape }: { shape: Shape }) {
  switch (shape.kind) {
    case "flow":
      return (
        <ol className="relative flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
          <AnimatePresence initial={false} mode="popLayout">
            {shape.items.map((it, n) => (
              <motion.li layout key={it.id} className="flex flex-col items-center gap-2 sm:flex-row">
                {n > 0 && <Arrow down />}
                <Card item={it} k={`flow:${it.id}`} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )
    case "list":
      return (
        <ol className="relative flex flex-wrap justify-center gap-1.5">
          <AnimatePresence initial={false} mode="popLayout">
            {shape.items.map((it, n) => (
              <motion.li layout key={it.id} className="flex flex-col items-center gap-1">
                <Card item={it} k={`list:${it.id}`} />
                <span className="font-mono text-xs text-muted-foreground tabular-nums">{n}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )
    case "values":
      return (
        <ul className="relative flex flex-wrap justify-center gap-2" aria-label="values">
          <AnimatePresence initial={false} mode="popLayout">
            {shape.items.map((it) => <li key={it.id}><Card item={it} k={`v:${it.id}`} dim /></li>)}
          </AnimatePresence>
        </ul>
      )
    case "bind":
      return (
        <ul className="relative flex flex-col items-center gap-2">
          <AnimatePresence initial={false} mode="popLayout">
            {shape.pairs.map(({ name, value }) => (
              <motion.li layout key={name.id} className="flex items-center gap-2">
                <motion.span layout layoutId={`n:${name.id}`} className="flex items-center gap-1.5 rounded-full bg-tint-lavender px-3 py-1 font-mono text-sm text-tag-purple-fg">
                  {name.icon && <Emoji char={name.icon} className="size-5" />}
                  {name.label}
                </motion.span>
                <Arrow />
                <Card item={value} k={`v:${value.id}`} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )
    case "tree":
      return <ul className="flex flex-col gap-2"><Tree node={shape.root} /></ul>
  }
}

/** Draws one frame. The LayoutGroup id keeps layoutIds from flying between different diagrams. */
export function DiagramBody({ frame }: { frame: Frame }) {
  const id = useId()
  return (
    <LayoutGroup id={id}>
      <div className="flex flex-col items-center gap-5">
        {frame.shapes.map((s, n) => <ShapeView key={`${n}-${s.kind}`} shape={s} />)}
      </div>
    </LayoutGroup>
  )
}

/** A ```diagram fence. A parse error shows the source as text (check:content reports it). */
export function DiagramBlock({ src }: { src: string }) {
  let frame: Frame
  try {
    frame = parseDiagram(src)
  } catch (e) {
    if (!(e instanceof DiagramError)) throw e
    return <pre className="my-4 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-[13px]">{src}</pre>
  }
  return (
    <figure className="my-4 rounded-lg bg-muted/50 px-4 py-5">
      <DiagramBody frame={frame} />
      {frame.caption && <figcaption className="mt-4 text-center text-sm text-muted-foreground">{frame.caption}</figcaption>}
    </figure>
  )
}
