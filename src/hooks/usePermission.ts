import { useAuthStore } from '@/stores/auth'

export function usePermissions() {
  return useAuthStore((s) => s.user?.permissions ?? [])
}

function effectivePermissions(user: NonNullable<ReturnType<typeof useAuthStore.getState>['user']>) {
  if (user.role === 'owner') return null
  const perms = user.permissions
  if (!perms?.length) return []
  return perms
}

export function usePermission(code: string) {
  const user = useAuthStore((s) => s.user)
  if (!user) return false
  if (user.role === 'owner') return true
  const perms = effectivePermissions(user)
  return perms !== null && perms.includes(code)
}

export function useAnyPermission(...codes: string[]) {
  const user = useAuthStore((s) => s.user)
  if (!user) return false
  if (user.role === 'owner') return true
  const perms = effectivePermissions(user)
  if (!perms?.length) return false
  const set = new Set(perms)
  return codes.some((c) => set.has(c))
}
