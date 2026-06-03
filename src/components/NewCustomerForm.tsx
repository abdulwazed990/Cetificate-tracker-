/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Phone, 
  MapPin, 
  School, 
  BookOpen, 
  Settings, 
  Wallet, 
  Save, 
  X, 
  HelpCircle, 
  MessageSquare,
  Sparkles,
  ArrowRightLeft,
  CheckCircle2,
  ClockAlert
} from 'lucide-react';
import { 
  CustomerRecord, 
  CategoryType, 
  BOARDS_A, 
  BOARDS_B, 
  EXAM_TYPES, 
  GROUPS, 
  WORK_TYPES, 
  ADDITIONAL_OPTIONS, 
  PaymentStatus 
} from '../types';

interface NewCustomerFormProps {
  onSave: (record: Omit<CustomerRecord, 'id' | 'createdAt' | 'dateString' | 'timeString' | 'lastUpdated'>) => void;
  onUpdate?: (id: string, record: Partial<CustomerRecord>) => void;
  editRecord?: CustomerRecord | null;
  onCancelEdit?: () => void;
  isDarkMode: boolean;
}

export default function NewCustomerForm({ onSave, onUpdate, editRecord, onCancelEdit, isDarkMode }: NewCustomerFormProps) {
  
  // ফর্ম স্টেটসমূহ (পার্সিস্টেন্ট ড্রাফট ক্লিয়ারেন্স ও লোডিং মেকানিজম)
  const [name, setName] = useState(() => localStorage.getItem('draft_cust_name') || '');
  const [phone, setPhone] = useState(() => localStorage.getItem('draft_cust_phone') || '');
  const [whatsapp, setWhatsapp] = useState(() => localStorage.getItem('draft_cust_whatsapp') || '');
  const [address, setAddress] = useState(() => localStorage.getItem('draft_cust_address') || '');
  const [category, setCategory] = useState<CategoryType>(() => (localStorage.getItem('draft_cust_category') as CategoryType) || 'A');
  const [board, setBoard] = useState(() => localStorage.getItem('draft_cust_board') || BOARDS_A[0]);
  const [examType, setExamType] = useState<typeof EXAM_TYPES[number] | ''>(() => (localStorage.getItem('draft_cust_exam_type') as typeof EXAM_TYPES[number]) || 'SSC');
  const [groupType, setGroupType] = useState<typeof GROUPS[number] | ''>(() => (localStorage.getItem('draft_cust_group_type') as typeof GROUPS[number]) || 'Science');
  const [workType, setWorkType] = useState<typeof WORK_TYPES[number] | ''>(() => (localStorage.getItem('draft_cust_work_type') as typeof WORK_TYPES[number]) || 'নতুন সার্টিফিকেট');
  const [year, setYear] = useState<number>(() => Number(localStorage.getItem('draft_cust_year')) || 2020);
  const [selectedOptions, setSelectedOptions] = useState<string[]>(() => {
    const raw = localStorage.getItem('draft_cust_selected_options');
    try { return raw ? JSON.parse(raw) : []; } catch { return []; }
  });
  const [urgentDelivery, setUrgentDelivery] = useState(() => localStorage.getItem('draft_cust_urgent_delivery') === 'true');
  const [totalPrice, setTotalPrice] = useState<number | ''>(() => {
    const raw = localStorage.getItem('draft_cust_total_price');
    return raw ? Number(raw) : '';
  });
  const [advance, setAdvance] = useState<number | ''>(() => {
    const raw = localStorage.getItem('draft_cust_advance');
    return raw ? Number(raw) : '';
  });
  const [notes, setNotes] = useState(() => localStorage.getItem('draft_cust_notes') || '');
  const [workStatus, setWorkStatus] = useState<'Pending' | 'Complete'>(() => (localStorage.getItem('draft_cust_work_status') as 'Pending' | 'Complete') || 'Pending');

  // এরর ট্র্যাকিং
  const [phoneError, setPhoneError] = useState('');

  // ড্রাফট স্টেট ক্লিয়ার করার মেথড
  const clearDrafts = () => {
    localStorage.removeItem('draft_cust_name');
    localStorage.removeItem('draft_cust_phone');
    localStorage.removeItem('draft_cust_whatsapp');
    localStorage.removeItem('draft_cust_address');
    localStorage.removeItem('draft_cust_category');
    localStorage.removeItem('draft_cust_board');
    localStorage.removeItem('draft_cust_exam_type');
    localStorage.removeItem('draft_cust_group_type');
    localStorage.removeItem('draft_cust_work_type');
    localStorage.removeItem('draft_cust_year');
    localStorage.removeItem('draft_cust_selected_options');
    localStorage.removeItem('draft_cust_urgent_delivery');
    localStorage.removeItem('draft_cust_total_price');
    localStorage.removeItem('draft_cust_advance');
    localStorage.removeItem('draft_cust_notes');
    localStorage.removeItem('draft_cust_work_status');
  };

  // টাইপ করার সাথে সাথে ড্রাফট হিসেবে সেভ করা
  useEffect(() => {
    if (!editRecord) {
      localStorage.setItem('draft_cust_name', name);
      localStorage.setItem('draft_cust_phone', phone);
      localStorage.setItem('draft_cust_whatsapp', whatsapp);
      localStorage.setItem('draft_cust_address', address);
      localStorage.setItem('draft_cust_category', category);
      localStorage.setItem('draft_cust_board', board);
      localStorage.setItem('draft_cust_exam_type', examType);
      localStorage.setItem('draft_cust_group_type', groupType || '');
      localStorage.setItem('draft_cust_work_type', workType || '');
      localStorage.setItem('draft_cust_year', year.toString());
      localStorage.setItem('draft_cust_selected_options', JSON.stringify(selectedOptions));
      localStorage.setItem('draft_cust_urgent_delivery', urgentDelivery ? 'true' : 'false');
      localStorage.setItem('draft_cust_total_price', totalPrice.toString());
      localStorage.setItem('draft_cust_advance', advance.toString());
      localStorage.setItem('draft_cust_notes', notes);
      localStorage.setItem('draft_cust_work_status', workStatus);
    }
  }, [name, phone, whatsapp, address, category, board, examType, groupType, workType, year, selectedOptions, urgentDelivery, totalPrice, advance, notes, workStatus, editRecord]);

  // বছরগুলোর তালিকা তৈরিকরণ (১৯৯০ থেকে ২০২৬)
  const yearsList: number[] = [];
  for (let y = 2026; y >= 1990; y--) {
    yearsList.push(y);
  }

  // এডিটের সময় রেকর্ড লোড করা
  useEffect(() => {
    if (editRecord) {
      setName(editRecord.name);
      setPhone(editRecord.phone);
      setWhatsapp(editRecord.whatsapp || '');
      setAddress(editRecord.address || '');
      setCategory(editRecord.category);
      setBoard(editRecord.board);
      setExamType(editRecord.examType);
      setGroupType(editRecord.groupType);
      setWorkType(editRecord.workType);
      setYear(editRecord.year);
      setSelectedOptions(editRecord.additionalOptions || []);
      setUrgentDelivery(editRecord.urgentDelivery || false);
      setTotalPrice(editRecord.totalPrice === 0 ? '' : editRecord.totalPrice);
      setAdvance(editRecord.advance === 0 ? '' : editRecord.advance);
      setNotes(editRecord.notes || '');
      setWorkStatus(editRecord.workStatus || 'Pending');
    } else {
      resetForm();
    }
  }, [editRecord]);

  // ক্যাটাগরি চেঞ্জের সাথে সাথে বোর্ড অটো অ্যাডজাস্ট করা
  useEffect(() => {
    if (!editRecord) {
      if (category === 'A') {
        setBoard(BOARDS_A[0]);
      } else {
        setBoard(BOARDS_B[0]);
      }
    }
  }, [category]);

  const resetForm = () => {
    setName('');
    setPhone('');
    setWhatsapp('');
    setAddress('');
    setCategory('A');
    setBoard(BOARDS_A[0]);
    setExamType('SSC');
    setGroupType('Science');
    setWorkType('নতুন সার্টিফিকেট');
    setYear(2020);
    setSelectedOptions([]);
    setUrgentDelivery(false);
    setTotalPrice('');
    setAdvance('');
    setNotes('');
    setWorkStatus('Pending');
    setPhoneError('');
    clearDrafts();
  };

  // লাইভ অটো-ক্যালকুলেশন বকেয়া হিসাব
  const calcTotalPrice = Number(totalPrice) || 0;
  const calcAdvance = Number(advance) || 0;
  const calcDue = calcTotalPrice - calcAdvance;

  // অটো পেমেন্ট স্ট্যাটাস নির্ধারণ
  const getAutoPaymentStatus = (): PaymentStatus => {
    const tot = Number(totalPrice) || 0;
    const adv = Number(advance) || 0;
    const rem = tot - adv;

    if (tot === 0) return 'Unpaid';
    if (rem <= 0) return 'Paid';
    if (adv > 0) return 'Partial';
    return 'Unpaid';
  };

  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, ''); // শুধু নাম্বার সাপোর্ট
    if (raw.length <= 11) {
      setPhone(raw);
      if (raw.length > 0 && raw.length < 11) {
        setPhoneError('মোবাইল নাম্বার অবশ্যই ১১ ডিজিটের হতে হবে');
      } else {
        setPhoneError('');
      }
    }
  };

  const handleOptionToggle = (option: string) => {
    setSelectedOptions((prev) => 
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
    );
  };

  // কুইক নোটস জেনারেটর টেমপ্লট যা দিয়ে এক ক্লিকে নোট তৈরি হতে পারে
  const applyQuickNoteTemplate = (type: string) => {
    let text = '';
    const examBoardText = `${examType} ${board} ${year}`;
    const moneyText = `ফি ${calcTotalPrice ? calcTotalPrice.toLocaleString('bn-BD') : '---'} টাকা, অ্যাডভান্স ${calcAdvance ? calcAdvance.toLocaleString('bn-BD') : '---'} টাকা।`;

    switch (type) {
      case 'correction':
        text = `${examBoardText} সংশোধন। ${moneyText} আগামী সপ্তাহে ডেলিভারি চেয়েছে।`;
        break;
      case 'result':
        text = `${examBoardText} রেজাল্ট ভেরিফিকেশন ও নতুন কপি। ${moneyText} কাস্টমার জরুরি চেয়েছেন।`;
        break;
      case 'fresh':
        text = `বিআইএসডি কোর্স ডিপ্লোমা নতুন ফ্রেশ সার্টিফিকেট কপি প্রসেস। ${moneyText} সম্পূর্ণ পেমেন্ট কমপ্লিট।`;
        break;
      case 'custom':
        text = `গ্রাহকের সাথে কথা হয়েছে, বোর্ড প্রসেডিং-এর পর পরবর্তী কনভারসেশনে আপডেট জানানো হবে।`;
        break;
      default:
        text = '';
    }
    setNotes(text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone) {
      setPhoneError('ফোন নাম্বার দেওয়া আবশ্যক!');
      return;
    }
    if (phone.length < 11) {
      setPhoneError('অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নাম্বার লিখুন।');
      return;
    }

    const priceNum = Number(totalPrice) || 0;
    const advanceNum = Number(advance) || 0;
    const dueNum = priceNum - advanceNum;

    const dataPayload = {
      name: name.trim() || 'অজানা কাস্টমার',
      phone,
      whatsapp: whatsapp.trim() || undefined,
      address: address.trim() || undefined,
      category,
      board,
      examType,
      groupType,
      workType,
      year,
      additionalOptions: selectedOptions,
      urgentDelivery,
      totalPrice: priceNum,
      advance: advanceNum,
      due: dueNum,
      paymentStatus: getAutoPaymentStatus(),
      notes: notes.trim(),
      workStatus
    };

    if (editRecord && onUpdate) {
      onUpdate(editRecord.id, dataPayload);
    } else {
      onSave(dataPayload);
      resetForm();
    }
  };

  return (
    <div className={`rounded-3xl p-5 border shadow-xl transition-all duration-300 ${
      isDarkMode 
        ? 'bg-slate-900 border-slate-800' 
        : 'bg-white border-slate-200'
    }`}>
      {/* ফর্মের শিরোনাম */}
      <div className="flex justify-between items-center mb-5 pb-3 border-b border-dashed border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className={`p-2 rounded-xl text-white ${editRecord ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
              <User className="w-4 h-4" />
            </span>
            {editRecord ? 'কাস্টমারের তথ্য পরিবর্তন (Edit)' : 'নতুন কাস্টমারের ফাইল যুক্ত করুন'}
          </h2>
          <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-1">
            {editRecord ? 'নিচে কোনো ফিল্ড এডিট করার পর ডাটাবেস আপডেট করুন।' : 'সার্টিফিকেট কাজের জন্য নিচে কাস্টমার ফাইল তৈরি করুন।'}
          </p>
        </div>
        
        {editRecord && onCancelEdit && (
          <button
            onClick={onCancelEdit}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="এডিট বাতিল করুন"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* কাস্টমার মেটা ডাটা */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* নাম */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              কাস্টমারের নাম
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: মোঃ সাকিব হাসান"
              className={`w-full py-2.5 px-3 rounded-xl text-sm border focus:outline-none focus:ring-1 transition-all ${
                isDarkMode 
                  ? 'bg-slate-950 border-slate-800 text-slate-100 focus:ring-indigo-500 focus:border-indigo-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-indigo-600 focus:border-indigo-600'
              }`}
            />
          </div>

          {/* ফোন নাম্বার (Required) */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              মোবাইল নাম্বার <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="যেমন: 017XXXXXXXX"
                className={`w-full py-2.5 px-3 rounded-xl text-sm border focus:outline-none focus:ring-1 pr-14 transition-all ${
                  isDarkMode 
                    ? 'bg-slate-950 border-slate-800 text-slate-100 focus:ring-indigo-500 focus:border-indigo-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-indigo-600 focus:border-indigo-600'
                } ${phoneError ? 'border-rose-400 focus:ring-rose-500 focus:border-rose-500' : ''}`}
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 uppercase font-mono">
                {phone.length}/১১
              </span>
            </div>
            {phoneError && (
              <span className="text-[10px] text-rose-500 mt-1 block font-medium flex items-center gap-1">
                <ClockAlert className="w-2.5 h-2.5" />
                {phoneError}
              </span>
            )}
          </div>

          {/* হোয়াটসঅ্যাপ (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-emerald-500" />
              হোয়াটসঅ্যাপ নাম্বার (ঐচ্ছিক)
            </label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '');
                if (raw.length <= 11) setWhatsapp(raw);
              }}
              placeholder="যেমন: 01XXXXXXXXX"
              className={`w-full py-2.5 px-3 rounded-xl text-sm border focus:outline-none focus:ring-1 transition-all ${
                isDarkMode 
                  ? 'bg-slate-950 border-slate-800 text-slate-100 focus:ring-indigo-500 focus:border-indigo-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-indigo-600 focus:border-indigo-600'
              }`}
            />
          </div>

          {/* ঠিকানা (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              গ্রাহকের ঠিকানা (ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="যেমন: রামপুরা, ঢাকা"
              className={`w-full py-2.5 px-3 rounded-xl text-sm border focus:outline-none focus:ring-1 transition-all ${
                isDarkMode 
                  ? 'bg-slate-950 border-slate-800 text-slate-100 focus:ring-indigo-500 focus:border-indigo-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-indigo-600 focus:border-indigo-600'
              }`}
            />
          </div>

        </div>

        {/* ক্যাটাগরি ও বোর্ড লজিক */}
        <div className={`p-4 rounded-2xl border ${
          isDarkMode ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50 border-slate-100'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* ক্যাটাগরি নির্বাচন (A/B) */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-500" />
                কাস্টমার ক্যাটাগরি
              </label>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCategory('A')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold cursor-pointer border text-center transition-all ${
                    category === 'A'
                      ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-500/20'
                      : isDarkMode
                      ? 'bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-850'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  ক্যাটাগরি A (শিক্ষা বোর্ড সমূহ)
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('B')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold cursor-pointer border text-center transition-all ${
                    category === 'B'
                      ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-500/20'
                      : isDarkMode
                      ? 'bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-850'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  ক্যাটাগরি B (শুধুমাত্র BISD)
                </button>
              </div>
            </div>

            {/* ডায়নামিক বোর্ড নির্বাচন */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1 animate-fadeIn">
                <School className="w-3.5 h-3.5 text-slate-400" />
                {category === 'A' ? 'শিক্ষা বোর্ড নির্বাচন করুন' : 'উৎস প্রতিষ্ঠান (BISD)'}
              </label>

              {category === 'A' ? (
                <select
                  value={board}
                  onChange={(e) => setBoard(e.target.value)}
                  className={`w-full py-2.5 px-3 rounded-xl text-sm border focus:outline-none focus:ring-1 transition-all ${
                    isDarkMode 
                      ? 'bg-slate-950 border-slate-800 text-slate-100 focus:ring-indigo-500 focus:border-indigo-500' 
                      : 'bg-slate-55 border-slate-200 text-slate-850 focus:ring-indigo-600 focus:border-indigo-600'
                  }`}
                >
                  {BOARDS_A.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              ) : (
                <div className={`py-2.5 px-3 rounded-xl text-sm border font-semibold flex items-center gap-2 ${
                  isDarkMode 
                    ? 'bg-slate-950 border-slate-800 text-emerald-400' 
                    : 'bg-slate-100 border-slate-200 text-emerald-700'
                }`}>
                  <CheckCircle2 className="w-4 h-4" />
                  {BOARDS_B[0]}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* পরীক্ষা, গ্রুপ, কাজ এবং সাল */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* পরীক্ষা */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              পরীক্ষার নাম
            </label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value as any)}
              className={`w-full py-2.5 px-3 rounded-xl text-sm border focus:outline-none focus:ring-1 transition-all ${
                isDarkMode 
                  ? 'bg-slate-950 border-slate-800 text-slate-100 focus:ring-indigo-500 focus:border-indigo-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-indigo-600 focus:border-indigo-600'
              }`}
            >
              {EXAM_TYPES.map((et) => (
                <option key={et} value={et}>{et}</option>
              ))}
            </select>
          </div>

          {/* গ্রুপ */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              বিভাগ / গ্রুপ
            </label>
            <select
              value={groupType}
              onChange={(e) => setGroupType(e.target.value as any)}
              className={`w-full py-2.5 px-3 rounded-xl text-sm border focus:outline-none focus:ring-1 transition-all ${
                isDarkMode 
                  ? 'bg-slate-950 border-slate-800 text-slate-100 focus:ring-indigo-500 focus:border-indigo-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-indigo-600 focus:border-indigo-600'
              }`}
            >
              {GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g === 'Science' ? 'Science (বিজ্ঞান)' : g === 'Business Studies' ? 'Commerce (ব্যবসায়শিক্ষা)' : g === 'Humanities' ? 'Arts (মানবিক)' : 'Vocational (কারিগরি)'}
                </option>
              ))}
            </select>
          </div>

          {/* কাজের ধরন */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              কাজের ধরন (Work)
            </label>
            <select
              value={workType}
              onChange={(e) => setWorkType(e.target.value as any)}
              className={`w-full py-2.5 px-3 rounded-xl text-sm border focus:outline-none focus:ring-1 transition-all ${
                isDarkMode 
                  ? 'bg-slate-950 border-slate-800 text-slate-100 focus:ring-indigo-500 focus:border-indigo-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-indigo-600 focus:border-indigo-600'
              }`}
            >
              {WORK_TYPES.map((wt) => (
                <option key={wt} value={wt}>{wt}</option>
              ))}
            </select>
          </div>

          {/* সাল নির্বাচন */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              পরীক্ষার সাল
            </label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className={`w-full py-2.5 px-3 rounded-xl text-sm border focus:outline-none focus:ring-1 transition-all ${
                isDarkMode 
                  ? 'bg-slate-950 border-slate-800 text-slate-100 focus:ring-indigo-500 focus:border-indigo-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-indigo-600 focus:border-indigo-600'
              }`}
            >
              {yearsList.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

        </div>

        {/* অতিরিক্ত অপশন (মাল্টি-সিলেক্ট এবং জরুরি সেবা) */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            অতিরিক্ত সেবা অপশন ও ডেলিভারি গতি
          </label>
          <div className="flex flex-wrap gap-2 items-center">
            {ADDITIONAL_OPTIONS.map((opt) => {
              const isSelected = selectedOptions.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleOptionToggle(opt)}
                  className={`py-1.5 px-3 cursor-pointer rounded-xl text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-400'
                      : isDarkMode
                      ? 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-850'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt}
                </button>
              );
            })}

            {/* জরুরি ডেলিভারি সুইচার */}
            <button
              type="button"
              onClick={() => setUrgentDelivery(!urgentDelivery)}
              className={`py-1.5 px-3 rounded-xl cursor-pointer text-xs font-bold border flex items-center gap-1.5 transition-all outline-none ${
                urgentDelivery
                  ? 'bg-rose-500 text-white border-rose-500 urgent-glow text-shadow'
                  : isDarkMode
                  ? 'bg-rose-950/25 text-rose-400 border-rose-900/35 hover:bg-rose-900/10'
                  : 'bg-rose-50 text-rose-600 border-rose-250 hover:bg-rose-100'
              }`}
            >
              <ClockAlert className="w-3.5 h-3.5" />
              জরুরি ডেলিভারি অপশন
            </button>
          </div>
        </div>

        {/* পেমেন্ট হিসাব */}
        <div className={`p-4 rounded-2xl border ${
          isDarkMode ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50 border-slate-100'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            
            {/* মোট প্রাইস */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-slate-400" />
                মোট প্রাইস (টাকা)
              </label>
              <input
                type="number"
                value={totalPrice}
                onChange={(e) => {
                  const val = e.target.value;
                  setTotalPrice(val === '' ? '' : Number(val));
                }}
                placeholder="যেমন: ৭০০০"
                className={`w-full py-2 px-3 rounded-xl text-sm border focus:outline-none focus:ring-1 transition-all ${
                  isDarkMode 
                    ? 'bg-slate-950 border-slate-800 text-slate-100 focus:ring-indigo-500' 
                    : 'bg-white border-slate-200 focus:ring-indigo-650'
                }`}
                min={0}
              />
            </div>

            {/* এডভান্স পরিশোধ */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                অগ্রিম প্রদান / এডভান্স
              </label>
              <input
                type="number"
                value={advance}
                onChange={(e) => {
                  const val = e.target.value;
                  setAdvance(val === '' ? '' : Number(val));
                }}
                placeholder="যেমন: ৩০০০"
                className={`w-full py-2 px-3 rounded-xl text-sm border focus:outline-none focus:ring-1 transition-all ${
                  isDarkMode 
                    ? 'bg-slate-950 border-slate-800 text-slate-100 focus:ring-indigo-500' 
                    : 'bg-white border-slate-200 focus:ring-indigo-650'
                }`}
                min={0}
              />
            </div>

            {/* বাকি টাকা (Auto Calculated) */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                বাকি টাকা (Due - অটো)
              </label>
              <div className={`py-2 px-3 rounded-xl text-sm border font-bold ${
                calcDue > 0
                  ? isDarkMode ? 'bg-slate-900 border-rose-900/30 text-rose-400' : 'bg-rose-50 border-rose-100 text-rose-600'
                  : isDarkMode ? 'bg-slate-900 border-emerald-900/30 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
              }`}>
                ৳ {calcDue.toLocaleString('bn-BD')}
              </div>
            </div>

            {/* লাইভ পেমেন্ট ব্যাজ */}
            <div>
              <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                পেমেন্ট স্ট্যাটাস (অটো)
              </span>
              <div className="flex items-center">
                {getAutoPaymentStatus() === 'Paid' && (
                  <span className="px-4 py-2 w-full text-center text-xs font-extrabold rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30">
                    পরিশোধিত (Paid)
                  </span>
                )}
                {getAutoPaymentStatus() === 'Partial' && (
                  <span className="px-4 py-2 w-full text-center text-xs font-extrabold rounded-xl bg-orange-100 text-orange-850 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-800/30 animate-pulse">
                    আংশিক প্রাপ্ত (Partial)
                  </span>
                )}
                {getAutoPaymentStatus() === 'Unpaid' && (
                  <span className="px-4 py-2 w-full text-center text-xs font-extrabold rounded-xl bg-rose-105 text-rose-800 dark:bg-rose-955/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30">
                    বকেয়া (Unpaid)
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* কনভারসেশন বা নোট */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
              লাস্ট কনভারসেশন / নোট রাখুন
            </label>

            {/* কুইক টেমপ্লেট বাটন */}
            <div className="flex items-center gap-1">
              <span className="text-[9.5px] text-slate-400 mr-1 hidden sm:inline">দ্রুত কি-টেমপ্লেট:</span>
              <button
                type="button"
                onClick={() => applyQuickNoteTemplate('correction')}
                className="text-[9px] py-0.5 px-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-500 cursor-pointer"
              >
                + সংশোধন নোট
              </button>
              <button
                type="button"
                onClick={() => applyQuickNoteTemplate('result')}
                className="text-[9px] py-0.5 px-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-500 cursor-pointer"
              >
                + রেজাল্ট ভেরিফাইড
              </button>
              <button
                type="button"
                onClick={() => applyQuickNoteTemplate('custom')}
                className="text-[9px] py-0.5 px-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-500 cursor-pointer"
              >
                + যোগাযোগ নোট
              </button>
            </div>
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="উদাহরণ: “SSC ঢাকা বোর্ড ২০১৭ সংশোধন। ৭,০০০ টাকা বলা হয়েছে, ৩,০০০ এডভান্স দিবে।”"
            rows={3}
            className={`w-full py-2 px-3 rounded-xl text-sm border focus:outline-none focus:ring-1 transition-all ${
              isDarkMode 
                ? 'bg-slate-950 border-slate-800 text-slate-100 focus:ring-indigo-500 focus:border-indigo-500' 
                : 'bg-white border-slate-200 text-slate-800 focus:ring-indigo-600 focus:border-indigo-600'
            }`}
          />
        </div>

        {/* কাজের ডেলিভারি স্ট্যাটাস (ফাইল এডিটের সময় জরুরি কাজ) */}
        {editRecord && (
          <div className={`p-4 rounded-2xl border ${
            isDarkMode ? 'bg-slate-950/20 border-slate-850' : 'bg-slate-50 border-slate-150'
          }`}>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-450 mb-1">
              ডেলিভারি ড্যাশবোর্ড স্ট্যাটাস
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setWorkStatus('Pending')}
                className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold cursor-pointer border text-center transition-all ${
                  workStatus === 'Pending'
                    ? 'bg-amber-500 text-white border-amber-500'
                    : isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
                }`}
              >
                চলতি কাজ (Pending)
              </button>
              <button
                type="button"
                onClick={() => setWorkStatus('Complete')}
                className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold cursor-pointer border text-center transition-all ${
                  workStatus === 'Complete'
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
                }`}
              >
                ডেলিভার্ড সম্পূর্ণ (Complete)
              </button>
            </div>
          </div>
        )}

        {/* অ্যাকশন বাটনসমূহ */}
        <div className="flex gap-2 pt-2 justify-end">
          <button
            type="button"
            onClick={resetForm}
            className={`py-2 px-4 text-xs font-semibold rounded-xl cursor-pointer transition-all border ${
              isDarkMode
                ? 'bg-slate-950 border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-100'
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600'
            }`}
          >
            ফর্মের লেখা মুছুন
          </button>
          
          <button
            type="submit"
            className={`py-2.5 px-6 text-xs font-bold rounded-xl cursor-pointer text-white shadow-md active:scale-98 transition-all flex items-center justify-center gap-1.5 ${
              editRecord 
                ? 'bg-indigo-600 hover:bg-indigo-700' 
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <Save className="w-4 h-4" />
            {editRecord ? 'কাস্টমার ডাটা আপডেট করুন' : 'নতুন ফাইল সেভ করুন'}
          </button>
        </div>
      </form>
    </div>
  );
}
