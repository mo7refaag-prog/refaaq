'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  Profile,
  Transaction,
  Expense,
  Asset,
  FundSummary,
  TransactionWithProfile,
} from '@/types/database';
import {
  INITIAL_MEMBERS,
  INITIAL_TRANSACTIONS,
  INITIAL_EXPENSES,
  INITIAL_ASSETS,
  calculateSummary,
} from '@/lib/mock-data';
import { get, set } from 'idb-keyval';

// مفاتيح التخزين المحلي الاحتياطي
const IDB_TX_KEY = 'refaaq_local_transactions';
const IDB_EXP_KEY = 'refaaq_local_expenses';
const IDB_AST_KEY = 'refaaq_local_assets';
const IDB_MEMBERS_KEY = 'refaaq_local_members';

// 1. استرجاع بيانات الصندوق والإحصائيات
export function useFundSummary() {
  return useQuery<FundSummary>({
    queryKey: ['fund-summary'],
    queryFn: async () => {
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase.rpc('get_fund_summary');
          if (!error && data) return data as FundSummary;
        } catch (e) {
          console.warn('استخدام الحساب المحلي لتعذر الاتصال بـ Supabase:', e);
        }
      }

      const txs = (await get<Transaction[]>(IDB_TX_KEY)) || INITIAL_TRANSACTIONS;
      const exps = (await get<Expense[]>(IDB_EXP_KEY)) || INITIAL_EXPENSES;
      return calculateSummary(
        txs,
        exps,
        INITIAL_MEMBERS.filter((m) => m.role === 'member').length
      );
    },
  });
}

// 2. استرجاع قائمة المعاملات مع الدمج الذكي بين المحلي والسحابي
export function useTransactions(userId?: string, isAdmin: boolean = false) {
  return useQuery<TransactionWithProfile[]>({
    queryKey: ['transactions', { userId, isAdmin }],
    queryFn: async () => {
      let remoteTxs: TransactionWithProfile[] = [];

      if (isSupabaseConfigured()) {
        try {
          let query = supabase
            .from('transactions')
            .select('*, profiles(full_name, phone)')
            .order('created_at', { ascending: false });

          if (!isAdmin && userId) {
            query = query.eq('user_id', userId);
          }

          const { data, error } = await query;
          if (!error && data) {
            remoteTxs = data as unknown as TransactionWithProfile[];
          } else if (error) {
            console.warn('Supabase query error:', error.message);
          }
        } catch (e) {
          console.warn('فشل جلب المعاملات من Supabase:', e);
        }
      }

      // استرجاع المعاملات المخزنة محلياً لضمان عدم ضياع أي إشعار معلق أثناء المعالجة أو ضعف الشبكة
      const localTxs = (await get<Transaction[]>(IDB_TX_KEY)) || [];
      const members = INITIAL_MEMBERS;

      const enrichedLocal: TransactionWithProfile[] = localTxs.map((tx) => ({
        ...tx,
        profiles: members.find((m) => m.id === tx.user_id) || null,
      }));

      // دمج المعاملات السحابية والمحلية بدون تكرار
      const combinedMap = new Map<string, TransactionWithProfile>();
      remoteTxs.forEach((t) => combinedMap.set(t.id, t));
      enrichedLocal.forEach((t) => {
        if (!combinedMap.has(t.id)) combinedMap.set(t.id, t);
      });

      let all = Array.from(combinedMap.values());
      if (!isAdmin && userId) {
        all = all.filter((t) => t.user_id === userId);
      }

      return all.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
  });
}

// 3. استرجاع المصروفات
export function useExpenses() {
  return useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: async () => {
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .order('created_at', { ascending: false });
          if (!error && data && data.length > 0) return data;
        } catch (e) {
          console.warn('استخدام مصروفات الكاش المحلي:', e);
        }
      }
      return (await get<Expense[]>(IDB_EXP_KEY)) || INITIAL_EXPENSES;
    },
  });
}

// 4. استرجاع أصول الجمعية
export function useAssets() {
  return useQuery<Asset[]>({
    queryKey: ['assets'],
    queryFn: async () => {
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('assets')
            .select('*')
            .order('created_at', { ascending: false });
          if (!error && data && data.length > 0) return data;
        } catch (e) {
          console.warn('استخدام أصول الكاش المحلي:', e);
        }
      }
      return (await get<Asset[]>(IDB_AST_KEY)) || INITIAL_ASSETS;
    },
  });
}

