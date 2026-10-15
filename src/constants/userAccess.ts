import type { UserManagementAccess } from '@/types/api'

/** 接口不可用或未加载完成时，禁止员工管理（fail-closed） */
export const DENY_USER_MANAGEMENT: UserManagementAccess = {
  role_slug: '',
  role_name: '',
  can_open_management: false,
  can_list: false,
  can_create: false,
  can_update: false,
  can_delete: false,
}
