import { NextResponse } from "next/server"

// Simple Error Handler to replace the deleted one

export class ValidationError extends Error {
  status: number
  code: string

  constructor(message: string) {
    super(message)
    this.name = "ValidationError"
    this.status = 400
    this.code = "VALIDATION_ERROR"
  }
}

export class NotFoundError extends Error {
  status: number
  code: string

  constructor(message: string) {
    super(message)
    this.name = "NotFoundError"
    this.status = 404
    this.code = "NOT_FOUND"
  }
}

export function handleApiError(error: any) {
  console.error("API Error:", error)
  
  // Default values for unknown errors (Internal Server Error)
  let status = 500
  let message = "Something went wrong on the server"
  let code = "INTERNAL_SERVER_ERROR"

  // Handle custom errors (ValidationError, NotFoundError) which have a 'status' property
  if (error.status) {
    status = error.status
    message = error.message
    code = error.code || "API_ERROR"
  } 
  // Handle Prisma Validation Errors (generic simplified check)
  else if (error.name === "PrismaClientValidationError") {
    status = 400
    message = "Invalid data provided to database"
    code = "DB_VALIDATION_ERROR"
  }
  
  return NextResponse.json({ error: message, code }, { status })
}
