import { useAuthStore } from '@/stores/auth'

const baseURL = import.meta.env.VITE_API_BASE_URL || ''

export async function openPrintPage(path: string) {
  const token = useAuthStore.getState().accessToken
  const url = `${baseURL}${path}`
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) {
    throw new Error('打印页面加载失败')
  }
  const html = await response.text()
  const win = window.open('', '_blank')
  if (!win) {
    throw new Error('请允许弹出窗口以打印')
  }
  win.document.write(html)
  win.document.close()
}
