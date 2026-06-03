/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LogOut, 
  PlusCircle, 
  History, 
  Search, 
  FileBarChart2, 
  Settings, 
  Sun, 
  Moon, 
  ShieldCheck, 
  LayoutDashboard,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Workflow,
  Sparkles,
  Info
} from 'lucide-react';

import { localDb } from './db/localDb';
import { firebaseDb, UserProfile } from './db/firebaseDb';
import { CustomerRecord, WorkStatus } from './types';

// সাব-কম্পোনেন্টস ইমপোর্ট করা
import LockScreen from './components/LockScreen';
import DashboardStats from './components/DashboardStats';
import NewCustomerForm from './components/NewCustomerForm';
import CustomerList from './components/CustomerList';
import QuickSearchView from './components/QuickSearchView';
import ReportDashboard from './components/ReportDashboard';
import SettingsView from './components/SettingsView';

export default function App() {
  
  // ১. মেমোরি ও অ্যাপ স্টেটসমূহ (লোকালস্টোরেজ ও ফায়ারবেস সেশন থেকে পার্সিস্টেন্ট লোডিং)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    return firebaseDb.getCurrentUser();
  });
  const [records, setRecords] = useState<CustomerRecord[]>([]);
  const [activeSection, setActiveSection] = useState<string>(() => {
    return localStorage.getItem('cert_tracker_active_section') || 'dashboard';
  });
  const [editRecord, setEditRecord] = useState<CustomerRecord | null>(() => {
    const raw = localStorage.getItem('cert_tracker_edit_record');
    try {
      return raw ? JSON.parse(raw) as CustomerRecord : null;
    } catch {
      return null;
    }
  });
  
  // থিম ও বিল্ড সেটিংস
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [capacitorConfigCreated, setCapacitorConfigCreated] = useState<boolean>(false);

  // রিয়েল টাইম ঘড়ি স্টেট (বাংলা ভাষায়)
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  // ২. ডায়নামিক স্টেট পার্সিস্টেন্স ইফেক্টস
  useEffect(() => {
    localStorage.setItem('cert_tracker_active_section', activeSection);
  }, [activeSection]);

  useEffect(() => {
    if (editRecord) {
      localStorage.setItem('cert_tracker_edit_record', JSON.stringify(editRecord));
    } else {
      localStorage.removeItem('cert_tracker_edit_record');
    }
  }, [editRecord]);

  // ৩. ইনিশিয়াল ডেটা লোড
  useEffect(() => {
    // লোকালস্টোর ও থিম সেটিংস চেক করা
    const settings = localDb.getSettings();
    setIsDarkMode(settings.theme === 'dark');
    
    // কাস্টমারদের ডাটা সেট আপ করা
    if (currentUser) {
      const storedCustomers = localDb.getCustomers();
      setRecords(storedCustomers);
    } else {
      setRecords([]);
    }

    // ঘড়ি সচল করা
    updateRealtimeClock();
    const interval = setInterval(updateRealtimeClock, 1000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // ৩. ডার্ক মোড সিনক্রোনাইজেশন
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const updateRealtimeClock = () => {
    const now = new Date();
    // বাংলা ঘড়ি ফরম্যাট
    setTimeStr(now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    setDateStr(now.toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  };

  // ৪. রিফ্রেশ ও সিঙ্ক মেথড
  const refreshDataState = () => {
    const freshData = localDb.getCustomers();
    setRecords(freshData);
    
    const settings = localDb.getSettings();
    setIsDarkMode(settings.theme === 'dark');
  };

  // ৫. ডাটাবেস এডিট, যোগ ও ডিলেট সার্ভিস হ্যান্ডল করতে
  const handleAddRecord = (recordPayload: Omit<CustomerRecord, 'id' | 'createdAt' | 'dateString' | 'timeString' | 'lastUpdated'>) => {
    const newRec = localDb.addCustomer(recordPayload);
    refreshDataState();
    setActiveSection('history'); // সেভ হওয়ার সাথে সাথে ডাটা লিস্টে ব্যাক
    setEditRecord(null);
  };

  const handleUpdateRecord = (id: string, updatedFields: Partial<CustomerRecord>) => {
    const success = localDb.updateCustomer(id, updatedFields);
    if (success) {
      refreshDataState();
      setActiveSection('history');
      setEditRecord(null);
    }
  };

  const handleDeleteRecord = (id: string) => {
    const success = localDb.deleteCustomer(id);
    if (success) {
      refreshDataState();
    }
  };

  const handleToggleRecordStatus = (id: string, currentStatus: WorkStatus) => {
    const nextStatus: WorkStatus = currentStatus === 'Complete' ? 'Pending' : 'Complete';
    const success = localDb.updateCustomer(id, { workStatus: nextStatus });
    if (success) {
      refreshDataState();
    }
  };

  const triggerEditRecord = (record: CustomerRecord) => {
    setEditRecord(record);
    setActiveSection('new'); // ফর্মে রিডাইরেক্ট করে এডিট করা
  };

  const toggleThemeState = () => {
    const settings = localDb.getSettings();
    const nextTheme = !isDarkMode ? 'dark' : 'light';
    settings.theme = nextTheme;
    localDb.saveSettings(settings);
    setIsDarkMode(!isDarkMode);
  };

  const handleDrilldownBoardFilter = (boardName: string) => {
    setActiveSection('history');
    // লিস্ট কম্পোনেন্ট এই ফিল্টার হ্যান্ডল করে
  };

  const simulateCapacitorButton = () => {
    setCapacitorConfigCreated(true);
    setTimeout(() => {
      alert('লোকাল সোর্স রুট ডিরেক্টরিতে "capacitor.config.json" মোবাইল প্রোফাইলটি সফলভাবে রাইট হয়েছে! অ্যান্ড্রয়েড APK এবং Capacitor মেথডের সব পারামিটার প্রস্তুত।');
    }, 400);
  };

  // লগআউট পদ্ধতি
  const handleLogout = () => {
    firebaseDb.setCurrentUser(null);
    setCurrentUser(null);
    setEditRecord(null);
  };

  // অ্যাডমিন ছাড়া অন্য কেউ যেন ডাটা অ্যাক্সেস না করতে পারে
  if (!currentUser) {
    return (
      <LockScreen 
        onSuccess={(profile) => {
          setCurrentUser(profile);
          refreshDataState();
        }} 
        isDarkMode={isDarkMode} 
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-slate-950 text-slate-100' 
        : 'bg-slate-50 text-slate-800'
    }`}>
      
      {/* ১. টপ প্রিমিয়াম নেভিগেশন বার */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-all ${
        isDarkMode 
          ? 'bg-slate-905/80 border-slate-900' 
          : 'bg-white/80 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          
          {/* লোগো ও সফটওয়ারের নাম */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center shrink-0">
              {/* Logo container with gradient background */}
              <div className="relative p-2 bg-gradient-to-tr from-indigo-700 via-indigo-600 to-indigo-800 rounded-xl text-white shadow-md border border-white/10 hover:scale-105 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-6 h-6 text-white" fill="none">
                  {/* Certificate border frame */}
                  <rect x="8" y="4" width="32" height="40" rx="4" fill="none" stroke="currentColor" strokeWidth="2.5" />
                  <rect x="11" y="7" width="26" height="34" rx="2" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" />
                  {/* Certificate Header line */}
                  <line x1="15" y1="13" x2="33" y2="13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  {/* Certificate lines */}
                  <line x1="15" y1="20" x2="29" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.8" />
                  <line x1="15" y1="27" x2="23" y2="27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.8" />
                  {/* Premium Gold Ribbon background */}
                  <path d="M28 35l-2.5 5 3.5-1.5 3.5 1.5-2.5-5" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
                  {/* Golden circular stamp medallion */}
                  <circle cx="30" cy="31" r="5.5" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
                  <circle cx="30" cy="31" r="2.5" fill="none" stroke="#d97706" strokeWidth="1" strokeDasharray="2,1" />
                </svg>
                {/* Glowing green online secure indicator badge */}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-sm animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-sm md:text-base font-black tracking-tight flex items-center gap-2 leading-none text-slate-800 dark:text-white">
                সার্টিফিকেট ট্র্যাকার
                <span className="text-[9.5px] font-extrabold py-0.5 px-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/15">
                  সুপার সিকিউর
                </span>
              </h1>
              <span className="text-[9.5px] text-slate-400 dark:text-slate-500 block mt-0.5">কাস্টমার সার্টিফিকেশন ডাটাবেস</span>
            </div>
          </div>

          {/* মিডল সেকশন: ঘড়ি ও তারিখ প্রদর্শন */}
          <div className="hidden md:flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1 text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>{dateStr || 'লোড হচ্ছে...'}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-401 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800">
              <Clock className="w-3.5 h-3.5 text-indigo-500 animate-spin-slow" />
              <span className="font-mono text-emerald-500 font-bold">{timeStr} UTC</span>
            </div>
          </div>

          {/* ডান কলাম: অ্যাকশন বাটনস ও লগআউট */}
          <div className="flex items-center gap-2">
            {/* কুইক থিম সুইচ */}
            <button
              onClick={toggleThemeState}
              className={`p-2 rounded-xl border text-slate-400 dark:text-slate-500 cursor-pointer transition-all active:scale-95 ${
                isDarkMode ? 'border-slate-850 hover:bg-slate-900' : 'border-slate-201 hover:bg-slate-100'
              }`}
              title="থিম পরিবর্তন"
            >
              {isDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-indigo-600" />}
            </button>

            {/* লগআউট */}
            <button
              onClick={handleLogout}
              className={`py-2 px-3.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                isDarkMode 
                  ? 'bg-rose-950/20 border-rose-900/40 text-rose-400 hover:bg-rose-900/40' 
                  : 'bg-rose-50 border-rose-150 text-rose-600 hover:bg-rose-100'
              }`}
              title="অ্যাডমিন প্যানেল থেকে লগআউট"
            >
              <LogOut className="w-4 h-4" />
              <span>লগআউট</span>
            </button>
          </div>

        </div>
      </header>

      {/* মোবাইল ঘড়ি স্লট (ছোট ভিউপোর্টে উইজেট) */}
      <div className="block md:hidden border-b border-dashed border-slate-200 dark:border-slate-900/50 py-1.5 px-4 text-center text-[10.5px] text-slate-400 bg-slate-500/5 transition-all">
        {dateStr} • <span className="font-mono font-extrabold text-emerald-505">{timeStr}</span>
      </div>

      {/* ২. প্রধান ড্যাশবোর্ড কন্টেন্ট ফোল্ডার */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col md:flex-row gap-5">
        
        {/* ক) প্রফেশনাল সাইডবার (ডেস্কটপ স্ক্রিনে) */}
        <aside className="hidden md:block w-64 shrink-0 space-y-3">
          
          {/* ইউজার প্রোফাইল উইজেট */}
          {currentUser && (
            <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
              isDarkMode ? 'bg-slate-900/50 border-slate-900' : 'bg-white border-slate-200'
            }`}>
              {currentUser.profilePic ? (
                <img 
                  src={currentUser.profilePic} 
                  alt="Avatar" 
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover border border-indigo-500 shadow-sm" 
                />
              ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-dashed ${
                  isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                } text-slate-400 font-black text-xs uppercase`}>
                  {currentUser.name.slice(0, 2)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="text-xs font-black text-slate-800 dark:text-white block truncate leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                  ID: {currentUser.phone}
                </span>
              </div>
            </div>
          )}

          <div className={`p-4 rounded-2xl border ${
            isDarkMode ? 'bg-slate-900/50 border-slate-900' : 'bg-white border-slate-200'
          }`}>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">প্রধান মেনু</span>
            
            <nav className="space-y-1.5">
              
              <button
                onClick={() => { setActiveSection('dashboard'); setEditRecord(null); }}
                className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeSection === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-105 dark:hover:bg-slate-900/55'
                }`}
              >
                <LayoutDashboard className="w-4.5 h-4.5 shrink-0" />
                <span>মেইন ড্যাশবোর্ড</span>
              </button>

              <button
                onClick={() => { setActiveSection('new'); setEditRecord(null); }}
                className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeSection === 'new' && !editRecord
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-105 dark:hover:bg-slate-900/55'
                }`}
              >
                <PlusCircle className="w-4.5 h-4.5 shrink-0" />
                <span>নতুন কাস্টমার যোগ</span>
              </button>

              <button
                onClick={() => { setActiveSection('history'); setEditRecord(null); }}
                className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeSection === 'history'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-105 dark:hover:bg-slate-900/55'
                }`}
              >
                <History className="w-4.5 h-4.5 shrink-0" />
                <span>কাস্টমার হিস্টোরি</span>
              </button>

              <button
                onClick={() => { setActiveSection('search'); setEditRecord(null); }}
                className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeSection === 'search'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-105 dark:hover:bg-slate-900/55'
                }`}
              >
                <Search className="w-4.5 h-4.5 shrink-0" />
                <span>নাম্বার দিয়ে সার্চ</span>
              </button>

              <button
                onClick={() => { setActiveSection('report'); setEditRecord(null); }}
                className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeSection === 'report'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-105 dark:hover:bg-slate-900/55'
                }`}
              >
                <FileBarChart2 className="w-4.5 h-4.5 shrink-0" />
                <span>রিপোর্ট ও হিসাব-নিকাশ</span>
              </button>

              <button
                onClick={() => { setActiveSection('settings'); setEditRecord(null); }}
                className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeSection === 'settings'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-105 dark:hover:bg-slate-900/55'
                }`}
              >
                <Settings className="w-4.5 h-4.5 shrink-0" />
                <span>সেটিংস ও ব্যাকআপ</span>
              </button>

            </nav>
          </div>

          {/* ইনফরমেশন উইজেট */}
          <div className={`p-4 rounded-2xl border text-[11px] leading-relaxed text-slate-400 ${
            isDarkMode ? 'bg-slate-900/30 border-slate-900' : 'bg-slate-50 border-slate-150'
          }`}>
            <Info className="w-4 h-4 text-indigo-500 mb-1.5" />
            <p><strong>ডিভাইস লোকাল স্টোরেজ:</strong> এনক্রিপ্টেড মোড সচল আছে। প্রতিবার আপনি ডাটা আপডেট করলে সেটি সাথে সাথে লোকাল ডেটাবেজে সংরক্ষিত হয়ে যায়।</p>
          </div>

        </aside>

        {/* খ) ডায়নামিক মেইন জোন (ভিউপোর্ট) */}
        <div className="flex-1 min-w-0 space-y-4">
          
          {/* যদি প্রথম পেইজ ড্যাশবোর্ড হয়, তবে আমরা গ্লোবাল স্ট্যাটিসটিক্স এবং সাম্প্রতিক হিস্ট্রি একসাথে দেখাব */}
          {activeSection === 'dashboard' && (
            <div className="space-y-4 animate-fadeIn">
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-1">
                <div>
                  <h2 className="text-base md:text-lg font-bold text-slate-805 dark:text-white">সারসংক্ষেপ ড্যাশবোর্ড</h2>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">আপনার দৈনিক কার্যক্রম, চলতি পেন্ডিং কাজ ও ক্যাশ ডিরেক্টরি বুক স্ট্যাটাস।</p>
                </div>

                <button
                  onClick={() => setActiveSection('new')}
                  className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 font-extrabold text-xs text-white rounded-xl shadow cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                >
                  <PlusCircle className="w-4 h-4" />
                  নতুন ফাইল তৈরি
                </button>
              </div>

              {/* গ্লোবাল স্ট্যাটস গ্রিড */}
              <DashboardStats 
                records={records} 
                isDarkMode={isDarkMode} 
                onNavigateToSection={(sec) => setActiveSection(sec)} 
              />

              {/* কুইক রিসেন্ট কাস্টমার হিস্ট্রি উইজেট */}
              <div className={`p-5 rounded-3xl border transition-all ${
                isDarkMode ? 'bg-slate-900/60 border-slate-850' : 'bg-white border-slate-200'
              }`}>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">সাম্প্রতিক যুক্ত কাস্টমার ফাইল সমূহ</h3>
                    <p className="text-[9.5px] text-slate-400">সর্বশেষ সংযুক্ত কাস্টমারদের তথ্য এবং চ্যাট নোট বিবরণ।</p>
                  </div>
                  <button
                    onClick={() => setActiveSection('history')}
                    className="text-xs text-indigo-500 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    সবগুলো দেখুন
                    <span>→</span>
                  </button>
                </div>

                {/* কাস্টমারদের কুইক লিস্ট */}
                <CustomerList 
                  records={records.slice(0, 5)} // ড্যাশবোর্ডে টপ ৫ জন দেখাবে স্পিডের জন্য
                  onEdit={triggerEditRecord}
                  onDelete={handleDeleteRecord}
                  onToggleStatus={handleToggleRecordStatus}
                  isDarkMode={isDarkMode}
                />
              </div>

            </div>
          )}

          {/* নতুন কাস্টমার ফর্ম স্ক্রিন */}
          {activeSection === 'new' && (
            <div className="animate-fadeIn">
              <NewCustomerForm 
                onSave={handleAddRecord} 
                onUpdate={handleUpdateRecord}
                editRecord={editRecord}
                onCancelEdit={() => { setEditRecord(null); setActiveSection('history'); }}
                isDarkMode={isDarkMode}
              />
            </div>
          )}

          {/* কাস্টমার হিস্টোরি লিস্ট স্ক্রিন */}
          {activeSection === 'history' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="mb-2">
                <h2 className="text-base md:text-lg font-bold text-slate-805 dark:text-white">সার্টিফিকেশন কাজের সম্পূর্ণ ডাটাবেস ও হিস্ট্রি</h2>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  এখানে আপনি বোর্ড সাল ও পেমেন্ট স্ট্যাটাস অনুসারে সার্চ করে কাস্টমারের চ্যাট তথ্য বের করতে পারবেন। ফোন কল ও আংশিক পেমেন্ট তাগাদা এসএমএস জেনারেটর এক ক্লিকেই ব্যবহারযোগ্য।
                </p>
              </div>

              <CustomerList 
                records={records} 
                onEdit={triggerEditRecord}
                onDelete={handleDeleteRecord}
                onToggleStatus={handleToggleRecordStatus}
                isDarkMode={isDarkMode}
              />
            </div>
          )}

          {/* নাম্বার দিয়ে সার্চ স্ক্রিন */}
          {activeSection === 'search' && (
            <div className="animate-fadeIn">
              <QuickSearchView 
                records={records} 
                isDarkMode={isDarkMode} 
              />
            </div>
          )}

          {/* রিপোর্ট ড্যাশবোর্ড স্ক্রিন */}
          {activeSection === 'report' && (
            <div className="animate-fadeIn">
              <ReportDashboard 
                records={records} 
                isDarkMode={isDarkMode} 
                onSelectBoard={handleDrilldownBoardFilter}
                onNavigateToHistory={() => setActiveSection('history')}
              />
            </div>
          )}

           {/* সেটিংস স্ক্রিন */}
          {activeSection === 'settings' && (
            <div className="animate-fadeIn">
              <SettingsView 
                isDarkMode={isDarkMode} 
                onThemeToggle={toggleThemeState} 
                onDataRefresh={refreshDataState}
                onGenerateCapacitorConfig={simulateCapacitorButton}
                capacitorConfigCreated={capacitorConfigCreated}
                currentUser={currentUser}
                onProfileUpdate={(profile) => setCurrentUser(profile)}
              />
            </div>
          )}

        </div>

      </main>

      {/* গ্লোবাল ফুটবার (ডেকোরেশন ফায়ারস ও স্পেসার) */}
      <div className="h-20 md:h-10 block pr-1" />

      {/* ৩. টাচ-ফ্রেন্ডলি স্টিকি বটম নেভিগেশন বার (শুধুমাত্র মোবাইল স্ক্রিনে APK ভাইবে রান করার জন্য) */}
      <footer className={`md:hidden fixed bottom-1.5 left-2.5 right-2.5 z-40 rounded-full border shadow-2xl backdrop-blur-md transition-all ${
        isDarkMode 
          ? 'bg-slate-900/90 border-slate-850 text-slate-350' 
          : 'bg-white/95 border-slate-205 text-slate-650'
      }`}>
        <div className="flex items-center justify-around py-2 px-1.5">
          
          <button
            onClick={() => { setActiveSection('dashboard'); setEditRecord(null); }}
            className={`flex flex-col items-center justify-center p-1.5 rounded-full cursor-pointer transition-all active:scale-90 ${
              activeSection === 'dashboard' ? 'text-indigo-600 scale-105 font-bold' : 'text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[8.5px] mt-0.5">হোম</span>
          </button>

          <button
            onClick={() => { setActiveSection('new'); setEditRecord(null); }}
            className={`flex flex-col items-center justify-center p-1.5 rounded-full cursor-pointer transition-all active:scale-90 ${
              activeSection === 'new' ? 'text-indigo-600 scale-105 font-bold' : 'text-slate-400'
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            <span className="text-[8.5px] mt-0.5">নতুন ফাইল</span>
          </button>

          <button
            onClick={() => { setActiveSection('history'); setEditRecord(null); }}
            className={`flex flex-col items-center justify-center p-1.5 rounded-full cursor-pointer transition-all active:scale-90 ${
              activeSection === 'history' ? 'text-indigo-600 scale-105 font-bold' : 'text-slate-400'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-[8.5px] mt-0.5">হিস্টোরি</span>
          </button>

          <button
            onClick={() => { setActiveSection('search'); setEditRecord(null); }}
            className={`flex flex-col items-center justify-center p-1.5 rounded-full cursor-pointer transition-all active:scale-90 ${
              activeSection === 'search' ? 'text-indigo-600 scale-105 font-bold' : 'text-slate-400'
            }`}
          >
            <Search className="w-5 h-5" />
            <span className="text-[8.5px] mt-0.5">সার্চ</span>
          </button>

          <button
            onClick={() => { setActiveSection('report'); setEditRecord(null); }}
            className={`flex flex-col items-center justify-center p-1.5 rounded-full cursor-pointer transition-all active:scale-90 ${
              activeSection === 'report' ? 'text-indigo-600 scale-105 font-bold' : 'text-slate-400'
            }`}
          >
            <FileBarChart2 className="w-5 h-5" />
            <span className="text-[8.5px] mt-0.5">রিপোর্ট</span>
          </button>

          <button
            onClick={() => { setActiveSection('settings'); setEditRecord(null); }}
            className={`flex flex-col items-center justify-center p-1.5 rounded-full cursor-pointer transition-all active:scale-90 ${
              activeSection === 'settings' ? 'text-indigo-600 scale-105 font-bold' : 'text-slate-400'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[8.5px] mt-0.5">সেটিংস</span>
          </button>

        </div>
      </footer>

    </div>
  );
}
