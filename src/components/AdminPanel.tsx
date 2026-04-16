import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/errorHandling';
import { Plus, Edit2, X, Trash2 } from 'lucide-react';
import { Product } from '../types';

interface AdminPanelProps {
  onClose: () => void;
  productToEdit?: Product | null;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, productToEdit }) => {
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Skin Care',
    price: '',
    imageUrl: '',
    discountPercentage: '0',
    productCode: ''
  });

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        title: productToEdit.title,
        category: productToEdit.category,
        price: productToEdit.price.toString(),
        imageUrl: productToEdit.imageUrl,
        discountPercentage: (productToEdit.discountPercentage || 0).toString(),
        productCode: productToEdit.productCode || ''
      });
    }
  }, [productToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const productData = {
        title: formData.title,
        category: formData.category,
        price: Number(formData.price),
        discountPercentage: Number(formData.discountPercentage),
        imageUrl: formData.imageUrl,
        productCode: formData.productCode,
      };

      if (productToEdit) {
        const productRef = doc(db, 'products', productToEdit.id);
        await updateDoc(productRef, productData);
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: serverTimestamp()
        });
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, productToEdit ? OperationType.UPDATE : OperationType.CREATE, 'products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!productToEdit) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'products', productToEdit.id));
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'products');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">
            {productToEdit ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              required
              type="text"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-none"
              placeholder="e.g. Luxury Face Cream"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-none bg-white"
            >
              <option value="Skin Care">Skin Care</option>
              <option value="Hair Care">Hair Care</option>
              <option value="Body Care">Body Care</option>
              <option value="Bags">Bags</option>
              <option value="Cosmetics">Cosmetics</option>
              <option value="Watches">Watches</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Price (৳)</label>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-none"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Discount (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.discountPercentage}
                onChange={e => setFormData({...formData, discountPercentage: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-none"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product Code</label>
            <input
              type="text"
              value={formData.productCode}
              onChange={e => setFormData({...formData, productCode: e.target.value})}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-none"
              placeholder="e.g. MV-101"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
            <input
              required
              type="url"
              value={formData.imageUrl}
              onChange={e => setFormData({...formData, imageUrl: e.target.value})}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-none"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading && !showDeleteConfirm ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {productToEdit ? <Edit2 size={20} /> : <Plus size={20} />}
                  {productToEdit ? 'Save Changes' : 'Add Product'}
                </>
              )}
            </button>
          </div>

          {productToEdit && (
            <div className="pt-2 mt-2">
              {showDeleteConfirm ? (
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                  <p className="text-sm text-red-800 mb-3 font-medium text-center">Are you sure you want to delete this product?</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={loading}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition-colors text-sm flex justify-center items-center"
                    >
                      {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Yes, Delete'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={loading}
                      className="flex-1 bg-white hover:bg-slate-50 text-slate-700 font-medium py-2 rounded-lg border border-slate-200 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 font-medium py-3 rounded-xl transition-colors"
                >
                  <Trash2 size={20} />
                  Delete Product
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
