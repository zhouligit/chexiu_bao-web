import { useAuthStore } from '@/stores/auth'

export function usePermissions() {
  return useAuthStore((s) => s.user?.permissions ?? [])
}

export function usePermission(code: string) {
  const user = useAuthStore((s) => s.user)
  if (!user) return false
  if (user.role === 'owner') return true
  return (user.permissions ?? []).includes(code)
}

export function useAnyPermission(...codes: string[]) {
  const user = useAuthStore((s) => s.user)
  if (!user) return false
  if (user.role === 'owner') return true
  const set = new Set(user.permissions ?? [])
  return codes.some((c) => set.has(c))
}
