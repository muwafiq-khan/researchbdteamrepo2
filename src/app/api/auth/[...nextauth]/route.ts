import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '../../../../lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.users.findUnique({
          where: { email: credentials.email }
        })

        if (!user) return null

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!passwordMatch) return null
        // if (!user.isVerified) return null

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          accountType: user.accountType,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
        token.accountType = user.accountType
      }
      return token
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id
        session.user.accountType = token.accountType
      }
      return session
    }
  },
  session: {
    strategy: 'jwt' as const
    // 'as const' tells TypeScript this is the literal type 'jwt'
    // not just any string — NextAuth requires the exact literal
  },
  pages: {
    signIn: '/login'
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }