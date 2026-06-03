/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, Phone, History, Calendar, Clock, AlertCircle, FileText, ArrowRight, User, Wallet, CheckCircle2 } from 'lucide-react';
import { CustomerRecord } from '../types';

interface QuickSearchViewProps {
  records: CustomerRecord[];
  isDarkMode: boolean;
}

export default function QuickSearchView({ records, isDarkMode }: QuickSearchViewProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [foundRecords, setFoundRecords] = useState<CustomerRecord[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // অটোমাটিক মোবাইল নাম্বারে রিয়েল টাইম এগ্রিগেশন ফিল্টারিং
  useEffect(() => {
    if (phoneNumber.trim().length >= 4) {
      const matched = records.filter(rec => rec.phone.includes(phoneNumber.trim()));
      setFoundRecords(matched);
      setHasSearched(true);
    } else {
      setFoundRecords([]);
      setHasSearched(false);
    }
  }, [phoneNumber, records]);

  // সমষ্টি হিসাব
  const totalAmount = foundRecords.reduce((acc, rec) => acc + rec.totalPrice, 0);
  const totalDue = foundRecords.reduce((acc, rec) => acc + rec.due, 0);
  const totalPaid = totalAmount - totalDue;

  // বাংলা সংখ্যায় পরিবর্তনের হেল্পার
  const toBengaliNumber = (num: number): string => {
    const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const bengaliNumbers = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    
    const formatted = num.toLocaleString('en-IN'); 
    return formatted.split('').map((char) => {
      const idx = englishNumbers.indexOf(char);
      return idx !== -1 ? bengaliNumbers[idx] : char;
    }).join('');
  };

  const toBengaliDateStr = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return isoString;
    }
  };

  const toBengaliTimeStr = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return '';
    }
  };

  const injectQuickPhone = (demoPhone: string) => {
    setPhoneNumber(demoPhone);
  };

  // ডেমো নাম্বারগুলোর কুইক সাজেশনস (সুবিধা বাড়াতে)
  const uniquePhonesObj = new Map<string, string>();
  records.slice(0, 5).forEach(r => uniquePhonesObj.set(r.phone, r.name));
  const suggestionPhones = Array.from(uniquePhonesObj.entries());

  return (
    <div className={`rounded-3xl p-5 border shadow-xl transition-all duration-300 ${
      isDarkMode 
        ? 'bg-slate-900 border-slate-800' 
        : 'bg-white border-slate-200'
    }`}>
      
      {/* হেডার */}
      <div className="text-center mb-5 max-w-sm mx-auto">
        <h2 className="text-sm md:text-base font-extrabold text-slate-800 dark:text-white flex items-center justify-center gap-1.5">
          <History className="w-5 h-5 text-indigo-500 shrink-0" />
          নাম্বার ভিত্তিক কুইক ট্র্যাকার ও হিস্টোরি
        </h2>
        <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-1">
          কাস্টমারের ফোন নাম্বার টাইপ করা শুরু করলেই সমস্ত কনভারসেশন বা কাজের লগ টাইমলাইন আকারে বের হয়ে যাবে।
        </p>
      </div>

      {/* সার্চের মেইন ইনপুট */}
      <div className="max-w-md mx-auto mb-6">
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Phone className="w-4.5 h-4.5 animate-pulse text-indigo-505" />
          </div>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
            placeholder="কাস্টমারের ফোন নাম্বার লিখুন..."
            className={`w-full py-3 pl-11 pr-14 rounded-2xl text-center font-semibold text-sm border focus:outline-none focus:ring-1 transition-all ${
              isDarkMode 
                ? 'bg-slate-950 border-slate-800 text-slate-100 focus:ring-indigo-500' 
                : 'bg-slate-50 border-slate-205 text-slate-800 focus:ring-indigo-600 focus:border-indigo-650'
            }`}
          />
          {phoneNumber && (
            <button
              onClick={() => setPhoneNumber('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-rose-500 font-bold hover:underline cursor-pointer"
            >
              মুছুন
            </button>
          )}
        </div>

        {/* সাজেশন সুচি */}
        {suggestionPhones.length > 0 && phoneNumber.length === 0 && (
          <div className="mt-3 text-center">
            <span className="text-[10px] text-slate-400 block mb-1.5">দ্রুত খোঁজার জন্য কাস্টমার লিস্ট থেকে সিলেক্ট করুন:</span>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {suggestionPhones.map(([num, bName]) => (
                <button
                  key={num}
                  onClick={() => injectQuickPhone(num)}
                  className={`text-[9px] py-1 px-2 cursor-pointer rounded-lg border font-medium hover:text-indigo-500 active:scale-95 transition-all ${
                    isDarkMode 
                      ? 'bg-slate-950 border-slate-850 text-slate-350 hover:bg-slate-800' 
                      : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'
                  }`}
                >
                  {bName} ({num})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* সার্চের উত্তর */}
      <div className="space-y-4">
        {hasSearched ? (
          foundRecords.length === 0 ? (
            <div className="text-center py-8 rounded-2xl border border-dashed border-rose-100 dark:border-rose-900/20">
              <AlertCircle className="w-8 h-8 text-rose-450 mx-auto mb-2" />
              <h3 className="text-xs font-bold text-rose-500">কোনো হিস্টোরি ফাইল পাওয়া যায়নি!</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                ফোন নাম্বার "{phoneNumber}" সম্বলিত কোনো ফাইল লোকাল ডেটাবেজে সংরক্ষিত নেই।
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* সংক্ষেপী হিসাব কার্ড */}
              <div className="grid grid-cols-3 gap-2 p-3.5 rounded-2xl border bg-indigo-500/5 border-indigo-500/10">
                <div className="text-center">
                  <span className="text-[9.5px] text-slate-400 dark:text-slate-450 block">সর্বমোট রেকর্ড</span>
                  <span className="text-xs font-black text-slate-800 dark:text-white">{toBengaliNumber(foundRecords.length)} টি</span>
                </div>
                <div className="text-center border-x border-dashed border-slate-200 dark:border-slate-800">
                  <span className="text-[9.5px] text-slate-400 dark:text-slate-450 block">মোট পরিশোধ</span>
                  <span className="text-xs font-black text-emerald-500">৳{toBengaliNumber(totalPaid)}</span>
                </div>
                <div className="text-center">
                  <span className="text-[9.5px] text-slate-400 dark:text-slate-450 block">মোট বকেয়া</span>
                  <span className="text-xs font-black text-rose-500">৳{toBengaliNumber(totalDue)}</span>
                </div>
              </div>

              {/* টাইমলাইন ম্যাপ */}
              <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-100 before:dark:bg-indigo-950/40">
                
                {foundRecords.map((rec, index) => (
                  <div key={rec.id} className="relative pl-7 transition-all">
                    
                    {/* টাইমলাইন বুদ বুদ */}
                    <div className="absolute left-1.5 top-2.5 w-3.5 h-3.5 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-905" />

                    {/* কাজের বিবরণ কার্ড */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                      isDarkMode 
                        ? 'bg-slate-950/50 border-slate-800' 
                        : 'bg-slate-50/60 border-slate-200'
                    }`}>
                      
                      {/* প্রথম লাইন: নাম ও তারিখ */}
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 mb-2">
                        <div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block">কাস্টমার রেকর্ড #{toBengaliNumber(foundRecords.length - index)}</span>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-405" />
                            {rec.name}
                          </h4>
                        </div>
                        
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                          <span className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            <Calendar className="w-3 h-3" />
                            {toBengaliDateStr(rec.createdAt)}
                          </span>
                          <span className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            <Clock className="w-3 h-3" />
                            {toBengaliTimeStr(rec.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* দ্বিতীয় লাইন: বোর্ড, সাল ও গ্রুপ */}
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        <span className="text-[9.5px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-805 dark:bg-indigo-950/40 dark:text-indigo-400 font-bold">
                          {rec.board} ({rec.examType} - {rec.year})
                        </span>
                        <span className="text-[9.5px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-650 dark:text-slate-350 font-semibold">
                          কাজ: {rec.workType}
                        </span>
                        
                        {/* পেমেন্ট অবস্থা */}
                        {rec.paymentStatus === 'Paid' ? (
                          <span className="text-[9.5px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-900/20">
                            পরিশোধিত (Paid)
                          </span>
                        ) : rec.paymentStatus === 'Partial' ? (
                          <span className="text-[9.5px] px-2 py-0.5 rounded bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400 font-bold border border-orange-200 dark:border-orange-800/20">
                            আংশিকবাকি ৳{toBengaliNumber(rec.due)}
                          </span>
                        ) : (
                          <span className="text-[9.5px] px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-450 font-bold border border-rose-200 dark:border-rose-900/25">
                            বকেয়া ৳{toBengaliNumber(rec.totalPrice)}
                          </span>
                        )}
                      </div>

                      {/* লাস্ট কনভারসেশন */}
                      <div className={`p-2.5 rounded-xl border text-xs relative ${
                        isDarkMode ? 'bg-slate-900 border-slate-850 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                      }`}>
                        <div className="absolute top-1.5 right-2 text-[8px] text-slate-400 tracking-wider">লাস্ট কনভারসেশন নোট</div>
                        <span className="block font-medium italic mt-1 leading-relaxed">
                          "{rec.notes || 'কোনো কথপোকথন বা নোট যুক্ত নেই।'}"
                        </span>
                      </div>

                      {/* মেটাডিটা আপডেট সময় */}
                      <div className="text-[9.5px] text-slate-400 dark:text-slate-500 mt-2 text-right">
                        রেকর্ড সর্বশেষ আপডেট: {toBengaliDateStr(rec.lastUpdated)} ({toBengaliTimeStr(rec.lastUpdated)})
                      </div>

                    </div>
                  </div>
                ))}

              </div>
            </div>
          )
        ) : (
          <div className="text-center py-6 text-slate-400 text-xs">
            সার্চ করার জন্য উপরে কাস্টমারের ফোন নাম্বার টাইপ করুন।
          </div>
        )}
      </div>

    </div>
  );
}
