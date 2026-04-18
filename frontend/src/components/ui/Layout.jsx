import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'

const NAV_ITEMS = [
  { path: '/', icon: '🏠', label: 'Home' },
  { path: '/map', icon: '🗺️', label: 'Map' },
  { path: '/order', icon: '🍔', label: 'Order' },
  { path: '/sync', icon: '👥', label: 'Sync' },
  { path: '/score', icon: '🏆', label: 'Score' },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const location = useLocation()

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 flex-shrink-0 bg-white border-r border-gray-200 h-screen sticky top-0 z-50">
        <div className="p-6 flex items-center gap-3 border-b border-gray-100">
          <span className="text-3xl">🎽</span>
          <h1 className="font-heading text-3xl tracking-wider text-blue-600">
            STADIUMIQ
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold ${isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-[1.02]'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-blue-600'
                }`
              }
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-[15px]">{item.label}</span>
            </NavLink>
          ))}
          
          <div className="pt-6 mt-6 border-t border-gray-100 space-y-2">
            <h4 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">More</h4>
            <NavLink to="/bot" className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all font-bold ${isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-500 hover:bg-gray-50'
              }`
            }>
              <span className="text-xl">🤖</span>
              <span className="text-sm">SmartBot</span>
            </NavLink>
            <NavLink to="/alerts" className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all font-bold ${isActive
                ? 'bg-orange-50 text-orange-700'
                : 'text-gray-500 hover:bg-gray-50'
              }`
            }>
              <span className="text-xl">🔔</span>
              <span className="text-sm">Alerts</span>
            </NavLink>
            <NavLink to="/exit" className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all font-bold ${isActive
                ? 'bg-red-50 text-red-700'
                : 'text-gray-500 hover:bg-gray-50'
              }`
            }>
              <span className="text-xl">🚪</span>
              <span className="text-sm">Exit Plan</span>
            </NavLink>
            <NavLink to="/admin" className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all font-bold ${isActive
                ? 'bg-gray-900 text-white shadow-md'
                : 'text-gray-500 hover:bg-gray-50'
              }`
            }>
              <span className="text-xl">⚙️</span>
              <span className="text-sm">Admin Area</span>
            </NavLink>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold font-heading text-lg">
              {user?.display_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 truncate px-3">
              <p className="text-sm font-bold text-gray-900 truncate">{user?.display_name || 'Fan'}</p>
              <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 truncate">{user?.email}</p>
            </div>
            <button onClick={logout} className="text-gray-400 hover:text-red-500 p-1 transition-colors" title="Logout">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen min-w-0 relative">
        <div className="md:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎽</span>
            <h1 className="font-heading text-xl tracking-wider text-blue-600">STADIUMIQ</h1>
          </div>
          <button onClick={logout} className="text-xs font-bold uppercase tracking-widest text-red-500">Log Out</button>
        </div>
        
        <div className="flex-1 pb-20 md:pb-0 overflow-y-auto relative">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-100 px-2 pb-safe pt-1 shadow-lg">
        <div className="flex justify-around items-end overflow-x-auto">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 p-2 min-w-[64px] transition-all relative ${isActive
                  ? 'text-blue-600 scale-110 -translate-y-1'
                  : 'text-gray-400 hover:text-blue-500'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`text-2xl transition-transform ${isActive ? 'drop-shadow-md' : ''}`}>{item.icon}</span>
                  <span className={`text-[10px] leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                  {isActive && <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-blue-600" />}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
