/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CustomerRecord, AppSettings } from '../types';
import { firebaseDb } from './firebaseDb';

// সিকিউর স্টোরেজ কী-সমূহ
const CUSTOMERS_KEY = 'cert_tracker_customers';
const SETTINGS_KEY = 'cert_tracker_settings';

// সিম্পল সিকিউরিটি ইনক্রিপশন কী এবং মেথড
// কাস্টমারের সংবেদনশীল তথ্য লেকাল স্টোরেজে এনক্রিপ্ট করে রাখার জন্য সিম্পল শিফটিং হাইব্রিড সাইফার
const ENCRYPTION_KEY = 42; // XOR বীজ

function encrypt(text: string): string {
  try {
    const encoded = encodeURIComponent(text);
    let result = '';
    for (let i = 0; i < encoded.length; i++) {
      result += String.fromCharCode(encoded.charCodeAt(i) ^ ENCRYPTION_KEY);
    }
    return btoa(result);
  } catch (e) {
    return text; // সাইলেন্ট ফলব্যাক
  }
}

function decrypt(text: string): string {
  try {
    const raw = atob(text);
    let result = '';
    for (let i = 0; i < raw.length; i++) {
      result += String.fromCharCode(raw.charCodeAt(i) ^ ENCRYPTION_KEY);
    }
    return decodeURIComponent(result);
  } catch (e) {
    return text; // সাইলেন্ট ফলব্যাক
  }
}

// ডিফল্ট পাসওয়ার্ড: "1234" (সিম্পল ক্লিপার হিসেবে স্টোর করা)
const DEFAULT_PASS_HASH = encrypt('1234');

const DEFAULT_SETTINGS: AppSettings = {
  adminPasswordHash: DEFAULT_PASS_HASH,
  theme: 'light',
  biometricReady: true
};

// প্রাথমিক ডেমো ডেটা কাস্টমারদের জন্য (প্রিস্টিন ক্লিন স্টার্ট এর জন্য ফাকা রাখা হলো)
const DEMO_CUSTOMERS: CustomerRecord[] = [];

