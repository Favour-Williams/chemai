import React, { useState } from 'react';
import { 
  User, 
  Palette, 
  Globe, 
  Bell, 
  Eye, 
  Shield, 
  Trash2, 
  Save,
  Moon,
  Sun,
  Monitor,
  Volume2,
  VolumeX,
  Smartphone,
  Mail,
  MessageSquare,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/useToast';

interface SettingsSection {
  id: string;
  title: string;
  icon: React.ReactNode;
}

const Settings: React.FC = () => {
  const settings = useSettingsStore();
  const { user, logout } = useAuthStore();
  const { success, error } = useToast();
  const [activeSection, setActiveSection] = useState('theme');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const isDark = settings.theme.mode === 'dark' || 
    (settings.theme.mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const sections: SettingsSection[] = [
    { id: 'theme', title: 'Theme & Appearance', icon: <Palette className="h-5 w-5" /> },
    { id: 'language', title: 'Language & Region', icon: <Globe className="h-5 w-5" /> },
    { id: 'notifications', title: 'Notifications', icon: <Bell className="h-5 w-5" /> },
    { id: 'accessibility', title: 'Accessibility', icon: <Eye className="h-5 w-5" /> },
    { id: 'account', title: 'Account & Security', icon: <Shield className="h-5 w-5" /> }
  ];

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveStatus('saved');
      success('Settings saved successfully!');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      error('Failed to save settings');
      setSaveStatus('idle');
    }
  };

  const handleDeleteAccount = () => {
    logout();
    success('Account deleted successfully');
  };

  const renderThemeSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Theme Mode
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'light', label: 'Light', icon: <Sun className="h-5 w-5" /> },
            { id: 'dark', label: 'Dark', icon: <Moon className="h-5 w-5" /> },
            { id: 'system', label: 'System', icon: <Monitor className="h-5 w-5" /> }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => settings.updateTheme({ mode: mode.id as any })}
              className={`
                p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2
                ${settings.theme.mode === mode.id
                  ? 'border-primary bg-primary/10'
                  : isDark
                    ? 'border-gray-600 hover:border-gray-500'
                    : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              {mode.icon}
              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {mode.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Primary Color
        </h3>
        <div className="grid grid-cols-6 gap-3">
          {[
            { id: 'blue', color: 'bg-blue-500', hex: '#3b82f6' },
            { id: 'purple', color: 'bg-purple-500', hex: '#a855f7' },
            { id: 'green', color: 'bg-green-500', hex: '#10b981' },
            { id: 'red', color: 'bg-red-500', hex: '#ef4444' },
            { id: 'orange', color: 'bg-orange-500', hex: '#f97316' },
            { id: 'pink', color: 'bg-pink-500', hex: '#ec4899' }
          ].map((color) => (
            <button
              key={color.id}
              onClick={() => settings.updateTheme({ primaryColor: color.id as any })}
              className={`
                w-12 h-12 rounded-lg relative transition-all hover:scale-110
                ${settings.theme.primaryColor === color.id ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-600' : ''}
              `}
              style={{ backgroundColor: color.hex }}
              title={`${color.id.charAt(0).toUpperCase() + color.id.slice(1)} theme`}
            >
              {settings.theme.primaryColor === color.id && (
                <Check className="h-6 w-6 text-white absolute inset-0 m-auto" />
              )}
            </button>
          ))}
        </div>
        <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Current color: {settings.theme.primaryColor.charAt(0).toUpperCase() + settings.theme.primaryColor.slice(1)}
        </p>
      </div>

      <div>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Font Size
        </h3>
        <div className="space-y-2">
          {[
            { id: 'small', label: 'Small', size: 'text-sm' },
            { id: 'medium', label: 'Medium', size: 'text-base' },
            { id: 'large', label: 'Large', size: 'text-lg' },
            { id: 'extra-large', label: 'Extra Large', size: 'text-xl' }
          ].map((size) => (
            <label key={size.id} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="fontSize"
                checked={settings.theme.fontSize === size.id}
                onChange={() => settings.updateTheme({ fontSize: size.id as any })}
                className="text-primary focus:ring-primary"
              />
              <span className={`${size.size} ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {size.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Layout Density
        </h3>
        <div className="space-y-2">
          {[
            { id: 'comfortable', label: 'Comfortable', description: 'More spacing between elements' },
            { id: 'compact', label: 'Compact', description: 'Less spacing, more content visible' }
          ].map((layout) => (
            <label key={layout.id} className="flex items-start space-x-3 cursor-pointer">
              <input
                type="radio"
                name="layout"
                checked={settings.theme.layout === layout.id}
                onChange={() => settings.updateTheme({ layout: layout.id as any })}
                className="text-primary focus:ring-primary mt-1"
              />
              <div>
                <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {layout.label}
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {layout.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLanguageSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Language
        </h3>
        <select
          value={settings.language}
          onChange={(e) => settings.updateLanguage(e.target.value)}
          className={`
            w-full px-4 py-2 rounded-lg border
            ${isDark
              ? 'bg-gray-700 border-gray-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
            }
            focus:ring-2 focus:ring-primary focus:border-transparent
          `}
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
          <option value="zh">中文</option>
          <option value="ja">日本語</option>
          <option value="ko">한국어</option>
        </select>
      </div>

      <div>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Region & Format
        </h3>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Date Format
            </label>
            <select className={`
              w-full px-4 py-2 rounded-lg border
              ${isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
              }
            `}>
              <option>MM/DD/YYYY</option>
              <option>DD/MM/YYYY</option>
              <option>YYYY-MM-DD</option>
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Temperature Unit
            </label>
            <select className={`
              w-full px-4 py-2 rounded-lg border
              ${isDark
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
              }
            `}>
              <option>Celsius (°C)</option>
              <option>Fahrenheit (°F)</option>
              <option>Kelvin (K)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Notification Channels
        </h3>
        <div className="space-y-4">
          {[
            { key: 'email', label: 'Email Notifications', icon: <Mail className="h-5 w-5" /> },
            { key: 'push', label: 'Push Notifications', icon: <Smartphone className="h-5 w-5" /> }
          ].map((channel) => (
            <div key={channel.key} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {channel.icon}
                <span className={isDark ? 'text-white' : 'text-gray-900'}>
                  {channel.label}
                </span>
              </div>
              <button
                onClick={() => settings.updateNotifications({ 
                  [channel.key]: !settings.notifications[channel.key as keyof typeof settings.notifications] 
                })}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.notifications[channel.key as keyof typeof settings.notifications]
                    ? 'bg-primary'
                    : isDark ? 'bg-gray-600' : 'bg-gray-200'
                  }
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.notifications[channel.key as keyof typeof settings.notifications]
                      ? 'translate-x-6'
                      : 'translate-x-1'
                    }
                  `}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Notification Types
        </h3>
        <div className="space-y-4">
          {[
            { key: 'reactions', label: 'Reaction Updates', description: 'Get notified about reaction simulation results' },
            { key: 'updates', label: 'Product Updates', description: 'New features and improvements' },
            { key: 'marketing', label: 'Marketing Communications', description: 'Tips, tutorials, and promotional content' }
          ].map((type) => (
            <div key={type.key} className="flex items-start justify-between">
              <div className="flex-1">
                <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {type.label}
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {type.description}
                </div>
              </div>
              <button
                onClick={() => settings.updateNotifications({ 
                  [type.key]: !settings.notifications[type.key as keyof typeof settings.notifications] 
                })}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors ml-4
                  ${settings.notifications[type.key as keyof typeof settings.notifications]
                    ? 'bg-primary'
                    : isDark ? 'bg-gray-600' : 'bg-gray-200'
                  }
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.notifications[type.key as keyof typeof settings.notifications]
                      ? 'translate-x-6'
                      : 'translate-x-1'
                    }
                  `}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAccessibilitySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Visual Accessibility
        </h3>
        <div className="space-y-4">
          {[
            { 
              key: 'highContrast', 
              label: 'High Contrast Mode', 
              description: 'Increase contrast for better visibility' 
            },
            { 
              key: 'reducedMotion', 
              label: 'Reduce Motion', 
              description: 'Minimize animations and transitions' 
            }
          ].map((option) => (
            <div key={option.key} className="flex items-start justify-between">
              <div className="flex-1">
                <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {option.label}
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {option.description}
                </div>
              </div>
              <button
                onClick={() => settings.updateAccessibility({ 
                  [option.key]: !settings.accessibility[option.key as keyof typeof settings.accessibility] 
                })}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors ml-4
                  ${settings.accessibility[option.key as keyof typeof settings.accessibility]
                    ? 'bg-primary'
                    : isDark ? 'bg-gray-600' : 'bg-gray-200'
                  }
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.accessibility[option.key as keyof typeof settings.accessibility]
                      ? 'translate-x-6'
                      : 'translate-x-1'
                    }
                  `}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Screen Reader Support
        </h3>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Enhanced Screen Reader Mode
            </div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Optimize interface for screen readers
            </div>
          </div>
          <button
            onClick={() => settings.updateAccessibility({ 
              screenReader: !settings.accessibility.screenReader 
            })}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors ml-4
              ${settings.accessibility.screenReader
                ? 'bg-primary'
                : isDark ? 'bg-gray-600' : 'bg-gray-200'
              }
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${settings.accessibility.screenReader
                  ? 'translate-x-6'
                  : 'translate-x-1'
                }
              `}
            />
          </button>
        </div>
      </div>

      <div>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Accessibility Font Size
        </h3>
        <div className="space-y-2">
          {[
            { id: 'small', label: 'Small', size: 'text-sm' },
            { id: 'medium', label: 'Medium', size: 'text-base' },
            { id: 'large', label: 'Large', size: 'text-lg' },
            { id: 'extra-large', label: 'Extra Large', size: 'text-xl' }
          ].map((size) => (
            <label key={size.id} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="accessibilityFontSize"
                checked={settings.accessibility.fontSize === size.id}
                onChange={() => settings.updateAccessibility({ fontSize: size.id as any })}
                className="text-primary focus:ring-primary"
              />
              <span className={`${size.size} ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {size.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAccountSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Account Information
        </h3>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Email Address
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className={`
                w-full px-4 py-2 rounded-lg border
                ${isDark
                  ? 'bg-gray-700 border-gray-600 text-gray-400'
                  : 'bg-gray-100 border-gray-300 text-gray-500'
                }
              `}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Display Name
            </label>
            <input
              type="text"
              value={user?.name || ''}
              className={`
                w-full px-4 py-2 rounded-lg border
                ${isDark
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
                }
                focus:ring-2 focus:ring-primary focus:border-transparent
              `}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Security
        </h3>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Two-Factor Authentication
              </div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Add an extra layer of security to your account
              </div>
            </div>
            <button
              onClick={() => settings.updateAccount({ 
                twoFactor: !settings.account.twoFactor 
              })}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors ml-4
                ${settings.account.twoFactor
                  ? 'bg-primary'
                  : isDark ? 'bg-gray-600' : 'bg-gray-200'
                }
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${settings.account.twoFactor
                    ? 'translate-x-6'
                    : 'translate-x-1'
                  }
                `}
              />
            </button>
          </div>
          
          <button className={`
            w-full py-2 px-4 rounded-lg border transition-colors
            ${isDark
              ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }
          `}>
            Change Password
          </button>
        </div>
      </div>

      <div>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Privacy
        </h3>
        <div className="space-y-4">
          {[
            { 
              key: 'dataSharing', 
              label: 'Data Sharing', 
              description: 'Allow anonymous usage data to improve the service' 
            },
            { 
              key: 'analytics', 
              label: 'Analytics', 
              description: 'Help us understand how you use ChemAI' 
            }
          ].map((option) => (
            <div key={option.key} className="flex items-start justify-between">
              <div className="flex-1">
                <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {option.label}
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {option.description}
                </div>
              </div>
              <button
                onClick={() => settings.updateAccount({ 
                  [option.key]: !settings.account[option.key as keyof typeof settings.account] 
                })}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors ml-4
                  ${settings.account[option.key as keyof typeof settings.account]
                    ? 'bg-primary'
                    : isDark ? 'bg-gray-600' : 'bg-gray-200'
                  }
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.account[option.key as keyof typeof settings.account]
                      ? 'translate-x-6'
                      : 'translate-x-1'
                    }
                  `}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className={`
        p-4 rounded-lg border
        ${isDark ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'}
      `}>
        <h3 className={`text-lg font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-red-400' : 'text-red-800'}`}>
          <AlertTriangle className="h-5 w-5" />
          Danger Zone
        </h3>
        <p className={`text-sm mb-4 ${isDark ? 'text-red-300' : 'text-red-700'}`}>
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Delete Account
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'theme':
        return renderThemeSettings();
      case 'language':
        return renderLanguageSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'accessibility':
        return renderAccessibilitySettings();
      case 'account':
        return renderAccountSettings();
      default:
        return renderThemeSettings();
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Settings
          </h1>
          <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Customize your ChemAI experience
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Navigation */}
          <div className={`lg:col-span-1 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
            <nav className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors
                    ${activeSection === section.id
                      ? 'bg-primary text-white'
                      : isDark
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {section.icon}
                  <span className="font-medium">{section.title}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Settings Content */}
          <div className={`lg:col-span-3 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {sections.find(s => s.id === activeSection)?.title}
              </h2>
              <button
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className={`
                  px-4 py-2 rounded-lg flex items-center gap-2 transition-colors
                  ${saveStatus === 'saved'
                    ? 'bg-green-600 text-white'
                    : saveStatus === 'saving'
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-primary hover:bg-primary-hover text-white'
                  }
                `}
              >
                {saveStatus === 'saving' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <Check className="h-4 w-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>

            {renderContent()}
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowDeleteConfirm(false)} />
          <div className={`relative w-full max-w-md p-6 rounded-lg shadow-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Delete Account
              </h3>
            </div>
            <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`
                  flex-1 py-2 px-4 rounded-lg border transition-colors
                  ${isDark
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;