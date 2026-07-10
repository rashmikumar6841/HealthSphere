import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Language, translations } from '../data/translations';
import {
  Settings2,
  Globe,
  Sun,
  Moon,
  Bell,
  Download,
  ShieldAlert,
  Save,
  CheckCircle,
  EyeOff
} from 'lucide-react';

export const Settings: React.FC = () => {
  const {
    language,
    setLanguage,
    theme,
    setTheme,
    healthData,
    currentScores
  } = useApp();

  const t = translations[language] || translations.en;

  // Local settings options state
  const [notifications, setNotifications] = useState({
    anomalies: true,
    weeklyReport: true,
    recommendations: false,
  });

  const [privacy, setPrivacy] = useState({
    sharing: true,
    localCache: true,
    anonymousStats: false,
  });

  const [showToast, setShowToast] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleExportData = () => {
    // Generate a backup JSON file of patient records
    const backupObj = {
      patient: "John Doe",
      timestamp: new Date().toISOString(),
      clinical_scores: currentScores,
      health_data: healthData,
      platform_settings: {
        language,
        theme,
        notifications,
        privacy
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `VitalPredict_Record_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto relative">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center space-x-3 bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-xl">
          <CheckCircle size={18} />
          <span className="text-xs font-bold font-sans">Settings updated successfully!</span>
        </div>
      )}

      {/* Header Description */}
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold tracking-tight">{t.settingsTitle}</h2>
        <p className="text-sm text-muted-foreground">
          Manage system configurations, user-facing notifications, privacy, and clinical export logs.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Multilingual & Theme Config */}
        <div className="bg-card/45 backdrop-blur-md border border-border/60 rounded-3xl p-5 md:p-6 shadow-lg space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 border-b border-border/40 pb-2">
            <Globe size={14} /> Interface Preferences
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Language */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">System Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="w-full bg-secondary/35 border border-border/80 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
              >
                <option value="en" className="bg-card">English (EN)</option>
                <option value="hi" className="bg-card">Hindi (हिंदी)</option>
                <option value="kn" className="bg-card">Kannada (ಕನ್ನಡ)</option>
                <option value="te" className="bg-card">Telugu (తెలుగు)</option>
                <option value="ta" className="bg-card">Tamil (தமிழ்)</option>
              </select>
            </div>

            {/* Theme Toggle Button */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Color Scheme Theme</label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    theme === 'light'
                      ? 'bg-primary text-white border-primary'
                      : 'border-border/80 hover:bg-secondary/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Sun size={14} />
                  <span>Light Mode</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    theme === 'dark'
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/10'
                      : 'border-border/80 hover:bg-secondary/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Moon size={14} />
                  <span>Dark Mode</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Card */}
        <div className="bg-card/45 backdrop-blur-md border border-border/60 rounded-3xl p-5 md:p-6 shadow-lg space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 border-b border-border/40 pb-2">
            <Bell size={14} /> Alerts & Notifications
          </h3>

          <div className="space-y-3.5">
            <label className="flex items-start justify-between cursor-pointer">
              <div className="space-y-0.5 max-w-md pr-4">
                <p className="text-xs font-bold text-foreground">Critical Biomarker Anomalies</p>
                <p className="text-[10px] text-muted-foreground">Receive instant desktop alerts when vital logs spike above clinical thresholds.</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.anomalies}
                onChange={() => setNotifications({ ...notifications, anomalies: !notifications.anomalies })}
                className="rounded border-border text-primary focus:ring-primary w-4 h-4 bg-secondary mt-1"
              />
            </label>

            <label className="flex items-start justify-between cursor-pointer">
              <div className="space-y-0.5 max-w-md pr-4">
                <p className="text-xs font-bold text-foreground">Weekly Explainable Digest</p>
                <p className="text-[10px] text-muted-foreground">Receive a weekly longitudinal overview matching changes to risk deflections.</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.weeklyReport}
                onChange={() => setNotifications({ ...notifications, weeklyReport: !notifications.weeklyReport })}
                className="rounded border-border text-primary focus:ring-primary w-4 h-4 bg-secondary mt-1"
              />
            </label>
          </div>
        </div>

        {/* Data Security & Privacy */}
        <div className="bg-card/45 backdrop-blur-md border border-border/60 rounded-3xl p-5 md:p-6 shadow-lg space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 border-b border-border/40 pb-2">
            <EyeOff size={14} /> Privacy & Clinical Sharing
          </h3>

          <div className="space-y-3.5">
            <label className="flex items-start justify-between cursor-pointer">
              <div className="space-y-0.5 max-w-md pr-4">
                <p className="text-xs font-bold text-foreground">Direct Clinical Consultation Sync</p>
                <p className="text-[10px] text-muted-foreground">Allow your primary physician to scan your patient UUID for brief summaries.</p>
              </div>
              <input
                type="checkbox"
                checked={privacy.sharing}
                onChange={() => setPrivacy({ ...privacy, sharing: !privacy.sharing })}
                className="rounded border-border text-primary focus:ring-primary w-4 h-4 bg-secondary mt-1"
              />
            </label>

            <label className="flex items-start justify-between cursor-pointer">
              <div className="space-y-0.5 max-w-md pr-4">
                <p className="text-xs font-bold text-foreground">Local Model Caching</p>
                <p className="text-[10px] text-muted-foreground">Store explanation weights locally in your browser cache to allow offline simulations.</p>
              </div>
              <input
                type="checkbox"
                checked={privacy.localCache}
                onChange={() => setPrivacy({ ...privacy, localCache: !privacy.localCache })}
                className="rounded border-border text-primary focus:ring-primary w-4 h-4 bg-secondary mt-1"
              />
            </label>
          </div>
        </div>

        {/* Export / Actions */}
        <div className="bg-card/45 backdrop-blur-md border border-border/60 rounded-3xl p-5 md:p-6 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-foreground">Export Medical Logs</h4>
            <p className="text-[10px] text-muted-foreground">Download all your records in a secure JSON file.</p>
          </div>
          
          <button
            type="button"
            onClick={handleExportData}
            className="flex items-center space-x-1.5 border border-primary/30 hover:border-primary/60 bg-primary/10 text-primary px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-primary/20 transition-all active:scale-95 shrink-0"
          >
            <Download size={13} />
            <span>Export Local JSON</span>
          </button>
        </div>

        {/* Save Controls */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center space-x-1.5 bg-gradient-to-r from-primary to-fuchsia-600 hover:from-primary/95 hover:to-fuchsia-600/95 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/20 active:scale-95"
          >
            <Save size={14} />
            <span>Save Preferences</span>
          </button>
        </div>

      </form>
    </div>
  );
};
