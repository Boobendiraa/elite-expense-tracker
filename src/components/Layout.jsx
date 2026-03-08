import { useState } from 'react'
import PropTypes from 'prop-types'
import Sidebar from './Sidebar.jsx'
import HeaderActions from './HeaderActions.jsx'
import ProfileModal from './ProfileModal.jsx'
import { loadProfile } from '../storage/index.js'

const Layout = ({ pages, activePage, onSelectPage, children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const active = pages.find((p) => p.id === activePage)
  const profile = loadProfile()
  const greeting = profile.name
    ? `Welcome back, ${profile.name}.`
    : 'Welcome to Elite Expense Tracker.'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex transition-colors">
      <Sidebar
        pages={pages}
        activePage={activePage}
        onSelectPage={onSelectPage}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="relative z-[100] h-16 border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 bg-slate-950/95 backdrop-blur shrink-0">
          <div className="min-w-0">
            <p className="text-[0.7rem] uppercase tracking-[0.25em] text-slate-500 truncate">
              {greeting}
            </p>
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-50 truncate">
              {active?.label ?? 'Elite Expense Tracker'}
            </h1>
          </div>
          <HeaderActions
            onOpenSettings={() => {}}
            onOpenProfile={() => setProfileModalOpen(true)}
            activePage={activePage}
            onSelectPage={onSelectPage}
          />
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-8 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900">
          <div className="mx-auto max-w-6xl animate-[fadeIn_0.2s_ease-out]">
            {children}
          </div>
        </main>
      </div>

      <ProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </div>
  )
}

Layout.propTypes = {
  pages: PropTypes.array.isRequired,
  activePage: PropTypes.string.isRequired,
  onSelectPage: PropTypes.func.isRequired,
  children: PropTypes.node,
}

export default Layout
