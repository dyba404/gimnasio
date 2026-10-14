import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { RutaProtegida } from '@/components/auth/RutaProtegida'
import { AppShell } from '@/components/layout/AppShell'
import { PageSkeleton } from '@/components/layout/page-skeleton'

const Dashboard = lazy(() => import('@/pages/Dashboard'))
const CheckinPage = lazy(() => import('@/pages/checkin/CheckinPage'))
const CajaPage = lazy(() => import('@/pages/caja/CajaPage'))
const PlaceholderPage = lazy(() => import('@/pages/PlaceholderPage'))
const SociosPage = lazy(() => import('@/pages/socios/SociosPage'))
const ProspectosPage = lazy(() => import('@/pages/prospectos/ProspectosPage'))
const MembresiasPage = lazy(() => import('@/pages/membresias/MembresiasPage'))
const ConfigPage = lazy(() => import('@/pages/config/ConfigPage'))
const PagosPage = lazy(() => import('@/pages/pagos/PagosPage'))
const ReportesPage = lazy(() => import('@/pages/reportes/ReportesPage'))
const MarketingPage = lazy(() => import('@/pages/marketing/MarketingPage'))
const ClasesPage = lazy(() => import('@/pages/clases/ClasesPage'))
const PosPage = lazy(() => import('@/pages/pos/PosPage'))
const CobranzaPage = lazy(() => import('@/pages/cobranza/CobranzaPage'))
const LoginPage = lazy(() => import('@/components/auth/LoginPage'))

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <LoginPage />
          </Suspense>
        }
      />
      <Route
        path="*"
        element={
          <RutaProtegida>
            <AppShell>
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/socios" element={<SociosPage />} />
                <Route path="/prospectos" element={<ProspectosPage />} />
                <Route path="/membresias" element={<MembresiasPage />} />
                <Route path="/pagos" element={<PagosPage />} />
                <Route path="/checkin" element={<CheckinPage />} />
                <Route path="/clases" element={<ClasesPage />} />
                <Route path="/caja" element={<CajaPage />} />
                <Route path="/tienda" element={<PosPage />} />
                <Route path="/reportes" element={<ReportesPage />} />
                <Route path="/marketing" element={<MarketingPage />} />
                <Route path="/cobranza" element={<CobranzaPage />} />
                <Route path="/config" element={<ConfigPage />} />
                <Route path="*" element={<PlaceholderPage title="Página no encontrada" />} />
              </Routes>
            </Suspense>
          </AppShell>
          </RutaProtegida>
        }
      />
    </Routes>
  )
}
