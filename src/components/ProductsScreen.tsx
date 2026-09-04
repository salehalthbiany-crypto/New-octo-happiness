import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Tag, ShoppingCart } from 'lucide-react';
import { Product, Currency } from '../types';
import { getCurrencySymbol } from '../utils/storage';

interface ProductsScreenProps {
  currency: Currency;
  products: Product[];
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onQuickAddToInvoice?: (product: Product) => void;
}

export const ProductsScreen: React.FC<ProductsScreenProps> = ({
  currency,
  products,
  onSaveProduct,
  onDeleteProduct,
  onQuickAddToInvoice,
}) => {
  const sym = getCurrencySymbol(currency);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState<number | ''>('');
  const [formCategory, setFormCategory] = useState('');

  // Extract categories
  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  ) as string[];

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    if (selectedCategory === 'ALL') return matchesSearch;
    return matchesSearch && p.category === selectedCategory;
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormName('');
    setFormPrice('');
    setFormCategory('مواد غذائية');
    setShowModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormPrice(p.price);
    setFormCategory(p.category || 'مواد غذائية');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || typeof formPrice !== 'number') return;

    const productData: Product = {
      id: editingProduct ? editingProduct.id : `p-${Date.now()}`,
      name: formName.trim(),
      price: formPrice,
      category: formCategory.trim() || 'مواد غذائية',
    };

    onSaveProduct(productData);
    setShowModal(false);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Top Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في السلع والمنتجات..."
              className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-800 outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة صنف جديد</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              selectedCategory === 'ALL'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            جميع الأصناف ({products.length})
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                selectedCategory === cat
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 text-xs border border-slate-200">
          <p className="text-2xl mb-1">📦</p>
          <p>لا توجد أصناف تطابق البحث</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-200/80 hover:border-emerald-300 transition flex items-center justify-between gap-2"
            >
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-xs sm:text-sm">{prod.name}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                    {prod.category || 'مواد غذائية'}
                  </span>
                  <div className="font-black text-emerald-700 text-sm font-mono">
                    {prod.price.toFixed(2)} {sym}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(prod)}
                  className="text-slate-400 hover:text-amber-700 p-1.5 rounded-lg transition"
                  title="تعديل السعر والصنف"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`هل أنت متأكد من حذف صنف "${prod.name}"؟`)) {
                      onDeleteProduct(prod.id);
                    }
                  }}
                  className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg transition"
                  title="حذف الصنف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">
                {editingProduct ? 'تعديل الصنف' : 'إضافة صنف جديد للمخزن'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم السلعة أو الصنف *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: حليب ممتاز 900 جم"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  سعر البيع ({sym}) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  required
                  value={formPrice}
                  onChange={(e) =>
                    setFormPrice(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                  placeholder="0.00"
                  className="w-full bg-slate-50 border-2 border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-3 py-2 text-base font-black text-emerald-800 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  التصنيف / القسم
                </label>
                <input
                  type="text"
                  list="category-suggestions"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="أرز وحبوب، زيوت، معلبات..."
                  className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                />
                <datalist id="category-suggestions">
                  <option value="أرز وحبوب" />
                  <option value="سكر وتوابل" />
                  <option value="زيوت وسمن" />
                  <option value="ألبان وأجبان" />
                  <option value="معلبات" />
                  <option value="مشروبات وشاي" />
                  <option value="منظفات" />
                </datalist>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-sm transition"
                >
                  حفظ الصنف
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-3 rounded-xl text-sm transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
