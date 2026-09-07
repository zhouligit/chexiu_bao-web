import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import LoginPage from '@/pages/Login'
import DashboardPage from '@/pages/Dashboard'
import CustomersPage from '@/pages/Customers'
import WorkOrderListPage from '@/pages/WorkOrders/List'
import WorkOrderCreatePage from '@/pages/WorkOrders/Create'
import WorkOrderDetailPage from '@/pages/WorkOrders/Detail'
import InventoryPage from '@/pages/Inventory'
import ReportsPage from '@/pages/Reports'
import {
  SettingsPage,
} from '@/pages/Placeholder'
import { PrivateRoute } from '@/routes/PrivateRoute'

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="work-orders" element={<WorkOrderListPage />} />
          <Route path="work-orders/create" element={<WorkOrderCreatePage />} />
          <Route path="work-orders/:id" element={<WorkOrderDetailPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
