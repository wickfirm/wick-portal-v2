// src/lib/project-assignments.ts
// Helper functions for project-level assignment system

import prisma from "./prisma";

/**
 * Get all project IDs assigned to a user
 * Returns empty array if no assignments (means show all client projects)
 */
export async function getUserAssignedProjects(userId: string): Promise<string[]> {
  const assignments = await prisma.projectAssignment.findMany({
    where: { userId },
    select: { projectId: true },
  });
  
  return assignments.map(a => a.projectId);
}

/**
 * Get project filter for a user based on their role and assignments
 * 
 * Logic:
 * - ADMIN/SUPER_ADMIN: See all projects in their agency
 * - MEMBER with project assignments: See only assigned projects
 * - MEMBER without project assignments: See all projects from assigned clients (fallback)
 */
export async function getProjectFilterForUser(
  userId: string,
  role: string,
  agencyId: string | null
): Promise<any> {
  
  // ADMIN and SUPER_ADMIN see all agency projects
  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    if (!agencyId) return {};
    
    return {
      client: {
        agencies: {
          some: {
            agencyId: agencyId
          }
        }
      }
    };
  }
  
  // MEMBER role - check for project assignments
  if (role === "MEMBER") {
    // Check if user has any project assignments
    const projectAssignments = await prisma.projectAssignment.findMany({
      where: { userId },
      select: { projectId: true },
    });
    
    // If user has project assignments, use those
    if (projectAssignments.length > 0) {
      const projectIds = projectAssignments.map(a => a.projectId);
      return { id: { in: projectIds } };
    }
    
    // Fallback: No project assignments, show all projects from assigned clients
    const clientAssignments = await prisma.clientTeamMember.findMany({
      where: { userId },
      select: { clientId: true },
    });
    const clientIds = clientAssignments.map(a => a.clientId);
    
    return { clientId: { in: clientIds } };
  }
  
  // Default: no filter
  return {};
}

/**
 * Check if a user has access to a specific project
 */
export async function userHasProjectAccess(
  userId: string,
  projectId: string,
  role: string,
  agencyId: string | null
): Promise<boolean> {
  // ADMIN/SUPER_ADMIN have access to all agency projects
  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    if (!agencyId) return false;
    
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client: {
          teamMembers: {
            some: {
              user: { agencyId }
            }
          }
        }
      }
    });
    
    return !!project;
  }
  
  // MEMBER - check project assignments first
  if (role === "MEMBER") {
    const projectAssignment = await prisma.projectAssignment.findFirst({
      where: { userId, projectId }
    });
    
    if (projectAssignment) return true;
    
    // Fallback: Check if user is assigned to the client
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { clientId: true }
    });
    
    if (!project) return false;
    
    const clientAssignment = await prisma.clientTeamMember.findFirst({
      where: {
        userId,
        clientId: project.clientId
      }
    });
    
    return !!clientAssignment;
  }
  
  return false;
}

/**
 * Assign a user to multiple projects
 */
export async function assignUserToProjects(
  userId: string,
  projectIds: string[]
): Promise<void> {
  // Delete existing assignments
  await prisma.projectAssignment.deleteMany({
    where: { userId }
  });
  
  // Create new assignments
  if (projectIds.length > 0) {
    await prisma.projectAssignment.createMany({
      data: projectIds.map(projectId => ({
        id: `pa-${userId}-${projectId}`,
        userId,
        projectId,
        role: 'MEMBER', // Default role for project assignments
        createdAt: new Date(),
      }))
    });
  }
}

/**
 * Get projects assigned to a user (with full project details)
 */
export async function getUserAssignedProjectsWithDetails(userId: string) {
  const assignments = await prisma.projectAssignment.findMany({
    where: { userId },
    include: {
      project: {
        include: {
          client: {
            select: { id: true, name: true, nickname: true }
          }
        }
      }
    }
  });
  
  return assignments.map(a => a.project);
}
