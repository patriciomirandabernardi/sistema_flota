import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Truck, Settings, FileText, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
  }`

function MainLayout() {
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col justify-between bg-slate-900 text-white print:hidden">
        <div>
          <div className="px-4 py-6">
            <h2 className="text-lg font-bold leading-tight">Sistema de Flota</h2>
            <p className="text-xs font-medium text-slate-400">Imcayper S.A.</p>
          </div>
          <nav className="flex flex-col gap-1 px-2">
            <NavLink to="/" end className={navLinkClass}>
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>
            <NavLink to="/vehiculos" className={navLinkClass}>
              <Truck size={18} />
              Vehículos
            </NavLink>
            <NavLink to="/catalogo" className={navLinkClass}>
              <Settings size={18} />
              Catálogo
            </NavLink>
            <NavLink to="/ordenes" className={navLinkClass}>
              <FileText size={18} />
              Órdenes
            </NavLink>
          </nav>
        </div>

        <div className="px-2 py-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-gray-100 p-6 print:bg-white print:p-0">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
