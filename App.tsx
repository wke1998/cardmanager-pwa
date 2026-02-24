import React, { useState } from 'react';
import { CreditCard, ViewState } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { CreditCardVisual } from './components/CreditCardVisual';
import { CardForm } from './components/CardForm';
import { CardDetail } from './components/CardDetail';
import { Plus, Wallet } from 'lucide-react';
import { getNextDueDate } from './utils';

// Generates a simple UUID-like string
const generateId = () => Math.random().toString(36).substring(2, 9);

export default function App() {
  const [cards, setCards] = useLocalStorage<CreditCard[]>('pwa-cards-data', []);
  const [view, setView] = useState<ViewState>({ type: 'LIST' });

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
        <div className="bg-apple-bg/85 backdrop-blur-xl sticky top-0 z-40 pt-[env(safe-area-inset-top)] border-b border-gray-200/50">
          <div className="px-5 pt-4 pb-3 flex justify-between items-end max-w-3xl mx-auto w-full">
            <h1 className="text-[34px] font-bold tracking-tight text-gray-900 leading-none">錢包</h1>
            <button
              onClick={() => setView({ type: 'ADD' })}
              className="bg-apple-blue text-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm mb-0.5 active:opacity-70 transition-opacity"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
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
