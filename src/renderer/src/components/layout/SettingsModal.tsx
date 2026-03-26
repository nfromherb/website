import { useState, useEffect } from 'react'
import { AppSettings } from '@shared/types'

interface SettingsModalProps {
  onClose: () => void
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<Partial<AppSettings>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.api.settings.get().then((res) => {
      if (res.ok) setSettings(res.data)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    await window.api.settings.set(settings)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="panel w-full max-w-lg mx-4 animate-slide-up">
        <div className="panel-header">
          <h2 className="panel-title">Settings</h2>
          <button onClick={onClose} className="btn-icon text-base">✕</button>
        </div>

        <div className="p-5 space-y-5 selectable">
          {/* Claude API key */}
          <div>
            <label className="block text-xs text-white/50 font-medium mb-1.5">
              Anthropic API Key <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              className="glass-input"
              placeholder="sk-ant-…"
              value={settings.anthropicApiKey || ''}
              onChange={(e) => update('anthropicApiKey', e.target.value)}
            />
            <p className="text-xs text-white/30 mt-1">
              Required for Claude AI. Get yours at{' '}
              <a
                href="https://console.anthropic.com"
                className="text-blue-400 hover:underline"
                onClick={(e) => { e.preventDefault(); /* shell.openExternal handled by main */ }}
              >
                console.anthropic.com
              </a>
            </p>
          </div>

          {/* Weather */}
          <div>
            <label className="block text-xs text-white/50 font-medium mb-1.5">Weather City</label>
            <input
              className="glass-input"
              placeholder="New York"
              value={settings.weatherCity || ''}
              onChange={(e) => update('weatherCity', e.target.value)}
            />
          </div>

          {/* Nitter */}
          <div>
            <label className="block text-xs text-white/50 font-medium mb-1.5">
              Nitter Instance (for X/Twitter feed)
            </label>
            <input
              className="glass-input"
              placeholder="https://nitter.poast.org"
              value={settings.nitterInstance || ''}
              onChange={(e) => update('nitterInstance', e.target.value)}
            />
            <p className="text-xs text-white/30 mt-1">
              Public Nitter instances: nitter.poast.org · nitter.privacydev.net
            </p>
          </div>

          {/* Email count */}
          <div>
            <label className="block text-xs text-white/50 font-medium mb-1.5">
              Emails to show (max)
            </label>
            <input
              type="number"
              min="5"
              max="50"
              className="glass-input"
              value={settings.defaultEmailCount || 10}
              onChange={(e) => update('defaultEmailCount', parseInt(e.target.value))}
            />
          </div>

          {/* Save button */}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="btn-icon px-4 py-2 text-sm">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`btn-primary ${saved ? 'bg-green-600 hover:bg-green-600' : ''}`}
            >
              {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
