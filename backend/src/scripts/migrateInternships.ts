import { prisma } from "../lib/prisma.js";

async function run() {
  console.log("Starting migration...");
  try {
    // 1. Create Internship table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Internship" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "companyName" TEXT,
        "requiredHours" INTEGER NOT NULL DEFAULT 300,
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "startDate" DATE,
        "endDate" DATE,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Internship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    console.log("Internship table verified/created.");

    // 2. Add activeInternshipId column to User if missing
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "activeInternshipId" TEXT;
    `);

    // 3. Add internshipId column to Attendance if missing (allow null temporarily)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "internshipId" TEXT;
    `);

    // 4. Find all users without an internship and create one
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users.`);

    for (const user of users) {
      let internship = await prisma.internship.findFirst({
        where: { userId: user.id },
      });

      if (!internship) {
        internship = await prisma.internship.create({
          data: {
            userId: user.id,
            title: "Internship 1",
            requiredHours: user.requiredHours || 300,
            status: "ACTIVE",
          },
        });
        console.log(`Created default internship ${internship.id} for user ${user.id}`);
      }

      // Link any attendance without internshipId to this internship
      const updateResult = await prisma.$executeRawUnsafe(
        `UPDATE "Attendance" SET "internshipId" = $1 WHERE "userId" = $2 AND ("internshipId" IS NULL OR "internshipId" = '');`,
        internship.id,
        user.id
      );
      console.log(`Linked attendances for user ${user.id} (updated: ${updateResult})`);

      // Set activeInternshipId if null
      if (!user.activeInternshipId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { activeInternshipId: internship.id },
        });
      }
    }

    // 5. Enforce NOT NULL and constraints on Attendance
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Attendance" ALTER COLUMN "internshipId" SET NOT NULL;
    `);

    // Drop old unique index on (userId, date) if present
    await prisma.$executeRawUnsafe(`
      DROP INDEX IF EXISTS "Attendance_userId_date_key";
    `);

    // Create unique index on (internshipId, date)
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Attendance_internshipId_date_key" ON "Attendance"("internshipId", "date");
    `);

    // Create index on internshipId
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Attendance_internshipId_idx" ON "Attendance"("internshipId");
    `);

    // Create index on Internship (userId, status)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Internship_userId_status_idx" ON "Internship"("userId", "status");
    `);

    // Add FK constraint if not exists
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'Attendance_internshipId_fkey'
        ) THEN
          ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_internshipId_fkey"
          FOREIGN KEY ("internshipId") REFERENCES "Internship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    console.log("Migration completed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
