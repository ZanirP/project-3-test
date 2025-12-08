import NextAuth, { type AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { upsertUserByEmail } from "@/lib/db";

export const authOptions: AuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),

        CredentialsProvider({
            name: "PIN Login",
            credentials: {
                id: { label: "ID", type: "text" },
                role: { label: "Role", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.id || !credentials.role) return null;

                return {
                    id: credentials.id,
                    role: credentials.role,
                } as any;
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },

    // TODO: implement this properly so it logs user out after closing tabs
    cookies: {
        sessionToken: {
            name: "next-auth.session-token",
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
                expires: undefined,
            },
        },
    },

    callbacks: {
        async jwt({ token, user, account }) {
            if (account?.provider) {
                token.provider = account.provider;
            }
            if (user) {
                if (account?.provider === "google" && user?.email) {
                    // insert the user into the users table with their email.
                    const dbUser = await upsertUserByEmail(user.email);

                    token.id = dbUser.id;
                    token.email = dbUser.email;
                    token.role = "customer";
                    (token as any).loyaltyPoints = dbUser.loyalty_points;
                } else {
                    token.id = user.id as string;
                    token.role = (user as any).role ?? "customer";
                }
            }
            return token;
        },

        async session({ session, token }) {
            session.user.id = token.id as any;
            session.user.role = token.role as any;
            session.user.provider = token.provider as string;
            if (token.email) {
                session.user.email = token.email as string;
            }
            (session.user as any).loyaltyPoints =
                (token as any).loyaltyPoints ?? 0;

            return session;
        },

        async redirect({ url, baseUrl }) {
            // If NextAuth gives us a relative URL (e.g. "/customerOrderTest"), allow it
            if (url.startsWith("/")) return url;

            // If it's the same origin full URL, allow it
            try {
                const parsed = new URL(url);
                if (parsed.origin === baseUrl) return url;
            } catch {
                // if URL parsing fails, just fall back
            }

            // Fallback: home
            return baseUrl;
        },
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
