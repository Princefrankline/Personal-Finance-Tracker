import React, { createContext, useContext, useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { db, auth } from "../lib/firebase";
import {
  Income,
  Expense,
  Budget,
  Saving,
  Investment,
  UserProfile,
  AISuggestions,
  EMI,
  BillReminder,
} from "../types";

interface FinanceContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isDemo: boolean;
  loading: boolean;
  incomes: Income[];
  expenses: Expense[];
  budgets: Budget[];
  savings: Saving[];
  investments: Investment[];
  emis: EMI[];
  reminders: BillReminder[];
  currency: string;
  language: "en" | "es" | "fr";
  theme: "light" | "dark";
  aiSuggestions: AISuggestions | null;
  aiLoading: boolean;
  
  // State setters & Actions
  setCurrency: (currency: string) => void;
  setLanguage: (lang: "en" | "es" | "fr") => void;
  setTheme: (theme: "light" | "dark") => void;
  toggleDemoMode: (enable: boolean) => void;
  fetchAISuggestions: () => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;

  // CRUD Operations
  addIncome: (income: Omit<Income, "userId">) => Promise<void>;
  editIncome: (id: string, income: Partial<Income>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;

  addExpense: (expense: Omit<Expense, "userId">) => Promise<void>;
  editExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  addBudget: (budget: Omit<Budget, "userId">) => Promise<void>;
  editBudget: (id: string, budget: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  addSaving: (saving: Omit<Saving, "userId">) => Promise<void>;
  editSaving: (id: string, saving: Partial<Saving>) => Promise<void>;
  deleteSaving: (id: string) => Promise<void>;

  addInvestment: (investment: Omit<Investment, "userId">) => Promise<void>;
  editInvestment: (id: string, investment: Partial<Investment>) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;

  addEMI: (emi: Omit<EMI, "userId" | "id">) => Promise<void>;
  editEMI: (id: string, emi: Partial<EMI>) => Promise<void>;
  deleteEMI: (id: string) => Promise<void>;

  addReminder: (reminder: Omit<BillReminder, "userId" | "id">) => Promise<void>;
  toggleReminderPaid: (id: string) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;

  // Data management
  backupData: () => string;
  restoreData: (jsonData: string) => Promise<boolean>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// Rich mock data for DEMO mode
const demoIncomes: Income[] = [
  { id: "inc1", userId: "demo", category: "Salary", amount: 6500, date: "2026-07-01", description: "Monthly corporate salary", recurring: true },
  { id: "inc2", userId: "demo", category: "Freelancing", amount: 1200, date: "2026-07-03", description: "Mobile App UI Design client contract" },
  { id: "inc3", userId: "demo", category: "Investments", amount: 350, date: "2026-06-25", description: "Quarterly stock dividend", recurring: true },
];

const demoExpenses: Expense[] = [
  { id: "exp1", userId: "demo", category: "Rent", amount: 1800, date: "2026-07-01", description: "Downtown apartment rental lease", recurring: true },
  { id: "exp2", userId: "demo", category: "Food", amount: 320, date: "2026-07-02", description: "Weekly organic groceries supermarket" },
  { id: "exp3", userId: "demo", category: "Transport", amount: 150, date: "2026-07-03", description: "Fuel refuel & metro smartcard top-up" },
  { id: "exp4", userId: "demo", category: "Entertainment", amount: 80, date: "2026-07-04", description: "Movie night and dinners" },
  { id: "exp5", userId: "demo", category: "Bills", amount: 120, date: "2026-07-02", description: "Gigabit internet & electricity bills", recurring: true },
  { id: "exp6", userId: "demo", category: "Shopping", amount: 450, date: "2026-06-28", description: "Summer clothes and sunglasses" },
  { id: "exp7", userId: "demo", category: "Healthcare", amount: 95, date: "2026-06-26", description: "Dental checkup and prescriptions" },
];

const demoBudgets: Budget[] = [
  { id: "bud1", userId: "demo", category: "Food", limit: 600, month: "2026-07" },
  { id: "bud2", userId: "demo", category: "Transport", limit: 250, month: "2026-07" },
  { id: "bud3", userId: "demo", category: "Entertainment", limit: 300, month: "2026-07" },
  { id: "bud4", userId: "demo", category: "Shopping", limit: 400, month: "2026-07" },
];

const demoSavings: Saving[] = [
  { id: "sav1", userId: "demo", goalName: "Emergency Fund", targetAmount: 15000, savedAmount: 10500, deadline: "2026-12-31" },
  { id: "sav2", userId: "demo", goalName: "Europe Vacation", targetAmount: 5000, savedAmount: 3200, deadline: "2026-08-15" },
  { id: "sav3", userId: "demo", goalName: "Tesla Model Y Downpayment", targetAmount: 12000, savedAmount: 2500, deadline: "2027-04-01" },
];

const demoInvestments: Investment[] = [
  { id: "inv1", userId: "demo", investmentType: "Stocks", investedAmount: 12000, currentValue: 14850, purchaseDate: "2025-01-10" },
  { id: "inv2", userId: "demo", investmentType: "Mutual Funds", investedAmount: 8000, currentValue: 9100, purchaseDate: "2025-03-20" },
  { id: "inv3", userId: "demo", investmentType: "Gold", investedAmount: 3000, currentValue: 3450, purchaseDate: "2024-11-05" },
  { id: "inv4", userId: "demo", investmentType: "Cryptocurrency", investedAmount: 4000, currentValue: 5200, purchaseDate: "2025-08-12" },
];

const demoEMIs: EMI[] = [
  { id: "emi1", userId: "demo", loanName: "Car Loan", principalAmount: 24000, interestRate: 4.5, tenureMonths: 48, monthlyEmi: 547, startDate: "2025-06-01", remainingMonths: 35 },
  { id: "emi2", userId: "demo", loanName: "Student Debt Refinance", principalAmount: 15000, interestRate: 3.2, tenureMonths: 60, monthlyEmi: 271, startDate: "2024-09-01", remainingMonths: 38 },
];

const demoReminders: BillReminder[] = [
  { id: "rem1", userId: "demo", title: "Monthly Rent Payment", amount: 1800, dueDate: "2026-08-01", category: "Rent", paid: false },
  { id: "rem2", userId: "demo", title: "Electric Utility", amount: 85, dueDate: "2026-07-15", category: "Bills", paid: false },
  { id: "rem3", userId: "demo", title: "Gym Subscription", amount: 45, dueDate: "2026-07-10", category: "Entertainment", paid: true },
  { id: "rem4", userId: "demo", title: "Netflix Premium", amount: 20, dueDate: "2026-07-08", category: "Entertainment", paid: false },
];

const demoSuggestions: AISuggestions = {
  financialHealthScore: 84,
  healthAssessment: "Excellent work! Your financial posture is incredibly healthy, powered by a 44% savings rate and solid diversification across growth portfolios. Your debt-to-income ratio is healthy, though entertainment and shopping deserve careful monitoring as they are closing in on category limits.",
  suggestions: [
    {
      type: "warning",
      category: "budget",
      title: "Shopping Budget Nearing Limit",
      message: "You have spent 450.00 of your Shopping budget. Ensure you defer unnecessary purchases until next month to avoid exceeding limits."
    },
    {
      type: "opportunity",
      category: "investment",
      title: "Rebalance Crypto Holdings",
      message: "Your Crypto holdings have increased significantly in value (+30%). We recommend locking in some gains and shifting them to your Europe Vacation goal to guarantee your deadline target."
    },
    {
      type: "tip",
      category: "saving",
      title: "Automate Holiday Transfers",
      message: "By automating a small monthly deposit of 200.00, your Emergency Fund goal will trigger 3 months ahead of your baseline target."
    }
  ],
  monthlyReportAnalysis: "Your income exceeds expenses by 5,305.00 this month. This outstanding surplus can either accelerate your emergency buffer or support diversified high-yield vehicles to guard against inflation. Keep up this disciplined tracking!"
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isDemo, setIsDemo] = useState<boolean>(true); // default to demo/guest so they see data instantly!
  const [loading, setLoading] = useState<boolean>(true);

  // Core Financial Entities
  const [incomes, setIncomes] = useState<Income[]>(demoIncomes);
  const [expenses, setExpenses] = useState<Expense[]>(demoExpenses);
  const [budgets, setBudgets] = useState<Budget[]>(demoBudgets);
  const [savings, setSavings] = useState<Saving[]>(demoSavings);
  const [investments, setInvestments] = useState<Investment[]>(demoInvestments);
  const [emis, setEmis] = useState<EMI[]>(demoEMIs);
  const [reminders, setReminders] = useState<BillReminder[]>(demoReminders);

  // App Settings
  const [currency, setCurrency] = useState<string>("INR");
  const [language, setLanguage] = useState<"en" | "es" | "fr">("en");
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // AI State
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestions | null>(demoSuggestions);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // React to Auth Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsDemo(false);
        
        // Fetch or create profile
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const profileSnap = await getDoc(userDocRef);

        let activeCurrency = "INR";
        if (profileSnap.exists()) {
          const profileData = profileSnap.data() as UserProfile;
          setUserProfile(profileData);
          if (profileData.preferredCurrency) {
            activeCurrency = profileData.preferredCurrency;
            setCurrency(profileData.preferredCurrency);
          }
        } else {
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
            email: firebaseUser.email || "",
            preferredCurrency: "INR",
            createdAt: new Date().toISOString(),
          };
          await setDoc(userDocRef, newProfile);
          setUserProfile(newProfile);
        }

        // Fetch user finance data from Firestore
        await fetchUserData(firebaseUser.uid, activeCurrency);
      } else {
        setUser(null);
        setUserProfile(null);
        // Fall back to Demo data so they are never greeted by empty states
        setIsDemo(true);
        setIncomes(demoIncomes);
        setExpenses(demoExpenses);
        setBudgets(demoBudgets);
        setSavings(demoSavings);
        setInvestments(demoInvestments);
        setEmis(demoEMIs);
        setReminders(demoReminders);
        setAiSuggestions(demoSuggestions);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchUserData = async (uid: string, prefCurrency: string) => {
    try {
      // 1. Fetch Incomes
      const incomesSnap = await getDocs(query(collection(db, "income"), where("userId", "==", uid)));
      const fetchedIncomes = incomesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Income[];
      setIncomes(fetchedIncomes);

      // 2. Fetch Expenses
      const expensesSnap = await getDocs(query(collection(db, "expenses"), where("userId", "==", uid)));
      const fetchedExpenses = expensesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Expense[];
      setExpenses(fetchedExpenses);

      // 3. Fetch Budgets
      const budgetsSnap = await getDocs(query(collection(db, "budgets"), where("userId", "==", uid)));
      const fetchedBudgets = budgetsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Budget[];
      setBudgets(fetchedBudgets);

      // 4. Fetch Savings
      const savingsSnap = await getDocs(query(collection(db, "savings"), where("userId", "==", uid)));
      const fetchedSavings = savingsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Saving[];
      setSavings(fetchedSavings);

      // 5. Fetch Investments
      const investmentsSnap = await getDocs(query(collection(db, "investments"), where("userId", "==", uid)));
      const fetchedInvestments = investmentsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Investment[];
      setInvestments(fetchedInvestments);

      // 6. Fetch EMIs (stored in a generic table / collection or custom)
      try {
        const emisSnap = await getDocs(query(collection(db, "emis"), where("userId", "==", uid)));
        const fetchedEMIs = emisSnap.docs.map(d => ({ id: d.id, ...d.data() })) as EMI[];
        setEmis(fetchedEMIs);
      } catch (e) {
        setEmis([]);
      }

      // 7. Fetch Reminders
      try {
        const remindersSnap = await getDocs(query(collection(db, "reminders"), where("userId", "==", uid)));
        const fetchedReminders = remindersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as BillReminder[];
        setReminders(fetchedReminders);
      } catch (e) {
        setReminders([]);
      }

      // Trigger AI fetch with empty/loaded state
      setAiSuggestions(null);
    } catch (e) {
      console.error("Error loading user Firestore documents: ", e);
    }
  };

  // Toggle demo mode explicitly
  const toggleDemoMode = (enable: boolean) => {
    if (enable) {
      setIsDemo(true);
      setUser(null);
      setUserProfile(null);
      setIncomes(demoIncomes);
      setExpenses(demoExpenses);
      setBudgets(demoBudgets);
      setSavings(demoSavings);
      setInvestments(demoInvestments);
      setEmis(demoEMIs);
      setReminders(demoReminders);
      setAiSuggestions(demoSuggestions);
    } else {
      setIsDemo(false);
      signOut(auth);
    }
  };

  // Profile Update
  const updateProfileName = async (name: string) => {
    if (isDemo || !user) {
      if (userProfile) setUserProfile({ ...userProfile, name });
      return;
    }
    const userDocRef = doc(db, "users", user.uid);
    const updated = { ...userProfile, name } as UserProfile;
    await setDoc(userDocRef, updated, { merge: true });
    setUserProfile(updated);
  };

  // Handle Preferred Currency changes (syncs to User Profile in DB)
  useEffect(() => {
    const syncCurrency = async () => {
      if (!isDemo && user && userProfile) {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { ...userProfile, preferredCurrency: currency }, { merge: true });
        setUserProfile({ ...userProfile, preferredCurrency: currency });
      }
    };
    syncCurrency();
  }, [currency]);

  // AI suggestions client trigger
  const fetchAISuggestions = async () => {
    setAiLoading(true);
    try {
      const response = await fetch("/api/ai-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          income: incomes,
          expenses: expenses,
          budgets: budgets,
          savings: savings,
          investments: investments,
          preferredCurrency: currency,
        }),
      });
      if (response.ok) {
        const suggestions = await response.json();
        setAiSuggestions(suggestions);
      } else {
        throw new Error("Failed to compile suggestions");
      }
    } catch (err) {
      console.error("AI Insights Error:", err);
      // fallback
      setAiSuggestions({
        financialHealthScore: 75,
        healthAssessment: "We couldn't generate full real-time suggestions due to an API timeout. Try updating budgets and checking in later.",
        suggestions: [
          {
            type: "tip",
            category: "general",
            title: "Maintain tracking",
            message: "Continue logging your investments, bills, and monthly activities to maintain high visibility."
          }
        ],
        monthlyReportAnalysis: "Income tracking is solid. Stay aligned with your monthly goals!"
      });
    } finally {
      setAiLoading(false);
    }
  };

  // Automatically trigger AI fetch once on user transition
  useEffect(() => {
    if (!isDemo && incomes.length > 0) {
      fetchAISuggestions();
    }
  }, [isDemo, incomes.length]);

  // ==========================================
  // CRUD Operations - Incomes
  // ==========================================
  const addIncome = async (inc: Omit<Income, "userId">) => {
    const item: Income = { ...inc, userId: user?.uid || "demo" };
    if (isDemo || !user) {
      const newItem = { id: `inc_${Date.now()}`, ...item };
      setIncomes([newItem, ...incomes]);
    } else {
      const docRef = await addDoc(collection(db, "income"), item);
      setIncomes([{ id: docRef.id, ...item }, ...incomes]);
    }
  };

  const editIncome = async (id: string, updatedFields: Partial<Income>) => {
    if (isDemo || !user) {
      setIncomes(incomes.map(item => (item.id === id ? { ...item, ...updatedFields } : item)));
    } else {
      const docRef = doc(db, "income", id);
      await updateDoc(docRef, updatedFields);
      setIncomes(incomes.map(item => (item.id === id ? { ...item, ...updatedFields } : item)));
    }
  };

  const deleteIncome = async (id: string) => {
    if (isDemo || !user) {
      setIncomes(incomes.filter(item => item.id !== id));
    } else {
      await deleteDoc(doc(db, "income", id));
      setIncomes(incomes.filter(item => item.id !== id));
    }
  };

  // ==========================================
  // CRUD Operations - Expenses
  // ==========================================
  const addExpense = async (exp: Omit<Expense, "userId">) => {
    const item: Expense = { ...exp, userId: user?.uid || "demo" };
    if (isDemo || !user) {
      const newItem = { id: `exp_${Date.now()}`, ...item };
      setExpenses([newItem, ...expenses]);
    } else {
      const docRef = await addDoc(collection(db, "expenses"), item);
      setExpenses([{ id: docRef.id, ...item }, ...expenses]);
    }
  };

  const editExpense = async (id: string, updatedFields: Partial<Expense>) => {
    if (isDemo || !user) {
      setExpenses(expenses.map(item => (item.id === id ? { ...item, ...updatedFields } : item)));
    } else {
      const docRef = doc(db, "expenses", id);
      await updateDoc(docRef, updatedFields);
      setExpenses(expenses.map(item => (item.id === id ? { ...item, ...updatedFields } : item)));
    }
  };

  const deleteExpense = async (id: string) => {
    if (isDemo || !user) {
      setExpenses(expenses.filter(item => item.id !== id));
    } else {
      await deleteDoc(doc(db, "expenses", id));
      setExpenses(expenses.filter(item => item.id !== id));
    }
  };

  // ==========================================
  // CRUD Operations - Budgets
  // ==========================================
  const addBudget = async (b: Omit<Budget, "userId">) => {
    const item: Budget = { ...b, userId: user?.uid || "demo" };
    if (isDemo || !user) {
      // Overwrite if same month & category exists
      const filtered = budgets.filter(x => !(x.category === b.category && x.month === b.month));
      const newItem = { id: `bud_${Date.now()}`, ...item };
      setBudgets([newItem, ...filtered]);
    } else {
      // Clear out duplicates
      const dups = budgets.filter(x => x.category === b.category && x.month === b.month);
      for (const d of dups) {
        if (d.id) await deleteDoc(doc(db, "budgets", d.id));
      }
      const docRef = await addDoc(collection(db, "budgets"), item);
      const filtered = budgets.filter(x => !(x.category === b.category && x.month === b.month));
      setBudgets([{ id: docRef.id, ...item }, ...filtered]);
    }
  };

  const editBudget = async (id: string, updatedFields: Partial<Budget>) => {
    if (isDemo || !user) {
      setBudgets(budgets.map(item => (item.id === id ? { ...item, ...updatedFields } : item)));
    } else {
      const docRef = doc(db, "budgets", id);
      await updateDoc(docRef, updatedFields);
      setBudgets(budgets.map(item => (item.id === id ? { ...item, ...updatedFields } : item)));
    }
  };

  const deleteBudget = async (id: string) => {
    if (isDemo || !user) {
      setBudgets(budgets.filter(item => item.id !== id));
    } else {
      await deleteDoc(doc(db, "budgets", id));
      setBudgets(budgets.filter(item => item.id !== id));
    }
  };

  // ==========================================
  // CRUD Operations - Savings
  // ==========================================
  const addSaving = async (s: Omit<Saving, "userId">) => {
    const item: Saving = { ...s, userId: user?.uid || "demo" };
    if (isDemo || !user) {
      const newItem = { id: `sav_${Date.now()}`, ...item };
      setSavings([newItem, ...savings]);
    } else {
      const docRef = await addDoc(collection(db, "savings"), item);
      setSavings([{ id: docRef.id, ...item }, ...savings]);
    }
  };

  const editSaving = async (id: string, updatedFields: Partial<Saving>) => {
    if (isDemo || !user) {
      setSavings(savings.map(item => (item.id === id ? { ...item, ...updatedFields } : item)));
    } else {
      const docRef = doc(db, "savings", id);
      await updateDoc(docRef, updatedFields);
      setSavings(savings.map(item => (item.id === id ? { ...item, ...updatedFields } : item)));
    }
  };

  const deleteSaving = async (id: string) => {
    if (isDemo || !user) {
      setSavings(savings.filter(item => item.id !== id));
    } else {
      await deleteDoc(doc(db, "savings", id));
      setSavings(savings.filter(item => item.id !== id));
    }
  };

  // ==========================================
  // CRUD Operations - Investments
  // ==========================================
  const addInvestment = async (inv: Omit<Investment, "userId">) => {
    const item: Investment = { ...inv, userId: user?.uid || "demo" };
    if (isDemo || !user) {
      const newItem = { id: `inv_${Date.now()}`, ...item };
      setInvestments([newItem, ...investments]);
    } else {
      const docRef = await addDoc(collection(db, "investments"), item);
      setInvestments([{ id: docRef.id, ...item }, ...investments]);
    }
  };

  const editInvestment = async (id: string, updatedFields: Partial<Investment>) => {
    if (isDemo || !user) {
      setInvestments(investments.map(item => (item.id === id ? { ...item, ...updatedFields } : item)));
    } else {
      const docRef = doc(db, "investments", id);
      await updateDoc(docRef, updatedFields);
      setInvestments(investments.map(item => (item.id === id ? { ...item, ...updatedFields } : item)));
    }
  };

  const deleteInvestment = async (id: string) => {
    if (isDemo || !user) {
      setInvestments(investments.filter(item => item.id !== id));
    } else {
      await deleteDoc(doc(db, "investments", id));
      setInvestments(investments.filter(item => item.id !== id));
    }
  };

  // ==========================================
  // CRUD Operations - EMI Tracker
  // ==========================================
  const addEMI = async (emi: Omit<EMI, "userId" | "id">) => {
    const item = { ...emi, userId: user?.uid || "demo" };
    if (isDemo || !user) {
      const newItem: EMI = { id: `emi_${Date.now()}`, ...item };
      setEmis([newItem, ...emis]);
    } else {
      const docRef = await addDoc(collection(db, "emis"), item);
      setEmis([{ id: docRef.id, ...item } as EMI, ...emis]);
    }
  };

  const editEMI = async (id: string, updatedFields: Partial<EMI>) => {
    if (isDemo || !user) {
      setEmis(emis.map(item => (item.id === id ? { ...item, ...updatedFields } : item)));
    } else {
      const docRef = doc(db, "emis", id);
      await updateDoc(docRef, updatedFields);
      setEmis(emis.map(item => (item.id === id ? { ...item, ...updatedFields } : item)));
    }
  };

  const deleteEMI = async (id: string) => {
    if (isDemo || !user) {
      setEmis(emis.filter(item => item.id !== id));
    } else {
      await deleteDoc(doc(db, "emis", id));
      setEmis(emis.filter(item => item.id !== id));
    }
  };

  // ==========================================
  // CRUD Operations - Reminders
  // ==========================================
  const addReminder = async (rem: Omit<BillReminder, "userId" | "id">) => {
    const item = { ...rem, userId: user?.uid || "demo" };
    if (isDemo || !user) {
      const newItem: BillReminder = { id: `rem_${Date.now()}`, ...item };
      setReminders([newItem, ...reminders]);
    } else {
      const docRef = await addDoc(collection(db, "reminders"), item);
      setReminders([{ id: docRef.id, ...item } as BillReminder, ...reminders]);
    }
  };

  const toggleReminderPaid = async (id: string) => {
    const target = reminders.find(x => x.id === id);
    if (!target) return;
    const nextPaid = !target.paid;

    if (isDemo || !user) {
      setReminders(reminders.map(item => (item.id === id ? { ...item, paid: nextPaid } : item)));
    } else {
      const docRef = doc(db, "reminders", id);
      await updateDoc(docRef, { paid: nextPaid });
      setReminders(reminders.map(item => (item.id === id ? { ...item, paid: nextPaid } : item)));
    }
  };

  const deleteReminder = async (id: string) => {
    if (isDemo || !user) {
      setReminders(reminders.filter(item => item.id !== id));
    } else {
      await deleteDoc(doc(db, "reminders", id));
      setReminders(reminders.filter(item => item.id !== id));
    }
  };

  // ==========================================
  // Data Backup & Restore (Feature 10)
  // ==========================================
  const backupData = () => {
    const backupObj = {
      incomes,
      expenses,
      budgets,
      savings,
      investments,
      emis,
      reminders,
      currency,
      theme,
      timestamp: new Date().toISOString(),
    };
    return JSON.stringify(backupObj, null, 2);
  };

  const restoreData = async (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (
        !parsed.incomes ||
        !parsed.expenses ||
        !parsed.budgets ||
        !parsed.savings ||
        !parsed.investments
      ) {
        return false;
      }

      setIncomes(parsed.incomes);
      setExpenses(parsed.expenses);
      setBudgets(parsed.budgets);
      setSavings(parsed.savings);
      setInvestments(parsed.investments);
      if (parsed.emis) setEmis(parsed.emis);
      if (parsed.reminders) setReminders(parsed.reminders);
      if (parsed.currency) setCurrency(parsed.currency);

      if (!isDemo && user) {
        // Recursively overwrite Firestore documents
        const uid = user.uid;
        
        // 1. Delete and upload incomes
        const incomesSnap = await getDocs(query(collection(db, "income"), where("userId", "==", uid)));
        for (const d of incomesSnap.docs) await deleteDoc(d.ref);
        for (const inc of parsed.incomes) {
          const { id, ...clean } = inc;
          await addDoc(collection(db, "income"), { ...clean, userId: uid });
        }

        // 2. Delete and upload expenses
        const expensesSnap = await getDocs(query(collection(db, "expenses"), where("userId", "==", uid)));
        for (const d of expensesSnap.docs) await deleteDoc(d.ref);
        for (const exp of parsed.expenses) {
          const { id, ...clean } = exp;
          await addDoc(collection(db, "expenses"), { ...clean, userId: uid });
        }

        // 3. Budgets
        const budgetsSnap = await getDocs(query(collection(db, "budgets"), where("userId", "==", uid)));
        for (const d of budgetsSnap.docs) await deleteDoc(d.ref);
        for (const b of parsed.budgets) {
          const { id, ...clean } = b;
          await addDoc(collection(db, "budgets"), { ...clean, userId: uid });
        }

        // 4. Savings
        const savingsSnap = await getDocs(query(collection(db, "savings"), where("userId", "==", uid)));
        for (const d of savingsSnap.docs) await deleteDoc(d.ref);
        for (const s of parsed.savings) {
          const { id, ...clean } = s;
          await addDoc(collection(db, "savings"), { ...clean, userId: uid });
        }

        // 5. Investments
        const investmentsSnap = await getDocs(query(collection(db, "investments"), where("userId", "==", uid)));
        for (const d of investmentsSnap.docs) await deleteDoc(d.ref);
        for (const inv of parsed.investments) {
          const { id, ...clean } = inv;
          await addDoc(collection(db, "investments"), { ...clean, userId: uid });
        }

        await fetchUserData(uid, currency);
      }
      return true;
    } catch (e) {
      console.error("Backup Restore Error:", e);
      return false;
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        user,
        userProfile,
        isDemo,
        loading,
        incomes,
        expenses,
        budgets,
        savings,
        investments,
        emis,
        reminders,
        currency,
        language,
        theme,
        aiSuggestions,
        aiLoading,
        setCurrency,
        setLanguage,
        setTheme,
        toggleDemoMode,
        fetchAISuggestions,
        updateProfileName,
        addIncome,
        editIncome,
        deleteIncome,
        addExpense,
        editExpense,
        deleteExpense,
        addBudget,
        editBudget,
        deleteBudget,
        addSaving,
        editSaving,
        deleteSaving,
        addInvestment,
        editInvestment,
        deleteInvestment,
        addEMI,
        editEMI,
        deleteEMI,
        addReminder,
        toggleReminderPaid,
        deleteReminder,
        backupData,
        restoreData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error("useFinance must be used within a FinanceProvider");
  }
  return context;
};
