# Live Polling System - Comprehensive Documentation

A real-time, production-ready polling application built with Next.js 16, TypeScript, Prisma v7, PostgreSQL, and Socket.io. This system enables teachers to create and manage interactive polls while students participate in real-time voting with server-authoritative timers and vote integrity.

This project implements a strict **Controller-Service-Repository** pattern to ensure clean architecture, maintainability, and separation of concerns.

## 📚 Table of Contents

- [Architecture Design](#-architecture-design)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Service Layer Implementation](#-service-layer-implementation)
- [Controller Layer Implementation](#-controller-layer-implementation)
- [API Documentation](#-api-documentation)
- [Socket.io Events](#-socketio-events)
- [Setup & Installation](#-setup--installation)
- [Key Principles](#-key-principles)
- [Refactoring Summary](#-refactoring-summary)

---

## 🏗 Architecture Design

The codebase follows a strict **Controller-Service** pattern. Each layer has a specific responsibility:

### 1. Controller Layer (Communication)
- **Files**: `app/api/**/route.ts`, `server.js` (Socket.IO)
- **Responsibilities**:
  - Receiving HTTP/Socket requests
  - Extracting and validating input format
  - Calling Services
  - Handling errors and formatting responses
  - Broadcasting notifications via Socket.IO
- **Strict Rule**: ONE Database calls allowed in this layer. All logic must be delegated to Services.

### 2. Service Layer (Business Logic)
- **Files**: `lib/services/*.ts`
- **Responsibilities**:
  - Business logic execution
  - Database operations (via Prisma)
  - Data validation (business rules)
  - Data transformation
  - State management (e.g., in-memory participants)
- **Strict Rule**: Must be reusable by REST APIs, Socket Handlers, and background jobs.

### 3. Data Layer (Persistence)
- **Files**: `lib/db.ts`, `prisma/schema.prisma`
- **Responsibilities**:
  - Raw database mapping and connection
  - Schema definitions

### Architecture Diagram
```
REST API Requests                Socket.IO Events
       ↓                                ↓
   Controllers                   Socket Handlers
   (Validate)                     (Extract data)
       ↓                                ↓
    ──────────────────────────────────────
                   ↓
            SERVICE LAYER
            ─────────────
            • PollService
            • VoteService
            • ChatService
            • ParticipantService
                   ↓
            PRISMA CLIENT
            ─────────────
            • Database queries
                   ↓
           PostgreSQL Database
```

---

## 💻 Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (Strict Mode)
- **UI Components**: shadcn/ui, Radix UI
- **Styling**: Tailwind CSS v4
- **State**: React Hooks + Socket.io Context
- **Real-Time**: Socket.io Client (Auto-reconnection)
- **Visuals**: Recharts (Live charts), Lucide React (Icons)

### Backend
- **Runtime**: Node.js (Next.js API Routes)
- **Database**: PostgreSQL 12+
- **ORM**: Prisma Client v7
- **Real-Time**: Socket.io v4.8.3 Server
- **Architecture**: Controller-Service Pattern

---

## 📂 Project Structure

```
live-polling-system/
├── app/
│   ├── api/                    # REST API Controllers
│   │   ├── polls/              # Poll endpoints
│   │   ├── votes/              # Vote endpoints
│   │   ├── chat/               # Chat endpoints
│   │   └── session/            # Session management
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Main entry
├── components/                 # React UI Components
│   ├── ui/                     # Generic UI elements
│   ├── *-view.tsx              # Feature-specific views
│   └── ...
├── lib/
│   ├── services/               # ✅ SERVICE LAYER
│   │   ├── index.ts            # Service exports
│   │   ├── poll.service.ts     # Poll logic
│   │   ├── vote.service.ts     # Vote logic
│   │   ├── chat.service.ts     # Chat logic
│   │   └── participant.service.ts # Participant tracking
│   ├── db.ts                   # Prisma Singleton
│   ├── utils.ts                # Utilities
│   └── validators.ts           # Input Validators
├── server.ts                   # Socket.IO Controller
├── prisma/
│   └── schema.prisma           # Database Schema
└── public/                     # Static Assets
```

---

## 🧠 Service Layer Implementation

### 1. `PollService` (`lib/services/poll.service.ts`)
Handles core polling logic.
- **Methods**:
  - `createPoll(input)`: Validates teacher & creates poll with options.
  - `startPoll(pollId)`: Sets `startedAt` timestamp, transitions status to ACTIVE.
  - `endPoll(pollId)`: Closes poll, calculates final structure.
  - `getPollResults(pollId)`: Returns aggregated vote counts and percentages.
  - `getActivePoll(teacherId)`: Finds current active poll for a teacher.
  - `closeAllPolls(teacherId)`: Safety method to close all polls for a teacher.

### 2. `VoteService` (`lib/services/vote.service.ts`)
Handles voting integrity.
- **Methods**:
  - `submitVote(input)`: Validates poll status (ACTIVE), uniqueness (student hasn't voted), and option context.
  - `getPollVotes(pollId)`: Retrieves all votes.
  - `hasStudentVoted(pollId, studentId)`: Boolean check.

### 3. `ChatService` (`lib/services/chat.service.ts`)
Handles messaging persistence.
- **Methods**:
  - `sendMessage(input)`: Persists message to DB.
  - `getRecentMessages(pollId, limit)`: Fetches chat history.

### 4. `ParticipantService` (`lib/services/participant.service.ts`)
Manages in-memory state for active connections.
- **Methods**:
  - `addParticipant(socketId, data)`: Maps socket ID to user info.
  - `removeParticipant(socketId)`: Cleans up on disconnect.
  - `getStudentsByPoll(pollId)`: Returns listing for teacher view.
  - `getStudentSocketId(studentId)`: Lookup for "Kick" functionality.

---

## 🎮 Controller Layer Implementation

### REST API Controllers
Located in `app/api/**`.
- **Pattern**:
  1. Extract body/query params.
  2. Perform basic input validation (e.g. required fields).
  3. Call Service method.
  4. Return JSON response.
  5. (Optional) Broadcast socket event if state changed.

**Example** (`app/api/polls/route.ts`):
```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  // Call Service
  const poll = await PollService.createPoll(body);
  return NextResponse.json(poll);
}
```

### Socket.IO Controller
Located in `server.js`.
- **Pattern**: Listen to event → Call Service → Emit result.

**Example**:
```javascript
socket.on('poll:start', async ({ pollId }) => {
  try {
    const poll = await PollService.startPoll(pollId);
    io.to(pollId).emit('poll:started', poll);
  } catch (err) {
    socket.emit('error', err.message);
  }
});
```

---

## 📡 API Documentation

### Polls
- `POST /api/polls`: Create a new poll.
- `GET /api/polls`: Get active poll for a teacher.
- `POST /api/polls/[id]/start`: Start a poll.
- `POST /api/polls/[id]/end`: End a poll.
- `GET /api/polls/[id]/results`: Get calculation results.
- `POST /api/polls/close-all`: Emergency stop all polls.
- `GET /api/polls/history`: Get past polls.

### Votes
- `POST /api/votes`: Submit a vote.
  - **Body**: `{ pollId, studentId, optionId }`

### Chat
- `POST /api/chat`: Send a message.
- `GET /api/chat`: Fetch message history.

---

## 🔌 Socket.io Events

### Client Emits (Requests)
- `join:poll`: Student joins a session.
- `poll:create`: Teacher creates a poll.
- `poll:start`: Teacher starts the timer.
- `poll:end`: Teacher ends the poll early/normally.
- `vote:submit`: Student casts a vote.
- `message:send`: User sends a chat.
- `student:kick`: Teacher removes a student.

### Server Emits (Responses)
- `poll:created`: Acknowledge creation.
- `poll:started`: Broadcast start (triggers timer).
- `poll:ended`: Broadcast end (show results).
- `poll:updated`: Generic state update.
- `results:updated`: Real-time bar chart update.
- `participants:update`: List of online users changed.
- `message:received`: New chat message.
- `error`: Warning/Error toast message.

---

## 🛠 Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 12+

### 1. Installation
```bash
git clone <repository-url>
cd live-polling-system
npm install
```

### 2. Environment Variables
Create `.env.local`:
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/db_name"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"
```

### 3. Database Migration
```bash
npx prisma migrate dev --name init
```

### 4. Run Development Server
```bash
npm run dev
```
Visit http://localhost:3000.

---

## 🔑 Key Principles

### 1. No Prisma in Controllers
Controllers never import `prisma`. They import `Services`.

### 2. Services are Reusable
Code written in `PollService` is used by both the REST API endpoint `POST /api/polls` AND the Socket event `poll:create`. This prevents logic duplication.

### 3. Server-Side Timer Authority
The exact start time is stored in the DB (`startedAt`). Clients utilize this timestamp to calculate remaining time, rather than relying on their own unstable `setTimeout` loops. This ensures all students see the exact same countdown, even if they refresh the page.

### 4. Stateful Participant Tracking
While Polls/Votes are stored in Postgres, active "Online Status" is transient. `ParticipantService` uses in-memory Maps to track who is currently connected via Socket.IO.

---

## 🔄 Refactoring Summary

**Status**: Complete ✅

The project underwent a massive refactoring to move from a monolithic "fat controller" approach to the layered architecture described above.

- **Removed**: Direct database calls from `server.js` and Next.js Route Handlers.
- **Created**: `lib/services/` directory containing dedicated logic classes.
- **Improved**: Error handling is now centralized in services, throwing descriptive errors that controllers catch and display.
- **Result**: A highly testable, maintainable, and scalable codebase ready for production extension.
