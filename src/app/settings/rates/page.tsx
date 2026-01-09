import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Header from "@/components/Header";
import { theme } from "@/lib/theme";
import RatesManager from "./rates-manager";

export const dynamic = "force-dynamic";

export default async function RatesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  
  const currentUser = session.user as any;
  const dbUser = await prisma.user.findUnique({
    where: { email: currentUser.email },
  });

  if (!dbUser) redirect("/login");

  // Only SUPER_ADMIN can access rates
  if (dbUser.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  // Fetch team members with their rates
  const teamMembers = await prisma.user.findMany({
    where: { 
      isActive: true,
      role: { not: "CLIENT" },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      hourlyRate: true,
    },
    orderBy: { name: "asc" },
  });

  // Fetch clients with their bill rates
  const clients = await prisma.client.findMany({
    where: { status: { in: ["ACTIVE", "ONBOARDING"] } },
    select: {
      id: true,
      name: true,
      nickname: true,
      billRate: true,
    },
    orderBy: { name: "asc" },
  });

  // Fetch projects with their bill rates
  const projects = await prisma.project.findMany({
  where: { 
    status: { 
      in: ["DRAFT", "PENDING_APPROVAL", "IN_PROGRESS"] 
    } 
  },
    select: {
      id: true,
      name: true,
      clientId: true,
      billRate: true,
      client: {
        select: { name: true, nickname: true },
      },
    },
    orderBy: { name: "asc" },
  });

  // Serialize decimal values
  const serializedTeam = teamMembers.map(m => ({
    ...m,
    hourlyRate: m.hourlyRate ? Number(m.hourlyRate) : null,
  }));

  const serializedClients = clients.map(c => ({
    ...c,
    billRate: c.billRate ? Number(c.billRate) : null,
  }));

  const serializedProjects = projects.map(p => ({
    ...p,
    billRate: p.billRate ? Number(p.billRate) : null,
  }));

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.bgPrimary }}>
      <Header />
      
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, color: theme.colors.textPrimary, margin: 0, marginBottom: 8 }}>
            Rates & Billing
          </h1>
          <p style={{ fontSize: 14, color: theme.colors.textSecondary, margin: 0 }}>
            Manage team cost rates and client billing rates
          </p>
        </div>

        <RatesManager 
          teamMembers={serializedTeam}
          clients={serializedClients}
          projects={serializedProjects}
        />
      </main>
    </div>
  );
}
