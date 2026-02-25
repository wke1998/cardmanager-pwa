import React, { useState } from 'react';
import { CreditCard, CardTheme, CardNetwork } from '../types';
import { getCurrentCycleStartDate, getPreviousCycleStartDate } from '../utils';

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
  const [isFlipped, setIsFlipped] = useState(false);
  const gradient = themeGradients[card.theme] || themeGradients.slate;

  // 計算當前消費累積（含訂閱）
  const startDate = getCurrentCycleStartDate(card.statementDate);
  const currentTransactions = (card.transactions || []).filter(t => t.date >= startDate.getTime());
  const transactionTotal = currentTransactions.reduce((sum, t) => sum + t.amount, 0);
  const subscriptionTotal = (card.subscriptions || []).reduce((sum, s) => sum + s.amount, 0);
  const currentTotal = transactionTotal + subscriptionTotal;

  // 計算上期應繳金額
  const prevStartDate = getPreviousCycleStartDate(card.statementDate);
  const prevTransactions = (card.transactions || []).filter(t => t.date >= prevStartDate.getTime() && t.date < startDate.getTime());
  const prevTotal = prevTransactions.reduce((sum, t) => sum + t.amount, 0) + subscriptionTotal;

  const bgStyles = card.backgroundImage ? 'bg-gray-900' : `bg-gradient-to-br ${gradient}`;

  return (
    <div className="relative w-full max-w-lg mx-auto min-h-[220px] sm:min-h-[240px] [perspective:1500px] cursor-pointer group">
      <div
        className={`relative w-full h-full min-h-[220px] sm:min-h-[240px] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] rounded-[20px] transition-transform duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
      >

        {/* FRONT - 點擊正面翻轉到背面 */}
        <div
          onClick={() => setIsFlipped(true)}
          className={`relative w-full h-full min-h-[220px] sm:min-h-[240px] rounded-[20px] flex flex-col justify-between overflow-hidden [backface-visibility:hidden] ${isFlipped ? 'z-0 pointer-events-none' : 'z-10'} ${bgStyles}`}
        >
          {/* 處理自訂圖片背景 */}
          {card.backgroundImage && (
            <>
              <img
                src={card.backgroundImage}
                alt="Card Background"
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
              <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
            </>
          )}

          {/* 光澤與反光效果 (如果沒有自訂圖片才明顯顯示) */}
          {!card.backgroundImage && (
            <>
              <div className="absolute inset-0 z-0 top-0 right-0 bottom-0 left-0 bg-gradient-to-tr from-white/5 via-white/10 to-transparent opacity-40 pointer-events-none mix-blend-overlay"></div>
              <div className="absolute inset-0 z-0 -inset-[100%] top-[-50%] rotate-45 bg-gradient-to-b from-transparent via-white/5 to-transparent w-[200%] h-[50%] pointer-events-none"></div>
              <div className="absolute inset-0 z-0 top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-white/10 blur-[60px] pointer-events-none mix-blend-screen"></div>
            </>
          )}

          <div className="flex flex-col flex-1 relative z-10 text-white p-5 sm:p-6 pb-4">
            {/* 頂部：銀行名稱與當前消費累積金額 */}
            <div className="flex justify-between items-start">
              <p className="text-base sm:text-xl font-medium tracking-wider text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] truncate max-w-[60%] pl-1">{card.bankName}</p>

              <div className="flex flex-col items-end pr-1 text-right">
                <span className="text-[10px] sm:text-[11px] font-medium tracking-widest text-white/80 mb-0.5 uppercase drop-shadow-md">當前消費累積</span>
                <span className="font-mono text-lg sm:text-xl font-bold leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-white/95">
                  ${currentTotal.toLocaleString()}
                </span>
                {currentTotal === 0 && ( /* 在結帳日後歸0時，提示翻轉看帳單 */
                  <span className="text-[9px] text-white/60 mt-0.5 whitespace-nowrap animate-pulse">點擊翻轉看本期應繳</span>
                )}
              </div>
            </div>

            {/* 中間：晶片與卡片名稱 - Content Driven Height 中間自動長高推開上下 */}
            <div className="flex flex-col flex-1 justify-center py-4 sm:py-6 pl-1">
              <div className="w-10 h-7 sm:w-12 sm:h-8 bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 rounded-[4px] border border-yellow-700/50 flex items-center justify-center mb-2 sm:mb-3 shadow-md relative overflow-hidden opacity-90">
                <div className="absolute inset-0 border-[0.5px] border-black/20 rounded-[4px]"></div>
                <div className="w-full h-[0.5px] bg-black/20 absolute top-1/2"></div>
                <div className="w-[0.5px] h-full bg-black/20 absolute left-1/3"></div>
                <div className="w-[0.5px] h-full bg-black/20 absolute right-1/3"></div>
                <div className="w-5 h-3.5 sm:w-6 sm:h-4 border-[0.5px] border-black/30 rounded-sm bg-gradient-to-br from-yellow-300 to-yellow-500 z-10"></div>
              </div>

              <h3 className="text-2xl sm:text-4xl font-bold tracking-widest drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] truncate text-white/95 uppercase leading-tight">
                {card.name}
              </h3>
            </div>

            {/* 底部：日期資訊與品牌 Logo */}
            <div className="flex justify-between items-end pl-1 pt-1">
              <div className="flex gap-6 sm:gap-10">
                <div className="flex flex-col">
                  <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest text-white/80 mb-1 drop-shadow-md">結帳日</span>
                  <span className="font-mono text-xl sm:text-3xl font-bold leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{card.statementDate} <span className="text-sm font-sans font-normal text-white/80">日</span></span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest text-white/80 mb-1 drop-shadow-md">繳款日</span>
                  <span className="font-mono text-xl sm:text-3xl font-bold leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{card.dueDate} <span className="text-sm font-sans font-normal text-white/80">日</span></span>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0 pr-1">
                <NetworkLogo network={card.network} />
              </div>
            </div>
          </div>
        </div>

        {/* BACK - 點擊背面任意處翻回正面，按鈕除外 */}
        <div
          onClick={() => setIsFlipped(false)}
          className={`absolute inset-0 w-full h-full rounded-[20px] overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)] ${isFlipped ? 'z-10' : 'z-0 pointer-events-none'} ${bgStyles}`}
        >
          {/* Back Background Elements */}
          {card.backgroundImage && (
            <>
              <img
                src={card.backgroundImage}
                alt="Card Background"
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
              <div className="absolute inset-0 z-0 bg-black/60 backdrop-blur-sm"></div>
            </>
          )}

          {!card.backgroundImage && (
            <>
              <div className="absolute inset-0 z-0 bg-black/20"></div>
              <div className="absolute inset-0 z-0 bg-gradient-to-tr from-white/5 via-white/10 to-transparent opacity-40 pointer-events-none mix-blend-overlay"></div>
            </>
          )}

          {/* Back Content */}
          <div className="flex flex-col h-full relative z-10 text-white p-6 pb-5">
            <div className="flex flex-col mb-4">
              <span className="text-white/80 text-xs sm:text-sm font-medium tracking-widest uppercase mb-1 drop-shadow-md">本期帳單金額</span>
              <span className="font-mono text-3xl sm:text-4xl font-bold drop-shadow-md text-white/95">
                ${prevTotal.toLocaleString()}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col justify-start">
              <span className="text-white/80 text-[11px] font-medium tracking-widest uppercase mb-2 border-b border-white/20 pb-1.5 inline-block w-fit">主打回饋</span>
              <p className="text-sm sm:text-base text-white/90 leading-relaxed whitespace-pre-wrap drop-shadow-sm min-h-0">
                {card.rewardsInfo || '未設定任何回饋資訊'}
              </p>
            </div>

            {/* 查看詳情按鈕（僅在列表模式有 onClick 時顯示） */}
            {onClick && (
              <div className="mt-auto pt-4 flex justify-end shrink-0">
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-[15px] font-semibold transition-colors shadow-sm outline-none active:scale-[0.98]"
                >
                  查看詳情 / 記帳
                </button>
              </div>
            )}

            {/* 詳情頁面的提示 */}
            {!onClick && (
              <div className="mt-auto pt-4 flex justify-center shrink-0">
                <span className="text-[11px] text-white/50 tracking-widest uppercase">點擊任意處翻回正面</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
