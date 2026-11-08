import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  AlertCircle,
  Tag
} from 'lucide-react';
import { Product } from '../types';
import { BillBookStorage } from '../data/BillBookStorage';

interface ProductsViewProps {
  products: Product[];
  onProductsUpdated: () => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ products, onProductsUpdated }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modal / Form state for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAvailable, setFormAvailable] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filtered list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormName('');
    setFormPrice('');
    setFormCategory('General');
    setFormDescription('');
    setFormAvailable(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormPrice(p.price.toString());
    setFormCategory(p.category || 'General');
    setFormDescription(p.description || '');
    setFormAvailable(p.isAvailable);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Product name is required');
      return;
    }
    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError('Please enter a valid price (>= 0)');
      return;
    }

    if (editingProduct) {
      BillBookStorage.updateProduct({
        ...editingProduct,
        name: formName.trim(),
        price: priceNum,
        category: formCategory.trim() || 'General',
        description: formDescription.trim(),
        isAvailable: formAvailable,
      });
    } else {
      BillBookStorage.addProduct({
        name: formName.trim(),
        price: priceNum,
        category: formCategory.trim() || 'General',
        description: formDescription.trim(),
        isAvailable: formAvailable,
      });
    }

    onProductsUpdated();
    setIsModalOpen(false);
  };

  const handleDeleteProduct = (p: Product) => {
    if (confirm(`Are you sure you want to delete "${p.name}" from catalogue?`)) {
      BillBookStorage.deleteProduct(p.id);
      onProductsUpdated();
    }
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Top Header & Add CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            Product Catalogue
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {products.length} items configured locally for quick shop billing
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#9E1B46] hover:bg-[#85163a] text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Search & Category Filter */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search items by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:outline-hidden focus:ring-1 focus:ring-[#9E1B46]"
          />
        </div>

        {/* Categories horizontal scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg font-medium transition-colors shrink-0 ${
                selectedCategory === cat
                  ? 'bg-[#9E1B46] text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-stone-400 text-xs">
            <Package className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p>No products match your search.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-stone-50/60 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-xs sm:text-sm text-stone-900 truncate">
                      {p.name}
                    </h4>
                    {!p.isAvailable && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-stone-100 text-stone-500 rounded font-medium">
                        Out of Stock
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
                    <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-medium text-[10px]">
                      {p.category || 'General'}
                    </span>
                    {p.description && (
                      <span className="truncate hidden sm:inline text-stone-400">
                        {p.description}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-mono font-bold text-sm sm:text-base text-stone-900">
                    ₹{p.price.toFixed(2)}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-2 text-stone-500 hover:text-[#9E1B46] hover:bg-stone-100 rounded-lg transition-colors"
                      title="Edit Product"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p)}
                      className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-stone-200 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-bold text-sm text-stone-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 mt-4">
              {formError && (
                <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tata Salt 1kg"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:ring-1 focus:ring-[#9E1B46]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="28.00"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 font-mono focus:outline-hidden focus:ring-1 focus:ring-[#9E1B46]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Groceries"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:ring-1 focus:ring-[#9E1B46]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Unit, brand, or packing detail"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:ring-1 focus:ring-[#9E1B46]"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formAvailable}
                  onChange={(e) => setFormAvailable(e.target.checked)}
                  className="rounded text-[#9E1B46] focus:ring-[#9E1B46]"
                />
                <span className="text-xs font-medium text-stone-700">Available in Stock</span>
              </label>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#9E1B46] hover:bg-[#85163a] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  {editingProduct ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
