import { useDashboardContext } from '../../hooks/useDashboardContext'

interface WeatherWidgetProps {
  context: ReturnType<typeof useDashboardContext>
}

export default function WeatherWidget({ context }: WeatherWidgetProps) {
  const { weather, loading, refresh } = context

  if (loading.weather && !weather) {
    return (
      <div className="panel flex flex-col">
        <div className="panel-header">
          <span className="panel-title">Weather</span>
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 rounded-lg shimmer" />
          ))}
        </div>
      </div>
    )
  }

  if (!weather) {
    return (
      <div className="panel flex flex-col">
        <div className="panel-header">
          <span className="panel-title">Weather</span>
          <button className="btn-icon" onClick={refresh.weather}>⟳</button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white/30 text-sm">Could not load weather</p>
        </div>
      </div>
    )
  }

  return (
    <div className="panel flex flex-col overflow-hidden">
      <div className="panel-header">
        <span className="panel-title">{weather.city}</span>
        <button className="btn-icon text-base" onClick={refresh.weather} title="Refresh">⟳</button>
      </div>

      {/* Current conditions */}
      <div className="px-5 py-4 flex items-center gap-4">
        <span className="text-5xl">{weather.condition.emoji}</span>
        <div>
          <div className="text-4xl font-thin text-white">{weather.tempC}°C</div>
          <div className="text-sm text-white/50">{weather.tempF}°F · Feels like {weather.feelsLikeC}°C</div>
          <div className="text-sm font-medium text-white/70 mt-0.5">{weather.condition.label}</div>
        </div>
        <div className="ml-auto text-right space-y-1">
          <div className="text-xs text-white/40">💧 {weather.humidity}%</div>
          <div className="text-xs text-white/40">💨 {weather.windKph} km/h</div>
        </div>
      </div>

      {/* Hourly forecast */}
      <div className="border-t border-white/5 px-4 py-3">
        <div className="flex gap-3 overflow-x-auto pb-1">
          {weather.hourly.slice(0, 8).map((h, i) => {
            const hour = new Date(h.time).getHours()
            const label = hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`
            return (
              <div key={i} className="flex flex-col items-center gap-1 min-w-[44px]">
                <span className="text-xs text-white/40">{label}</span>
                <span className="text-base">{h.condition.emoji}</span>
                <span className="text-xs font-medium text-white/80">{h.tempC}°</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
