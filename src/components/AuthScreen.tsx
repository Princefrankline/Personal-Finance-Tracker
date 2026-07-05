import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { useFinance } from "../context/FinanceContext";
import { DollarSign, Mail, Lock, User, Sparkles, AlertCircle, ArrowRight } from "lucide-react";

export default function AuthScreen() {
  const { toggleDemoMode } = useFinance();
  const [isLogin, setIsLogin] = useState(true);
  const [isReset, setIsReset] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  
  // Feedback
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isReset) {
        await sendPasswordResetEmail(auth, email);
        setMessage("Password reset email sent successfully! Please check your inbox.");
        setIsReset(false);
      } else if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (!name.trim()) {
          throw new Error("Please enter your name");
        }
        await createUserWithEmailAndPassword(auth, email, password);
        // Authentication state observer will handle profile creation
      }
    } catch (err: any) {
      console.error(err);
      let errorMsg = err.message || "An authentication error occurred.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        errorMsg = "Invalid email or password. Please try again.";
      } else if (err.code === "auth/email-already-in-use") {
        errorMsg = "This email is already registered.";
      } else if (err.code === "auth/weak-password") {
        errorMsg = "Password should be at least 6 characters long.";
      } else if (err.code === "auth/invalid-email") {
        errorMsg = "Please enter a valid email address.";
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      setError("Google Sign-In failed or was blocked by the browser. Try entering an email & password or use Guest Mode!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-4 py-12 relative overflow-hidden font-sans">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="max-w-md w-full relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold mb-4 shadow-xl shadow-emerald-500/20">
            <DollarSign className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            ValueVault
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Personal Finance Tracker with Smart AI Insights
          </p>
        </div>

        {/* Card Body */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-slate-950/50">
          <h2 className="text-xl font-semibold mb-6">
            {isReset
              ? "Reset Password"
              : isLogin
              ? "Welcome Back"
              : "Create Your Vault Account"}
          </h2>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-3">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && !isReset && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm transition-all text-slate-200"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="jane@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm transition-all text-slate-200"
                />
              </div>
            </div>

            {!isReset && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-slate-400">Password</label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => setIsReset(true)}
                      className="text-xs text-emerald-400 hover:underline hover:text-emerald-300"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm transition-all text-slate-200"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold rounded-xl text-sm transition-all shadow-lg hover:shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Authenticating..." : isReset ? "Send Reset Email" : isLogin ? "Sign In" : "Register Account"}
            </button>
          </form>

          {isReset ? (
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => setIsReset(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              {/* Divider */}
              <div className="flex items-center my-6">
                <div className="flex-1 h-[1px] bg-slate-800" />
                <span className="px-3 text-slate-500 text-xs">or connect with</span>
                <div className="flex-1 h-[1px] bg-slate-800" />
              </div>

              {/* Third-Party Auths */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-900 hover:border-slate-700 rounded-xl text-sm font-medium flex items-center justify-center gap-3 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 14.98 1 12 1 7.35 1 3.37 3.68 1.42 7.62l3.86 2.99C6.23 7.62 8.89 5.04 12 5.04z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.75-4.87 3.75-8.5z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.78a6.992 6.992 0 0 1 0-4.18L1.42 7.62a11.94 11.94 0 0 0 0 8.76l3.86-2.99z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.66-2.84c-1.1.74-2.51 1.18-4.3 1.18-3.11 0-5.77-2.58-6.72-5.57L1.42 16.4C3.37 20.32 7.35 23 12 23z"
                    />
                  </svg>
                  Sign in with Google
                </button>

                <button
                  type="button"
                  onClick={() => toggleDemoMode(true)}
                  className="w-full py-2.5 bg-gradient-to-r from-slate-900 to-slate-950 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl text-sm font-medium flex items-center justify-center gap-2 text-emerald-400 transition-all cursor-pointer group"
                >
                  <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Try Live Demo (Instant Guest Mode)
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>
              </div>

              {/* Mode Switch */}
              <div className="text-center mt-6 text-xs text-slate-500">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-emerald-400 hover:underline"
                >
                  {isLogin ? "Register now" : "Sign in here"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
