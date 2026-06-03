/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BarChart, 
  TrendingUp, 
  UserSquare, 
  School, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  MessageSquare, 
  Copy, 
  ChevronRight,
  TrendingDown,
  Percent,
  Calculator,
  Download,
  Check
} from 'lucide-react';
import { CustomerRecord, BOARDS_A, BOARDS_B } from '../types';

interface ReportDashboardProps {
  records: CustomerRecord[];
  isDarkMode: boolean;
  onSelectBoard: (board: string) => void;
  onNavigateToHistory: () => void;
}

export default function ReportDashboard({ records, isDarkMode, onSelectBoard, onNavigateToHistory }: ReportDashboardProps) {
  
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ১. আর্থিক এগ্রিগেশন হিসাব
  const totalPricing = records.reduce((acc, r) => acc + r.totalPrice, 0);
  const totalAdvances = records.reduce((acc, r) => acc + r.advance, 0);
  const totalDues = records.reduce((acc, r) => acc + r.due, 0);
  const totalCollected = totalPricing - totalDues; // মোট সংগৃহীত টাকা = অ্যাডভান্স + পেইড

  // শতাংশ হিসাবসমূহ
  const collectedPercentage = totalPricing > 0 ? Math.round((totalCollected / totalPricing) * 100) : 0;
  const duePercentage = totalPricing > 0 ? Math.round((totalDues / totalPricing) * 100) : 0;

  // ২. কাজ সমাপ্তির অবস্থা
  const totalJobs = records.length;
  const completedJobs = records.filter(r => r.workStatus === 'Complete').length;
  const pendingJobs = records.filter(r => r.workStatus === 'Pending').length;
  const completionRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;

  // ৩. বোর্ড অনুসারে কাস্টমার বন্টন হিসাব
  const getBoardDistribution = () => {
    const counts: { [key: string]: number } = {};
    records.forEach((r) => {
      counts[r.board] = (counts[r.board] || 0) + 1;
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percentage: totalJobs > 0 ? Math.round((count / totalJobs) * 100) : 0
    })).sort((a, b) => b.count - a.count);
  };

  const boardDistribution = getBoardDistribution();

  // ৪. কাজের ধরনের ডিস্ট্রিবিউশন
  const getWorkTypeStats = () => {
    const counts: { [key: string]: number } = {};
    records.forEach((r) => {
      counts[r.workType] = (counts[r.workType] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({
      type,
      count
    })).sort((a, b) => b.count - a.count);
  };

  const workTypeStats = getWorkTypeStats();

  // ৫. বকেয়া পেমেন্ট নোটিশ মেসেজ কপি জেনারেটর (ম্যানেজমেন্ট সুবিধা)
  const generateUnpaidBillingSMS = (rec: CustomerRecord) => {
    return `প্রিয় ${rec.name || 'গ্রাহক'}, আপনার ${rec.examType || ''} (${rec.board}) সার্টিফিকেট কাজের মোট বকেয়া ৳${rec.due.toLocaleString('bn-BD')} বকেয়া আছে। অনুগ্রহ করে দ্রুত পরিশোধ করুন। ধন্যবাদ।`;
  };

  const coptToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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

  return (
    <div className="space-y-6">
      
      {/* ১. আর্থিক সারসংক্ষেপ গ্রিড */}
      <div className={`rounded-2xl p-5 border shadow-md transition-all ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <h3 className="text-sm font-extrabold text-slate-850 dark:text-white flex items-center gap-1.5 mb-4 border-b border-dashed border-slate-200 dark:border-slate-800 pb-2">
          <Calculator className="w-4.5 h-4.5 text-indigo-500" />
          অর্থনৈতিক হিসাব-নিকাশ
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* প্রগতিবার ১ - আদায়কৃত অর্থ */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">আদায়কৃত পেমেন্ট (Collected)</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">৳{toBengaliNumber(totalCollected)} ({toBengaliNumber(collectedPercentage)}%)</span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000"
                style={{ width: `${collectedPercentage}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 block">মোট মূল্য ৳{toBengaliNumber(totalPricing)} এর মধ্যে ক্যাশ বুক জমা</span>
          </div>

          {/* প্রগতিবার ২ - বাকি বকেয়া */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">বকেয়া পরিমাণ (Outstanding Due)</span>
              <span className="font-extrabold text-rose-500">৳{toBengaliNumber(totalDues)} ({toBengaliNumber(duePercentage)}%)</span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
              <div 
                className="h-full bg-gradient-to-r from-rose-500 to-red-500 rounded-full transition-all duration-1000"
                style={{ width: `${duePercentage}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 block">বাজার থেকে অবশিষ্টাংশ কালেকশন বাকি</span>
          </div>

          {/* প্রগতিবার ৩ - কাজ সম্পন্নতা হার */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">ডেলিভারি সম্পন্নতার হার</span>
              <span className="font-extrabold text-indigo-500">৳{toBengaliNumber(completedJobs)}/৳{toBengaliNumber(totalJobs)} ({toBengaliNumber(completionRate)}%)</span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-1000"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 block">মোট {toBengaliNumber(totalJobs)} ফাইলের অগ্রগতির হার</span>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* ২. বোর্ড বন্টন রিপোর্ট */}
        <div className={`rounded-2xl p-5 border shadow-md transition-all ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mb-4">
            <School className="w-4 h-4 text-emerald-500" />
            বোর্ড অনুযায়ী বন্টন ও কুইক ফিল্টার
          </h3>

          <div className="space-y-3">
            {boardDistribution.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">কোনো ফাইল যুক্ত নেই।</p>
            ) : (
              boardDistribution.map((bd) => (
                <button
                  key={bd.name}
                  onClick={() => onSelectBoard(bd.name)}
                  className={`w-full p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all active:scale-98 ${
                    isDarkMode 
                      ? 'bg-slate-950/60 border-slate-850 hover:bg-slate-850' 
                      : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                  }`}
                  title={`${bd.name} ফিল্টার করুন`}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                      {toBengaliNumber(bd.count)}
                    </span>
                    <span className="font-semibold text-slate-850 dark:text-slate-200">{bd.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-405">{toBengaliNumber(bd.percentage)}%</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </button>
              ))
            )}
          </div>
          <p className="text-[9px] text-slate-400 dark:text-slate-500 text-center mt-3">
            * উপরে নির্দিষ্ট বোর্ডের নামের উপরে ক্লিক করলে তাৎক্ষণিক কাস্টমার হিস্ট্রি ফিল্টার হয়ে যাবে।
          </p>
        </div>

        {/* ৩. কাজের শ্রেণীবিভাগ এনালিটিক্স */}
        <div className={`rounded-2xl p-5 border shadow-md transition-all ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mb-4">
            <BarChart className="w-4 h-4 text-indigo-500" />
            সার্টিফিকেট কাজের শ্রেণীবিভাগ
          </h3>

          <div className="space-y-4">
            {workTypeStats.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">কোনো কাজের ডাটা নেই।</p>
            ) : (
              workTypeStats.map((wt) => {
                const maxCount = Math.max(...workTypeStats.map(w => w.count)) || 1;
                const barWidth = (wt.count / maxCount) * 100;

                return (
                  <div key={wt.type} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-800 dark:text-slate-350">{wt.type}</span>
                      <span className="font-extrabold text-indigo-500">{toBengaliNumber(wt.count)} টি ফাইল</span>
                    </div>
                    
                    {/* অনুভূমিক বার চার্ট সিমুলেটর */}
                    <div className={`w-full h-1.5 rounded-full ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-650 rounded-full transition-all duration-700"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* ৪. বকেয়া পেমেন্ট ও এসএমএস নোটিশ প্যানেল */}
      <div className={`rounded-2xl p-5 border shadow-md transition-all ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mb-4">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          বকেয়া তাগাদা তালিকা ও কুইক SMS নোটিশ ৩য় কিস্তি
        </h3>

        {records.filter(r => r.due > 0).length === 0 ? (
          <p className="text-xs text-emerald-500 font-semibold text-center py-6">
            দারুণ! বাজারে কোনো কাস্টমারের বকেয়া বা ডিউ পেমেন্ট পেন্ডিং নেই।
          </p>
        ) : (
          <div className="space-y-3 overflow-y-auto max-h-72 pr-1">
            {records.filter(r => r.due > 0).map((unpaid) => {
              const smsText = generateUnpaidBillingSMS(unpaid);
              return (
                <div 
                  key={unpaid.id}
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs ${
                    isDarkMode ? 'bg-slate-950/40 border-slate-850' : 'bg-rose-50/10 border-rose-100/50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-800 dark:text-slate-100">{unpaid.name}</span>
                      <span className="font-mono text-[10.5px] text-slate-405">({unpaid.phone})</span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-450 italic">
                      {unpaid.board} • বকেয়া: <span className="text-rose-500 font-extrabold">৳{toBengaliNumber(unpaid.due)}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => coptToClipboard(smsText, unpaid.id)}
                      className={`text-[10.5px] py-1.5 px-3 rounded-lg border font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        copiedId === unpaid.id
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : isDarkMode
                          ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'
                      }`}
                    >
                      {copiedId === unpaid.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          কপি হয়েছে!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          নোটিশ কপি
                        </>
                      )}
                    </button>

                    <a
                      href={`sms:${unpaid.phone}?body=${encodeURIComponent(smsText)}`}
                      className="text-[10.5px] py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 font-bold text-white flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      মেসেজ পাঠান
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
