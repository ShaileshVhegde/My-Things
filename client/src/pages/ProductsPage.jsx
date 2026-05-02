import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../api/axios';
import {
  Plus, Search, Filter, Laptop, Tv, Refrigerator, WashingMachine,
  Smartphone, Car, Home, Headphones, Camera, Watch, Zap, Package
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';



// Category → icon + color mapping
const CATEGORY_META = {
  'Electronics': { icon: Laptop, color: '#6C47FF' },
  'Mobile': { icon: Smartphone, color: '#00D4AA' },
  'TV': { icon: Tv, color: '#FF6B35' },
  'Refrigerator': { icon: Refrigerator, color: '#00C896' },
  'Washing Machine': { icon: WashingMachine, color: '#7D5EFF' },
  'Audio': { icon: Headphones, color: '#FF6B35' },
  'Camera': { icon: Camera, color: '#FFAD33' },
  'Watch': { icon: Watch, color: '#FF3B5C' },
  'Car': { icon: Car, color: '#00D4AA' },
  'Home Appliance': { icon: Home, color: '#6C47FF' },
  'Other': { icon: Package, color: '#6B7499' },
};

function getCategoryMeta(category) {
  return CATEGORY_META[category] || CATEGORY_META['Other'];
}

function getWarrantyStatus(expiryDate) {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { label: 'Expired', color: '#FF3B5C', bg: '#FF3B5C20', daysLeft };
  if (daysLeft <= 30) return { label: `${daysLeft}d left`, color: '#FF6B35', bg: '#FF6B3520', daysLeft };
  return { label: 'Active', color: '#00C896', bg: '#00C89620', daysLeft };
}

function ProductCard({ product, idx }) {
  const { icon: Icon, color } = getCategoryMeta(product.category);
  const status = getWarrantyStatus(product.warrantyExpiryDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05, duration: 0.35 }}
    >
      <div
        className="block bg-bgSurface border border-borderBase rounded-2xl p-5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all group"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}>
            <Icon size={20} style={{ color }} />
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
            style={{ backgroundColor: status.bg, color: status.color }}>
            {status.label}
          </span>
        </div>

        <h3 className="font-display font-bold text-textPrimary text-base leading-tight mb-1 group-hover:text-primary transition-colors">
          {product.productName}
        </h3>
        <p className="text-textMuted text-xs mb-3">{product.category}</p>

        <div className="flex items-center justify-between pt-3 border-t border-borderBase">
          <span className="text-xs text-textMuted">Expires</span>
          <span className="text-xs font-semibold text-textSecondary">
            {new Date(product.warrantyExpiryDate).toLocaleDateString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric'
            })}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-borderBase">
          <Link to={`/analyze?productId=${product._id}`} onClick={(e) => e.stopPropagation()}
            className="flex-1 flex justify-center items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary py-2 rounded-xl text-xs font-semibold transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
            Ask AI
          </Link>
          <Link to={`/products/${product._id}`}
            className="flex-1 flex justify-center items-center py-2 bg-bgElevated hover:bg-borderBase text-textSecondary rounded-xl text-xs font-semibold transition-colors">
            View Details
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function ProductsPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await API.get('/products', {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        setProducts(res.data.products);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filtered = products.filter(p => {
    const matchSearch = p.productName.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filterStatus === 'all') return true;
    const { daysLeft } = getWarrantyStatus(p.warrantyExpiryDate);
    if (filterStatus === 'active') return daysLeft > 30;
    if (filterStatus === 'expiring') return daysLeft >= 0 && daysLeft <= 30;
    if (filterStatus === 'expired') return daysLeft < 0;
    return true;
  });

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-textPrimary">Products</h1>
            <p className="text-textMuted text-sm mt-1">{products.length} item{products.length !== 1 ? 's' : ''} tracked</p>
          </div>
          <Link to="/products/add"
            className="flex items-center gap-2 bg-primary hover:bg-primaryHover text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-primary/20">
            <Plus size={16} />
            <span className="hidden sm:inline">Add Product</span>
          </Link>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-bgSurface border border-borderBase rounded-xl pl-9 pr-4 py-2.5 text-sm text-textPrimary placeholder:text-textMuted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'expiring', 'expired'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${filterStatus === s ? 'bg-primary text-white' : 'bg-bgSurface border border-borderBase text-textSecondary hover:border-primary/50'
                  }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-danger">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-bgSurface border border-borderBase rounded-2xl">
            <Package size={40} className="text-textMuted mx-auto mb-3" />
            <p className="text-textSecondary font-semibold mb-1">
              {search || filterStatus !== 'all' ? 'No results found' : 'No products yet'}
            </p>
            <p className="text-textMuted text-sm mb-4">
              {search || filterStatus !== 'all' ? 'Try a different search or filter' : 'Start by adding your first product'}
            </p>
            {(!search && filterStatus === 'all') && (
              <Link to="/products/add"
                className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold">
                <Plus size={16} /> Add Product
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((product, i) => (
              <ProductCard key={product._id} product={product} idx={i} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
