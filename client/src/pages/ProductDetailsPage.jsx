import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  ArrowLeft, Trash2, Download, ExternalLink, ShieldCheck, ShieldAlert,
  ShieldX, Store, CalendarDays, Tag, FileText, Loader, Phone, MapPin, Clock, BrainCircuit
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api';

const DOC_LABELS = { bill: 'Bill / Invoice', warranty: 'Warranty Card', manual: 'User Manual' };

function getWarrantyStatus(expiryDate) {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { label: 'Expired', color: '#FF3B5C', icon: ShieldX, daysLeft };
  if (daysLeft <= 30) return { label: `${daysLeft} days left`, color: '#FF6B35', icon: ShieldAlert, daysLeft };
  return { label: 'Active', color: '#00C896', icon: ShieldCheck, daysLeft };
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-borderBase last:border-0">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={14} className="text-primary" />
      </div>
      <div>
        <p className="text-xs text-textMuted font-medium mb-0.5">{label}</p>
        <p className="text-sm text-textPrimary font-semibold">{value}</p>
      </div>
    </div>
  );
}

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${API}/products/${id}`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        setProduct(res.data.product);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await axios.delete(`${API}/products/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (error || !product) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-danger">{error || 'Product not found'}</p>
          <button onClick={() => navigate('/products')} className="mt-4 text-primary text-sm font-semibold">
            Back to Products
          </button>
        </div>
      </AppLayout>
    );
  }

  const status = getWarrantyStatus(product.warrantyExpiryDate);
  const StatusIcon = status.icon;
  const store = product.storeDetails || {};
  const hasStoreInfo = store.storeName || store.phoneNumber || store.location;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}
              className="p-2 text-textSecondary hover:text-textPrimary rounded-lg hover:bg-bgElevated transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl lg:text-2xl font-display font-bold text-textPrimary leading-tight">
                {product.productName}
              </h1>
              <p className="text-textMuted text-sm">{product.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/analyze?productId=${product._id}`}
              className="flex items-center gap-1.5 text-primary bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
              <BrainCircuit size={16} />
              Ask AI
            </Link>
            <button onClick={handleDelete} disabled={deleting}
              className="flex items-center gap-1.5 text-danger hover:bg-danger/10 px-3 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50">
              {deleting ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete
            </button>
          </div>
        </div>

        {/* Warranty Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-5 rounded-2xl border"
          style={{ backgroundColor: `${status.color}10`, borderColor: `${status.color}30` }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${status.color}20` }}>
            <StatusIcon size={24} style={{ color: status.color }} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: status.color }}>
              Warranty Status
            </p>
            <p className="text-xl font-display font-bold text-textPrimary mt-0.5">{status.label}</p>
            <p className="text-xs text-textMuted mt-0.5">
              {product.warrantyValue ? `${product.warrantyValue} ${product.warrantyUnit}` : `${product.warrantyMonths} month${product.warrantyMonths > 1 ? 's' : ''}`} warranty — Expires{' '}
              {new Date(product.warrantyExpiryDate).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
          </div>
        </motion.div>

        {/* Product Info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-bgSurface border border-borderBase rounded-2xl p-5"
        >
          <h2 className="text-sm uppercase tracking-wide font-bold text-textMuted mb-2">Product Info</h2>
          <InfoRow icon={Tag} label="Category" value={product.category} />
          <InfoRow icon={CalendarDays} label="Purchase Date"
            value={new Date(product.purchaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
          <InfoRow icon={Clock} label="Warranty Period"
            value={product.warrantyValue ? `${product.warrantyValue} ${product.warrantyUnit}` : `${product.warrantyMonths} month${product.warrantyMonths > 1 ? 's' : ''}`} />
          <InfoRow icon={CalendarDays} label="Warranty Expiry"
            value={new Date(product.warrantyExpiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
          {product.notes && <InfoRow icon={FileText} label="Notes" value={product.notes} />}
        </motion.div>

        {/* Store Details */}
        {hasStoreInfo && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-bgSurface border border-borderBase rounded-2xl p-5"
          >
            <h2 className="text-sm uppercase tracking-wide font-bold text-textMuted mb-2">Store / Retailer</h2>
            <InfoRow icon={Store} label="Store Name" value={store.storeName} />
            <InfoRow icon={Phone} label="Phone Number" value={store.phoneNumber} />
            <InfoRow icon={MapPin} label="Location" value={store.location} />
          </motion.div>
        )}

        {/* Documents */}
        {product.documents && product.documents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-bgSurface border border-borderBase rounded-2xl p-5"
          >
            <h2 className="text-sm uppercase tracking-wide font-bold text-textMuted mb-4">Documents</h2>
            <div className="space-y-3">
              {product.documents.map((doc, i) => (
                <div key={i}
                  className="flex items-center justify-between p-3 bg-bgElevated rounded-xl border border-borderBase">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText size={14} className="text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-textPrimary">
                      {DOC_LABELS[doc.type] || doc.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={doc.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primaryHover px-3 py-1.5 bg-primary/10 rounded-lg transition-colors">
                      <ExternalLink size={12} /> View
                    </a>
                    <a href={doc.url} download
                      className="flex items-center gap-1.5 text-xs font-semibold text-textSecondary hover:text-textPrimary px-3 py-1.5 bg-bgBase rounded-lg border border-borderBase transition-colors">
                      <Download size={12} /> Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <p className="text-xs text-textMuted text-center pb-4">
          Added {new Date(product.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
    </AppLayout>
  );
}
