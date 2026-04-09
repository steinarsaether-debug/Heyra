import { DefaultSession } from "next-auth";
import { UserRole, UserStatus } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole;
      roles: UserRole[];
      status: UserStatus;
      fullName: string;
    };
  }

  interface User {
    id: string;
    role: UserRole;
    roles: UserRole[];
    status: UserStatus;
    fullName: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    roles: UserRole[];
    status: UserStatus;
    fullName: string;
  }
}