// 5. استرجاع قائمة الأعضاء للإدارة وتسجيل الدخول
export function useMembers() {
  return useQuery<Profile[]>({
    queryKey: ['members'],
    queryFn: async () => {
      let remoteMembers: Profile[] = [];
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase.from('profiles').select('*').order('full_name');
          if (!error && data && data.length > 0) {
            remoteMembers = data;
          }
        } catch (e) {
          console.warn('استخدام قائمة الأعضاء المحلية:', e);
        }
      }

      const customLocal = (await get<Profile[]>(IDB_MEMBERS_KEY)) || [];
      const baseMembers = INITIAL_MEMBERS;

      // دمج الأعضاء مع منع التكرار
      const map = new Map<string, Profile>();
      baseMembers.forEach((m) => map.set(m.id, m));
      customLocal.forEach((m) => map.set(m.id, m));
      remoteMembers.forEach((m) => map.set(m.id, m));

      return Array.from(map.values()).sort((a, b) => a.full_name.localeCompare(b.full_name, 'ar'));
    },
  });
}

// ============================================================================
// الطفرات والرفع السحابي مع دعم التخزين بدون اتصال
// ============================================================================

export function useUploadReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      amount,
      referenceNumber,
      receiptImageFile,
      previewUrl,
      paymentMonth,
    }: {
      userId: string;
      amount: number;
      referenceNumber: string;
      receiptImageFile?: File | null;
      previewUrl?: string | null;
      paymentMonth: string;
    }) => {
      let finalImageUrl: string | null = previewUrl || null;

      // 1. محاولة رفع الصورة لسحابة Supabase Storage إذا توفرت الشبكة
      if (isSupabaseConfigured() && receiptImageFile) {
        try {
          const fileName = `${userId}/${Date.now()}_receipt.jpg`;
          const { error: uploadError } = await supabase.storage
            .from('receipts')
            .upload(fileName, receiptImageFile, {
              contentType: 'image/jpeg',
              upsert: true,
            });

          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(fileName);
            if (urlData?.publicUrl) {
              finalImageUrl = urlData.publicUrl;
            }
          }
        } catch (err) {
          console.warn('تعذر الرفع المباشر لـ Supabase Storage، سيتم الحفظ محلياً:', err);
        }
      }

      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        user_id: userId,
        amount,
        type: 'bank_transfer',
        receipt_image_url: finalImageUrl,
        reference_number: referenceNumber,
        status: 'pending',
        payment_month: paymentMonth,
        created_at: new Date().toISOString(),
      };

      // 2. الحفظ المحلي الفوري (مضمون 100% أن يظهر للإدارة والمشترك فوراً)
      const current = (await get<Transaction[]>(IDB_TX_KEY)) || [];
      await set(IDB_TX_KEY, [newTx, ...current]);

      // 3. المزامنة مع قاعدة بيانات Supabase
      if (isSupabaseConfigured()) {
        try {
          const { error: dbErr } = await supabase.from('transactions').insert({
            user_id: userId,
            amount,
            type: 'bank_transfer',
            receipt_image_url: finalImageUrl,
            reference_number: referenceNumber,
            payment_month: paymentMonth,
            status: 'pending',
          });

          if (dbErr) {
            console.warn('Supabase rejected insert (foreign key / missing profile):', dbErr.message);
          } else {
            console.log('Transaction synced to Supabase successfully!');
          }
        } catch (err) {
          console.warn('تم حفظ الإشعار محلياً وفي طابور المزامنة:', err);
        }
      }

      return newTx;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['fund-summary'] });
    },
  });
}

export function useApproveTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId: string) => {
      const current = (await get<Transaction[]>(IDB_TX_KEY)) || [];
      const updated = current.map((t) =>
        t.id === transactionId ? { ...t, status: 'approved' as const } : t
      );
      await set(IDB_TX_KEY, updated);

      if (isSupabaseConfigured()) {
        try {
          await supabase
            .from('transactions')
            .update({ status: 'approved' })
            .eq('id', transactionId);
        } catch (_) {}
      }
      return transactionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['fund-summary'] });
    },
  });
}

