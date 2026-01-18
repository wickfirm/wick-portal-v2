import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "./prisma";

function getSubdomainFromHost(hostname: string): string | null {
  const host = hostname.split(':')[0];
  
  if (host === 'localhost' || host === '127.0.0.1') {
    return process.env.DEV_TENANT_SLUG || null;
  }
  
  const parts = host.split('.');
  
  if (parts.length >= 3) {
    return parts[0];
  }
  
  return null;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        console.log("Login attempt for:", credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }
        
        try {
          // Get subdomain from request
          const hostname = req?.headers?.host || '';
          const subdomain = getSubdomainFromHost(hostname);
          
          console.log("Querying database for subdomain:", subdomain);
          
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              agency: true,
            },
          });

          console.log("User found:", user ? user.email : "none");

          if (!user) {
            console.log("No user found");
            return null;
          }

          // Validate user belongs to this tenant
          if (subdomain && user.agency?.slug !== subdomain) {
            console.log("User does not belong to this tenant");
            return null;
          }

          console.log("Checking password...");
          const isValid = await compare(credentials.password, user.password);
          console.log("Password valid:", isValid);
          
          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            agencyId: user.agencyId,
            agencySlug: user.agency?.slug,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.agencyId = (user as any).agencyId;
        token.agencySlug = (user as any).agencySlug;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).agencyId = token.agencyId;
        (session.user as any).agencySlug = token.agencySlug;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
