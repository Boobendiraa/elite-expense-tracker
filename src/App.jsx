import { useState } from 'react'
import Layout from './components/Layout.jsx'
import Overview from './pages/Overview.jsx'
import Money from './pages/Money.jsx'
import Wealth from './pages/Wealth.jsx'
import Goals from './pages/Goals.jsx'
import Essentials from './pages/Essentials.jsx'
import Reports from './pages/Reports.jsx'
import Settings from './pages/Settings.jsx'

const PAGES = [
  { id: 'overview', label: 'Overview', icon: 'OVW' },
  { id: 'money', label: 'Money', icon: '$' },
  { id: 'wealth', label: 'Wealth', icon: 'W' },
  { id: 'goals', label: 'Goals', icon: 'G' },
  { id: 'essentials', label: 'Essentials', icon: 'E' },
  { id: 'reports', label: 'Reports', icon: 'R' },
  { id: 'settings', label: 'Settings', icon: 'S' },
]

function App() {
  const [activePage, setActivePage] = useState('overview')

  const renderPage = () => {
    switch (activePage) {
      case 'overview':
        return <Overview />
      case 'money':
        return <Money />
      case 'wealth':
        return <Wealth />
      case 'goals':
        return <Goals />
      case 'essentials':
        return <Essentials />
      case 'reports':
        return <Reports />
      case 'settings':
        return <Settings />
      default:
        return <Overview />
    }
  }

  return (
    <Layout
      pages={PAGES}
      activePage={activePage}
      onSelectPage={setActivePage}
    >
      {renderPage()}
    </Layout>
  )
}

export default App