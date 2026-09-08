import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import LoginPage from '@/pages/Login'
import RegisterPage from '@/pages/Register'
import DashboardPage from '@/pages/Dashboard'
import CustomersPage from '@/pages/Customers'
import CustomerDetailPage from '@/pages/Customers/Detail'
import WorkOrderListPage from '@/pages/WorkOrders/List'
import WorkOrderCreatePage from '@/pages/WorkOrders/Create'
import WorkOrderDetailPage from '@/pages/WorkOrders/Detail'
import InventoryPage from '@/pages/Inventory'
import ReportsPage from '@/pages/Reports'
import ServicesPage from '@/pages/Services'
import SettingsPage from '@/pages/Settings'
import SuppliersPage from '@/pages/Suppliers'
import PaymentsPage from '@/pages/Payments'
import { PrivateRoute } from '@/routes/PrivateRoute'

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
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
          <Route path="customers/:id" element={<CustomerDetailPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
