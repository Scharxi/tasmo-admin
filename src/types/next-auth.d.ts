import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username?: string;
      role?: string;
    };
  }

  interface User {
    username?: string;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username?: string;
    role?: string;
  }
} 