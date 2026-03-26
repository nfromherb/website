type ActiveView = 'dashboard' | 'email' | 'notes' | 'tasks' | 'news'

interface SidebarProps {
  active: ActiveView
  onChange: (v: ActiveView) => void
  onSettings: () => void
}

const navItems: { id: ActiveView; icon: string; label: string }[] = [
  { id: 'dashboard', icon: '⊞', label: 'Dashboard' },
  { id: 'email',     icon: '✉', label: 'Mail' },
  { id: 'tasks',     icon: '✓', label: 'Tasks' },
  { id: 'notes',     icon: '📝', label: 'Notes' },
  { id: 'news',      icon: '📰', label: 'News & X' }
]

export default function Sidebar({ active, onChange, onSettings }: SidebarProps) {
  return (
    <nav
      className="no-drag flex flex-col items-center py-16 px-2 gap-1 border-r border-white/5 z-40"
      style={{ width: 60, background: 'rgba(18,18,24,0.6)', backdropFilter: 'blur(20px)' }}
    >
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          title={item.label}
          className={`
            w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all cursor-default
            ${active === item.id
              ? 'bg-blue-600/30 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
              : 'text-white/40 hover:text-white/80 hover:bg-white/8'}
          `}
        >
          {item.icon}
        </button>
      ))}

      <div className="flex-1" />

      <button
        onClick={onSettings}
        title="Settings"
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg text-white/40 hover:text-white/80 hover:bg-white/8 transition-all cursor-default"
      >
        ⚙
      </button>
    </nav>
  )
}
