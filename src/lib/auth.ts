import { NextAuthOptions, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import prisma from "./prisma";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      agencyId: string | null;
      agencySlug: string | null;
    };
  }
  
  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    agencyId: string | null;
    agencySlug: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    agencyId: string | null;
    agencySlug: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth Provider - for Google Workspace users
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          // Only allow specific hosted domain (Google Workspace)
          hd: "thewickfirm.com",
        },
      },
    }),
    // Email/Password credentials provider
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        console.log("Login attempt for:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        try {
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

          console.log("Checking password...");
          const isValid = await compare(credentials.password, user.password);
          console.log("Password valid:", isValid);

          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name || user.email, // Fallback to email if name is null
            role: user.role,
            agencyId: user.agencyId,
            agencySlug: user.agency?.slug || null,
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "production" ? '.omnixia.ai' : undefined,
      }
    }
  },
  callbacks: {
    async signIn({ user, account }) {
      // For Google OAuth, verify user exists in database
      if (account?.provider === "google") {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email || "" },
            include: { agency: true },
          });

          if (!dbUser) {
            // User doesn't exist in our system - reject sign in
            console.log("Google OAuth: User not found in database:", user.email);
            return "/login?error=NoAccount";
          }

          if (!dbUser.isActive) {
            console.log("Google OAuth: User account is inactive:", user.email);
            return "/login?error=AccountInactive";
          }

          console.log("Google OAuth: User authenticated:", user.email);
          return true;
        } catch (error) {
          console.error("Google OAuth error:", error);
          return "/login?error=AuthError";
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // For Google OAuth, fetch user details from database
      if (account?.provider === "google" && user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { agency: true },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role || "MEMBER";
          token.agencyId = dbUser.agencyId;
          token.agencySlug = dbUser.agency?.slug || null;
        }
      } else if (user) {
        // Credentials provider - user object already has the data
        token.id = user.id;
        token.role = user.role;
        token.agencyId = user.agencyId;
        token.agencySlug = user.agencySlug;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.agencyId = token.agencyId;
        session.user.agencySlug = token.agencySlug;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  events: {
    async signOut({ token }) {
      console.log("User signed out:", token?.email);
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
