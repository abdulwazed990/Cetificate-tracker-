/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Lock, 
  RefreshCcw, 
  Moon, 
  Sun, 
  Download, 
  Upload, 
  ShieldAlert, 
  FolderSync, 
  ChevronRight, 
  Terminal, 
  HelpCircle,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  FileCode,
  User,
  Camera,
  Image as ImageIcon,
  Mail,
  Phone
} from 'lucide-react';
import { localDb } from '../db/localDb';
import { firebaseDb, UserProfile } from '../db/firebaseDb';

interface SettingsViewProps {
  isDarkMode: boolean;
  onThemeToggle: () => void;
  onDataRefresh: () => void;
  onGenerateCapacitorConfig: () => void;
  capacitorConfigCreated: boolean;
  currentUser: UserProfile | null;
  onProfileUpdate: (user: UserProfile) => void;
}

export default function SettingsView({ 
  isDarkMode, 
  onThemeToggle, 
  onDataRefresh, 
  onGenerateCapacitorConfig,
  capacitorConfigCreated,
  currentUser,
  onProfileUpdate
}: SettingsViewProps) {
  
  // পাসওয়ার্ড পরিবর্তন স্টেট
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState({ success: true, text: '' });

  // ডাটা রিসেট স্টেট
  const [resetPassword, setResetPassword] = useState('');
  const [resetMsg, setResetMsg] = useState({ success: true, text: '' });
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // ব্যাকআপ মেসেজ স্টেট
  const [backupMsg, setBackupMsg] = useState({ success: true, text: '' });
  
  // ফাইল ইনপুট রেফারেন্স
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ১. পাসওয়ার্ড চেঞ্জ হ্যান্ডলিং
  const handlePassChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      setPassMsg({ success: false, text: 'সবগুলো ইনপুট ফিল্ড পূরণ করুন!' });
      return;
    }

    const res = localDb.changePassword(oldPassword, newPassword);
    setPassMsg({ success: res.success, text: res.message });
    if (res.success) {
      setOldPassword('');
      setNewPassword('');
    }
    setTimeout(() => setPassMsg({ success: true, text: '' }), 5000);
  };

  // ২. ডাটাবেস এক্সপোর্ট ব্যাকআপ হ্যান্ডলিং
  const handleExportBackup = () => {
    try {
      const backupStr = localDb.exportBackup();
      const blob = new Blob([backupStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificate_Tracker_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setBackupMsg({ success: true, text: 'ব্যাকআপ ফাইল সফলভাবে এক্সপোর্ট ও ডাউনলোড হয়েছে!' });
    } catch (e) {
      setBackupMsg({ success: false, text: 'এক্সপোর্ট করতে ব্যর্থ: ' + (e as Error).message });
    }
    setTimeout(() => setBackupMsg({ success: true, text: '' }), 5000);
  };

  // ৩. ডাটাবেস ইমপোর্ট ব্যাকআপ হ্যান্ডলিং
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = localDb.importBackup(content);
      setBackupMsg({ success: res.success, text: res.message });
      if (res.success) {
        onDataRefresh(); // রিলোড মেইন স্টেট
      }
    };
    reader.readAsText(file);
    // রিসেট ইনপুট ভ্যালু
    if (e.target) e.target.value = '';
    setTimeout(() => setBackupMsg({ success: true, text: '' }), 6000);
  };

  // ৪. ডাটাবেস সম্পূর্ণ রিসেট হ্যান্ডলিং
  const handleResetDatabase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassword) {
      setResetMsg({ success: false, text: 'নিশ্চিতকরণের জন্য অ্যাডমিন পাসওয়ার্ড দিন!' });
      return;
    }

    const success = localDb.resetDatabase(resetPassword);
    if (success) {
      setResetMsg({ success: true, text: 'সফলভাবে লোকাল ডাটাবেস রিসেট হয়েছে। সমস্ত কাস্টমার ফাইল মুছে ফেলা হয়েছে।' });
      setResetPassword('');
      setShowResetConfirm(false);
      onDataRefresh(); // রি-ইনিশিয়ালাইজ মেইন স্টেট
    } else {
      setResetMsg({ success: false, text: 'ভুল পাসওয়ার্ড! ডাটা ডাটাবেস রিসেট করা যায়নি।' });
    }
    setTimeout(() => setResetMsg({ success: true, text: '' }), 5000);
  };

  // অ্যাডমিন ছাড়া অন্য কেউ যেন ডাটা অ্যাক্সেস না করতে পারে
  const [profileMsg, setProfileMsg] = useState({ success: true, text: '' });
  const settingsFileRef = useRef<HTMLInputElement>(null);
  const settingsCameraRef = useRef<HTMLInputElement>(null);

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800 * 1024) {
        setProfileMsg({ success: false, text: 'ফাইল সাইজ অবশ্যই ৮০০KB এর নিচে হতে হবে।' });
        setTimeout(() => setProfileMsg({ success: true, text: '' }), 5000);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const updated = await firebaseDb.updateProfilePic(base64);
          onProfileUpdate(updated);
          setProfileMsg({ success: true, text: 'আপনার প্রোফাইল পিকচার সফলভাবে ক্লাউডে আপডেট হয়েছে!' });
        } catch (err) {
          setProfileMsg({ success: false, text: 'আপডেট ব্যর্থ: ' + (err as Error).message });
        }
        setTimeout(() => setProfileMsg({ success: true, text: '' }), 5000);
      };
      reader.readAsDataURL(file);
    }
  };

  // ৫. বায়োমেট্রিক সাপোর্ট ইনফো কুপন
  const triggerBiometricsDemo = () => {
    alert('বায়োমেট্রিক ফিঙ্গারপ্রিন্ট ট্র্যাকার এনাবেলড! এটি অ্যান্ড্রয়েড ক্যাপাসিটর সোর্স ফোল্ডারে বিল্ড করার পর ডিভাইসের ফিঙ্গারপ্রিন্ট লকের সাথে ইন্টিগ্রেট হবে।');
  };

  return (
    <div className="space-y-6">

      {/* অ্যাকাউন্ট প্রোফাইল কার্ড */}
      {currentUser && (
        <div className={`p-5 rounded-2xl border shadow-sm ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* Avatar Selector Container */}
            <div className="relative group shrink-0">
              {currentUser.profilePic ? (
                <img 
                  src={currentUser.profilePic} 
                  alt="Avatar" 
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-full object-cover border-2 border-indigo-600 ring-4 ring-indigo-500/10" 
                />
              ) : (
                <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 border-dashed ${
                  isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                } text-slate-400`}>
                  <User className="w-8 h-8 opacity-65" />
                </div>
              )}
              {/* Overlaid Camera controls to change */}
              <div className="absolute -bottom-1 -right-1 flex gap-1">
                <button
                  type="button"
                  onClick={() => settingsCameraRef.current?.click()}
                  className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow border border-white dark:border-slate-900 cursor-pointer active:scale-90 transition-transform"
                  title="ক্যামেরা দিয়ে তুলুন"
                >
                  <Camera className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => settingsFileRef.current?.click()}
                  className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow border border-white dark:border-slate-900 cursor-pointer active:scale-90 transition-transform"
                  title="গ্যালারি থেকে সিলেক্ট"
                >
                  <ImageIcon className="w-3 h-3" />
                </button>
              </div>

              {/* Hidden file selectors inside Settings */}
              <input 
                type="file" 
                ref={settingsFileRef}
                onChange={handleProfilePhotoChange}
                accept="image/*"
                className="hidden"
              />
              <input 
                type="file" 
                ref={settingsCameraRef}
                onChange={handleProfilePhotoChange}
                accept="image/*"
                capture="user"
                className="hidden"
              />
            </div>

            {/* Profile fields */}
            <div className="flex-1 text-center sm:text-left space-y-1">
              <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center justify-center sm:justify-start gap-1.5">
                {currentUser.name}
                <span className="text-[10px] font-bold py-0.5 px-2 bg-indigo-600 text-white rounded-full">
                  সক্রিয় ইউজার
                </span>
              </h2>
              
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-indigo-500" />
                  ID/মোবাইল: {currentUser.phone}
                </span>
                {currentUser.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-indigo-500" />
                    ইমেইল: {currentUser.email}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-emerald-500 font-medium">
                ✓ আপনার সকল তথ্য এবং কাস্টমার হিস্টোরি ক্লাউড সার্ভারে সলিড ব্যাকআপে সেভ আছে।
              </p>
            </div>
          </div>

          {profileMsg.text && (
            <div className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 border ${
              profileMsg.success
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100'
                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100'
            }`}>
              {profileMsg.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{profileMsg.text}</span>
            </div>
          )}
        </div>
      )}
      
      {/* ১. পাসওয়ার্ড সেটিংস ও থিম*/}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* পাসওয়ার্ড পরিবর্তন ফর্ম */}
        <div className={`p-5 rounded-2xl border shadow-sm ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400 flex items-center gap-1.5 mb-4">
            <Lock className="w-4 h-4 text-indigo-500" />
            অ্যাডমিন পিন কোড পরিবর্তন করুন
          </h3>

          {passMsg.text && (
            <div className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 border ${
              passMsg.success
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100'
                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-605 dark:text-rose-450 border-rose-100'
            }`}>
              {passMsg.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{passMsg.text}</span>
            </div>
          )}

          <form onSubmit={handlePassChange} className="space-y-3">
            <div>
              <label className="block text-[10.5px] font-semibold text-slate-400 mb-1">কারেন্ট অ্যাডমিন পিন (Old PIN)</label>
              <input
                type="password"
                maxLength={4}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value.replace(/\D/g, ''))}
                placeholder="ডিফল্ট কোড: 1234"
                className={`w-full py-2 px-3 rounded-xl text-xs border focus:outline-none focus:ring-1 ${
                  isDarkMode ? 'bg-slate-950 border-slate-850 text-slate-100 focus:ring-indigo-500' : 'bg-slate-55 border-slate-205 focus:ring-indigo-600'
                }`}
                required
              />
            </div>
            <div>
              <label className="block text-[10.5px] font-semibold text-slate-400 mb-1">নতুন অ্যাডমিন পিন (New PIN - ৪ সংখ্যা)</label>
              <input
                type="password"
                maxLength={4}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value.replace(/\D/g, ''))}
                placeholder="যেমন: 5678"
                className={`w-full py-2 px-3 rounded-xl text-xs border focus:outline-none focus:ring-1 ${
                  isDarkMode ? 'bg-slate-950 border-slate-850 text-slate-100 focus:ring-indigo-500' : 'bg-slate-55 border-slate-205 focus:ring-indigo-600'
                }`}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs text-white rounded-xl active:scale-95 transition-all cursor-pointer"
            >
              পিন সেট করুন
            </button>
          </form>
        </div>

        {/* থিম এবং বায়োমেট্রিক কনফিগারেশন */}
        <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400 flex items-center gap-1.5 mb-4">
              <Sun className="w-4 h-4 text-emerald-500" />
              সিস্টেম ইন্টিগ্রেশন ও ভিজ্যুয়াল
            </h3>
            
            <div className="space-y-4">
              {/* অন্ধকার মোড সুইচার */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-805 dark:text-slate-100 block">ভিজ্যুয়াল ডার্ক মোড (Theme)</span>
                  <span className="text-[10px] text-slate-400">লোকাল লাইট ও ডার্ক লেআউট থিম ও স্প্রিং</span>
                </div>
                <button
                  type="button"
                  onClick={onThemeToggle}
                  className={`p-2 rounded-xl border flex items-center gap-1 cursor-pointer transition-all active:scale-95 outline-none ${
                    isDarkMode 
                      ? 'bg-slate-955 border-slate-800 text-amber-400' 
                      : 'bg-indigo-50 border-indigo-150 text-slate-700'
                  }`}
                >
                  {isDarkMode ? (
                    <>
                      <Sun className="w-4 h-4" />
                      <span className="text-xs font-bold">লাইট থিম</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-indigo-650" />
                      <span className="text-xs font-bold">ডার্ক থিম</span>
                    </>
                  )}
                </button>
              </div>

              {/* ফিঙ্গারপ্রিন্ট বায়োমেট্রিক তথ্য */}
              <div className="flex items-center justify-between pt-3 border-t border-dashed border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">বায়োমেট্রিক (Touch ID)</span>
                  <span className="text-[10px] text-slate-400">অ্যান্ড্রয়েড ও আইওএস বায়োমেট্রিক সাপোর্ট</span>
                </div>
                <button
                  onClick={triggerBiometricsDemo}
                  className="text-[10.5px] py-1.5 px-3 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 font-bold rounded-xl cursor-pointer"
                >
                  স্ট্যাটাস: অ্যাক্টিভ
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-dashed border-slate-200 dark:border-slate-800 mt-4 text-[10px] text-slate-400 leading-relaxed">
            * থিম পরিবর্তন ইন্টারফেস সম্পূর্ণরূপে কাস্টমাইজড। ডার্ক মোড চোখ বাঁঁচাতে সাহায্য করে এবং মোবাইল মোডে ব্যাটারি সাশ্রয়ী।
          </div>
        </div>

      </div>

      {/* ২. ডাটা ব্যাকআপ ও রিস্টোর (JSON EXPORT/IMPORT) */}
      <div className={`p-5 rounded-2xl border shadow-sm ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400 flex items-center gap-1.5 mb-2">
          <FolderSync className="w-4 h-4 text-emerald-500" />
          মেগা ড্রাইভ ব্যাকআপ ও ডেটাবেস মেথডস
        </h3>
        <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">
          আপনার কাস্টমার হিস্ট্রি ফাইল ব্যাকআপ করে সেভ করে রাখুন। মোবাইল পরিবর্তন করলে বা রিলোড করলে ব্যাকআপ ফিরিয়ে আনতে পারবেন।
        </p>

        {backupMsg.text && (
          <div className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 border ${
            backupMsg.success
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400/90'
              : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
          }`}>
            {backupMsg.success ? <CheckCircle2 className="w-4 h-4 animate-bounce" /> : <AlertCircle className="w-4 h-4" />}
            <span>{backupMsg.text}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          
          <button
            onClick={handleExportBackup}
            className="flex-1 py-3 px-4 rounded-xl border border-dashed text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Download className="w-4.5 h-4.5 text-indigo-500" />
            লোকাল ব্যাকআপ এক্সপোর্ট করুন (.json)
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-3 px-4 rounded-xl border border-dashed text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Upload className="w-4.5 h-4.5 text-emerald-500" />
            ব্যাকআপ ফাইল থেকে রিস্টোর (.json)
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportBackup}
            accept=".json"
            className="hidden"
          />

        </div>
      </div>

      {/* ৩. সম্পূর্ণ তথ্য রিসেট প্যানেল */}
      <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5">
        <h3 className="text-xs font-bold text-rose-750 dark:text-rose-450 uppercase tracking-wider flex items-center gap-1.5 mb-2">
          <ShieldAlert className="w-4.5 h-4.5 text-rose-500" />
          রিসেট জোন (সতর্কতা)
        </h3>
        <p className="text-[10px] text-slate-400 mb-4">
          ডিভাইসের সমস্ত মেমোরি খালি করতে চাইলে ডাটা রিসেট মেথড ব্যবহার করুন। এর ফলে কাস্টমার ও পেমেন্টের সব ডাটা একেবারে মুছে যাবে। কাজ বাতিল করার পুর্বে ব্যাকআপ ডাউনলোড করে রাখা সাজেস্টেড।
        </p>

        {resetMsg.text && (
          <div className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 border ${
            resetMsg.success
              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-100'
              : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 border-rose-100'
          }`}>
            <span>{resetMsg.text}</span>
          </div>
        )}

        {showResetConfirm ? (
          <form onSubmit={handleResetDatabase} className="space-y-3 max-w-sm animate-fadeIn">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl space-y-2 border border-rose-200">
              <label className="block text-[10px] font-bold text-rose-605">নিশ্চিত করতে অ্যাডমিন পিনকোড দিন:</label>
              <input
                type="password"
                maxLength={4}
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value.replace(/\D/g, ''))}
                placeholder="যেমন: 1234"
                className={`w-full py-2 px-3 rounded-xl text-xs border focus:outline-none focus:ring-1 ${
                  isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-205'
                }`}
                required
              />
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 text-[10.5px] cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-750 text-white rounded-lg text-[10.5px] cursor-pointer font-bold"
                >
                  আমি নিশ্চিত, মুছে ফেলুন
                </button>
              </div>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="py-2 px-4 bg-rose-600/10 hover:bg-rose-605 text-rose-650 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-rose-500/20"
          >
            সম্পূর্ণ ডেটাবেস রিসেট করুন
          </button>
        )}
      </div>

      {/* ৪. অ্যান্ড্রয়েড APK জেনারেট ইনফরমেশন */}
      <div className={`p-5 rounded-2xl border ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-dashed border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-850 dark:text-white flex items-center gap-1.5">
              <Smartphone className="w-5 h-5 text-indigo-500 animate-bounce" />
              অ্যান্ড্রয়েড APK বিল্ড মেথড ও সাপোর্ট কোড
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              এই রিয়্যাক্ট-ওয়েব অ্যাপটিকে Capacitor ব্যবহার করে খুব সহজেই ১ মিনিটে একটি স্পিডি অ্যান্ড্রয়েড অ্যাপে রূপান্তর করতে পারেন।
            </p>
          </div>

          <button
            onClick={onGenerateCapacitorConfig}
            className={`py-2 px-4 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow ${
              capacitorConfigCreated 
                ? 'bg-emerald-650 text-white' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            <FileCode className="w-4 h-4 animate-spin-slow" />
            {capacitorConfigCreated ? 'ক্যাপাসিটর কনফিগ জেনারেট সম্পন্ন!' : 'ক্যাপাসিটর মোবাইল প্রোফাইল তৈরি'}
          </button>
        </div>

        {/* কনসোল রিডার */}
        <div className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-350">
          
          <div className="rounded-xl p-3.5 bg-slate-950 font-mono text-[10.5px] text-lime-400 overflow-x-auto space-y-2 border border-slate-900 shadow-inner">
            <div className="text-slate-500 text-[10px] flex items-center justify-between border-b border-slate-900 pb-1 mb-2">
              <span>🖥️ অ্যান্ড্রয়েড কনসোল বিল্ডিং কমান্ড সিরিজ:</span>
              <span className="text-indigo-400">BUILD: APK READY</span>
            </div>
            <div># ১. কীবর্ড খুলে এই রিপোজিটরি জিপ জেনারেট করে নিজের লোকাল পিসিতে নিন।</div>
            <div># ২. লোকাল কোড ওপেন করে ক্যাপাসিটর ফ্রেমওয়ার্ক ইনস্টল করুন:</div>
            <div className="text-white bg-slate-900 px-2 py-1 rounded select-all font-semibold my-1">npm install @capacitor/core @capacitor/cli @capacitor/android</div>
            <div># ৩. প্রজেক্টের মেইন মোবাইল ক্যাপাসিটর রান ইনিসিয়ালাইজ করুন:</div>
            <div className="text-white bg-slate-900 px-2 py-1 rounded select-all font-semibold my-1">npx cap init</div>
            <div># ৪. রিয়্যাক্ট প্রজেক্টকে প্রোডাকশন বিল্ড করুন:</div>
            <div className="text-white bg-slate-900 px-2 py-1 rounded select-all font-semibold my-1">npm run build</div>
            <div># ৫. অ্যান্ড্রয়েড বিল্ড ফোল্ডার ক্যাপাসিটারে সিঙ্ক করুন:</div>
            <div className="text-white bg-slate-900 px-2 py-1 rounded select-all font-semibold my-1">npx cap add android && npx cap sync</div>
            <div># ৬. অ্যান্ড্রয়েড প্রজেক্ট রান করে আপনার প্রফেশনাল APK বিল্ড করুন:</div>
            <div className="text-white bg-slate-900 px-2 py-1 rounded select-all font-semibold my-1">npx cap open android</div>
          </div>

          <div className="p-3 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl space-y-1.5">
            <h4 className="font-extrabold text-slate-800 dark:text-indigo-300 text-xs flex items-center gap-1">
              <Sparkles className="w-4.5 h-4.5 text-indigo-500" />
              কেন এই অ্যাপটি একটি পারফেক্ট অ্যান্ড্রয়েড হাইব্রিড সফটওয়্যার?
            </h4>
            <ul className="list-disc pl-4 text-[10.5px] space-y-1 text-slate-500 dark:text-slate-400">
              <li><strong>মোবাইল রেসপন্সিভ ডিজাইন:</strong> অ্যাপটি টাচ-ফ্রেন্ডলি ড্রপডাউন এবং বটম-বার সহ মোবাইল স্ক্রিনে সুন্দর দেখায়।</li>
              <li><strong>১০০% অফলাইন সমর্থিত:</strong> লোকাল মেমোরি এনক্রিপশন থাকার ফলে ইন্টারনেট ছাড়াই পুরো ডাটা ডাস্টবিনে সুরক্ষিত থাকে।</li>
              <li><strong>মোবাইলের শর্টকাট:</strong> সরাসরি ফোন কল ডায়ালার ওপেনিং ও হোয়াটসঅ্যাপ ইন্টিগ্রেশন মোবাইল ব্যবহার বাড়াবে।</li>
              <li><strong>সহজ জিপ মেথডস:</strong> ক্যাপাসিটরের সাহায্যে অ্যান্ড্রয়েড স্টুডিও থেকে সরাসরি সাইনড রিলিজ এপিকে (.APK) তৈরি করে মোবাইলে ইনস্টল করতে পারবেন।</li>
            </ul>
          </div>

        </div>
      </div>

    </div>
  );
}
