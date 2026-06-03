/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Lock, 
  Unlock, 
  UserPlus, 
  UserCheck, 
  Phone, 
  Mail, 
  KeyRound, 
  User, 
  Camera, 
  Image as ImageIcon, 
  AlertCircle, 
  CheckCircle2, 
  Smartphone,
  Eye,
  EyeOff
} from 'lucide-react';
import { firebaseDb, UserProfile } from '../db/firebaseDb';

interface LockScreenProps {
  onSuccess: (user: UserProfile) => void;
  isDarkMode: boolean;
}

export default function LockScreen({ onSuccess, isDarkMode }: LockScreenProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  // Custom Account Signup fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [profilePic, setProfilePic] = useState<string>(''); // Base64 representation

  // Login fields
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Status variables
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // File Upload Reference for Gallery & Camera
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Convert File to Base64 String
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800 * 1024) { // Compress/Reject if extremely large (to stay safe in Firestore document 1MB limits)
        setErrorMsg('ফাইল সাইজ বেশি বড় (৮০০KB এর নিচে হতে হবে)।');
        setTimeout(() => setErrorMsg(''), 3000);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger file managers
  const triggerGallery = () => {
    fileInputRef.current?.click();
  };

  const triggerCamera = () => {
    cameraInputRef.current?.click();
  };

  // Handlers
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName.trim()) {
      setErrorMsg('অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন');
      return;
    }
    if (phone.trim().length !== 11) {
      setErrorMsg('মোবাইল নাম্বারটি অবশ্যই ১১ ডিজিটের হতে হবে');
      return;
    }
    if (password.length < 4) {
      setErrorMsg('পাসওয়ার্ড/পিন কমপক্ষে ৪ ডিজিটের হতে হবে');
      return;
    }

    setIsLoading(true);
    try {
      const profile = await firebaseDb.registerUser({
        name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        profilePic: profilePic || undefined,
        passwordHash: '' // Calculated strictly in registerUser
      }, password);

      setSuccessMsg('অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! ড্যাশবোর্ডে প্রবেশ হচ্ছে...');
      setTimeout(() => {
        onSuccess(profile);
      }, 1200);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'অ্যাকাউন্ট তৈরি করতে ব্যর্থ হয়েছে।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (loginPhone.trim().length !== 11) {
      setErrorMsg('১১ ডিজিটের মোবাইল নাম্বার প্রদান করুন');
      return;
    }
    if (loginPassword.length < 4) {
      setErrorMsg('সঠিক পিন/পাসওয়ার্ড লিখুন');
      return;
    }

    setIsLoading(true);
    try {
      const profile = await firebaseDb.loginUser(loginPhone.trim(), loginPassword);
      setSuccessMsg('সফল লগইন! আপনার তথ্য লোড হচ্ছে...');
      
      // Let's process any offline synced mutations once logged in
      firebaseDb.processOfflineMutations();

      setTimeout(() => {
        onSuccess(profile);
      }, 1000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'লগইন করতে ব্যর্থ হয়েছে। অনুগ্রহ করে ইন্টারনেট বা পিন চেক করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100' 
        : 'bg-gradient-to-br from-indigo-50/50 via-slate-50 to-slate-100 text-slate-800'
    }`}>
      
      {/* Top Banner & Header */}
      <div className="flex flex-col items-center text-center mb-6 max-w-sm">
        <div className="relative mb-4 flex items-center justify-center">
          <div className="absolute inset-0 bg-indigo-500/25 rounded-full blur-xl animate-pulse" />
          
          <div className="relative p-2.5 bg-gradient-to-tr from-indigo-700 via-indigo-600 to-indigo-900 rounded-2xl text-white shadow-xl border border-white/10 hover:scale-105 transition-transform duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-10 h-10 text-white" fill="none">
              <rect x="8" y="4" width="32" height="40" rx="4" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <rect x="11" y="7" width="26" height="34" rx="2" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" />
              <line x1="15" y1="13" x2="33" y2="13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="15" y1="20" x2="29" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.8" />
              <line x1="15" y1="27" x2="23" y2="27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.8" />
              <path d="M28 35l-2.5 5 3.5-1.5 3.5 1.5-2.5-5" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
              <circle cx="30" cy="31" r="5.5" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
              <circle cx="30" cy="31" r="2.5" fill="none" stroke="#d97706" strokeWidth="1" strokeDasharray="2,1" />
            </svg>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-sm animate-pulse" />
          </div>
        </div>
        
        <h1 className="text-xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-1.5 justify-center">
          সার্টিফিকেট ট্র্যাকার
          <span className="text-[9.5px] font-extrabold py-0.5 px-2 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/15">
            PRO
          </span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          মাল্টি-ইউজার ক্লাউড অ্যাকাউন্ট ও লাইফ-টাইম ডেটা সিকিউরিটি সিস্টেম
        </p>
      </div>

      {/* Main Glassmorphism Form Card */}
      <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl transition-all duration-300 border ${
        isDarkMode 
          ? 'bg-slate-900/80 border-slate-800 backdrop-blur-md shadow-indigo-950/20' 
          : 'bg-white border-slate-200/80 shadow-slate-350/20'
      }`}>

        {/* Toggle Mode Selectors */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl mb-6 border border-slate-200 dark:border-slate-900">
          <button
            onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 text-xs font-black rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'login'
                ? (isDarkMode ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-900 shadow')
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            লগইন করুন
          </button>
          <button
            onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 text-xs font-black rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'signup'
                ? (isDarkMode ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-900 shadow')
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            অ্যাকাউন্ট তৈরি
          </button>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2 animate-bounce">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-bold">{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {/* Mode Forms */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                ১১ ডিজিট মোবাইল নাম্বার
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  maxLength={11}
                  placeholder="যেমন: ০১XXXXXXXXX"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  className={`w-full py-2.5 pl-10 pr-4 text-xs font-bold rounded-xl border outline-none transition-all ${
                    isDarkMode 
                      ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-905 focus:border-indigo-500'
                  }`}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                পাসওয়ার্ড বা পিন কোড
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="আপনার গোপন পাসওয়ার্ড পিন"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className={`w-full py-2.5 pl-10 pr-10 text-xs font-bold rounded-xl border outline-none transition-all ${
                    isDarkMode 
                      ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-905 focus:border-indigo-500'
                  }`}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2.5 text-xs font-black text-center text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ভেরিফাই করা হচ্ছে...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  নিরাপদ লগইন করুন →
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUpSubmit} className="space-y-4">
            {/* Custom Picture Holder */}
            <div className="flex flex-col items-center mb-1">
              <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 text-center text-xs">
                প্রোফাইল পিকচার যুক্ত করুন (স্থায়ী ও নিরাপদ)
              </span>
              
              <div className="relative group">
                {profilePic ? (
                  <img 
                    src={profilePic} 
                    alt="Uploaded avatar" 
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500 shadow-md ring-4 ring-indigo-500/10" 
                  />
                ) : (
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 border-dashed ${
                    isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  } text-slate-400`}>
                    <User className="w-8 h-8 opacity-60" />
                  </div>
                )}
                
                {/* Glowing indicators */}
                <div className="absolute -bottom-1 -right-1 flex gap-1">
                  <button
                    type="button"
                    onClick={triggerCamera}
                    className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow border border-white dark:border-slate-900 cursor-pointer transition-all active:scale-90"
                    title="ক্যামেরা দিয়ে তুলুন"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={triggerGallery}
                    className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow border border-white dark:border-slate-900 cursor-pointer transition-all active:scale-90"
                    title="গ্যালারি থেকে সিলেক্ট"
                  >
                    <ImageIcon className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Hidden file inputs */}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <input 
                type="file" 
                ref={cameraInputRef}
                onChange={handleFileChange}
                accept="image/*"
                capture="user"
                className="hidden"
              />
              {profilePic && (
                <button
                  type="button"
                  onClick={() => setProfilePic('')}
                  className="text-[10px] text-rose-500 font-extrabold mt-1.5 hover:underline cursor-pointer"
                >
                  ছবি রিমুভ করুন
                </button>
              )}
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                আপনার পূর্ণ নাম <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="আপনার সুন্দর নাম লিখুন"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full py-2.5 pl-10 pr-4 text-xs font-bold rounded-xl border outline-none transition-all ${
                    isDarkMode 
                      ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-905 focus:border-indigo-500'
                  }`}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                ১১ ডিজিট মোবাইল নাম্বার (অ্যাকাউন্ট ভেরিফিকেশন আইডি) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  maxLength={11}
                  placeholder="যেমন: ০১XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  className={`w-full py-2.5 pl-10 pr-4 text-xs font-bold rounded-xl border outline-none transition-all ${
                    isDarkMode 
                      ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-905 focus:border-indigo-500'
                  }`}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                ইমেইল এড্রেস (ঐচ্ছিক)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  placeholder="যেমন: address@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full py-2.5 pl-10 pr-4 text-xs font-bold rounded-xl border outline-none transition-all ${
                    isDarkMode 
                      ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-905 focus:border-indigo-500'
                  }`}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                সিকিউরিটি পিন বা পাসওয়ার্ড <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="পিনকোড বা পাসওয়ার্ড দিন"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full py-2.5 pl-10 pr-10 text-xs font-bold rounded-xl border outline-none transition-all ${
                    isDarkMode 
                      ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-905 focus:border-indigo-500'
                  }`}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                পিনকোডটি নিরাপদে মনে রাখুন। ভবিষ্যতে অন্য কোনো মোবাইলে লগইন করতে এটি প্রয়োজন হবে।
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2.5 text-xs font-black text-center text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  অ্যাকাউন্ট প্রস্তুত হচ্ছে...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  নতুন অ্যাকাউন্ট তৈরি করুন →
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
