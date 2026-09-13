# 1. Why: Problem being solved

Implement the core attendance feature for the DTR application.

The application is a personal OJT/internship hour tracker. Authenticated users need to record when they start and finish their OJT day and track their accumulated hours against `User.requiredHours`.

The official school/company DTR remains the authoritative attendance record. This application only tracks the user's progress.

# 2. What: Concrete deliverable

Implement the backend attendance feature only.

Deliver:

- `Attendance` Prisma model.
- `User` → `Attendance` relation.
- Prisma migration.
- Attendance schemas/validation where needed.
- Attendance service.
- Attendance controller.
- Attendance routes.
- JWT-protected attendance endpoints.
- Clock-in.
- Clock-out.
- Today's attendance.
- Attendance history.
- OJT hours summary.

Mount the routes in `server.ts` using:

```ts
app.use("/api/attendance", attendanceRoutes);
```

# 3. Constraints: Must / Must Not / Out of Scope

## Must

- Follow the repository's existing architecture:
  - `controllers/`
  - `services/`
  - `routes/`
  - `middleware/`
  - `schemas/`
- Use the existing Prisma client setup.
- Use the existing `requireAuth` middleware.
- Use `req.user!.id` as the authenticated user's ID.
- Use the existing Zod `validate()` middleware.
- Follow the existing response format where practical.
- Generate `clockIn` and `clockOut` timestamps on the server.
- Do not accept user-controlled clock-in/out timestamps.
- Allow only one active attendance per user.
- Allow only one attendance record per user per working date.
- `clockOut` must be later than `clockIn`.
- Calculate rendered hours from `clockIn` and `clockOut`.
- Calculate OJT progress from attendance records and `User.requiredHours`.
- Keep derived values out of the database.
- Scope all attendance queries to the authenticated user.
- Keep Prisma/database operations inside services.
- Keep controllers thin.
- Use clear HTTP status codes and existing error-response conventions.
- Verify the implementation with TypeScript/build checks and API testing.

## Must Not

- Do not modify the existing authentication flow.
- Do not create another JWT/authentication system.
- Do not modify `requireAuth` unless absolutely required for TypeScript integration.
- Do not accept `userId` from the client.
- Do not store `completedHours`, `remainingHours`, or `progressPercentage`.
- Do not put Prisma queries in controllers.
- Do not introduce unnecessary dependencies.
- Do not implement frontend changes.
- Do not implement breaks/lunch tracking.
- Do not implement supervisor verification.
- Do not implement manual attendance editing.
- Do not implement attendance correction workflows.
- Do not implement GPS, biometrics, geofencing, or anti-cheating systems.
- Do not redesign unrelated existing code.

## Out of Scope

- Frontend/UI.
- Break management.
- Supervisor/admin attendance management.
- Attendance approval.
- Manual time correction.
- PDF/Excel DTR export.
- Notifications.
- GPS/location tracking.
- Biometric verification.
- Payroll.

# 4. Current State: Existing code & patterns

Repository:

`Vryon09/dtr`

Backend structure currently follows:

```text
backend/src/
├── controllers/
│   └── authController.ts
├── middleware/
│   ├── auth.ts
│   └── validate.ts
├── routes/
│   └── authRoutes.ts
├── schemas/
│   └── authSchemas.ts
├── services/
│   └── authService.ts
├── lib/
│   └── prisma.ts
└── server.ts
```

Existing `User` model:

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  name          String?
  requiredHours Int
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

`requiredHours` is the user's OJT/internship target.

Add:

```prisma
attendances Attendance[]
```

to `User`.

Use this initial model:

```prisma
model Attendance {
  id        String    @id @default(cuid())
  userId    String
  date      DateTime
  clockIn   DateTime
  clockOut  DateTime?
  notes     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, date])
  @@index([userId, clockOut])
}
```

Do not add `totalHours` to the model. Rendered hours are derived from `clockIn` and `clockOut`.

## Existing authentication

`requireAuth` reads the JWT from the `token` cookie and sets:

```ts
req.user = { id: payload.userId };
```

Therefore attendance endpoints should use:

```ts
req.user!.id;
```

and never accept the user ID from the request body.

Authentication is already implemented. Do not recreate it.

## Existing validation

The project already has:

```ts
validate(schema);
```

which validates `req.body` using Zod and returns:

```json
{
  "success": false,
  "errors": [...]
}
```

Follow this existing pattern.

## Existing route mounting

`server.ts` currently mounts:

```ts
app.use("/api/auth", authRoutes);
```

Add:

```ts
app.use("/api/attendance", attendanceRoutes);
```

Do not change the existing auth route mounting.

