import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../api/axios';
import { ArrowLeft, Upload, CheckCircle, Loader } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';



const CATEGORIES = [
  'Electronics', 'Mobile', 'TV', 'Refrigerator', 'Washing Machine',
  'Audio', 'Camera', 'Watch', 'Car', 'Home Appliance', 'Other'
];

const WARRANTY_UNITS = ['Days', 'Months', 'Years'];

function FileUploadZone({ label, name, file, onFileChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-textSecondary mb-1.5">{label}</label>
      <div
        onDrop={(e) => { e.preventDefault(); onFileChange(name, e.dataTransfer.files[0]); }}
        onDragOver={e => e.preventDefault()}
        className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${file ? 'border-primary/50 bg-primary/5' : 'border-borderBase hover:border-primary/40 hover:bg-bgElevated'
          }`}
        onClick={() => document.getElementById(`file-${name}`).click()}
      >
        <input
          id={`file-${name}`}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => onFileChange(name, e.target.files[0])}
        />
        {file ? (
          <div className="flex items-center justify-center gap-2">
            <CheckCircle size={16} className="text-primary" />
            <span className="text-sm text-primary font-medium truncate max-w-[200px]">{file.name}</span>
          </div>
        ) : (
          <div>
            <Upload size={20} className="text-textMuted mx-auto mb-1" />
            <p className="text-xs text-textMuted">Drop or <span className="text-primary font-medium">browse</span></p>
            <p className="text-xs text-textMuted mt-0.5">JPG, PNG, PDF</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AddProductPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    productName: '',
    category: '',
    customCategory: '',
    purchaseDate: '',
    warrantyValue: '',
    warrantyUnit: 'Months',
    storeName: '',
    phoneNumber: '',
    location: '',
    notes: '',
  });

  const [files, setFiles] = useState({ bill: null, warranty: null, manual: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Calculate expiry date preview
  const expiryPreview = (form.purchaseDate && form.warrantyValue && form.warrantyUnit)
    ? (() => {
      const d = new Date(form.purchaseDate);
      const val = parseInt(form.warrantyValue);
      if (form.warrantyUnit === 'Days') d.setDate(d.getDate() + val);
      else if (form.warrantyUnit === 'Months') d.setMonth(d.getMonth() + val);
      else if (form.warrantyUnit === 'Years') d.setFullYear(d.getFullYear() + val);

      const now = new Date();
      const daysLeft = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
      const statusText = daysLeft < 0 ? 'Expired' : `${daysLeft} days left`;

      return { date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), statusText };
    })()
    : null;

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleFile = (name, file) => setFiles(prev => ({ ...prev, [name]: file }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const finalCategory = form.category === 'Other' && form.customCategory.trim() !== ''
      ? form.customCategory
      : form.category;

    const data = new FormData();
    data.append('productName', form.productName);
    data.append('category', finalCategory);
    data.append('purchaseDate', form.purchaseDate);
    data.append('warrantyValue', form.warrantyValue);
    data.append('warrantyUnit', form.warrantyUnit);
    data.append('storeName', form.storeName);
    data.append('phoneNumber', form.phoneNumber);
    data.append('location', form.location);
    data.append('notes', form.notes);

    Object.entries(files).forEach(([k, f]) => { if (f) data.append(k, f); });

    try {
      const res = await API.post('/products/add', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Fire-and-forget: trigger OCR extraction in background if documents were uploaded
      const newProductId = res.data?.product?._id;
      const hasFiles = Object.values(files).some(f => f !== null);
      if (newProductId && hasFiles) {
        API.post('/ai/extract',
          { productId: newProductId },
          {}
        ).catch(() => { }); // silent — background job
      }

      setSuccess(true);
      setTimeout(() => navigate('/products'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
            <CheckCircle size={56} className="text-success" />
          </motion.div>
          <p className="text-xl font-display font-bold text-textPrimary">Product Added!</p>
          <p className="text-textMuted text-sm">Redirecting to your products...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)}
            className="p-2 text-textSecondary hover:text-textPrimary rounded-lg hover:bg-bgElevated transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-display font-bold text-textPrimary">Add Product</h1>
            <p className="text-textMuted text-sm">Track a new warranty</p>
          </div>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-bgSurface border border-borderBase rounded-2xl p-6 space-y-5"
        >
          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger p-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-1.5">Product Name *</label>
            <input
              type="text" name="productName" required
              placeholder="e.g. Samsung 65-inch TV"
              value={form.productName} onChange={handleChange}
              className="w-full bg-bgElevated border border-borderBase rounded-xl px-4 py-3 text-textPrimary placeholder:text-textMuted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
            />
          </div>

          {/* Category */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-1.5">Category *</label>
              <select name="category" required value={form.category} onChange={handleChange}
                className="w-full bg-bgElevated border border-borderBase rounded-xl px-4 py-3 text-textPrimary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm">
                <option value="" disabled>Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {form.category === 'Other' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <label className="block text-sm font-medium text-textSecondary mb-1.5">Custom Category Name *</label>
                <input
                  type="text" name="customCategory" required={form.category === 'Other'}
                  placeholder="e.g. Drone, Microwave, Book"
                  value={form.customCategory} onChange={handleChange}
                  className="w-full bg-bgElevated border border-borderBase rounded-xl px-4 py-3 text-textPrimary placeholder:text-textMuted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                />
              </motion.div>
            )}
          </div>

          {/* Purchase Date + Warranty Months */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-1.5">Purchase Date *</label>
              <input
                type="date" name="purchaseDate" required
                value={form.purchaseDate} onChange={handleChange}
                className="w-full bg-bgElevated border border-borderBase rounded-xl px-4 py-3 text-textPrimary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-1.5">Warranty Period *</label>
              <div className="flex gap-2">
                <input
                  type="number" name="warrantyValue" required min="1"
                  placeholder="e.g. 1, 6, 12"
                  value={form.warrantyValue} onChange={handleChange}
                  className="w-2/3 bg-bgElevated border border-borderBase rounded-xl px-4 py-3 text-textPrimary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                />
                <select name="warrantyUnit" required value={form.warrantyUnit} onChange={handleChange}
                  className="w-1/3 bg-bgElevated border border-borderBase rounded-xl px-3 py-3 text-textPrimary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm">
                  {WARRANTY_UNITS.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Expiry Preview */}
          {expiryPreview && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-success/10 border border-success/20 rounded-xl">
              <CheckCircle size={14} className="text-success flex-shrink-0" />
              <p className="text-sm text-success font-medium">
                Warranty expires on <span className="font-bold">{expiryPreview.date}</span> ({expiryPreview.statusText})
              </p>
            </div>
          )}

          {/* Store Details */}
          <div>
            <p className="text-sm font-medium text-textSecondary mb-3">Store / Retailer Details</p>
            <div className="space-y-3">
              <input
                type="text" name="storeName"
                placeholder="Store name (e.g. Croma, Flipkart)"
                value={form.storeName} onChange={handleChange}
                className="w-full bg-bgElevated border border-borderBase rounded-xl px-4 py-3 text-textPrimary placeholder:text-textMuted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="tel" name="phoneNumber"
                  placeholder="Phone number"
                  value={form.phoneNumber} onChange={handleChange}
                  className="w-full bg-bgElevated border border-borderBase rounded-xl px-4 py-3 text-textPrimary placeholder:text-textMuted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                />
                <input
                  type="text" name="location"
                  placeholder="Location / City"
                  value={form.location} onChange={handleChange}
                  className="w-full bg-bgElevated border border-borderBase rounded-xl px-4 py-3 text-textPrimary placeholder:text-textMuted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-1.5">Notes (optional)</label>
            <textarea
              name="notes" rows={3}
              placeholder="Serial number, model number, extra details..."
              value={form.notes} onChange={handleChange}
              className="w-full bg-bgElevated border border-borderBase rounded-xl px-4 py-3 text-textPrimary placeholder:text-textMuted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm resize-none"
            />
          </div>

          {/* Document Uploads */}
          <div>
            <p className="text-sm font-medium text-textSecondary mb-3">Documents (optional)</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FileUploadZone label="Bill / Invoice" name="bill" file={files.bill} onFileChange={handleFile} />
              <FileUploadZone label="Warranty Card" name="warranty" file={files.warranty} onFileChange={handleFile} />
              <FileUploadZone label="User Manual" name="manual" file={files.manual} onFileChange={handleFile} />
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading}
            className="w-full bg-primary hover:bg-primaryHover text-white py-3.5 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
            {loading ? (
              <><Loader size={16} className="animate-spin" /> Saving & Uploading...</>
            ) : 'Add Product'}
          </button>
        </motion.form>
      </div>
    </AppLayout>
  );
}
