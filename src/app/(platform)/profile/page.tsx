import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../api/auth/[...nextauth]/route'

export default async function ProfileRedirectPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  redirect(`/profile/${session.user.id}`)
}
