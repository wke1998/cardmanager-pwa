import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, CardTheme, CardNetwork, Subscription } from '../types';
import { ArrowLeft, Image as ImageIcon, Trash2, X, Check, Plus, RefreshCw } from 'lucide-react';

// --- 新增：互動式照片裁切元件 (Interactive Image Cropper) ---
const TARGET_RATIO = 1.586;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = CANVAS_WIDTH / TARGET_RATIO;

const ImageCropper = ({ imageSrc, onCrop, onCancel }: { imageSrc: string, onCrop: (base64: string) => void, onCancel: () => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dims, setDims] = useState({ cw: 0, ch: 0, iw: 0, ih: 0, baseScale: 1 });
  const [loaded, setLoaded] = useState(false);

  // 圖片載入完成後計算初始比例與置中
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: iw, naturalHeight: ih } = e.currentTarget;
    if (!containerRef.current) return;

    const cw = containerRef.current.clientWidth;
    const ch = cw / TARGET_RATIO;

    // 找出能夠覆蓋整個裁切框的最小比例
    const baseScale = Math.max(cw / iw, ch / ih);
    setDims({ cw, ch, iw, ih, baseScale });

    // 預設將照片置中
    const renderedW = iw * baseScale;
    const renderedH = ih * baseScale;
    setOffset({
      x: (cw - renderedW) / 2,
      y: (ch - renderedH) / 2
    });
    setLoaded(true);
  };

  // 手勢/滑鼠拖曳處理
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !loaded) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    const renderedW = dims.iw * dims.baseScale * zoom;
    const renderedH = dims.ih * dims.baseScale * zoom;

    // 限制拖曳範圍，不允許露出邊界
    const minX = Math.min(0, dims.cw - renderedW);
    const minY = Math.min(0, dims.ch - renderedH);

    setOffset({
      x: Math.max(minX, Math.min(0, newX)),
      y: Math.max(minY, Math.min(0, newY))
    });
  };

  const handlePointerUp = () => setIsDragging(false);

  // 縮放時確保不超出邊界
  useEffect(() => {
    if (!loaded) return;
    const renderedW = dims.iw * dims.baseScale * zoom;
    const renderedH = dims.ih * dims.baseScale * zoom;

    const minX = Math.min(0, dims.cw - renderedW);
    const minY = Math.min(0, dims.ch - renderedH);

    setOffset(prev => ({
      x: Math.max(minX, Math.min(0, prev.x)),
      y: Math.max(minY, Math.min(0, prev.y))
    }));
  }, [zoom, loaded, dims]);

  // 執行裁切並輸出 Base64
  const handleConfirm = () => {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx || !imgRef.current) return;

    // 將螢幕上的座標與尺寸轉換為 Canvas 解析度
    const ratio = CANVAS_WIDTH / dims.cw;
    const drawW = dims.iw * dims.baseScale * zoom * ratio;
    const drawH = dims.ih * dims.baseScale * zoom * ratio;
    const drawX = offset.x * ratio;
    const drawY = offset.y * ratio;

    // 填充底色 (避免極端情況下的透明邊緣)
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 繪製裁切結果
    ctx.drawImage(imgRef.current, drawX, drawY, drawW, drawH);
    onCrop(canvas.toDataURL('image/jpeg', 0.8));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col safe-pb safe-pt touch-none">
      {/* 頂部導覽列 */}
      <div className="flex justify-between items-center p-4">
        <button onClick={onCancel} className="text-white p-2 flex items-center">
          <X size={24} />
        </button>
        <span className="text-white font-semibold text-[17px]">調整卡面</span>
        <button onClick={handleConfirm} className="text-apple-blue font-semibold p-2 flex items-center">
          <Check size={24} />
        </button>
      </div>

      {/* 裁切預覽區 */}
      <div className="flex-1 flex flex-col justify-center px-4 max-w-3xl mx-auto w-full">
        <div
          ref={containerRef}
          className="w-full relative overflow-hidden rounded-[20px] bg-gray-900 border border-white/20 touch-none shadow-2xl cursor-grab active:cursor-grabbing"
          style={{ aspectRatio: TARGET_RATIO }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <img
            ref={imgRef}
            src={imageSrc}
            onLoad={handleImageLoad}
            className="absolute max-w-none origin-top-left pointer-events-none"
            style={{
              width: dims.iw * dims.baseScale * zoom,
              height: dims.ih * dims.baseScale * zoom,
              transform: `translate(${offset.x}px, ${offset.y}px)`
            }}
            alt="Crop target"
          />
          {/* 指示遮罩 (當尚未拖曳時顯示) */}
          {loaded && !isDragging && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 bg-black/20">
              <span className="text-white font-medium drop-shadow-md tracking-wider">拖曳調整範圍</span>
            </div>
          )}
        </div>
      </div>

      {/* 底部縮放拉桿 */}
      <div className="p-8 pb-12 flex items-center gap-4 max-w-xl mx-auto w-full">
        <ImageIcon size={20} className="text-gray-400" />
        <input
          type="range"
          min="1"
          max="3"
          step="0.01"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-apple-blue"
        />
        <ImageIcon size={28} className="text-white" />
      </div>
    </div>
  );
};

