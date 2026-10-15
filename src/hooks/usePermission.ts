import { useAuthStore } from '@/stores/auth'

/** 仅以服务端下发的 permissions 为准（登录/me 已包含 owner 的全量权限码） */
export function usePermissions() {
  return useAuthStore((s) => s.user?.permissions ?? [])
}

export function usePermission(code: string) {
  const permissions = useAuthStore((s) => s.user?.permissions)
  if (!permissions?.length) return false
  return permissions.includes(code)
}

export function useAnyPermission(...codes: string[]) {
  const permissions = useAuthStore((s) => s.user?.permissions)
  if (!permissions?.length) return false
  const set = new Set(permissions)
  return codes.some((c) => set.has(c))
}
