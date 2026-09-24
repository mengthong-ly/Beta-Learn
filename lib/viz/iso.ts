// Isometric maths for the visualizer: true isometric (the three axes 120° apart on
// screen), parallel edges, no vanishing point. World units are screen pixels.
// x runs down-right, y runs down-left, z runs up.

export const C = Math.cos(Math.PI / 6)
export const S = 0.5

export type P2 = { x: number; y: number }
export type P3 = { x: number; y: number; z?: number }
export type Box = { w: number; d: number; h: number }

export const project = ({ x, y, z = 0 }: P3): P2 => ({
  x: (x - y) * C,
  y: (x + y) * S - z,
})

const r = (n: number) => Math.round(n * 100) / 100
const pts = (...ps: P2[]) => ps.map((q) => `${r(q.x)},${r(q.y)}`).join(" ")

/** SVG polygon points for the three visible faces of a box whose back-bottom corner is `at`. */
export function boxFaces({ w, d, h }: Box, at: P3 = { x: 0, y: 0 }) {
  const z0 = at.z ?? 0
  const p = (x: number, y: number, z: number) =>
    project({ x: at.x + x, y: at.y + y, z: z0 + z })
  return {
    top: pts(p(0, 0, h), p(w, 0, h), p(w, d, h), p(0, d, h)),
    left: pts(p(0, d, 0), p(w, d, 0), p(w, d, h), p(0, d, h)),
    right: pts(p(w, 0, 0), p(w, d, 0), p(w, d, h), p(w, 0, h)),
    floor: pts(p(0, 0, 0), p(w, 0, 0), p(w, d, 0), p(0, d, 0)),
  }
}

/** Screen-space bounding box of a box at `at`. */
export function boxBounds({ w, d, h }: Box, at: P3 = { x: 0, y: 0 }) {
  const z0 = at.z ?? 0
  const o = project({ x: at.x, y: at.y, z: z0 })
  return {
    minX: o.x - d * C,
    maxX: o.x + w * C,
    minY: o.y - h,
    maxY: o.y + (w + d) * S,
  }
}

/** Centre of a box's top face, where values are painted. */
export const topCenter = ({ w, d, h }: Box, at: P3 = { x: 0, y: 0 }) =>
  project({ x: at.x + w / 2, y: at.y + d / 2, z: (at.z ?? 0) + h })

/** SVG transform that lays local x/y flat onto the ground plane at `p` (text painted on a top face). */
export const onFloor = (p: P2) =>
  `matrix(${r(C)},${S},${r(-C)},${S},${r(p.x)},${r(p.y)})`

export type PathKind = "iso" | "curve" | "hcurve" | "straight"

/**
 * A connection from a to b. "iso" runs along the two ground axes (the technical-illustration
 * look), "curve" is a vertical S-bend, "hcurve" a horizontal one (into a node's side),
 * "straight" a line. Returns the path and the direction
 * (radians) it arrives in, for the arrowhead.
 */
export function isoPath(
  a: P2,
  b: P2,
  kind: PathKind
): { d: string; angle: number } {
  const dx = b.x - a.x
  const dy = b.y - a.y
  if (kind === "straight" || (dx === 0 && dy === 0))
    return {
      d: `M${r(a.x)},${r(a.y)} L${r(b.x)},${r(b.y)}`,
      angle: Math.atan2(dy, dx),
    }
  if (kind === "hcurve") {
    const k = Math.max(24, Math.abs(dx) / 2)
    return {
      d: `M${r(a.x)},${r(a.y)} C${r(a.x + k)},${r(a.y)} ${r(b.x - k)},${r(b.y)} ${r(b.x)},${r(b.y)}`,
      angle: 0,
    }
  }
  if (kind === "curve") {
    const k = Math.max(24, Math.abs(dy) / 2)
    return {
      d: `M${r(a.x)},${r(a.y)} C${r(a.x)},${r(a.y + k)} ${r(b.x)},${r(b.y - k)} ${r(b.x)},${r(b.y)}`,
      angle: Math.PI / 2,
    }
  }
  // a + s·(C, S) + t·(−C, S) = b: walk along the x axis, then along the y axis.
  const s = (dx / C + dy / S) / 2
  const t = (dy / S - dx / C) / 2
  const corner = { x: a.x + s * C, y: a.y + s * S }
  const last =
    Math.abs(t) > 0.5
      ? { x: -C * Math.sign(t), y: S * Math.sign(t) }
      : { x: C * Math.sign(s), y: S * Math.sign(s) }
  return {
    d: `M${r(a.x)},${r(a.y)} L${r(corner.x)},${r(corner.y)} L${r(b.x)},${r(b.y)}`,
    angle: Math.atan2(last.y, last.x),
  }
}
