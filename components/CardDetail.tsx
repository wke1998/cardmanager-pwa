import React, { useState } from 'react';
import { CreditCard, Transaction } from '../types';
import { CreditCardVisual } from './CreditCardVisual';
import { getCurrentCycleStartDate, downloadICS } from '../utils';
import { ArrowLeft, Trash2, Calendar, Gift, AlertCircle, ShieldCheck, Receipt, X, Plus, CalendarPlus, RefreshCw } from 'lucide-react';

interface Props {
  card: CreditCard;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: (updatedData: Partial<CreditCard>) => void;
}

export const CardDetail: React.FC<Props> = ({ card, onBack, onEdit, onDelete, onUpdate }) => {
  const [amountInput, setAmountInput] = useState('');
  const [descInput, setDescInput] = useState('');

  const handleDelete = () => {
    if (window.confirm('確定要刪除這張卡片嗎？此操作無法還原。')) {
      onDelete();
    }
  };

  const handleAddTransaction = () => {
    const amount = parseInt(amountInput, 10);
    if (isNaN(amount) || amount <= 0) return;

    const newTransaction: Transaction = {
      id: Math.random().toString(36).substring(2, 9),
      amount,
      description: descInput.trim() || '一般消費',
      date: Date.now(),
    };

    onUpdate({
      transactions: [newTransaction, ...(card.transactions || [])],
    });

    setAmountInput('');
    setDescInput('');
  };

  const handleDeleteTransaction = (txId: string) => {
    onUpdate({
      transactions: (card.transactions || []).filter(t => t.id !== txId),
    });
  };

  const handleAddToCalendar = () => {
    downloadICS(card.name, card.dueDate);
  };

  const channelTags = card.applicableChannels
    ? card.applicableChannels.split(/[,、\n\s]+/).filter(tag => tag.trim() !== '')
    : [];

  const startDate = getCurrentCycleStartDate(card.statementDate);
  const currentTransactions = (card.transactions || []).filter(t => t.date >= startDate.getTime());
  const transactionTotal = currentTransactions.reduce((sum, t) => sum + t.amount, 0);
  const subscriptionTotal = (card.subscriptions || []).reduce((sum, s) => sum + s.amount, 0);
  const currentTotal = transactionTotal + subscriptionTotal;

  const blockClass = "bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4";
  const titleClass = "text-[16px] font-bold text-gray-900 ml-2";

  return (
    <div className="min-h-screen bg-apple-bg flex flex-col">
      <div className="bg-apple-bg/80 backdrop-blur-xl sticky top-0 z-50 safe-pt border-b border-gray-200/50">
        <div className="flex items-center justify-between px-4 h-14 max-w-3xl mx-auto w-full">
          <button onClick={onBack} className="text-apple-blue flex items-center p-2 -ml-2 active:opacity-50 transition-opacity">
            <ArrowLeft size={24} />
            <span className="ml-1 text-[17px]">首頁</span>
          </button>
          <span className="font-semibold text-[17px]">卡片詳情</span>
          <button onClick={onEdit} className="text-apple-blue font-semibold p-2 -mr-2 active:opacity-50 transition-opacity">
            編輯
          </button>
        </div>
      </div>

      <div className="flex-1 pb-24 px-5 pt-5 space-y-6 max-w-3xl mx-auto w-full">
        <div>
          <CreditCardVisual card={card} />
        </div>

        <div className={blockClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Receipt size={20} className="text-apple-blue" />
              <h3 className={titleClass}>本期累積消費</h3>
            </div>
            <span className="font-mono text-xl font-bold text-gray-900">
              ${currentTotal.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <div className="flex gap-3">
              <div className="flex-1 flex flex-col gap-3">
                <input
                  type="number"
                  inputMode="decimal"
                  value={amountInput}
                  onChange={e => setAmountInput(e.target.value)}
                  placeholder="輸入消費金額..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[16px] outline-none text-gray-900 font-medium placeholder-gray-400 focus:ring-2 focus:ring-apple-blue transition-all"
                />
                <input
                  type="text"
                  value={descInput}
                  onChange={e => setDescInput(e.target.value)}
                  placeholder="備註 (如：全聯、晚餐)"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[15px] outline-none text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-apple-blue transition-all"
                />
              </div>
              <button
                onClick={handleAddTransaction}
                disabled={!amountInput}
                className="bg-apple-blue text-white px-5 rounded-xl font-semibold active:bg-blue-600 disabled:opacity-40 transition-colors flex flex-col items-center justify-center min-w-[70px] shadow-sm"
              >
                <Plus size={22} className="mb-1" />
                <span className="text-[14px]">記帳</span>
              </button>
            </div>
          </div>

          {currentTransactions.length > 0 && (
            <div className="divide-y divide-gray-100 border-t border-gray-100 pt-2 mt-2">
              {currentTransactions.map(t => (
                <div key={t.id} className="py-3 flex justify-between items-center bg-white">
                  <div className="flex-1 overflow-hidden pr-3">
                    <p className="text-[16px] text-gray-900 font-medium truncate">{t.description}</p>
                    <p className="text-[12px] text-gray-500 mt-1">
                      {new Date(t.date).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-[17px] font-semibold text-gray-900">${t.amount.toLocaleString()}</span>
                    <button
                      onClick={() => handleDeleteTransaction(t.id)}
                      className="text-gray-300 active:text-rose-500 p-1.5 rounded-full bg-gray-50 hover:bg-rose-50 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {currentTransactions.length === 0 && subscriptionTotal === 0 && (
            <div className="pt-3 text-center text-[14px] text-gray-400 border-t border-gray-100">
              本期尚無消費紀錄
            </div>
          )}

          {(card.subscriptions || []).length > 0 && (
            <div className="border-t border-gray-100 pt-3 mt-2">
              <p className="text-[13px] text-gray-500 mb-2 flex items-center gap-1.5">
                <RefreshCw size={13} />
                固定訂閱扣款（每月自動計入）
              </p>
              <div className="space-y-1.5">
                {(card.subscriptions || []).map(sub => (
                  <div key={sub.id} className="flex justify-between items-center py-1.5">
                    <span className="text-[15px] text-gray-700">{sub.name}</span>
                    <span className="font-mono text-[15px] font-medium text-apple-blue">${sub.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 mt-2 border-t border-dashed border-gray-200">
                <span className="text-[13px] text-gray-500">訂閱小計</span>
                <span className="font-mono text-[14px] font-bold text-apple-blue">${subscriptionTotal.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        <div className={blockClass}>
          <div className="flex items-center mb-2">
            <Calendar size={20} className="text-apple-blue" />
            <h3 className={titleClass}>帳單週期</h3>
          </div>
          <div className="flex divide-x divide-gray-100 bg-gray-50/50 rounded-xl border border-gray-100 p-4 mb-3">
            <div className="flex-1 pr-4">
              <p className="text-[13px] text-gray-500 mb-1">每月結帳日</p>
              <p className="text-2xl font-bold text-gray-900">{card.statementDate} <span className="text-sm font-normal text-gray-500">日</span></p>
            </div>
            <div className="flex-1 pl-4">
              <p className="text-[13px] text-gray-500 mb-1">繳款截止日</p>
              <p className="text-2xl font-bold text-rose-500">{card.dueDate} <span className="text-sm font-normal text-rose-400">日</span></p>
            </div>
          </div>

          <button
            onClick={handleAddToCalendar}
            className="w-full flex items-center justify-center gap-2 bg-apple-blue/10 text-apple-blue py-2.5 rounded-xl font-medium active:bg-apple-blue/20 transition-colors mb-2"
          >
            <CalendarPlus size={18} />
            <span className="text-[15px]">加入 Apple 行事曆提醒</span>
          </button>

          <p className="text-[12px] text-gray-400 text-center">
            本期計算起算日：{startDate.toLocaleDateString('zh-TW')}
          </p>
        </div>

        <div className={blockClass}>
          <div className="flex items-center mb-2">
            <Gift size={20} className="text-rose-500" />
            <h3 className={titleClass}>回饋與權益</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-[13px] text-gray-500 mb-1.5">主打回饋</p>
              <p className="text-[16px] text-gray-900 whitespace-pre-wrap leading-relaxed">
                {card.rewardsInfo || '未設定'}
              </p>
            </div>

            {channelTags.length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-[13px] text-gray-500 mb-2.5">主要適用通路</p>
                <div className="flex flex-wrap gap-2">
                  {channelTags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-[14px] font-medium border border-gray-200/50">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {card.rewardCap && (
              <div className="bg-amber-50/80 rounded-xl p-3.5 border border-amber-200/60 flex items-start mt-2">
                <AlertCircle size={18} className="text-amber-500 mr-2.5 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[13px] text-amber-700 font-bold mb-0.5">回饋上限</p>
                  <p className="text-[14px] text-amber-900/90 leading-snug">{card.rewardCap}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={blockClass}>
          <div className="flex items-center mb-2">
            <ShieldCheck size={20} className="text-emerald-500" />
            <h3 className={titleClass}>免年費條件</h3>
          </div>
          <div>
            <p className="text-[16px] text-gray-900 whitespace-pre-wrap leading-relaxed">
              {card.annualFeeCondition || '未設定'}
            </p>
          </div>
        </div>

        <div className="pt-6 pb-2">
          <button
            onClick={handleDelete}
            className="w-full bg-white text-rose-500 border border-rose-100 rounded-xl py-4 text-[17px] font-bold shadow-sm flex items-center justify-center active:bg-rose-50 transition-colors"
          >
            <Trash2 size={18} className="mr-2" />
            刪除此卡片
          </button>
        </div>
      </div>
    </div>
  );
};
