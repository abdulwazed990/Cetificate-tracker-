/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  Clock, 
  Phone, 
  MessageSquare, 
  ChevronRight, 
  ChevronDown, 
  AlertCircle, 
  Calendar,
  Layers,
  MapPin,
  ClockAlert,
  Share2,
  ListFilter,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { CustomerRecord, EXAM_TYPES, BOARDS_A, BOARDS_B, PaymentStatus, WorkStatus } from '../types';

interface CustomerListProps {
  records: CustomerRecord[];
  onEdit: (record: CustomerRecord) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, currentStatus: WorkStatus) => void;
  isDarkMode: boolean;
}

export default function CustomerList({ records, onEdit, onDelete, onToggleStatus, isDarkMode }: CustomerListProps) {
  
  // কাস্টম সার্চ ও ফিল্টারিং স্টেট (পার্সিস্টেন্ট উইথ লোকালস্টোরেজ)
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem('cust_list_search_term') || '';
  });
  const [selectedBoardFilter, setSelectedBoardFilter] = useState<string>(() => {
    return localStorage.getItem('cust_list_board_filter') || 'All';
  });
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>(() => {
    return localStorage.getItem('cust_list_year_filter') || 'All';
  });
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<string>(() => {
    return localStorage.getItem('cust_list_payment_filter') || 'All';
  });
  const [selectedWorkStatusFilter, setSelectedWorkStatusFilter] = useState<string>(() => {
    return localStorage.getItem('cust_list_work_status_filter') || 'All';
  });

  // ফিল্টার পার্সিস্টেন্স সিঙ্ক ইফেক্টস
  React.useEffect(() => {
    localStorage.setItem('cust_list_search_term', searchTerm);
  }, [searchTerm]);

  React.useEffect(() => {
    localStorage.setItem('cust_list_board_filter', selectedBoardFilter);
  }, [selectedBoardFilter]);

  React.useEffect(() => {
    localStorage.setItem('cust_list_year_filter', selectedYearFilter);
  }, [selectedYearFilter]);

  React.useEffect(() => {
    localStorage.setItem('cust_list_payment_filter', selectedPaymentFilter);
  }, [selectedPaymentFilter]);

  React.useEffect(() => {
    localStorage.setItem('cust_list_work_status_filter', selectedWorkStatusFilter);
  }, [selectedWorkStatusFilter]);

  // কুইক এক্সপ্যান্ড রেকর্ডস স্টেট
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ডিলেট কনফার্মেশন স্টেট
  const [deleteIdConfirm, setDeleteIdConfirm] = useState<string | null>(null);

  // ইউনিক বছরের তালিকা বের করা
  const yearList = Array.from(new Set(records.map(r => r.year.toString()))).sort((a, b) => b.localeCompare(a));

  // ডাবল লজিক্যাল ফিল্টার অ্যান্ড সার্চ মেথড
  const getFilteredRecords = (): CustomerRecord[] => {
    return records.filter((rec) => {
      // ১. কীওয়ার্ড সার্চ (নাম, ফোন নাম্বার, বোর্ড, পরীক্ষা বা কাজের ধরন)
      const keyword = searchTerm.toLowerCase().trim();
      const matchesSearch = 
        !keyword ||
        rec.name.toLowerCase().includes(keyword) ||
        rec.phone.includes(keyword) ||
        (rec.whatsapp && rec.whatsapp.includes(keyword)) ||
        rec.board.toLowerCase().includes(keyword) ||
        rec.examType.toLowerCase().includes(keyword) ||
        rec.workType.toLowerCase().includes(keyword) ||
        rec.year.toString().includes(keyword);

      // ২. বোর্ড ফিল্টার
      const matchesBoard = 
        selectedBoardFilter === 'All' || 
        rec.board === selectedBoardFilter;

      // ৩. সাল ফিল্টার
      const matchesYear = 
        selectedYearFilter === 'All' || 
        rec.year.toString() === selectedYearFilter;

      // ৪. পেমেন্ট ফিল্টার
      const matchesPayment = 
        selectedPaymentFilter === 'All' || 
        rec.paymentStatus === selectedPaymentFilter;

      // ৫. কাজ ডেলিভারি ফিল্টার
      const matchesWorkStatus = 
        selectedWorkStatusFilter === 'All' || 
        rec.workStatus === selectedWorkStatusFilter;

      return matchesSearch && matchesBoard && matchesYear && matchesPayment && matchesWorkStatus;
    });
  };

  const filteredRecords = getFilteredRecords();

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // বাংলা সংখ্যায় পরিবর্তনের অতিরিক্ত রূপরেখা
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

  const handleShare = (rec: CustomerRecord) => {
    const textStr = `কাস্টমার ফাইল:\nনাম: ${rec.name}\nমোবাইল: ${rec.phone}\nবোর্ড: ${rec.board}\nপরীক্ষা: ${rec.examType} (${rec.year})\nকাজের ধরন: ${rec.workType}\nপেমেন্ট: ৳${rec.totalPrice} (এডভান্স ৳${rec.advance}, বকেয়া ৳${rec.due})\nনোট: ${rec.notes || 'কোনো নোট নেই।'}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'সার্টিফিকেট কাস্টমার রেকর্ড',
        text: textStr
      }).catch(console.error);
    } else {
      // ক্লিপবোর্ড কপি ফলব্যাকস
      navigator.clipboard.writeText(textStr);
      alert('রেকর্ড ক্লিপবোর্ডে কপি করা হয়েছে!');
    }
  };

  return (
    <div className="space-y-4">
      
      {/* ১. সার্চ ও কুইক ফিল্টারিং ইন্টারফেস */}
      <div className={`rounded-2xl p-4 border transition-all duration-300 shadow-md ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col gap-3">
          
          {/* সার্চ বক্স */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="মোবাইল নাম্বার, নাম, বোর্ড, সাল অথবা পরীক্ষার নাম লিখে খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full py-2.5 pl-10 pr-4 rounded-xl text-xs border focus:outline-none focus:ring-1 transition-all ${
                isDarkMode 
                  ? 'bg-slate-950 border-slate-800 text-slate-100 focus:ring-indigo-500' 
                  : 'bg-slate-50 border-slate-250 text-slate-800 focus:ring-indigo-650'
              }`}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-450 hover:text-rose-500 cursor-pointer font-medium"
              >
                মুছুন
              </button>
            )}
          </div>

          {/* অ্যাডভান্স ড্রপডাউন ফিল্টারস */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            
            {/* বোর্ড ফিল্টার */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-0.5">
                <ListFilter className="w-3 h-3" />
                বোর্ড ফিল্টার
              </label>
              <select
                value={selectedBoardFilter}
                onChange={(e) => setSelectedBoardFilter(e.target.value)}
                className={`w-full py-1.5 px-2 rounded-lg text-xs border focus:outline-none focus:ring-1 ${
                  isDarkMode ? 'bg-slate-950 border-slate-850 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <option value="All">সব বোর্ড</option>
                {Array.from(new Set(records.map(r => r.board))).map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* সাল ফিল্টার */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-0.5">
                <Calendar className="w-3 h-3" />
                সাল ফিল্টার
              </label>
              <select
                value={selectedYearFilter}
                onChange={(e) => setSelectedYearFilter(e.target.value)}
                className={`w-full py-1.5 px-2 rounded-lg text-xs border focus:outline-none focus:ring-1 ${
                  isDarkMode ? 'bg-slate-950 border-slate-850 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <option value="All">সব সাল</option>
                {yearList.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* পেমেন্ট ফিল্টার */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-0.5">
                <Layers className="w-3 h-3" />
                পেমেন্ট ফিল্টার
              </label>
              <select
                value={selectedPaymentFilter}
                onChange={(e) => setSelectedPaymentFilter(e.target.value)}
                className={`w-full py-1.5 px-2 rounded-lg text-xs border focus:outline-none focus:ring-1 ${
                  isDarkMode ? 'bg-slate-950 border-slate-850 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <option value="All">সব পেমেন্ট</option>
                <option value="Paid">পরিশোধিত (Paid)</option>
                <option value="Partial">আংশিক (Partial)</option>
                <option value="Unpaid">বকেয়া (Unpaid)</option>
              </select>
            </div>

            {/* কাজের প্রসেস ফিল্টার */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-0.5">
                <CheckCircle className="w-3 h-3" />
                কাজের অগ্রগতি
              </label>
              <select
                value={selectedWorkStatusFilter}
                onChange={(e) => setSelectedWorkStatusFilter(e.target.value)}
                className={`w-full py-1.5 px-2 rounded-lg text-xs border focus:outline-none focus:ring-1 ${
                  isDarkMode ? 'bg-slate-950 border-slate-850 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <option value="All">সব ক্যাটাগরি</option>
                <option value="Pending">চলতি কাজ (Pending)</option>
                <option value="Complete">ডেলিভার্ড (Complete)</option>
              </select>
            </div>

          </div>

          {/* কুইক রিসেট ফিল্টার বাটন */}
          {(selectedBoardFilter !== 'All' || selectedYearFilter !== 'All' || selectedPaymentFilter !== 'All' || selectedWorkStatusFilter !== 'All' || searchTerm !== '') && (
            <div className="flex justify-between items-center text-[10px] text-indigo-500">
              <span>মোট ফিল্টারড ফলাফল: {toBengaliNumber(filteredRecords.length)} টি রেকর্ড</span>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedBoardFilter('All');
                  setSelectedYearFilter('All');
                  setSelectedPaymentFilter('All');
                  setSelectedWorkStatusFilter('All');
                }}
                className="font-bold underline cursor-pointer"
              >
                সব ফিল্টার মুছে দিন
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ২. কাস্টমারদের লিস্ট ভিউ */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className={`p-10 text-center rounded-2xl border ${
            isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-150'
          }`}>
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-600 dark:text-slate-350">
              কোনো কাস্টমার রেকর্ড পাওয়া যায়নি!
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              অনুগ্রহ করে নতুন কাস্টমার এন্ট্রি করুন অথবা ভিন্ন কীওয়ার্ড দিয়ে সার্চ ও ফিল্টার করুন।
            </p>
          </div>
        ) : (
          filteredRecords.map((rec) => {
            const isExpanded = expandedId === rec.id;
            const isDeleting = deleteIdConfirm === rec.id;

            return (
              <div
                key={rec.id}
                className={`rounded-2xl border transition-all duration-300 ${
                  rec.urgentDelivery && rec.workStatus === 'Pending' 
                    ? 'border-rose-500/50 dark:border-rose-500/40 bg-rose-50/15 dark:bg-rose-950/5 urgent-glow' 
                    : isDarkMode 
                    ? 'bg-slate-900/40 border-slate-850 hover:bg-slate-900/80 hover:border-slate-800' 
                    : 'bg-white border-slate-205 hover:shadow-md hover:border-slate-300'
                }`}
              >
                {/* কার্ডের মূল ইন্টারেক্টিভ রো */}
                <div 
                  onClick={() => toggleExpand(rec.id)}
                  className="p-4 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  
                  {/* কাস্টমার মেটা ও কাজের বিবরণ */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      {/* নাম এবং পরীক্ষার টাইটেল */}
                      <span className="text-sm font-extrabold text-slate-800 dark:text-white truncate block">
                        {rec.name}
                      </span>
                      
                      {/* ক্যাটাগরি এবং সাল ব্যাজ */}
                      <span className={`text-[9.5px] px-2 py-0.5 rounded-md font-bold ${
                        rec.category === 'A'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                      }`}>
                        ক্যাটাগরি {rec.category} ({rec.examType || 'অন্যান্য'} - {rec.year})
                      </span>

                      {/* কাজের ধরন ব্যাজ */}
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                        isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {rec.workType}
                      </span>

                      {/* জরুরি সেবা ব্যাজ */}
                      {rec.urgentDelivery && (
                        <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-rose-500 text-white font-black flex items-center gap-0.5 animate-pulse">
                          <ClockAlert className="w-3 h-3" />
                          জরুরি ডেলিভারি
                        </span>
                      )}
                    </div>

                    {/* বোর্ড, ফোন নাম্বার এবং ডেট স্ট্যাম্প */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{rec.board}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-indigo-500 shrink-0" />
                        <span className="font-mono font-medium">{rec.phone}</span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>{toBengaliDateStr(rec.createdAt)} ({toBengaliTimeStr(rec.createdAt)})</span>
                      </div>
                    </div>
                  </div>

                  {/* ড্যাশবোর্ড পেমেন্ট ও ডেলিভারি ব্যাজগুলো */}
                  <div className="flex items-center justify-between md:justify-end gap-3 border-t border-dashed md:border-t-0 pt-2.5 md:pt-0 border-slate-200 dark:border-slate-800">
                    
                    {/* পেমেন্ট অবস্থা */}
                    <div className="flex flex-col items-start md:items-end">
                      <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-bold mb-0.5">পেমেন্ট অবস্থা:</span>
                      {rec.paymentStatus === 'Paid' && (
                        <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/20">
                          ৳{toBengaliNumber(rec.totalPrice)} (Paid)
                        </span>
                      )}
                      {rec.paymentStatus === 'Partial' && (
                        <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border border-orange-200 dark:border-orange-900/20">
                          বাকি ৳{toBengaliNumber(rec.createdAt === rec.lastUpdated ? rec.due : (rec.totalPrice - rec.advance))}
                        </span>
                      )}
                      {rec.paymentStatus === 'Unpaid' && (
                        <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200 dark:border-rose-900/20 animate-pulse">
                          বকেয়া ৳{toBengaliNumber(rec.totalPrice)} (Due)
                        </span>
                      )}
                    </div>

                    {/* কাজ অগ্রগতি অবস্থা */}
                    <div className="flex flex-col items-end">
                      <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-bold mb-0.5">অভিযান অগ্রগতি:</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation(); // কল পপআপ অফ রাখা
                          onToggleStatus(rec.id, rec.workStatus);
                        }}
                        className={`text-[10.5px] font-black cursor-pointer px-2.5 py-0.5 rounded-full border flex items-center gap-1 active:scale-95 transition-all outline-none ${
                          rec.workStatus === 'Complete'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-400/30'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-400/30'
                        }`}
                        title="কাজটির অগ্রগতি অবস্থা টগল করুন"
                      >
                        {rec.workStatus === 'Complete' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            ডেলিভার্ড
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5" />
                            পেন্ডিং
                          </>
                        )}
                      </button>
                    </div>

                    {/* এক্সপ্যান্ড ইন্ডিকেটর */}
                    <div className="text-slate-400 dark:text-slate-600 hidden sm:block pointer-events-none">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </div>

                  </div>

                </div>

                {/* ৩. এক্সপ্যান্ডেড কাস্টমার ডিটেইলস প্যানেল */}
                {isExpanded && (
                  <div className={`px-4 pb-4 pt-2 border-t border-dashed transition-all duration-200 animate-slideDown ${
                    isDarkMode ? 'border-slate-800 bg-slate-950/30' : 'border-slate-150 bg-slate-50/40'
                  }`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      
                      {/* কাস্টমার ডেমোগ্রাফিক্স কলাম */}
                      <div className="space-y-2 border-b md:border-b-0 md:border-r border-dashed border-slate-200 dark:border-slate-800 pb-3 md:pb-0 pr-0 md:pr-4">
                        <h4 className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                          <Layers className="w-3.5 h-3.5 text-indigo-500" />
                          গ্রাহকের পরিচিতি ও লোকেশন
                        </h4>
                        <div>
                          <span className="text-slate-450">ঠিকানা:</span>
                          <p className="font-semibold text-slate-850 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {rec.address || 'কোনো ঠিকানা এন্ট্রি করা হয়নি।'}
                          </p>
                        </div>
                        {rec.whatsapp && (
                          <div>
                            <span className="text-slate-455">হোয়াটসঅ্যাপ চ্যাট লাইভ:</span>
                            <a
                              href={`https://wa.me/88${rec.whatsapp}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-500 hover:underline font-bold flex items-center gap-1 font-mono mt-0.5"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                              {rec.whatsapp} (ওপেন চ্যাট)
                            </a>
                          </div>
                        )}
                        <div>
                          <span className="text-slate-450 dark:text-slate-500">শেষ আপডেট টাইম:</span>
                          <span className="block font-medium text-slate-500 dark:text-slate-400">
                            {toBengaliDateStr(rec.lastUpdated)} ({toBengaliTimeStr(rec.lastUpdated)})
                          </span>
                        </div>
                      </div>

                      {/* পেমেন্ট ও অ্যাকাউন্ট কিস্তি কলাম */}
                      <div className="space-y-2 border-b md:border-b-0 md:border-r border-dashed border-slate-200 dark:border-slate-800 pb-3 md:pb-0 pr-0 md:pr-4">
                        <h4 className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                          <Layers className="w-3.5 h-3.5 text-emerald-500" />
                          পেমেন্ট মেমোরেন্ডাম
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className={`p-2 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                            <span className="text-slate-400 block mb-0.5">মোট ফি:</span>
                            <span className="font-extrabold text-slate-800 dark:text-white text-xs">৳{toBengaliNumber(rec.totalPrice)}</span>
                          </div>
                          <div className={`p-2 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-rose-950/20' : 'bg-rose-50 border-rose-100'}`}>
                            <span className="text-rose-500 block mb-0.5">বাকি বকেয়া:</span>
                            <span className="font-extrabold text-rose-600 dark:text-rose-400 text-xs">৳{toBengaliNumber(rec.due)}</span>
                          </div>
                          <div className={`p-2 rounded-xl border col-span-2 ${isDarkMode ? 'bg-slate-900 border-emerald-950/20' : 'bg-emerald-50 border-emerald-100'}`}>
                            <span className="text-emerald-600 dark:text-emerald-400 block mb-0.5">অগ্রিম প্রাপ্তি (এডভান্স):</span>
                            <span className="font-extrabold text-emerald-700 dark:text-emerald-450 text-xs">৳{toBengaliNumber(rec.advance)}</span>
                          </div>
                        </div>
                      </div>

                      {/* লাস্ট কনভারসেশন ও কুইক অ্যাকশন কলাম */}
                      <div className="space-y-3 flex flex-col justify-between">
                        <div>
                          <h4 className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1 text-[11px] uppercase tracking-wider mb-1">
                            <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                            শেষ কথপোকথন / নোট রেকর্ড
                          </h4>
                          <blockquote className={`p-3 rounded-xl border text-xs max-h-32 overflow-y-auto ${
                            isDarkMode 
                              ? 'bg-slate-950 border-slate-850 text-slate-300 italic' 
                              : 'bg-indigo-50/30 border-indigo-100 text-slate-700 italic'
                          }`}>
                            "{rec.notes || 'কোনো নোট সেভ করা হয়নি।'}"
                          </blockquote>
                        </div>

                        {/* রিয়েল অ্যাকশন বাটনসমূহ */}
                        <div className="flex gap-2 justify-end pt-1">
                          {/* সরাসরি কল ট্রিপ */}
                          <a
                            href={`tel:${rec.phone}`}
                            className="p-2 cursor-pointer bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl shadow transition-all flex items-center justify-center gap-1 font-bold text-[11px]"
                            title="সরাসরি কল দিন"
                          >
                            <Phone className="w-3.5 h-3.5 animate-bounce" />
                            কল দিন
                          </a>

                          {/* ডাটা শেয়ার করুন */}
                          <button
                            onClick={() => handleShare(rec)}
                            className="p-2 cursor-pointer bg-emerald-650 hover:bg-emerald-705 text-white rounded-xl active:scale-95 shadow transition-all flex items-center justify-center"
                            title="শেয়ার বা কপি করুন"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {/* এডিট বাটন */}
                          <button
                            onClick={() => onEdit(rec)}
                            className={`p-2 cursor-pointer rounded-xl active:scale-95 border transition-all flex items-center justify-center ${
                              isDarkMode 
                                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                                : 'bg-slate-100 border-slate-205 text-slate-650 hover:bg-slate-200'
                            }`}
                            title="পরিবর্তন বা এডিট"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* কুইক রিস্কি ডিলিট প্যানেল */}
                          {isDeleting ? (
                            <div className="flex gap-1 animate-fadeIn items-center">
                              <span className="text-[10px] text-rose-500 font-bold">নিশ্চিত?</span>
                              <button
                                onClick={() => onDelete(rec.id)}
                                className="px-2 py-1 bg-rose-600 text-white font-extrabold text-[10px] rounded hover:bg-rose-700 cursor-pointer"
                              >
                                হ্যাঁ
                              </button>
                              <button
                                onClick={() => setDeleteIdConfirm(null)}
                                className="px-2 py-1 bg-slate-300 dark:bg-slate-800 text-slate-650 dark:text-slate-300 text-[10px] rounded cursor-pointer"
                              >
                                না
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteIdConfirm(rec.id)}
                              className="p-2 cursor-pointer bg-rose-100 hover:bg-rose-600 hover:text-white text-rose-650 rounded-xl active:scale-95 transition-all flex items-center justify-center"
                              title="ডিলিট রেকর্ড"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                      </div>

                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
