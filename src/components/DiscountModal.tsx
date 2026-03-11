import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/errorHandling';
import { Product } from '../types';
import { X, Percent } from 'lucide-react';

interface DiscountModalProps {
  product: Product;
  onClose: () => void;
}

export const DiscountModal: React.FC<DiscountModalProps> = ({ product, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [discount, setDiscount] = useState(product.discountPercentage?.toString() || '0');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const productRef = doc(db, 'products', product.id);
      await updateDoc(productRef, {
        discountPercentage: Number(discount)
      });
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${product.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Set Discount</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <img src={product.imageUrl} alt={product.title} className="w-16 h-16 rounded-lg object-cover" />
            <div>
              <h3 className="font-medium text-slate-800 line-clamp-1">{product.title}</h3>
              <p className="text-sm text-slate-500">৳{product.price.toFixed(2)}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Discount Percentage</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Percent size={16} />
              </div>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={discount}
                onChange={e => setDiscount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-none text-lg font-medium"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Save Discount'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
