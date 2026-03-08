import PropTypes from 'prop-types'

const ICONS = {
  OVW: '◉',
  $: '₹',
  W: '◆',
  G: '◎',
  E: '◇',
  R: '▤',
  S: '⚙',
}

const Sidebar = ({ pages, activePage, onSelectPage, collapsed, onToggle }) => {
  return (
    <aside
      className={
        'hidden md:flex md:flex-col border-r border-slate-800 bg-slate-900/95 backdrop-blur transition-all duration-300 ' +
        (collapsed ? 'w-[72px]' : 'w-64')
      }
    >
      <div
        className={
          'flex items-center border-b border-slate-800 py-4 transition-all ' +
          (collapsed ? 'justify-center px-0' : 'justify-between gap-3 px-3')
        }
      >
        <button
          type="button"
          onClick={onToggle}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={'h-5 w-5 transition-transform duration-300 ' + (collapsed ? 'rotate-180' : '')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        {!collapsed && (
          <div className="flex flex-col justify-center min-w-0 flex-1 overflow-hidden">
            <span className="text-[0.65rem] font-semibold tracking-[0.2em] text-teal-400 uppercase leading-none">
              Elite
            </span>
            <span className="mt-1 text-sm font-semibold tracking-tight text-slate-50 truncate leading-tight block">
              Expense Tracker
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {pages.map((page) => {
          const isActive = page.id === activePage
          const icon = ICONS[page.icon] || page.icon
          return (
            <button
              key={page.id}
              type="button"
              onClick={() => onSelectPage(page.id)}
              title={collapsed ? page.label : undefined}
              className={[
                'w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-all min-h-[44px]',
                collapsed ? 'justify-center px-0' : 'px-3',
                isActive
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/40'
                  : 'text-slate-300 hover:text-teal-200 hover:bg-slate-800 border border-transparent',
              ].join(' ')}
            >
              <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 text-xs font-medium">
                {icon}
              </span>
              {!collapsed && (
                <span className="truncate text-left flex-1 py-0.5">{page.label}</span>
              )}
            </button>
          )
        })}
      </nav>

      {!collapsed && (
        <div className="px-4 py-3 border-t border-slate-800 text-[0.7rem] text-slate-500">
          <span>v1.0</span>
        </div>
      )}
    </aside>
  )
}

Sidebar.propTypes = {
  pages: PropTypes.array.isRequired,
  activePage: PropTypes.string.isRequired,
  onSelectPage: PropTypes.func.isRequired,
  collapsed: PropTypes.bool,
  onToggle: PropTypes.func,
}

export default Sidebar
