/** Consecutive local days with activity, counting back from today (or yesterday if today has none yet). */
export function streak(times: number[], now: number) {
  const day = (t: number) => new Date(t).toDateString()
  const days = new Set(times.map(day))
  const d = new Date(now)
  if (!days.has(day(+d))) d.setDate(d.getDate() - 1)
  let n = 0
  while (days.has(day(+d))) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

/** Course XP: 10 per lesson, 2 per best lesson-quiz point, 50 per section quiz and 200 for the final once passed. */
export function xp(
  lessonsDone: number,
  quizzes: { key: string; best: number; passedAt?: number }[]
) {
  return quizzes.reduce((sum, q) => {
    const id = q.key.slice(q.key.indexOf("/") + 1)
    if (id === "final") return sum + (q.passedAt ? 200 : 0)
    if (id.startsWith("section:")) return sum + (q.passedAt ? 50 : 0)
    return sum + q.best * 2
  }, lessonsDone * 10)
}
