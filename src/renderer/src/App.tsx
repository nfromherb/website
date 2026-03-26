import { useState } from 'react'
import Sidebar from './components/layout/Sidebar'
import ClaudePanel from './components/layout/ClaudePanel'
import EmailPanel from './components/panels/EmailPanel'
import TasksPanel from './components/panels/TasksPanel'
import NotesPanel from './components/panels/NotesPanel'
import TodoPanel from './components/panels/TodoPanel'
import WeatherWidget from './components/panels/WeatherWidget'
import NewsPanel from './components/panels/NewsPanel'
import XFeedPanel from './components/panels/XFeedPanel'
import SettingsModal from './components/layout/SettingsModal'
import { useDashboardContext } from './hooks/useDashboardContext'

type ActiveView = 'dashboard' | 'email' | 'notes' | 'tasks' | 'news'

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const context = useDashboardContext()

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: '#0f0f14' }}>
      {/* Traffic light drag region */}
      <div className="drag-region absolute top-0 left-0 right-0 h-12 z-50 pointer-events-none" />

      {/* Icon sidebar */}
      <Sidebar
        active={activeView}
        onChange={setActiveView}
        onSettings={() => setSettingsOpen(true)}
      />

      {/* Main content area */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto p-4 pt-14">
          {activeView === 'dashboard' && (
            <DashboardGrid context={context} />
          )}
          {activeView === 'email' && (
            <div className="h-full">
              <EmailPanel fullHeight context={context} />
            </div>
          )}
          {activeView === 'notes' && (
            <div className="h-full">
              <NotesPanel fullHeight context={context} />
            </div>
          )}
          {activeView === 'tasks' && (
            <div className="grid grid-cols-2 gap-4 h-full">
              <TasksPanel fullHeight context={context} />
              <TodoPanel fullHeight context={context} />
            </div>
          )}
          {activeView === 'news' && (
            <div className="grid grid-cols-2 gap-4 h-full">
              <NewsPanel fullHeight context={context} />
              <XFeedPanel fullHeight context={context} />
            </div>
          )}
        </div>
      </main>

      {/* Claude AI sidebar */}
      <ClaudePanel context={context} />

      {/* Settings modal */}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}

function DashboardGrid({ context }: { context: ReturnType<typeof useDashboardContext> }) {
  return (
    <div className="grid grid-cols-3 grid-rows-2 gap-4 h-full min-h-[600px]">
      {/* Row 1 */}
      <WeatherWidget context={context} />
      <EmailPanel context={context} />
      <TasksPanel context={context} />

      {/* Row 2 */}
      <NotesPanel context={context} />
      <NewsPanel context={context} />
      <div className="grid grid-rows-2 gap-4">
        <TodoPanel context={context} />
        <XFeedPanel context={context} />
      </div>
    </div>
  )
}
