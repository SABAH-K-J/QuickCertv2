import { useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { createFileRoute } from '@tanstack/react-router'
import { api } from '@/lib/api'
import { setToken, setStoredUser } from '@/lib/auth'
import { toast } from 'sonner'

export const Route = createFileRoute('/auth_callback')({
  component: AuthCallbackComponent,
  validateSearch: (search: Record<string, unknown>): { token?: string } => {
    return { token: search.token as string | undefined }
  },
})

function AuthCallbackComponent() {
  const router = useRouter()
  const { token } = Route.useSearch()

  useEffect(() => {
    async function handleAuth() {
      if (token) {
        setToken(token)
        try {
          const res = await api.get('/auth/me');
          setStoredUser(res.data)
          toast.success("Successfully signed in")
          router.navigate({ to: '/templates' })
        } catch (error) {
          toast.error("Failed to fetch user profile")
          router.navigate({ to: '/login' })
        }
      } else {
        router.navigate({ to: '/login' })
      }
    }
    handleAuth()
  }, [token, router])

  return (
    <div className="flex h-screen w-full items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Logging you in...</h2>
        <p className="text-muted-foreground mt-2">Please wait while we set up your session.</p>
      </div>
    </div>
  )
}
