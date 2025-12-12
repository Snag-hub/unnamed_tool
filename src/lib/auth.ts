import { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/db';
import { accounts, sessions, users, verificationTokens } from '../db/schema';
import { Adapter } from 'next-auth/adapters';
import { createTransport } from 'nodemailer';

export const authOptions: NextAuthOptions = {
    adapter: DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
    }) as Adapter,
    providers: [
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        EmailProvider({
            server: {
                host: process.env.EMAIL_SERVER_HOST,
                port: Number(process.env.EMAIL_SERVER_PORT),
                auth: {
                    user: process.env.MAILJET_API_KEY,
                    pass: process.env.MAILJET_SECRET_KEY,
                },
            },
            from: process.env.EMAIL_FROM,
            sendVerificationRequest: async ({ identifier, url, provider }) => {
                const transport = createTransport(provider.server);
                await transport.sendMail({
                    to: identifier,
                    from: provider.from,
                    subject: 'Sign in to Read-Later',
                    html: `<p>Click the magic link below to sign in to Read-Later:</p>
                 <p><a href="${url}">Sign in</a></p>`,
                });
            },
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        session: ({ session, user }) => ({
            ...session,
            user: {
                ...session.user,
                id: user.id,
            },
        }),
    },
    // pages: {
    //     signIn: '/', // Custom sign-in page
    //     error: '/', // Error page
    // },
};
