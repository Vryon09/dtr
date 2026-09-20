1. Profile settings

Allow the authenticated user to update:

name
email

Rules:

name: optional, reasonable length limit
email: valid email format
email must remain unique
require authentication 2. OJT settings

Allow the user to update:

requiredHours

Rules:

integer
minimum 1
no negative/decimal values
require authentication

Example:

{
"name": "Vryon Antonio",
"email": "vryon@example.com",
"requiredHours": 600
} 3. Change password

Endpoint for changing the authenticated user's password.

Require:

currentPassword
newPassword

Rules:

current password must be verified with bcrypt
new password must satisfy the same password requirements as registration
new password must not be empty
never return/store the plaintext password

Example:

{
"currentPassword": "old-password",
"newPassword": "new-password"
} 4. Get current settings

The frontend needs a way to load the user's current settings.

Return only safe fields:

{
"id": "...",
"name": "Vryon Antonio",
"email": "vryon@example.com",
"requiredHours": 600
}

Never return:

passwordHash
Suggested API
GET /api/settings
PATCH /api/settings
PATCH /api/settings/password

All three should use:

requireAuth

So the user ID comes from the JWT rather than from a URL/body.

Architecture

Follow the exact architecture you already established:

routes
↓
middleware
↓
controller
↓
service
↓
Prisma

Files:

src/
├── controllers/
│ └── settingsController.ts
├── services/
│ └── settingsService.ts
├── routes/
│ └── settingsRoutes.ts
└── schemas/
└── settingsSchemas.ts

And in server.ts:

app.use("/api/settings", settingsRoutes);
