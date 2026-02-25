export type CardTheme =
  | 'slate'
  | 'blue'
  | 'emerald'
  | 'rose'
  | 'amber'
  | 'indigo'
  | 'purple';

export type CardNetwork = 'VISA' | 'Mastercard' | 'JCB' | 'American Express' | 'Other';

export interface Transaction {
  id: string;
  amount: number;
  date: number; // timestamp
  description?: string;
}

export interface Subscription {
  id: string;
  name: string;    // 如 "Netflix"、"NSO會員"
  amount: number;  // 月費金額
}

export interface PaymentCheck {
  month: string;   // 帳單週期 key（如 "2026-02-06"），依結帳日計算，用於判斷是否需要自動重置
  checked: boolean; // 是否已繳款 / 戶頭已備妥金額
}

export interface CreditCard {
  id: string;
  name: string;
  bankName: string;
  network?: CardNetwork;
  expiryDate: string; // MM/YY format
  statementDate: number; // 1-31
  dueDate: number; // 1-31
  creditLimit?: number; // 信用額度
  rewardsInfo: string;
  rewardCap: string;
  applicableChannels?: string;
  annualFeeCondition: string;
  theme: CardTheme;
  backgroundImage?: string; // 自訂卡面圖片 (Base64)
  createdAt: number;
  transactions?: Transaction[]; // 消費紀錄陣列
  subscriptions?: Subscription[]; // 固定訂閱扣款
  paymentCheck?: PaymentCheck;     // 繳款確認狀態（每月自動重置）
}

export type ViewState =
  | { type: 'LIST' }
  | { type: 'ADD' }
  | { type: 'EDIT'; cardId: string }
  | { type: 'DETAIL'; cardId: string };
