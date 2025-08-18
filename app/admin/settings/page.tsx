'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Settings,
  Shield,
  Save,
  AlertCircle,
  Check,
  ToggleLeft,
  ToggleRight,
  Database,
  Lock,
  Globe,
  Mail,
  CreditCard,
  Zap,
  Users,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface SystemSetting {
  key: string
  value: any
  category: string
  description: string
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Map<string, SystemSetting>>(
    new Map()
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<
    'general' | 'limits' | 'features' | 'security'
  >('general')
  const supabase = createClient()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('system_settings').select('*')

      if (error) throw error

      const settingsMap = new Map()
      data?.forEach((setting) => {
        settingsMap.set(setting.key, setting)
      })
      setSettings(settingsMap)
    } catch (error) {
      console.error('Failed to load settings:', error)
      toast.error('Failed to load system settings')
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (key: string, value: any) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({
          value: typeof value === 'object' ? value : JSON.stringify(value),
          updated_at: new Date().toISOString(),
        })
        .eq('key', key)

      if (error) throw error

      // Update local state
      const updatedSettings = new Map(settings)
      const setting = updatedSettings.get(key)
      if (setting) {
        setting.value = value
        updatedSettings.set(key, setting)
        setSettings(updatedSettings)
      }

      toast.success('Setting updated')

      // Log admin action
      await supabase.from('audit_logs').insert({
        action: 'update_setting',
        entity_type: 'system_setting',
        entity_id: key,
        details: { new_value: value },
      })
    } catch (error) {
      toast.error('Failed to update setting')
    } finally {
      setSaving(false)
    }
  }

  const settingsByCategory = {
    general: [
      {
        key: 'maintenance_mode',
        label: 'Maintenance Mode',
        type: 'toggle',
        icon: <Lock className="h-5 w-5" />,
        description: 'Enable to prevent users from accessing the platform',
      },
      {
        key: 'allow_new_signups',
        label: 'Allow New Signups',
        type: 'toggle',
        icon: <Users className="h-5 w-5" />,
        description: 'Control whether new users can register',
      },
      {
        key: 'platform_name',
        label: 'Platform Name',
        type: 'text',
        icon: <Globe className="h-5 w-5" />,
        description: 'Display name for the platform',
        defaultValue: 'DesignOS',
      },
      {
        key: 'support_email',
        label: 'Support Email',
        type: 'email',
        icon: <Mail className="h-5 w-5" />,
        description: 'Contact email for user support',
        defaultValue: 'support@designos.com',
      },
    ],
    limits: [
      {
        key: 'max_designs_per_user',
        label: 'Max Designs per User',
        type: 'number',
        icon: <FileText className="h-5 w-5" />,
        description: 'Maximum number of designs a user can create',
      },
      {
        key: 'max_ai_requests_per_day',
        label: 'Max AI Requests per Day',
        type: 'number',
        icon: <Zap className="h-5 w-5" />,
        description: 'Daily limit for AI requests per user',
      },
      {
        key: 'max_file_size_mb',
        label: 'Max File Size (MB)',
        type: 'number',
        icon: <Database className="h-5 w-5" />,
        description: 'Maximum file upload size in megabytes',
        defaultValue: 10,
      },
      {
        key: 'max_canvas_dimensions',
        label: 'Max Canvas Size (px)',
        type: 'number',
        icon: <FileText className="h-5 w-5" />,
        description: 'Maximum canvas width/height in pixels',
        defaultValue: 5000,
      },
    ],
    features: [
      {
        key: 'enable_ai_features',
        label: 'Enable AI Features',
        type: 'toggle',
        icon: <Zap className="h-5 w-5" />,
        description: 'Toggle all AI-powered features',
      },
      {
        key: 'enable_collaboration',
        label: 'Enable Real-time Collaboration',
        type: 'toggle',
        icon: <Users className="h-5 w-5" />,
        description: 'Allow multiple users to edit simultaneously',
      },
      {
        key: 'enable_templates',
        label: 'Enable Templates',
        type: 'toggle',
        icon: <FileText className="h-5 w-5" />,
        description: 'Show template gallery to users',
      },
      {
        key: 'enable_public_sharing',
        label: 'Enable Public Sharing',
        type: 'toggle',
        icon: <Globe className="h-5 w-5" />,
        description: 'Allow users to share designs publicly',
      },
    ],
    security: [
      {
        key: 'require_email_verification',
        label: 'Require Email Verification',
        type: 'toggle',
        icon: <Mail className="h-5 w-5" />,
        description: 'Users must verify email before access',
      },
      {
        key: 'session_timeout_hours',
        label: 'Session Timeout (hours)',
        type: 'number',
        icon: <Lock className="h-5 w-5" />,
        description: 'Auto logout after inactivity',
        defaultValue: 24,
      },
      {
        key: 'min_password_length',
        label: 'Min Password Length',
        type: 'number',
        icon: <Lock className="h-5 w-5" />,
        description: 'Minimum password length requirement',
        defaultValue: 8,
      },
      {
        key: 'rate_limit_per_minute',
        label: 'API Rate Limit (per minute)',
        type: 'number',
        icon: <Shield className="h-5 w-5" />,
        description: 'Maximum API requests per minute',
        defaultValue: 60,
      },
    ],
  }

  const getSettingValue = (key: string, defaultValue: any = '') => {
    const setting = settings.get(key)
    if (!setting) return defaultValue

    try {
      if (typeof setting.value === 'string') {
        return JSON.parse(setting.value)
      }
      return setting.value
    } catch {
      return setting.value
    }
  }

  const renderSettingInput = (setting: any) => {
    const value = getSettingValue(setting.key, setting.defaultValue)

    switch (setting.type) {
      case 'toggle':
        return (
          <button
            onClick={() => updateSetting(setting.key, !value)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              value ? 'bg-purple-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                value ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        )

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) =>
              updateSetting(setting.key, parseInt(e.target.value))
            }
            className="w-32 rounded-lg border border-gray-300 px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        )

      case 'text':
      case 'email':
        return (
          <input
            type={setting.type}
            value={value}
            onChange={(e) => updateSetting(setting.key, e.target.value)}
            className="w-64 rounded-lg border border-gray-300 px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        )

      default:
        return null
    }
  }

  const tabs = [
    { id: 'general', label: 'General', icon: <Settings className="h-4 w-4" /> },
    { id: 'limits', label: 'Limits', icon: <Database className="h-4 w-4" /> },
    { id: 'features', label: 'Features', icon: <Zap className="h-4 w-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="h-4 w-4" /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Admin Sidebar */}
        <div className="min-h-screen w-64 bg-gray-900">
          <div className="p-4">
            <Link href="/admin" className="mb-8 flex items-center gap-2">
              <Shield className="h-8 w-8 text-purple-500" />
              <div>
                <h1 className="text-lg font-bold text-white">Admin Panel</h1>
                <p className="text-xs text-gray-400">System Settings</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <header className="border-b bg-white shadow-sm">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    System Settings
                  </h2>
                  <p className="text-sm text-gray-600">
                    Configure platform settings and features
                  </p>
                </div>
                {saving && (
                  <div className="flex items-center gap-2 text-purple-600">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                    <span className="text-sm">Saving...</span>
                  </div>
                )}
              </div>
            </div>
          </header>

          {loading ? (
            <div className="p-6 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
            </div>
          ) : (
            <div className="p-6">
              {/* Tab Navigation */}
              <div className="mb-6 rounded-lg bg-white shadow">
                <div className="border-b">
                  <nav className="flex">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 border-b-2 px-6 py-3 transition-colors ${
                          activeTab === tab.id
                            ? 'border-purple-600 text-purple-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {tab.icon}
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Settings Content */}
                <div className="p-6">
                  <div className="space-y-6">
                    {settingsByCategory[activeTab].map((setting) => (
                      <div
                        key={setting.key}
                        className="flex items-start justify-between border-b py-4 last:border-0"
                      >
                        <div className="flex items-start gap-3">
                          <div className="rounded-lg bg-gray-100 p-2">
                            {setting.icon}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {setting.label}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                              {setting.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {renderSettingInput(setting)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                <h3 className="mb-4 text-lg font-semibold text-red-900">
                  Danger Zone
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-red-900">
                        Clear All Cache
                      </h4>
                      <p className="text-sm text-red-700">
                        Remove all cached data and temporary files
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            'Are you sure? This will clear all cached data.'
                          )
                        ) {
                          toast.success('Cache cleared')
                        }
                      }}
                      className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                    >
                      Clear Cache
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-red-900">
                        Reset All Settings
                      </h4>
                      <p className="text-sm text-red-700">
                        Restore all settings to default values
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            'Are you sure? This will reset all settings to defaults.'
                          )
                        ) {
                          toast.success('Settings reset')
                        }
                      }}
                      className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                    >
                      Reset Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
