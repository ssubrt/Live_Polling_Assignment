import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { validators } from "@/lib/validators"
import { handleApiError, NotFoundError, ValidationError } from "@/lib/error-handler"


export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { role, name } = body

    // Validate input
    validators.role(role)
    validators.name(name)

    if (role === "TEACHER") {
      const teacher = await prisma.teacher.create({
        data: { name },
      })

      const session = await prisma.session.create({
        data: {
          role: "TEACHER",
          name,
          teacherId: teacher.id,
        },
      })

      return NextResponse.json(session, { status: 201 })
    } else if (role === "STUDENT") {
      const student = await prisma.student.create({
        data: { name },
      })

      const session = await prisma.session.create({
        data: {
          role: "STUDENT",
          name,
          studentId: student.id,
        },
      })

      return NextResponse.json(session, { status: 201 })
    }

    throw new ValidationError("Invalid role")
  } catch (error) {
    return handleApiError(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("id")

    // If no ID provided, return all active sessions
  if (!sessionId) {
      // FIX: Removed invalid expiresAt check
      const sessions = await prisma.session.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      })
      return NextResponse.json(sessions)
    }

    // Otherwise return specific session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    })

    if (!session) {
      throw new NotFoundError("Session not found")
    }

    return NextResponse.json(session)
  } catch (error) {
    return handleApiError(error)
  }
}
