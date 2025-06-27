import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import * as ldap from "ldapjs";
import { readLdapConfig, isLdapEnabled } from "./ldap-config";

interface LDAPUser {
  uid: string;
  mail: string;
  cn: string;
  dn: string;
}

async function authenticateWithLDAP(username: string, password: string): Promise<LDAPUser | null> {
  try {
    // Read current LDAP configuration
    const ldapConfig = await readLdapConfig();
    
    // Check if LDAP is enabled
    if (!ldapConfig.enabled) {
      console.log("LDAP authentication disabled in configuration");
      return null;
    }
    
    const userDn = `uid=${username},ou=users,${ldapConfig.baseDn}`;
    
    console.log(`LDAP auth attempt for: ${userDn}`);
    
    return new Promise((resolve) => {
      const client = ldap.createClient({
        url: ldapConfig.ldapUrl,
        timeout: 5000,
        connectTimeout: 10000,
      });

      client.bind(userDn, password, (bindErr: any) => {
        if (bindErr) {
          console.error("LDAP bind error:", bindErr);
          client.unbind();
          resolve(null);
          return;
        }

        console.log("LDAP bind successful!");
        
        // If bind successful, we know the user is valid
        // Return user info without doing a search (which might fail due to permissions)
        const userFound: LDAPUser = {
          uid: username,
          mail: `${username}@tasmota.local`,
          cn: username === "admin" ? "Administrator" : `${username}`,
          dn: userDn,
        };

        client.unbind();
        resolve(userFound);
      });

      client.on("error", (err: any) => {
        console.error("LDAP client error:", err);
        resolve(null);
      });
    });
  } catch (error) {
    console.error("Error reading LDAP config:", error);
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "admin",
      name: "Admin Login",
      credentials: {
        username: {
          label: "Username",
          type: "text",
          placeholder: "Enter admin username",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter admin password",
        },
      },
      async authorize(credentials: Record<"username" | "password", string> | undefined) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        // Check admin credentials from env
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (credentials.username === adminUsername && credentials.password === adminPassword) {
          return {
            id: "admin",
            name: "Administrator",
            email: "admin@tasmota.local",
            username: "admin",
            role: "admin",
          };
        }

        return null;
      },
    }),
    CredentialsProvider({
      id: "ldap",
      name: "LDAP",
      credentials: {
        username: {
          label: "Username",
          type: "text",
          placeholder: "Enter your username",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter your password",
        },
      },
      async authorize(credentials: Record<"username" | "password", string> | undefined) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const ldapUser = await authenticateWithLDAP(
            credentials.username,
            credentials.password
          );

          if (ldapUser) {
            return {
              id: ldapUser.uid,
              name: ldapUser.cn,
              email: ldapUser.mail,
              username: ldapUser.uid,
              role: "user",
            };
          }
        } catch (error) {
          console.error("LDAP authentication error:", error);
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = (user as any).username;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.username = token.username as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 