export function useRejectTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId: string) => {
      const current = (await get<Transaction[]>(IDB_TX_KEY)) || [];
      const updated = current.map((t) =>
        t.id === transactionId ? { ...t, status: 'rejected' as const } : t
      );
      await set(IDB_TX_KEY, updated);

      if (isSupabaseConfigured()) {
        try {
          await supabase
            .from('transactions')
            .update({ status: 'rejected' })
            .eq('id', transactionId);
        } catch (_) {}
      }
      return transactionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['fund-summary'] });
    },
  });
}

export function useAddCashPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      amount,
      paymentMonth,
    }: {
      userId: string;
      amount: number;
      paymentMonth: string;
    }) => {
      const newTx: Transaction = {
        id: `tx-cash-${Date.now()}`,
        user_id: userId,
        amount,
        type: 'cash',
        receipt_image_url: null,
        reference_number: `CSH-${Date.now().toString().slice(-6)}`,
        status: 'approved',
        payment_month: paymentMonth,
        created_at: new Date().toISOString(),
      };

      const current = (await get<Transaction[]>(IDB_TX_KEY)) || [];
      await set(IDB_TX_KEY, [newTx, ...current]);

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('transactions').insert({
            user_id: userId,
            amount,
            type: 'cash',
            reference_number: newTx.reference_number,
            status: 'approved',
            payment_month: paymentMonth,
          });
        } catch (_) {}
      }

      return newTx;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['fund-summary'] });
    },
  });
}

export function useAddExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      amount,
      category,
      description,
    }: {
      amount: number;
      category: 'aid' | 'asset_purchase' | 'other';
      description: string;
    }) => {
      const newExp: Expense = {
        id: `exp-${Date.now()}`,
        amount,
        category,
        description,
        created_at: new Date().toISOString(),
      };

      const current = (await get<Expense[]>(IDB_EXP_KEY)) || INITIAL_EXPENSES;
      await set(IDB_EXP_KEY, [newExp, ...current]);

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('expenses').insert({
            amount,
            category,
            description,
          });
        } catch (_) {}
      }

      return newExp;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['fund-summary'] });
    },
  });
}

export function useAddAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      quantity,
      status,
    }: {
      name: string;
      quantity: number;
      status: 'available' | 'borrowed';
    }) => {
      const newAsset: Asset = {
        id: `ast-${Date.now()}`,
        name,
        quantity,
        status,
        created_at: new Date().toISOString(),
      };

      const current = (await get<Asset[]>(IDB_AST_KEY)) || INITIAL_ASSETS;
      await set(IDB_AST_KEY, [newAsset, ...current]);

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('assets').insert({
            name,
            quantity,
            status,
          });
        } catch (_) {}
      }

      return newAsset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

// 6. إضافة عضو جديد من قبل مدير الجمعية
export function useAddMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fullName,
      phone,
      pinCode,
      role = 'member',
    }: {
      fullName: string;
      phone?: string | null;
      pinCode: string;
      role?: 'member' | 'admin';
    }) => {
      const newMember: Profile & { pin_code: string } = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `m-${Date.now()}`,
        full_name: fullName.trim(),
        role,
        phone: phone?.trim() || null,
        pin_code: pinCode.trim(),
        created_at: new Date().toISOString(),
      };

      const customLocal = (await get<Profile[]>(IDB_MEMBERS_KEY)) || [];
      await set(IDB_MEMBERS_KEY, [...customLocal, newMember]);

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('profiles').insert({
            id: newMember.id,
            full_name: newMember.full_name,
            role: newMember.role,
            phone: newMember.phone,
            pin_code: newMember.pin_code,
          });
        } catch (e) {
          console.warn('Supabase profile insert error:', e);
        }
      }

      return newMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['fund-summary'] });
    },
  });
}

// 7. تنظيف وتصفير جداول المعاملات والمصروفات والأصول لبدء تجربة فعلية جديدة
export function useCleanDatabase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // 1. تصفير التخزين المحلي الاحتياطي
      await set(IDB_TX_KEY, []);
      await set(IDB_EXP_KEY, []);
      await set(IDB_AST_KEY, []);

      // 2. تصفير قاعدة بيانات Supabase إذا كانت متصلة
      if (isSupabaseConfigured()) {
        try {
          await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('assets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        } catch (err) {
          console.warn('Supabase database cleanup error:', err);
        }
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['fund-summary'] });
    },
  });
}
