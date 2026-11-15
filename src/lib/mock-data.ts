import { Profile, Transaction, Expense, Asset, FundSummary } from '@/types/database';

export const INITIAL_MEMBERS: (Profile & { pin_code: string })[] = [
  { id: 'c0000000-0000-0000-0000-000000000001', full_name: 'محمد حسن قديل (مدير الجمعية)', role: 'admin', phone: null, pin_code: '7391', created_at: '2026-01-01' },
  { id: 'c0000000-0000-0000-0000-000000000002', full_name: 'عبدو سبب', role: 'member', phone: null, pin_code: '4826', created_at: '2026-01-01' },
  { id: 'c0000000-0000-0000-0000-000000000003', full_name: 'علم الدين مبارك', role: 'member', phone: null, pin_code: '6159', created_at: '2026-01-01' },
  { id: 'c0000000-0000-0000-0000-000000000004', full_name: 'متوكل حاتم', role: 'member', phone: null, pin_code: '2947', created_at: '2026-01-01' },
  { id: 'c0000000-0000-0000-0000-000000000005', full_name: 'حسن علي', role: 'member', phone: null, pin_code: '8314', created_at: '2026-01-01' },
  { id: 'c0000000-0000-0000-0000-000000000006', full_name: 'وليد شيبة', role: 'member', phone: null, pin_code: '5762', created_at: '2026-01-01' },
  { id: 'c0000000-0000-0000-0000-000000000007', full_name: 'عبد السلام', role: 'member', phone: null, pin_code: '3485', created_at: '2026-01-01' },
  { id: 'c0000000-0000-0000-0000-000000000008', full_name: 'عبد الباسط', role: 'member', phone: null, pin_code: '9173', created_at: '2026-01-01' },
  { id: 'c0000000-0000-0000-0000-000000000009', full_name: 'أحمدتقلاوي', role: 'member', phone: null, pin_code: '1648', created_at: '2026-01-01' },
  { id: 'c0000000-0000-0000-0000-000000000010', full_name: 'بكري شلقي', role: 'member', phone: null, pin_code: '5029', created_at: '2026-01-01' },
  { id: 'c0000000-0000-0000-0000-000000000011', full_name: 'نور الدين تاور', role: 'member', phone: null, pin_code: '8461', created_at: '2026-01-01' },
  { id: 'c0000000-0000-0000-0000-000000000012', full_name: 'امجد اب صرة', role: 'member', phone: null, pin_code: '2735', created_at: '2026-01-01' },
  { id: 'c0000000-0000-0000-0000-000000000013', full_name: 'اوركيشن', role: 'member', phone: null, pin_code: '6914', created_at: '2026-01-01' },
  { id: 'c0000000-0000-0000-0000-000000000014', full_name: 'محمد يعقوب', role: 'member', phone: null, pin_code: '3852', created_at: '2026-01-01' },
  { id: 'c0000000-0000-0000-0000-000000000015', full_name: 'ود الكي بي', role: 'member', phone: null, pin_code: '7548', created_at: '2026-01-01' },
  { id: 'c0000000-0000-0000-0000-000000000016', full_name: 'محمد ارباب', role: 'member', phone: null, pin_code: '1926', created_at: '2026-01-01' },
  { id: 'c0000000-0000-0000-0000-000000000017', full_name: 'عمر بوي', role: 'member', phone: null, pin_code: '4607', created_at: '2026-01-01' },
  { id: 'c0000000-0000-0000-0000-000000000018', full_name: 'جدو الخير', role: 'member', phone: null, pin_code: '9382', created_at: '2026-01-01' },
  { id: 'c0000000-0000-0000-0000-000000000019', full_name: 'على عبد العاطي', role: 'member', phone: null, pin_code: '5193', created_at: '2026-01-01' },
  { id: 'c0000000-0000-0000-0000-000000000020', full_name: 'فتاح', role: 'member', phone: null, pin_code: '2478', created_at: '2026-01-01' },
  { id: 'c0000000-0000-0000-0000-000000000021', full_name: 'فاروق', role: 'member', phone: null, pin_code: '8036', created_at: '2026-01-01' },
  { id: 'c0000000-0000-0000-0000-000000000022', full_name: 'عمر شمو', role: 'member', phone: null, pin_code: '6571', created_at: '2026-01-01' },
  { id: 'c0000000-0000-0000-0000-000000000023', full_name: 'الطيب كوكس', role: 'member', phone: null, pin_code: '3164', created_at: '2026-01-01' },
  { id: 'c0000000-0000-0000-0000-000000000024', full_name: 'احمد الربع', role: 'member', phone: null, pin_code: '7829', created_at: '2026-01-01' },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_ASSETS: Asset[] = [];

export function calculateSummary(
  transactions: Transaction[],
  expenses: Expense[],
  totalMembers: number = INITIAL_MEMBERS.filter((m) => m.role === 'member').length
): FundSummary {
  const approved = transactions.filter((t) => t.status === 'approved');
  const totalIncome = approved.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const currentMonthTransactions = approved.filter((t) => t.payment_month?.startsWith('2026-11'));
  const uniquePaidUserIds = new Set(currentMonthTransactions.map((t) => t.user_id));
  const paidCount = uniquePaidUserIds.size;

  return {
    total_income: totalIncome,
    total_expenses: totalExpenses,
    balance: totalIncome - totalExpenses,
    total_members: totalMembers,
    paid_members_count: paidCount,
    unpaid_members_count: Math.max(0, totalMembers - paidCount),
    current_month: '2026-11-01',
  };
}
