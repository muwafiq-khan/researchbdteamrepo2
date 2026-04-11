// src/types/next-auth.d.ts
// This file extends NextAuth's built-in TypeScript types
// to include our custom fields: id and accountType
// Without this, TypeScript complains that id and accountType
// don't exist on the session or token objects
// Python equivalent: there's no direct equivalent — Python is duck-typed

import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    accountType: string
  }
  interface Session {
    user: {
      id: string
      email: string
      name: string
      accountType: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    accountType: string
  }
}