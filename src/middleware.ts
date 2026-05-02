import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/login',
  },
})

export const config = {
  matcher: [
    '/feed/:path*',
    '/profile/:path*',
    '/posts/:path*',
    '/acquaintances/:path*',
    '/messaging/:path*',
    '/notifications/:path*',
    '/problems/:path*',
    '/researchers/:path*',
    '/saved/:path*',
  ]
}