export const localDb = {
  // ১। অ্যাপ সম্বলিত সেটিংস ও পাসওয়ার্ড রিট্রিভ করা
  getSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (!stored) {
        // নতুন হলে ডিফল্ট রিটার্ন এবং সেভ করা
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
        return DEFAULT_SETTINGS;
      }
      return JSON.parse(stored) as AppSettings;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  },

  // ২। সেটিংস পরিবর্তন বা সেভ করা
  saveSettings(settings: AppSettings): boolean {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (e) {
      console.error('সেটিংস সেভ করতে ব্যর্থ হয়েছে:', e);
      return false;
    }
  },

  // ৩। পাসওয়ার্ড ম্যাচিং চেক করা
  verifyPassword(inputPassword: string): boolean {
    const settings = this.getSettings();
    const verified = settings.adminPasswordHash === encrypt(inputPassword);
    return verified;
  },

  // ৪। পাসওয়ার্ড পরিবর্তন করা
  changePassword(oldPassword: string, newPassword: string): { success: boolean; message: string } {
    if (!this.verifyPassword(oldPassword)) {
      return { success: false, message: 'বর্তমান পাসওয়ার্ডটি সঠিক নয়!' };
    }
    if (newPassword.trim().length < 4) {
      return { success: false, message: 'নতুন পাসওয়ার্ডটি কমপক্ষে ৪ অক্ষরের হতে হবে।' };
    }

    const settings = this.getSettings();
    settings.adminPasswordHash = encrypt(newPassword);
    this.saveSettings(settings);
    return { success: true, message: 'অ্যাডমিন পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে।' };
  },

  // ৫। কাস্টমার তথ্য রিট্রিভ করা (এনক্রিপ্টেড ডাটা ডিক্রিপ্ট করা)
  getCustomers(): CustomerRecord[] {
    try {
      const stored = localStorage.getItem(CUSTOMERS_KEY);
      if (!stored) {
        // নতুন কাস্টমারস শুরু করতে ড্র ডিফল্ট ফাকা রাখা হলো
        this.saveCustomers([]);
        return [];
      }

      const encryptedData = JSON.parse(stored) as string[];
      const customers = encryptedData.map((encString) => {
        try {
          const decString = decrypt(encString);
          return JSON.parse(decString) as CustomerRecord;
        } catch {
          return null;
        }
      }).filter((c): c is CustomerRecord => c !== null);

      // ১00% প্রিস্টিন ডেটা এনসিওর করতে যেকোনো ডেমো বা মক ডাটা ফিল্টার করা
      const cleanCustomers = customers.filter((c) => {
        if (!c || !c.id) return false;
        // ডেমো আইডি বাদ দিন
        if (c.id.includes('demo') || c.id.startsWith('demo-')) return false;
        // আগের ডেমো ৪ জনের কাস্টমার নাম বাদ দিন
        const demoNames = ['সাখাওয়াত হোসেন', 'মো: আব্দুর রহমান', 'মোসাম্মৎ আয়েশা আক্তার', 'সাকিব আল হাসান', 'সাখাওয়াত'];
        if (demoNames.some(name => c.name.includes(name))) return false;
        return true;
      });

      // যদি ডেমো কাস্টমার পাওয়া যায় তবে ডেটাবেস সিঙ্ক করুন
      if (cleanCustomers.length < customers.length) {
        this.saveCustomers(cleanCustomers);
      }

      return cleanCustomers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // লেটেস্ট ডাবল চেক

    } catch (e) {
      console.error('কাস্টমার ডেটা ডিক্রিপশন বা লোডিং ব্যর্থ:', e);
      return [];
    }
  },

  // ৬। সব কাস্টমার একসাথে সেভ করা (এনক্রিপ্ট করে)
  saveCustomers(records: CustomerRecord[]): boolean {
    try {
      const encryptedList = records.map((record) => {
        const jsonRecord = JSON.stringify(record);
        return encrypt(jsonRecord);
      });
      localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(encryptedList));
      return true;
    } catch (e) {
      console.error('কাস্টমার ডেটা ইনক্রিপ্ট বা সেভ ব্যর্থ:', e);
      return false;
    }
  },

  // ৭। কাস্টমার নতুন রেকর্ড যোগ করা
  addCustomer(record: Omit<CustomerRecord, 'id' | 'createdAt' | 'dateString' | 'timeString' | 'lastUpdated'>): CustomerRecord {
    const customers = this.getCustomers();
    const now = new Date();
    
    // অটো ফর্ম্যাটের ডেটটাইম ও আইডি তৈরি করা
    const newRecord: CustomerRecord = {
      ...record,
      id: `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: now.toISOString(),
      dateString: now.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' }),
      timeString: now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', hour12: true }),
      lastUpdated: now.toISOString()
    };

    customers.unshift(newRecord); // সামনে পুশ করা যাতে ড্যাশবোর্ডে প্রথমে আসে
    this.saveCustomers(customers);

    // অটো ক্লাউড সিনক্রোনাইজেশন
    firebaseDb.saveCustomerToCloud(newRecord).catch((err) => {
      console.warn('Silent add sync background issue:', err);
    });

    return newRecord;
  },

  // ৮। কাস্টমার রেকর্ড আপডেট করা
  updateCustomer(id: string, updatedFields: Partial<Omit<CustomerRecord, 'id' | 'createdAt' | 'dateString' | 'timeString'>>): boolean {
    const customers = this.getCustomers();
    const index = customers.findIndex((c) => c.id === id);
    if (index === -1) return false;

    // নতুন আপডেট ডেট সম্বলিত আপডেট
    customers[index] = {
      ...customers[index],
      ...updatedFields,
      due: (updatedFields.totalPrice !== undefined && updatedFields.advance !== undefined) 
        ? (updatedFields.totalPrice - updatedFields.advance) 
        : (updatedFields.totalPrice !== undefined ? updatedFields.totalPrice - customers[index].advance : (updatedFields.advance !== undefined ? customers[index].totalPrice - updatedFields.advance : customers[index].due)),
      lastUpdated: new Date().toISOString()
    };
    
    // পেমেন্ট স্ট্যাটাস অটো-ক্যালকুলেশন যদি চেঞ্জড হয়
    const updatedRecord = customers[index];
    if (updatedRecord.due === 0) {
      updatedRecord.paymentStatus = 'Paid';
    } else if (updatedRecord.advance > 0) {
      updatedRecord.paymentStatus = 'Partial';
    } else {
      updatedRecord.paymentStatus = 'Unpaid';
    }

    this.saveCustomers(customers);

    // অটো ক্লাউড সিনক্রোনাইজেশন
    firebaseDb.saveCustomerToCloud(updatedRecord).catch((err) => {
      console.warn('Silent update sync background issue:', err);
    });

    return true;
  },

  // ৯। কাস্টমার রেকর্ড ডিলিট করা
  deleteCustomer(id: string): boolean {
    const customers = this.getCustomers();
    const filtered = customers.filter((c) => c.id !== id);
    if (filtered.length === customers.length) return false;
    this.saveCustomers(filtered);

    // অটো ক্লাউড সিনক্রোনাইজেশন
    firebaseDb.deleteCustomerFromCloud(id).catch((err) => {
      console.warn('Silent delete sync background issue:', err);
    });

    return true;
  },

  // ১০। সম্পূর্ণ ডেটাবেস রিসেট করা (পাসওয়ার্ড ছাড়া সব ক্লিয়ার হবে)
  resetDatabase(adminPasswordInput: string): boolean {
    if (!this.verifyPassword(adminPasswordInput)) {
      return false;
    }
    localStorage.removeItem(CUSTOMERS_KEY);
    // লোড ডেমো কাস্টমারস সেভ
    this.saveCustomers([]);
    return true;
  },

  // ১১। ব্যাকআপ এক্সপোর্ট (JSON-এ ডাউনলোডের উপযোগী স্ট্রিং রিটার্ন দিবে)
  exportBackup(): string {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      customers: this.getCustomers(),
      settings: this.getSettings()
    };
    return JSON.stringify(data, null, 2);
  },

  // ১২। ব্যাকআপ ইমপোর্ট (ভ্যালিডেশন সহ)
  importBackup(backupJsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(backupJsonString);
      if (!parsed || !Array.isArray(parsed.customers)) {
        return { success: false, message: 'অকার্যকর ব্যাকআপ ফাইল! কাস্টমার তালিকার ডাটা ফরম্যাট সঠিক নয়।' };
      }

      // ইমপোর্ট ডেটা মার্জ বা ওভাররাইট করা
      const currentCustomers = this.getCustomers();
      const importedCustomers = parsed.customers as CustomerRecord[];
      
      // ডুপ্লিকেট রিডাকশন ওভারঅলআইডি ম্যাচিং করে ইউনিক মার্জ
      const mergedMap = new Map<string, CustomerRecord>();
      currentCustomers.forEach(c => mergedMap.set(c.id, c));
      importedCustomers.forEach(c => mergedMap.set(c.id, c));
      const mergedList = Array.from(mergedMap.values());

      this.saveCustomers(mergedList);

      if (parsed.settings) {
        const currentSettings = this.getSettings();
        this.saveSettings({
          ...currentSettings,
          ...parsed.settings,
          adminPasswordHash: currentSettings.adminPasswordHash // অ্যাডমিনের কারেন্ট পাসওয়ার্ড বহাল রাখা সুরক্ষার স্বার্থে
        });
      }

      return { 
        success: true, 
        message: `সফলভাবে ব্যাকআপ রি-স্টোর হয়েছে। মোট ${importedCustomers.length} টি কাস্টমার রেকর্ড সনাক্ত ও মার্জ করা হয়েছে।` 
      };
    } catch (e) {
      return { success: false, message: 'ব্যাকআপ ফাইলটি পার্স করতে ভুল হয়েছে: ' + (e as Error).message };
    }
  }
};
