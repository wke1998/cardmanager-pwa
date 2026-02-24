import React from 'react';
import { CreditCard, CardTheme, CardNetwork } from '../types';
import { getCurrentCycleStartDate } from '../utils';

interface Props {
  card: CreditCard;
  onClick?: () => void;
}

// 預設的深色系高級金屬/寶石質感漸層 (若無圖片時的退路)
const themeGradients: Record<CardTheme, string> = {
  slate: 'from-gray-800 via-gray-900 to-black',
  blue: 'from-slate-800 via-blue-900 to-black',
  emerald: 'from-gray-800 via-emerald-900 to-black',
  rose: 'from-gray-800 via-rose-900 to-black',
  amber: 'from-gray-800 via-amber-900 to-black',
  indigo: 'from-slate-800 via-indigo-900 to-black',
  purple: 'from-gray-800 via-purple-900 to-black',
};

const NetworkLogo = ({ network }: { network?: CardNetwork }) => {
  if (!network || network === 'Other') return null;

  switch (network) {
    case 'VISA':
      return <div className="italic font-bold text-3xl tracking-tighter select-none text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">VISA</div>;
    case 'Mastercard':
      return (
        <div className="flex -space-x-3 items-center opacity-90 select-none drop-shadow-md">
          <div className="w-9 h-9 rounded-full bg-[#ff5f00] z-10 opacity-90"></div>
          <div className="w-9 h-9 rounded-full bg-[#eb001b] -ml-4 z-0"></div>
          <div className="w-9 h-9 rounded-full bg-[#f79e1b] -ml-4 z-20 mix-blend-screen opacity-80"></div>
        </div>
      );
    case 'JCB':
      return (
        <div className="flex gap-0.5 items-center select-none drop-shadow-md opacity-90">
          <div className="bg-blue-600 px-2 py-0.5 rounded-sm"><span className="text-white text-sm font-bold leading-none">J</span></div>
          <div className="bg-red-600 px-2 py-0.5 rounded-sm"><span className="text-white text-sm font-bold leading-none">C</span></div>
          <div className="bg-green-600 px-2 py-0.5 rounded-sm"><span className="text-white text-sm font-bold leading-none">B</span></div>
        </div>
      );
    case 'American Express':
      return (
        <div className="bg-blue-400/20 backdrop-blur-sm border border-blue-200/30 px-2 py-1.5 rounded select-none drop-shadow-md">
          <div className="text-[10px] font-bold text-white uppercase leading-none tracking-wider text-center w-12 break-words">
            AMEX
          </div>
        </div>
      );
    default:
      return null;
  }
};

export const CreditCardVisual: React.FC<Props> = ({ card, onClick }) => {
  const gradient = themeGradients[card.theme] || themeGradients.slate;

  // 計算本期累積消費（含訂閱）
  const startDate = getCurrentCycleStartDate(card.statementDate);
  const currentTransactions = (card.transactions || []).filter(t => t.date >= startDate.getTime());
  const transactionTotal = currentTransactions.reduce((sum, t) => sum + t.amount, 0);
  const subscriptionTotal = (card.subscriptions || []).reduce((sum, s) => sum + s.amount, 0);
  const currentTotal = transactionTotal + subscriptionTotal;

  return (
    <div
      onClick={onClick}
      className={`relative w-full max-w-lg mx-auto aspect-[1.586/1] rounded-[20px] p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] overflow-hidden cursor-pointer active:scale-[0.97] transition-all duration-300 border border-white/10 ${card.backgroundImage ? 'bg-gray-900' : `bg-gradient-to-br ${gradient}`}`}
    >
      {/* 處理自訂圖片背景 */}
      {card.backgroundImage && (
        <>
          <img
            src={card.backgroundImage}
            alt="Card Background"
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
          {/* 強力陰影遮罩，確保不論圖片多白，文字都看得清楚 */}
          <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/90 via-black/40 to-black/70 mix-blend-multiply"></div>
          <div className="absolute inset-0 z-0 bg-black/20"></div>
        </>
      )}

      {/* 光澤與反光效果 (如果沒有自訂圖片才明顯顯示) */}
      {!card.backgroundImage && (
        <>
          <div className="absolute top-0 right-0 bottom-0 left-0 bg-gradient-to-tr from-white/5 via-white/10 to-transparent opacity-40 pointer-events-none mix-blend-overlay"></div>
          <div className="absolute -inset-[100%] top-[-50%] rotate-45 bg-gradient-to-b from-transparent via-white/5 to-transparent w-[200%] h-[50%] pointer-events-none"></div>
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-white/10 blur-[60px] pointer-events-none mix-blend-screen"></div>
        </>
      )}

      <div className="flex flex-col h-full justify-between relative z-10 text-white">

        {/* 頂部：銀行名稱與本期累積金額 */}
        <div className="flex justify-between items-start">
          <p className="text-lg sm:text-xl font-medium tracking-wider text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] truncate max-w-[60%]">{card.bankName}</p>

          <div className="flex flex-col items-end">
            <span className="text-[9px] sm:text-[10px] tracking-widest text-white/70 mb-0.5 uppercase drop-shadow-md">本期累積</span>
            <span className="font-mono text-base sm:text-lg font-bold leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-white/95">
              ${currentTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 中間：晶片與卡片名稱 - 使用 flex-1 來動態調整垂直間距 */}
        <div className="flex flex-col flex-1 justify-center py-2">
          <div className="w-11 h-8 bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 rounded-[4px] border border-yellow-700/50 flex items-center justify-center mb-3 shadow-md relative overflow-hidden opacity-90">
            <div className="absolute inset-0 border-[0.5px] border-black/20 rounded-[4px]"></div>
            <div className="w-full h-[0.5px] bg-black/20 absolute top-1/2"></div>
            <div className="w-[0.5px] h-full bg-black/20 absolute left-1/3"></div>
            <div className="w-[0.5px] h-full bg-black/20 absolute right-1/3"></div>
            <div className="w-6 h-4 border-[0.5px] border-black/30 rounded-sm bg-gradient-to-br from-yellow-300 to-yellow-500 z-10"></div>
          </div>

          <h3 className="text-3xl sm:text-4xl font-bold tracking-widest drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] truncate text-white/95">
            {card.name}
          </h3>
        </div>

        {/* 底部：日期資訊與品牌 Logo */}
        <div className="flex justify-between items-end mb-1">
          <div className="flex gap-6 sm:gap-8">
            <div className="flex flex-col">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/70 mb-0.5 drop-shadow-md">結帳日</span>
              <span className="font-mono text-xl sm:text-2xl font-medium leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{card.statementDate} <span className="text-sm font-sans text-white/80">日</span></span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/70 mb-0.5 drop-shadow-md">繳款日</span>
              <span className="font-mono text-xl sm:text-2xl font-medium leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{card.dueDate} <span className="text-sm font-sans text-white/80">日</span></span>
            </div>
          </div>

          <div className="flex flex-col items-end pb-0.5 shrink-0 pl-2">
            <NetworkLogo network={card.network} />
          </div>
        </div>
      </div>
    </div>
  );
};
