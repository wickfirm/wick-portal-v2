import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createDefaultProjects() {
  console.log("🚀 Starting migration: Creating Admin/Operations projects...\n");

  try {
    // Get all clients
    const clients = await (prisma.client.findMany as any)({
      include: {
        projects: true,
      },
    }) as any[];

    console.log(`Found ${clients.length} clients\n`);

    let created = 0;
    let skipped = 0;
    let tasksAssigned = 0;

    for (const client of clients) {
      // Check if client already has a default project
      const hasDefault = client.projects.some((p: any) => p.isDefault);
      
      if (hasDefault) {
        console.log(`⏭️  ${client.name} - Already has default project, skipping`);
        skipped++;
        continue;
      }

      console.log(`📝 ${client.name} - Creating Admin/Operations project...`);
      
      // Create the default project
      const defaultProject = await prisma.project.create({
        data: {
          name: "Admin/Operations",
          description: "General administrative tasks and operations",
          clientId: client.id,
          serviceType: "CONSULTING",
          status: "IN_PROGRESS",
          isDefault: true,
        },
      });

      created++;

      // Find all orphaned tasks for this client
      const orphanedTasks = await prisma.clientTask.findMany({
        where: {
          clientId: client.id,
          projectId: null,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (orphanedTasks.length > 0) {
        console.log(`   └─ Found ${orphanedTasks.length} orphaned tasks, assigning to Admin/Operations...`);
        
        // Assign all orphaned tasks to the default project
        await prisma.clientTask.updateMany({
          where: {
            clientId: client.id,
            projectId: null,
          },
          data: {
            projectId: defaultProject.id,
          },
        });

        tasksAssigned += orphanedTasks.length;
      } else {
        console.log(`   └─ No orphaned tasks found`);
      }
    }

    console.log("\n✅ Migration complete!");
    console.log(`   - Created: ${created} default projects`);
    console.log(`   - Skipped: ${skipped} clients (already had default)`);
    console.log(`   - Assigned: ${tasksAssigned} orphaned tasks\n`);

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
createDefaultProjects()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
