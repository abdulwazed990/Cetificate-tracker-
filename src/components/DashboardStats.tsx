/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CustomerRecord, ReportSummary } from '../types';
import { 
  Users, 
  CalendarClock, 
  Clock, 
  CheckCircle, 
  BadgeDollarSign, 
  TrendingUp, 
  Receipt 
} from 'lucide-react';

interface DashboardStatsProps {
  records: CustomerRecord[];
  isDarkMode: boolean;
  onNavigateToSection: (section: string) => void;
}

export default function DashboardStats({ records, isDarkMode, onNavigateToSection }: DashboardStatsProps) {
  
  // ক্যালকুলেশন মেথডস
  const getStats = (): ReportSummary => {
    const todayStr = new Date().toLocaleDateString('bn-BD');
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalCustomersToday = 0;
    let totalCustomersThisMonth = 0;
    let pendingJobs = 0;
    let completedJobs = 0;
    let totalDueAmount = 0;
    let advanceReceived = 0;
    let totalIncome = 0; // মোট আদায়কৃত টাকা = এডভান্স + পেইড কিস্তি (অর্থাৎ totalPrice - due)

    records.forEach((rec) => {
      const recDate = new Date(rec.createdAt);
      
      // ১. আজকের কাস্টমার (বাংলা ডেট কম্পারিজন বা সিম্পল ট্র্যাকিং)
      // ডাবল রিলায়েবল ডেট স্ট্যাম্প চেক
      const isTodayStr = recDate.toLocaleDateString('bn-BD') === todayStr;
      const isTodayTime = recDate.getDate() === now.getDate() && 
                          recDate.getMonth() === now.getMonth() && 
                          recDate.getFullYear() === now.getFullYear();
      if (isTodayStr || isTodayTime) {
        totalCustomersToday++;
      }

      // ২. এই মাসের কাস্টমার
      if (recDate.getMonth() === currentMonth && recDate.getFullYear() === currentYear) {
        totalCustomersThisMonth++;
      }

      // ৩. পেন্ডিং কাজ
      if (rec.workStatus === 'Pending') {
        pendingJobs++;
      } else {
        completedJobs++;
      }

      // ৪. মোট বকেয়া, এডভান্স ও মোট সংগৃহীত টাকা
      totalDueAmount += rec.due;
      advanceReceived += rec.advance;
      totalIncome += (rec.totalPrice - rec.due);
    });

    return {
      totalCustomersToday,
      totalCustomersThisMonth,
      pendingJobs,
      completedJobs,
      totalDueAmount,
      totalIncome,
      advanceReceived
    };
  };

  const stats = getStats();

  // বাংলা সংখ্যায় কনভার্ট করার হেল্পার
  const toBengaliNumber = (num: number): string => {
    const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const bengaliNumbers = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    
    // লোকাল কারেন্সি ফরম্যাট করা (যেমন: ৫০,০০০)
    const formatted = num.toLocaleString('en-IN'); 
    
    return formatted.split('').map((char) => {
      const idx = englishNumbers.indexOf(char);
      return idx !== -1 ? bengaliNumbers[idx] : char;
    }).join('');
  };

  const cards = [
    {
      id: 'today-leads',
      title: 'আজকের কাস্টমার',
      value: toBengaliNumber(stats.totalCustomersToday) + ' জন',
      icon: Users,
      desc: 'আজ নতুন যুক্ত হয়েছেন',
      gradient: 'from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400',
      border: 'border-blue-500/20',
      tabId: 'history'
    },
    {
      id: 'month-leads',
      title: 'এই মাসের কাস্টমার',
      value: toBengaliNumber(stats.totalCustomersThisMonth) + ' জন',
      icon: CalendarClock,
      desc: 'চলতি মাসে সর্বমোট কাস্টমার',
      gradient: 'from-indigo-500/10 to-violet-500/10 text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-500/20',
      tabId: 'history'
    },
    {
      id: 'pending-tasks',
      title: 'পেন্ডিং কাজ',
      value: toBengaliNumber(stats.pendingJobs) + ' টি',
      icon: Clock,
      desc: 'বোর্ডে ডেলিভারি এখনো বাকি',
      gradient: 'from-amber-500/10 to-orange-500/10 text-amber-500',
      border: 'border-amber-500/20',
      tabId: 'history'
    },
    {
      id: 'completed-tasks',
      title: 'সম্পন্ন কাজ',
      value: toBengaliNumber(stats.completedJobs) + ' টি',
      icon: CheckCircle,
      desc: 'সফলভাবে ডেলিভারি করা হয়েছে',
      gradient: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500/20',
      tabId: 'history'
    },
    {
      id: 'due-payments',
      title: 'মোট বকেয়া (Due)',
      value: '৳ ' + toBengaliNumber(stats.totalDueAmount),
      icon: Receipt,
      desc: 'কাস্টমারদের থেকে বাকি টাকা',
      gradient: 'from-rose-500/10 to-pink-500/10 text-rose-600 dark:text-rose-400',
      border: 'border-rose-500/20',
      tabId: 'payment'
    },
    {
      id: 'collected',
      title: 'মোট আয় (রিসিভড)',
      value: '৳ ' + toBengaliNumber(stats.totalIncome),
      icon: TrendingUp,
      desc: 'অ্যাডভান্স + পরিশোধিত মোট',
      gradient: 'from-emerald-500/20 to-lime-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm',
      border: 'border-emerald-500/30 font-semibold',
      tabId: 'payment'
    },
    {
      id: 'advances',
      title: 'অগ্রিম প্রাপ্তি',
      value: '৳ ' + toBengaliNumber(stats.advanceReceived),
      icon: BadgeDollarSign,
      desc: 'পেন্ডিং কাজের মোট এডভান্স',
      gradient: 'from-teal-500/10 to-cyan-500/10 text-teal-600 dark:text-teal-400',
      border: 'border-teal-500/20',
      tabId: 'payment'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
      
      {/* প্রথম ৩ টি মেইল কাস্টমার কার্ড */}
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <button
            key={card.id}
            onClick={() => onNavigateToSection(card.tabId)}
            className={`cursor-pointer text-left rounded-2xl p-4 border transition-all duration-300 transform active:scale-98 ${
              isDarkMode 
                ? 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/40' 
                : 'bg-white hover:shadow-md hover:border-slate-300'
            } ${card.border} ${card.id === 'collected' ? 'col-span-2 md:col-span-2' : 'col-span-1'}`}
          >
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 tracking-tight block truncate">
                {card.title}
              </span>
              <div className={`p-1.5 rounded-lg bg-gradient-to-br ${card.gradient} shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            
            <div className="flex flex-col gap-0.5">
              <span className={`text-base md:text-lg font-bold tracking-tight ${
                card.id === 'collected' ? 'text-emerald-500 text-lg md:text-xl' : 'text-slate-800 dark:text-white'
              }`}>
                {card.value}
              </span>
              <span className="text-[9.5px] md:text-xs text-slate-400 dark:text-slate-500 truncate block">
                {card.desc}
              </span>
            </div>
          </button>
        );
      })}

    </div>
  );
}