// --- 表單主體 ---
interface Props {
  initialData?: CreditCard;
  onSave: (card: Omit<CreditCard, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const themes: { value: CardTheme; label: string; colorClass: string }[] = [
  { value: 'slate', label: '鈦金黑', colorClass: 'bg-gray-800' },
  { value: 'blue', label: '午夜藍', colorClass: 'bg-blue-900' },
  { value: 'emerald', label: '暗夜綠', colorClass: 'bg-emerald-900' },
  { value: 'rose', label: '玫瑰金', colorClass: 'bg-rose-900' },
  { value: 'amber', label: '香檳金', colorClass: 'bg-amber-800' },
  { value: 'indigo', label: '靛藍紫', colorClass: 'bg-indigo-900' },
  { value: 'purple', label: '紫水晶', colorClass: 'bg-purple-900' },
];

const networks: CardNetwork[] = ['VISA', 'Mastercard', 'JCB', 'American Express', 'Other'];

export const CardForm: React.FC<Props> = ({ initialData, onSave, onCancel }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 暫存剛選取但尚未裁切的照片
  const [croppingImage, setCroppingImage] = useState<string | null>(null);

  // 訂閱管理狀態
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subNameInput, setSubNameInput] = useState('');
  const [subAmountInput, setSubAmountInput] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    bankName: '',
    network: 'VISA' as CardNetwork,
    expiryDate: '',
    statementDate: '1',
    dueDate: '15',
    rewardsInfo: '',
    rewardCap: '',
    applicableChannels: '',
    annualFeeCondition: '',
    theme: 'slate' as CardTheme,
    backgroundImage: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        bankName: initialData.bankName,
        network: initialData.network || 'Other',
        expiryDate: initialData.expiryDate,
        statementDate: initialData.statementDate.toString(),
        dueDate: initialData.dueDate.toString(),
        rewardsInfo: initialData.rewardsInfo,
        rewardCap: initialData.rewardCap,
        applicableChannels: initialData.applicableChannels || '',
        annualFeeCondition: initialData.annualFeeCondition,
        theme: initialData.theme,
        backgroundImage: initialData.backgroundImage || '',
      });
      setSubscriptions(initialData.subscriptions || []);
    }
  }, [initialData]);

  const handleAddSubscription = () => {
    const name = subNameInput.trim();
    const amount = parseInt(subAmountInput, 10);
    if (!name || isNaN(amount) || amount <= 0) return;
    const newSub: Subscription = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      amount,
    };
    setSubscriptions(prev => [...prev, newSub]);
    setSubNameInput('');
    setSubAmountInput('');
  };

  const handleRemoveSubscription = (id: string) => {
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 觸發照片選擇，讀取後開啟裁切器
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setCroppingImage(event.target.result); // 啟動裁切畫面
      }
    };
    reader.readAsDataURL(file);

    // 清除 input 以允許重複選取同檔案
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeBackgroundImage = () => {
    setFormData(prev => ({ ...prev, backgroundImage: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      statementDate: parseInt(formData.statementDate, 10),
      dueDate: parseInt(formData.dueDate, 10),
      subscriptions,
    });
  };

  const inputClass = "w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-[16px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent transition-all shadow-sm";
  const labelClass = "block text-[14px] font-medium text-gray-700 mb-2 ml-1";
  const sectionTitleClass = "text-[16px] font-bold text-gray-900 mb-5 border-b border-gray-200 pb-2";

  // 若處於裁切模式，全螢幕顯示裁切器
  if (croppingImage) {
    return (
      <ImageCropper
        imageSrc={croppingImage}
        onCrop={(base64) => {
          setFormData(prev => ({ ...prev, backgroundImage: base64 }));
          setCroppingImage(null);
        }}
        onCancel={() => setCroppingImage(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-apple-bg flex flex-col">
      <div className="bg-apple-bg/80 backdrop-blur-xl sticky top-0 z-50 border-b border-gray-200/50 safe-pt shadow-sm">
        <div className="flex items-center justify-between px-4 h-14 max-w-3xl mx-auto w-full">
          <button type="button" onClick={onCancel} className="text-apple-blue flex items-center p-2 -ml-2 active:opacity-50 transition-opacity">
            <ArrowLeft size={24} />
            <span className="ml-1 text-[17px]">取消</span>
          </button>
          <span className="font-semibold text-[17px] text-gray-900">{initialData ? '編輯卡片' : '新增卡片'}</span>
          <button
            type="button"
            onClick={handleSubmit}
            className="text-apple-blue font-semibold p-2 -mr-2 flex items-center active:opacity-50 transition-opacity text-[17px]"
          >
            儲存
          </button>
        </div>
      </div>

      <form id="cardForm" onSubmit={handleSubmit} className="flex-1 pb-24 px-5 pt-6 space-y-8 max-w-3xl mx-auto w-full">

        <div>
          <h3 className={sectionTitleClass}>自訂卡面</h3>
          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />

            {formData.backgroundImage ? (
              <div className="relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden shadow-md border border-gray-200">
                <img src={formData.backgroundImage} alt="Card Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={removeBackgroundImage}
                    className="bg-rose-500 text-white p-3 rounded-full shadow-lg active:scale-95 transition-transform"
                  >
                    <Trash2 size={24} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={removeBackgroundImage}
                  className="absolute top-3 right-3 bg-white/90 backdrop-blur p-1.5 rounded-full text-rose-500 shadow-sm md:hidden"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[1.586/1] rounded-2xl border-2 border-dashed border-gray-300 bg-white hover:bg-gray-50 flex flex-col items-center justify-center text-gray-500 active:scale-[0.98] transition-all"
              >
                <ImageIcon size={32} className="mb-2 text-gray-400" />
                <span className="text-[15px] font-medium">從相簿上傳卡面照片</span>
                <span className="text-[13px] text-gray-400 mt-1">選填，可自行拖曳與縮放裁切範圍</span>
              </button>
            )}

            {!formData.backgroundImage && (
              <div className="pt-2">
                <label className={labelClass}>或使用純色風格</label>
                <div className="flex flex-wrap gap-4 mt-2">
                  {themes.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, theme: t.value }))}
                      className={`w-12 h-12 rounded-full ${t.colorClass} border border-white/20 shadow-md flex items-center justify-center transition-transform ${formData.theme === t.value ? 'ring-4 ring-offset-2 ring-apple-blue scale-110' : 'scale-100'}`}
                      title={t.label}
                    >
                      {formData.theme === t.value && <div className="w-3.5 h-3.5 bg-white rounded-full"></div>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className={sectionTitleClass}>基本資訊</h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>銀行名稱</label>
              <input
                required
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                placeholder="如: 國泰世華"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>卡片名稱</label>
              <input
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="如: CUBE卡"
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>發卡機構</label>
                <select
                  name="network"
                  value={formData.network}
                  onChange={handleChange}
                  className={`${inputClass} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:1.2em_1.2em] pr-10`}
                >
                  {networks.map(n => (
                    <option key={n} value={n}>{n === 'Other' ? '其他 / 不顯示' : n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>有效期限</label>
                <input
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  placeholder="MM/YY"
                  maxLength={5}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className={sectionTitleClass}>帳單週期</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>每月結帳日</label>
              <select
                name="statementDate"
                value={formData.statementDate}
                onChange={handleChange}
                className={`${inputClass} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:1.2em_1.2em] pr-10`}
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>{d} 日</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>每月繳款日</label>
              <select
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className={`${inputClass} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:1.2em_1.2em] pr-10`}
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>{d} 日</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <h3 className={sectionTitleClass}>回饋與權益</h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>主打回饋</label>
              <textarea
                name="rewardsInfo"
                value={formData.rewardsInfo}
                onChange={handleChange}
                rows={2}
                placeholder="如: 國內3%, 國外5%"
                className={`${inputClass} resize-none`}
              />
            </div>
            <div>
              <label className={labelClass}>主要適用通路 <span className="text-gray-400 font-normal">(以空白或逗號分隔)</span></label>
              <textarea
                name="applicableChannels"
                value={formData.applicableChannels}
                onChange={handleChange}
                rows={2}
                placeholder="如: 7-11 全家 高鐵 指定餐飲"
                className={`${inputClass} resize-none`}
              />
            </div>
            <div>
              <label className={labelClass}>回饋上限</label>
              <input
                name="rewardCap"
                value={formData.rewardCap}
                onChange={handleChange}
                placeholder="如: 每月上限 500 點"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className={sectionTitleClass}>固定訂閱扣款</h3>
          <div className="space-y-4">
            {subscriptions.length > 0 && (
              <div className="space-y-2">
                {subscriptions.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <RefreshCw size={16} className="text-apple-blue shrink-0" />
                      <span className="text-[15px] font-medium text-gray-900">{sub.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[15px] font-semibold text-gray-700">${sub.amount}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubscription(sub.id)}
                        className="text-gray-300 active:text-rose-500 p-1 rounded-full hover:bg-rose-50 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="text-right pr-1">
                  <span className="text-[13px] text-gray-500">每月小計：</span>
                  <span className="font-mono text-[15px] font-bold text-apple-blue">${subscriptions.reduce((s, sub) => s + sub.amount, 0).toLocaleString()}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <input
                type="text"
                value={subNameInput}
                onChange={e => setSubNameInput(e.target.value)}
                placeholder="服務名稱 (如: Netflix)"
                className="flex-1 min-w-0 bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-[16px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent transition-all shadow-sm"
              />
              <input
                type="number"
                inputMode="decimal"
                value={subAmountInput}
                onChange={e => setSubAmountInput(e.target.value)}
                placeholder="月費"
                className="w-24 shrink-0 bg-white border border-gray-200 rounded-xl px-3 py-3.5 text-[16px] text-gray-900 placeholder-gray-400 text-center focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent transition-all shadow-sm"
              />
              <button
                type="button"
                onClick={handleAddSubscription}
                disabled={!subNameInput.trim() || !subAmountInput}
                className="bg-apple-blue text-white px-4 rounded-xl font-semibold active:bg-blue-600 disabled:opacity-40 transition-colors flex items-center justify-center shadow-sm shrink-0"
              >
                <Plus size={20} />
              </button>
            </div>
            {subscriptions.length === 0 && (
              <p className="text-[13px] text-gray-400 text-center pt-1">尚未設定任何訂閱，可在此新增每月固定扣款項目</p>
            )}
          </div>
        </div>

        <div>
          <h3 className={sectionTitleClass}>其他設定</h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>免年費條件</label>
              <textarea
                name="annualFeeCondition"
                value={formData.annualFeeCondition}
                onChange={handleChange}
                rows={2}
                placeholder="如: 申請電子帳單免年費"
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};
