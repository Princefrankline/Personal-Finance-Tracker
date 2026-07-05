import React, { useState } from "react";
import { useFinance } from "../context/FinanceContext";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";
import {
  User,
  Settings,
  Database,
  Download,
  Upload,
  LogOut,
  CheckCircle,
  HelpCircle,
  DollarSign,
  Globe,
  Lock,
} from "lucide-react";

export default function ProfileView() {
  const {
    user,
    userProfile,
    isDemo,
    currency,
    language,
    theme,
    setCurrency,
    setLanguage,
    setTheme,
    toggleDemoMode,
    updateProfileName,
    backupData,
    restoreData,
  } = useFinance();

  const [name, setName] = useState(userProfile?.name || "Jane Doe");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  const currencies = [
    { code: "USD", name: "United States Dollar ($)" },
    { code: "EUR", name: "Euro (€)" },
    { code: "GBP", name: "Great British Pound (£)" },
    { code: "JPY", name: "Japanese Yen (¥)" },
    { code: "CAD", name: "Canadian Dollar (C$)" },
    { code: "AUD", name: "Australian Dollar (A$)" },
    { code: "INR", name: "Indian Rupee (₹)" },
  ];

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    try {
      await updateProfileName(name);
      setProfileMessage("Profile updated successfully!");
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBackup = () => {
    try {
      const dataStr = backupData();
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `ValueVault_Backup_${new Date().toISOString().split("T")[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Backup failed:", err);
      alert("Backup failed. Verify data values.");
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestoreMessage(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const success = await restoreData(text);
        if (success) {
          setRestoreMessage("Database restored successfully!");
          setTimeout(() => setRestoreMessage(null), 4000);
        } else {
          setRestoreMessage("Error: Invalid or corrupt backup file format.");
        }
      } catch (err) {
        console.error(err);
        setRestoreMessage("Error reading backup file.");
      }
    };
    reader.readAsText(file);
  };

  const handleLogOut = () => {
    if (isDemo) {
      toggleDemoMode(false);
    } else {
      signOut(auth);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      {/* LEFT 2 COLUMNS: Profile & Settings forms */}
      <div className="xl:col-span-2 space-y-6">
        
        {/* Profile Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h3 className="text-sm font-semibold text-slate-100 mb-5 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" /> Personal Identity
          </h3>

          <form onSubmit={handleUpdateName} className="space-y-4">
            {profileMessage && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{profileMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">User Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-semibold">Email Address</label>
                <input
                  type="text"
                  disabled
                  value={user?.email || "demo@valuevault.ai"}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/40 border border-slate-900 outline-none text-xs text-slate-500 select-none cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              {isDemo && (
                <span className="text-[10px] text-slate-500">
                  Guest Demo account. Login to save name updates to Firestore.
                </span>
              )}
              <button
                type="submit"
                className="ml-auto px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors"
              >
                Update Profile Name
              </button>
            </div>
          </form>
        </div>

        {/* Global Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-400" /> Localization & Preferences
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Preferred Currency */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-slate-400" />
                <label className="text-xs font-semibold text-slate-300">Preferred Currency</label>
              </div>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-slate-200 cursor-pointer"
              >
                {currencies.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Selection */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-slate-400" />
                <label className="text-xs font-semibold text-slate-300">Multi-language Support</label>
              </div>
              <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800/60">
                {(["en", "es", "fr"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                      language === lang ? "bg-slate-800 text-slate-100" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {lang === "en" ? "English" : lang === "es" ? "Español" : "Français"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Database backup & restore */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h3 className="text-sm font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            Backup & Restore Core Engine
          </h3>

          {restoreMessage && (
            <div
              className={`p-3.5 mb-4 text-xs rounded-xl flex items-center gap-2 ${
                restoreMessage.startsWith("Error")
                  ? "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                  : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
              }`}
            >
              <span>{restoreMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Backup */}
            <div className="p-4 bg-slate-950/40 border border-slate-800/40 rounded-2xl flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-slate-400" /> Export Database Backup
                </h4>
                <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                  Download all incomes, expenses, budgets, savings, and investments as a secure JSON backup.
                </p>
              </div>
              <button
                type="button"
                onClick={handleBackup}
                className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 cursor-pointer transition-colors"
              >
                Download JSON Backup
              </button>
            </div>

            {/* Restore */}
            <div className="p-4 bg-slate-950/40 border border-slate-800/40 rounded-2xl flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-slate-400" /> Restore Database Backup
                </h4>
                <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                  Upload a previously saved ValueVault backup. Note: Uploading will replace your current entries.
                </p>
              </div>
              <div className="relative mt-4">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestore}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <button
                  type="button"
                  className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 pointer-events-none"
                >
                  Upload Backup File
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Account settings */}
      <div>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400" /> Guard Session
          </h3>

          <div className="p-4 bg-slate-950/30 rounded-2xl border border-slate-800/40 text-center py-6">
            <User className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <h4 className="text-xs font-bold text-slate-300">
              {isDemo ? "Guest Demo Account" : userProfile?.name || user?.email}
            </h4>
            <p className="text-[10px] text-slate-500 mt-1 font-mono uppercase tracking-wider">
              {isDemo ? "OFFLINE-FIRST MODE" : "FIRESTORE SYNCED"}
            </p>
          </div>

          <button
            onClick={handleLogOut}
            className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <LogOut className="w-4 h-4" />
            {isDemo ? "Sign in to Firestore Vault" : "Sign Out of Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
