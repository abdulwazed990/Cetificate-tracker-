/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// কাস্টমার ক্যাটাগরি ও বোর্ড সম্পর্কিত এনাম এবং টাইপসমূহ
export type CategoryType = 'A' | 'B';

export const BOARDS_A = [
  'ঢাকা বোর্ড',
  'চট্টগ্রাম বোর্ড',
  'রাজশাহী বোর্ড',
  'কুমিল্লা বোর্ড',
  'যশোর বোর্ড',
  'বরিশাল বোর্ড',
  'সিলেট বোর্ড',
  'দিনাজপুর বোর্ড',
  'মাদ্রাসা বোর্ড',
  'কারিগরি বোর্ড'
] as const;

export const BOARDS_B = [
  'বাংলাদেশ ইনস্টিটিউট অফ স্কিল ডেভেলপমেন্ট (BISD)'
] as const;

export const EXAM_TYPES = [
  'SSC',
  'HSC',
  'Diploma',
  'JSC',
  'Equivalent'
] as const;

export const GROUPS = [
  'Science',
  'Business Studies',
  'Humanities',
  'Vocational'
] as const;

export const WORK_TYPES = [
  'নতুন সার্টিফিকেট',
  'সংশোধন',
  'রেজাল্ট পরিবর্তন',
  'নাম সংশোধন',
  'বয়স সংশোধন',
  'মার্কশিট',
  'সার্টিফিকেট কপি',
  'বোর্ড ভেরিফিকেশন',
  'GPA আপডেট',
  'অন্যান্য'
] as const;

export const ADDITIONAL_OPTIONS = [
  'নতুন করে করা',
  'সংশোধন',
  'রেজাল্ট পরিবর্তন',
  'Duplicate Copy'
] as const;

export type PaymentStatus = 'Paid' | 'Partial' | 'Unpaid';
export type WorkStatus = 'Pending' | 'Complete';

// কাস্টমার রেকর্ডের ইন্টারফেস
export interface CustomerRecord {
  id: string; // ইউনিক আইডি
  name: string; // কাস্টমারের নাম
  phone: string; // ফোন নাম্বার (Required)
  whatsapp?: string; // হোয়াটসঅ্যাপ নাম্বার (Optional)
  address?: string; // ঠিকানা (Optional)
  createdAt: string; // ডেটটাইম ISO স্ট্রিং
  dateString: string; // তারিখ স্ট্রিং (readable format)
  timeString: string; // সময় স্ট্রিং
  category: CategoryType; // ক্যাটাগরি (A / B)
  board: string; // নির্বাচিত বোর্ড / BISD
  examType: typeof EXAM_TYPES[number] | ''; // পরীক্ষা
  groupType: typeof GROUPS[number] | ''; // গ্রুপ
  workType: typeof WORK_TYPES[number] | ''; // কাজের ধরন
  year: number; // সাল (১9৯০ - বর্তমান)
  additionalOptions: string[]; // অতিরিক্ত অপশনসমূহ (মাল্টি-সিলেক্ট)
  urgentDelivery: boolean; // জরুরি ডেলিভারি
  totalPrice: number; // মোট টাকা
  advance: number; // অগ্রিম টাকা
  due: number; // বাকি টাকা
  paymentStatus: PaymentStatus; // পেমেন্ট স্ট্যাটাস
  notes: string; // লাস্ট কনভারসেশন / নোট
  workStatus: WorkStatus; // কাজের স্ট্যাটাস (Pending / Complete)
  lastUpdated: string; // সর্বশেষ আপডেটের সময়
}

// অ্যাপ সেটিংস ও সিকিউরিটি ইন্টারফেস
export interface AppSettings {
  adminPasswordHash: string; // এনক্রিপ্টেড বা সিম্পল হ্যাশ পাসওয়ার্ড
  theme: 'light' | 'dark'; // লাইট অথবা ডার্ক থিম
  biometricReady: boolean; // বায়োমেট্রিক লগইন স্ট্রাকচার এনাবেল মোড
}

// রিপোর্ট ড্যাশবোর্ড ইন্টারফেস
export interface ReportSummary {
  totalCustomersToday: number;
  totalCustomersThisMonth: number;
  pendingJobs: number;
  completedJobs: number;
  totalDueAmount: number;
  totalIncome: number;
  advanceReceived: number;
}
