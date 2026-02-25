import React, { useState, useRef } from 'react';
import { CreditCard, ViewState } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { CreditCardVisual } from './components/CreditCardVisual';
import { CardForm } from './components/CardForm';
import { CardDetail } from './components/CardDetail';
import { Plus, Wallet, Download, Upload } from 'lucide-react';
import { getNextDueDate, exportCardsToJSON, parseBackupJSON } from './utils';

// Generates a simple UUID-like string
const generateId = () => Math.random().toString(36).substring(2, 9);

export default function App() {
  const [cards, setCards] = useLocalStorage<CreditCard[]>('pwa-cards-data', []);
  const [view, setView] = useState<ViewState>({ type: 'LIST' });

  // 隱藏的 file input ref，用於觸發匯入選檔視窗
  const importInputRef = useRef<HTMLInputElement>(null);

  /** 匯出所有卡片為 JSON 備份檔 */
  const handleExport = () => {
    if (cards.length === 0) {
      alert('目前沒有任何卡片可以匯出。');
      return;
    }
    exportCardsToJSON(cards);
  };

  /** 使用者選擇 JSON 備份檔後執行匯入 */
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const backup = parseBackupJSON(ev.target?.result as string);
        const cardCount = backup.cards.length;

        // 讓使用者選擇「合併」或「覆蓋」
        const isMerge = window.confirm(
          `備份中包含 ${cardCount} 張卡片。\n\n` +
          `【確定】→ 合併匯入（保留現有卡片，略過 id 重複的項目）\n` +
          `【取消】→ 完全覆蓋（清除現有資料，以備份取代）`
        );

        if (isMerge) {
          // 合併模式：只加入 id 不存在的卡片
          const existingIds = new Set(cards.map(c => c.id));
          const newCards = backup.cards.filter(c => !existingIds.has(c.id));
          setCards([...cards, ...newCards]);
          alert(`✅ 合併完成！新增了 ${newCards.length} 張卡片。`);
        } else {
          // 覆蓋模式：二次確認，避免誤操作
          const confirmed = window.confirm(
            `⚠️ 警告：此操作將清除現有 ${cards.length} 張卡片並以備份取代，確定繼續嗎？`
          );
          if (confirmed) {
            setCards(backup.cards);
            alert(`✅ 覆蓋完成！已還原 ${cardCount} 張卡片。`);
          }
        }
      } catch (err) {
        alert('❌ 匯入失敗：' + (err as Error).message);
      }
      // 重置 input，允許下次選同一檔案也能觸發
      e.target.value = '';
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleAddCard = (newCardData: Omit<CreditCard, 'id' | 'createdAt'>) => {
    const newCard: CreditCard = {
      ...newCardData,
      id: generateId(),
      createdAt: Date.now(),
      transactions: [],
    };
    setCards([...cards, newCard]);
    setView({ type: 'LIST' });
  };

  const handleUpdateCard = (cardId: string, updatedData: Partial<CreditCard>) => {
    setCards(cards.map(card =>
      card.id === cardId ? { ...card, ...updatedData } : card
    ));
    // 保持在原畫面
  };

  const handleDeleteCard = (cardId: string) => {
    setCards(cards.filter(c => c.id !== cardId));
    setView({ type: 'LIST' });
  };

  // Render List View
  if (view.type === 'LIST') {
    return (
      <div className="min-h-[100dvh] bg-apple-bg flex flex-col safe-pb">
        {/* Header - Apple Wallet Style */}
        <div className="bg-apple-bg/85 backdrop-blur-xl sticky top-0 z-40 safe-pt border-b border-gray-200/50">
          <div className="px-5 pt-4 pb-3 flex justify-between items-end max-w-3xl mx-auto w-full">
            <h1 className="text-[34px] font-bold tracking-tight text-gray-900 leading-none">錢包</h1>
            {/* 右側操作按鈕群組 */}
            <div className="flex items-center gap-2 mb-0.5">
              {/* 匯出備份按鈕 */}
              <button
                onClick={handleExport}
                title="匯出備份"
                className="text-apple-blue w-8 h-8 rounded-full flex items-center justify-center active:opacity-70 transition-opacity"
              >
                <Download size={20} strokeWidth={2} />
              </button>
              {/* 匯入備份按鈕（觸發隱藏 file input） */}
              <button
                onClick={() => importInputRef.current?.click()}
                title="匯入備份"
                className="text-apple-blue w-8 h-8 rounded-full flex items-center justify-center active:opacity-70 transition-opacity"
              >
                <Upload size={20} strokeWidth={2} />
              </button>
              {/* 新增卡片按鈕 */}
              <button
                onClick={() => setView({ type: 'ADD' })}
                className="bg-apple-blue text-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm active:opacity-70 transition-opacity"
              >
                <Plus size={20} strokeWidth={2.5} />
              </button>
            </div>
            {/* 隱藏的檔案選擇器，accept 限制為 JSON */}
            <input
              ref={importInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleImportFile}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 pt-6 pb-24 max-w-3xl mx-auto w-full">
          {cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-72 text-center px-4 mt-10">
              <div className="w-24 h-24 bg-gray-200/50 rounded-full flex items-center justify-center mb-5 shadow-inner">
                <Wallet size={48} className="text-gray-400" strokeWidth={1.5} />
              </div>
              <h2 className="text-[22px] font-semibold text-gray-800 mb-2">錢包是空的</h2>
              <p className="text-gray-500 mb-8 text-[15px] max-w-[250px]">點擊右上角的按鈕加入卡片，開始管理您的信用卡。</p>
              <button
                onClick={() => setView({ type: 'ADD' })}
                className="bg-apple-blue text-white font-semibold py-3.5 px-10 rounded-[14px] active:scale-95 transition-all shadow-md text-[17px]"
              >
                加入卡片
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {cards.map(card => {
                // 計算是否即將繳款 (小於等於 3 天)
                const nextDue = getNextDueDate(card.dueDate);
                const daysLeft = Math.ceil((nextDue.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                const isDueSoon = daysLeft >= 0 && daysLeft <= 3;

                return (
                  <div key={card.id} className="relative z-10 transition-transform">
                    {/* 即將繳款的警告標籤 */}
                    {isDueSoon && (
                      <div className="absolute -top-3 -right-2 z-20 bg-rose-500 text-white text-[12px] font-bold px-3 py-1.5 rounded-full shadow-lg border-2 border-[#f2f2f7] animate-pulse">
                        {daysLeft === 0 ? '今日繳款！' : `剩 ${daysLeft} 天繳款`}
                      </div>
                    )}

                    <CreditCardVisual
                      card={card}
                      onClick={() => setView({ type: 'DETAIL', cardId: card.id })}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Add Form
  if (view.type === 'ADD') {
    return (
      <CardForm
        onSave={handleAddCard}
        onCancel={() => setView({ type: 'LIST' })}
      />
    );
  }

  // Render Edit Form
  if (view.type === 'EDIT') {
    const cardToEdit = cards.find(c => c.id === view.cardId);
    if (!cardToEdit) {
      setView({ type: 'LIST' });
      return null;
    }
    return (
      <CardForm
        initialData={cardToEdit}
        onSave={(data) => {
          handleUpdateCard(view.cardId, data);
          setView({ type: 'DETAIL', cardId: view.cardId });
        }}
        onCancel={() => setView({ type: 'DETAIL', cardId: view.cardId })}
      />
    );
  }

  // Render Detail View
  if (view.type === 'DETAIL') {
    const cardToShow = cards.find(c => c.id === view.cardId);
    if (!cardToShow) {
      setView({ type: 'LIST' });
      return null;
    }
    return (
      <CardDetail
        card={cardToShow}
        onBack={() => setView({ type: 'LIST' })}
        onEdit={() => setView({ type: 'EDIT', cardId: view.cardId })}
        onDelete={() => handleDeleteCard(view.cardId)}
        onUpdate={(updatedData) => handleUpdateCard(view.cardId, updatedData)}
      />
    );
  }

  return null;
}
