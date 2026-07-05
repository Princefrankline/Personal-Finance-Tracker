import React, { useState } from "react";
import { useFinance } from "./context/FinanceContext";
import AuthScreen from "./components/AuthScreen";
import DashboardView from "./components/DashboardView";
import TransactionsView from "./components/TransactionsView";
import BudgetView from "./components/BudgetView";
import SavingsView from "./components/SavingsView";
import InvestmentsView from "./components/InvestmentsView";
import RemindersView from "./components/RemindersView";
import InsightsView from "./components/InsightsView";
import ProfileView from "./components/ProfileView";

import {
  LayoutDashboard,
  ArrowRightLeft,
  Target,
  PiggyBank,
  Briefcase,
  CalendarDays,
  Sparkles,
  Settings,
  DollarSign,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";

export default function App() {
  const { user, isDemo, loading, theme } = useFinance();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // loading splash screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans">
        <div className="text-center space-y-4">
          <div className="relative inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold animate-pulse">
            <DollarSign className="w-6 h-6 stroke-[2.5]" />
          </div>
          <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">Initializing Vault...</p>
        </div>
      </div>
    );
  }

  // Auth Guard
  if (!user && !isDemo) {
    return <AuthScreen />;
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "transactions", label: "Ledger", icon: ArrowRightLeft },
    { id: "budget", label: "Category Cap", icon: Target },
    { id: "savings", label: "Savings Target", icon: PiggyBank },
    { id: "investments", label: "Investments", icon: Briefcase },
    { id: "reminders", label: "Liabilities", icon: CalendarDays },
    { id: "insights", label: "AI Advisor", icon: Sparkles },
    { id: "settings", label: "Profile", icon: Settings },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView setActiveTab={handleTabChange} />;
      case "transactions":
        return <TransactionsView />;
      case "budget":
        return <BudgetView />;
      case "savings":
        return <SavingsView />;
      case "investments":
        return <InvestmentsView />;
      case "reminders":
        return <RemindersView />;
      case "insights":
        return <InsightsView />;
      case "settings":
        return <ProfileView />;
      default:
        return <DashboardView setActiveTab={handleTabChange} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* MOBILE HEADER BAR */}
      <header className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-sm font-extrabold tracking-tight">ValueVault</span>
          {isDemo && (
            <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold uppercase font-mono tracking-wider ml-1">
              Demo
            </span>
          )}
        </div>
        
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* MOBILE DRAWER / DROPDOWN */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 top-[61px] bg-slate-950/95 backdrop-blur-md p-6 flex flex-col justify-between">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full p-3.5 rounded-xl flex items-center gap-3.5 text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-500/15 to-teal-500/5 text-emerald-400 border border-emerald-500/20"
                      : "text-slate-400 hover:bg-slate-900"
                  }`}
                >
                  <IconComp className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-slate-800/60">
            <div className="flex items-center gap-3 p-3.5 bg-slate-900 rounded-xl mb-4">
              <div className="w-9 h-9 rounded-lg bg-slate-950 flex items-center justify-center text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">
                  {isDemo ? "Guest Demo" : user?.displayName || user?.email?.split("@")[0]}
                </p>
                <p className="text-[9px] text-slate-500 font-mono mt-0.5 uppercase">
                  {isDemo ? "DEMO ACTIVE" : "FIRESTORE SECURED"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-slate-900 border-r border-slate-800 shrink-0 p-5 min-h-screen sticky top-0">
        <div className="space-y-6">
          {/* Sidebar Brand logo */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-emerald-500/10">
              <DollarSign className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight">ValueVault</span>
              {isDemo ? (
                <p className="text-[8px] text-emerald-400 font-bold uppercase font-mono tracking-wider mt-0.5">
                  Guest Demo Mode
                </p>
              ) : (
                <p className="text-[8px] text-slate-500 font-bold uppercase font-mono tracking-wider mt-0.5">
                  Cloud Secured
                </p>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full p-3 rounded-xl flex items-center gap-3.5 text-xs font-semibold transition-all cursor-pointer group ${
                    isActive
                      ? "bg-slate-950 text-emerald-400 border border-slate-800/80 shadow"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-950/40"
                  }`}
                >
                  <IconComp
                    className={`w-4 h-4 transition-transform group-hover:scale-105 ${
                      isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-400"
                    }`}
                  />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Session profile foot */}
        <div className="pt-5 border-t border-slate-800/60">
          <div className="flex items-center gap-3 p-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center text-slate-400 border border-slate-800/40">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">
                {isDemo ? "Guest Demo" : user?.displayName || user?.email?.split("@")[0]}
              </p>
              <p className="text-[8px] text-slate-500 font-mono mt-0.5 truncate uppercase">
                {isDemo ? "DEMO" : "CLOUD"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN VIEW AREA */}
      <main className="flex-1 min-w-0 overflow-y-auto px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto w-full">
        {renderActiveView()}
      </main>
    </div>
  );
}
