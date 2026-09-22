import { auth } from "@/lib/auth"
import { changed, merge, parseRows, type Rows } from "@/lib/merge"
import { prisma } from "@/lib/prisma"

// ponytail: loads all of the learner's rows per request (hundreds at most); filter by id if pushes get heavy.
async function load(userId: string): Promise<Rows> {
  const where = { userId }
  const [progress, reads, quizzes, drafts] = await Promise.all([
    prisma.progress.findMany({ where }),
    prisma.lessonRead.findMany({ where }),
    prisma.quizResult.findMany({ where }),
    prisma.draft.findMany({ where }),
  ])
  return {
    progress: progress.map((r) => ({ lessonId: r.lessonId, completedAt: r.completedAt.getTime() })),
    reads: reads.map((r) => ({ lessonId: r.lessonId, readAt: r.readAt.getTime() })),
    quizzes: quizzes.map((r) => ({
      key: r.key,
      best: r.best,
      total: r.total,
      ...(r.passedAt && { passedAt: r.passedAt.getTime() }),
    })),
    drafts: drafts.map((r) => ({ lessonId: r.lessonId, code: r.code, updatedAt: r.updatedAt.getTime() })),
  }
}

function save(userId: string, rows: Rows) {
  const at = (ms: number) => new Date(ms)
  return prisma.$transaction([
    ...rows.progress.map((r) =>
      prisma.progress.upsert({
        where: { userId_lessonId: { userId, lessonId: r.lessonId } },
        create: { userId, lessonId: r.lessonId, completedAt: at(r.completedAt) },
        update: { completedAt: at(r.completedAt) },
      })
    ),
    ...rows.reads.map((r) =>
      prisma.lessonRead.upsert({
        where: { userId_lessonId: { userId, lessonId: r.lessonId } },
        create: { userId, lessonId: r.lessonId, readAt: at(r.readAt) },
        update: { readAt: at(r.readAt) },
      })
    ),
    ...rows.quizzes.map((r) => {
      const data = { best: r.best, total: r.total, passedAt: r.passedAt === undefined ? null : at(r.passedAt) }
      return prisma.quizResult.upsert({
        where: { userId_key: { userId, key: r.key } },
        create: { userId, key: r.key, ...data },
        update: data,
      })
    }),
    ...rows.drafts.map((r) =>
      prisma.draft.upsert({
        where: { userId_lessonId: { userId, lessonId: r.lessonId } },
        create: { userId, lessonId: r.lessonId, code: r.code, updatedAt: at(r.updatedAt) },
        update: { code: r.code, updatedAt: at(r.updatedAt) },
      })
    ),
  ])
}

/** Merges the posted rows into the account and returns the merged set. An empty body just reads. */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Not signed in" }, { status: 401 })
  const local = parseRows(await request.json().catch(() => null))
  if (!local) return Response.json({ error: "Invalid body" }, { status: 400 })

  const server = await load(session.user.id)
  const merged = merge(server, local)
  await save(session.user.id, changed(server, merged))
  return Response.json(merged)
}
