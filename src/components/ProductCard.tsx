import React, { useState } from 'react';
import { Product } from '../types';
import { Tag, Edit2 } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  isAdmin: boolean;
  onEditProduct: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, isAdmin, onEditProduct }) => {
  const hasDiscount = product.discountPercentage && product.discountPercentage > 0;
  const discountedPrice = hasDiscount
    ? product.price - (product.price * (product.discountPercentage! / 100))
    : product.price;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-md transition-shadow relative">
      {hasDiscount && (
        <div className="absolute top-4 left-4 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10 flex items-center gap-1 shadow-sm">
          <Tag size={12} />
          {product.discountPercentage}% OFF
        </div>
      )}
      
      {isAdmin && (
        <button
          onClick={() => onEditProduct(product)}
          className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-slate-700 p-2 rounded-full z-10 shadow-sm hover:bg-slate-100 transition-colors"
          title="Edit Product"
        >
          <Edit2 size={16} />
        </button>
      )}

      <div className="aspect-square overflow-hidden bg-slate-50 relative">
        <img
          src={product.imageUrl}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="p-5">
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
          {product.category}
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2 line-clamp-1">
          {product.title}
        </h3>
        
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-slate-900">
            ৳{discountedPrice.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-slate-400 line-through">
              ৳{product.price.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
