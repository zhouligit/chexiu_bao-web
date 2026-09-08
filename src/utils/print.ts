import { useAuthStore } from '@/stores/auth'

const baseURL = import.meta.env.VITE_API_BASE_URL || ''

async function authFetch(path: string) {
  const token = useAuthStore.getState().accessToken
  const url = `${baseURL}${path}`
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) {
    throw new Error('请求失败')
  }
  return response
}

export async function openPrintPage(path: string) {
  const response = await authFetch(path)
  const html = await response.text()
  const win = window.open('', '_blank')
  if (!win) {
    throw new Error('请允许弹出窗口以打印')
  }
  win.document.write(html)
  win.document.close()
}

export async function downloadPdf(path: string, filename: string) {
  const response = await authFetch(path)
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
