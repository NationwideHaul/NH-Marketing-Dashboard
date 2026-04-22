import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

async function refreshAccessToken(token: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        grant_type: "refresh_token",
        refresh_token: token.refreshToken as string,
      }),
    });

    const refreshed = await response.json();

    if (!response.ok) {
      console.error("Token refresh failed:", refreshed);
      throw new Error(refreshed.error || "Token refresh failed");
    }

    return {
      ...token,
      accessToken: refreshed.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + (refreshed.expires_in || 3600),
      // Keep the existing refresh token if a new one wasn't provided
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        if (
          email === process.env.DASHBOARD_EMAIL &&
          password === process.env.DASHBOARD_PASSWORD
        ) {
          return { id: "1", name: "NH Marketing", email };
        }
        return null;
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/analytics.readonly",
            "https://www.googleapis.com/auth/adwords",
            "https://www.googleapis.com/auth/business.manage",
            "https://www.googleapis.com/auth/youtube.readonly",
            "https://www.googleapis.com/auth/yt-analytics.readonly",
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // On initial sign-in with Google, save all tokens
      if (account && account.provider === "google") {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
        };
      }

      // If token hasn't expired yet, return it as-is
      const expiresAt = (token.expiresAt as number) || 0;
      if (Date.now() / 1000 < expiresAt - 60) {
        return token;
      }

      // Token is expired or about to expire -- refresh it
      console.log("Access token expired, refreshing...");
      return await refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      (session as any).refreshToken = token.refreshToken as string; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (token.error) {
        (session as any).error = token.error; // eslint-disable-line @typescript-eslint/no-explicit-any
      }
      return session;
    },
  },
});
