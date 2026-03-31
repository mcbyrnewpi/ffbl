import NextAuth, { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  // Because we are using a Credentials provider (our Dev Simulator), 
  // NextAuth requires us to use JWT sessions instead of Database sessions.
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {

    // 1. Only allow existing users to log in
    async signIn({ user }) {
      if (!user.email) return false;

      // Check if this email exists in our database
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email.toLowerCase() },
      });

      // If they aren't in the database, reject the login
      if (!existingUser) {
        // Returning false kicks them back to the login page with an AccessDenied error
        return false; 
      }

      // If they are in the DB, let them in!
      return true;
    },

    // 2. When a user logs in, we attach their DB info to the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.teamId = (user as any).teamId;
      }
      return token;
    },
    // 2. We pass that token data down to the frontend session object
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).teamId = token.teamId;
      }
      return session;
    },
  },
};

// 🛑 THE SECRET DEV SIMULATOR 🛑
// This will ONLY exist when you are running `npm run dev`
if (process.env.NODE_ENV === "development") {
  authOptions.providers.push(
    CredentialsProvider({
      id: "dev-simulator",
      name: "Dev Simulator",
      credentials: {
        email: { label: "Simulate User by Email", type: "email", placeholder: "commish@ffbl.com" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        
        // Find the user they typed into the Dev Login box
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // If they exist, log them in instantly (no password required)
        if (user) return user;
        return null;
      }
    })
  );
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };