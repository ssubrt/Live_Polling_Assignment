import { ValidationError } from "./error-handler"

export const validators = {
  question: (value: string) => {
    if (!value || typeof value !== "string") {
      throw new ValidationError("Question must be a non-empty string")
    }
    if (value.length < 5) {
      throw new ValidationError("Question must be at least 5 characters long")
    }
    if (value.length > 500) {
      throw new ValidationError("Question must not exceed 500 characters")
    }
    return value.trim()
  },

  options: (values: unknown) => {
    if (!Array.isArray(values)) {
      throw new ValidationError("Options must be an array")
    }
    if (values.length < 2) {
      throw new ValidationError("At least 2 options are required")
    }
    if (values.length > 10) {
      throw new ValidationError("Maximum 10 options allowed")
    }
    return values.map((v) => {
      if (typeof v !== "string" || !v.trim()) {
        throw new ValidationError("Each option must be a non-empty string")
      }
      return v.trim()
    })
  },

  timeLimit: (value: unknown) => {
    const num = Number(value)
    if (!Number.isInteger(num)) {
      throw new ValidationError("Time limit must be an integer")
    }
    if (num < 10) {
      throw new ValidationError("Time limit must be at least 10 seconds")
    }
    if (num > 300) {
      throw new ValidationError("Time limit must not exceed 300 seconds")
    }
    return num
  },

  name: (value: string) => {
    if (!value || typeof value !== "string") {
      throw new ValidationError("Name must be a non-empty string")
    }
    if (value.length < 2) {
      throw new ValidationError("Name must be at least 2 characters long")
    }
    if (value.length > 50) {
      throw new ValidationError("Name must not exceed 50 characters")
    }
    return value.trim()
  },

  role: (value: unknown) => {
    const validRoles = ["STUDENT", "TEACHER"]
    if (!validRoles.includes(String(value))) {
      throw new ValidationError("Invalid role. Must be STUDENT or TEACHER")
    }
    return value
  },
}