# 5. Tasks: Small, verifiable steps

## Task 1 — Inspect before modifying

Inspect the existing:

- Prisma configuration/client.
- `authController.ts`.
- `authService.ts`.
- `authRoutes.ts`.
- `auth.ts`.
- `validate.ts`.
- `server.ts`.
- Current Prisma schema.

Do not modify code during this task.

Identify the exact patterns attendance should follow.

## Task 2 — Add the Attendance model

Update the Prisma schema:

- Add `User.attendances`.
- Add `Attendance`.
- Add the necessary unique constraint/indexes.

Create the migration using the repository's existing Prisma setup.

Verify the migration and Prisma client generation succeed.

Do not modify unrelated models.

## Task 3 — Implement attendance service

Create:

```text
services/attendanceService.ts
```

Implement the core operations:

```text
clockIn(userId)
clockOut(userId)
getToday(userId)
getHistory(userId)
getSummary(userId)
```

Business rules belong here.

### Clock in

- Determine the current server timestamp.
- Determine the current working date.
- Check whether the user already has an attendance for that date.
- Reject the operation if an attendance already exists.
- Otherwise create the attendance with:
  - `date`
  - `clockIn`
  - `clockOut = null`

### Clock out

- Find the user's active attendance (`clockOut = null`).
- Reject if none exists.
- Generate the current server timestamp.
- Set `clockOut`.
- Ensure it is later than `clockIn`.

### Hours calculation

Calculate rendered hours from:

```text
clockOut - clockIn
```

Do not persist the calculated value.

Choose a consistent representation for the API response and document the calculation clearly.

## Task 4 — Implement validation

Create attendance schemas only where request-body validation is actually necessary.

Clock-in and clock-out should not receive timestamps from the client.

If notes are supported, validate them using Zod and impose a reasonable maximum length.

Do not introduce validation abstractions that the project does not already need.

## Task 5 — Implement controller

Create:

```text
controllers/attendanceController.ts
```

Implement:

```text
clockIn
clockOut
getToday
getHistory
getSummary
```

Controllers should:

1. Obtain `req.user!.id`.
2. Call the appropriate service.
3. Return the response.
4. Handle errors using the existing project convention.

Do not put business logic or Prisma queries in the controller.

## Task 6 — Implement routes

Create:

```text
routes/attendanceRoutes.ts
```

Routes:

```text
POST /clock-in
POST /clock-out
GET  /today
GET  /
GET  /summary
```

Protect every route with:

```ts
requireAuth;
```

Follow the existing route style from `authRoutes.ts`.

## Task 7 — Mount routes

Update `server.ts`:

```ts
import attendanceRoutes from "./routes/attendanceRoutes.js";
```

and:

```ts
app.use("/api/attendance", attendanceRoutes);
```

Do not alter the existing `/api/auth` behavior.

## Task 8 — Attendance history

Implement:

```text
GET /api/attendance
```

Return only the authenticated user's attendance records.

Order records consistently, preferably newest first.

If the project already has a pagination convention, follow it.

If it does not, do not introduce an unnecessarily complex pagination system for this first implementation.

## Task 9 — OJT summary

Implement:

```text
GET /api/attendance/summary
```

Return:

```json
{
  "requiredHours": 600,
  "completedHours": 103.5,
  "remainingHours": 496.5,
  "progressPercentage": 17.25
}
```

Use:

```text
requiredHours = User.requiredHours

completedHours =
  sum of completed attendance durations

remainingHours =
  max(requiredHours - completedHours, 0)

progressPercentage =
  min((completedHours / requiredHours) * 100, 100)
```

Do not store these calculated values.

Do not count an active attendance toward completed hours unless it has a `clockOut`.

## Task 10 — Verify edge cases

Test:

```text
Unauthenticated request
        → 401

Clock in
        → success

Clock in again
        → reject

Get today
        → returns active attendance

Clock out
        → success + calculated duration

Clock out again
        → reject

Get history
        → only current user's records

Get summary
        → correct OJT calculations
```

Also verify:

- A user cannot access another user's attendance.
- Client timestamps cannot manipulate clock-in/out.
- Duplicate daily attendance is prevented.
- TypeScript compilation succeeds.
- Prisma migration succeeds.

## Completion criteria

Stop when:

- Attendance schema is migrated successfully.
- Attendance follows the existing project architecture.
- JWT authentication is reused.
- Clock-in works.
- Clock-out works.
- Duplicate attendance is rejected.
- Attendance history works.
- OJT summary works.
- Derived hours are not stored.
- Existing auth functionality remains unchanged.
- No frontend or out-of-scope features were added.
