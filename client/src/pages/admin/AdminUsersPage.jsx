import React, { useEffect, useState, useCallback } from 'react';
import API from '../../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, ChevronLeft, ChevronRight, Package, Clock,
  ShieldAlert, CheckCircle, User, Pencil, Trash2, UserPlus, Shield, AlertTriangle
} from 'lucide-react';
import AdminLayout from '../../components/navigation/AdminLayout';
import CustomSelect from '../../components/ui/CustomSelect';


const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });


function Badge({ children, color }) {
  const colors = {
    admin: 'bg-primary/10 text-primary',
    user: 'bg-bgElevated text-textMuted',
    active: 'bg-emerald-500/10 text-emerald-500',
    expired: 'bg-danger/10 text-danger',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors[color] || colors.user}`}>
      {children}
    </span>
  );
}

/* ─── Confirm Delete Modal ─── */
function ConfirmDeleteModal({ user, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-sm bg-bgSurface border border-borderBase rounded-2xl shadow-2xl p-6"
      >
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-danger/10 mx-auto mb-4">
          <AlertTriangle size={26} className="text-danger" />
        </div>
        <h3 className="text-lg font-bold text-textPrimary text-center mb-2">Delete User?</h3>
        <p className="text-sm text-textMuted text-center mb-1">
          You are about to permanently delete <span className="font-semibold text-textPrimary">{user.name}</span>.
        </p>
        <p className="text-xs text-danger text-center mb-6">All their products will also be deleted. This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-borderBase text-textSecondary font-semibold text-sm hover:bg-bgElevated transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-danger text-white font-semibold text-sm hover:bg-danger/80 disabled:opacity-50 transition-colors">
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── User Form Modal (Add / Edit) ─── */
function UserFormModal({ editUser, onClose, onSaved }) {
  const isEdit = !!editUser;
  const [form, setForm] = useState({
    name: editUser?.name || '',
    email: editUser?.email || '',
    role: editUser?.role || 'user',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isEdit) {
        const payload = { name: form.name, email: form.email, role: form.role };
        await API.put(`/admin/users/${editUser._id}`, payload, { headers: authHeaders() });
      } else {
        if (!form.password) { setError('Password is required for new users'); setLoading(false); return; }
        await API.post('/admin/users', form, { headers: authHeaders() });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-bgSurface border border-borderBase rounded-2xl shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-borderBase">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              {isEdit ? <Pencil size={16} className="text-primary" /> : <UserPlus size={16} className="text-primary" />}
            </div>
            <h3 className="text-base font-bold text-textPrimary">{isEdit ? 'Edit User' : 'Add New User'}</h3>
          </div>
          <button onClick={onClose} className="p-2 text-textSecondary hover:text-textPrimary hover:bg-bgElevated rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-xl text-sm">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-textMuted mb-1.5 uppercase tracking-wider">Full Name</label>
            <input
              name="name" value={form.name} onChange={handleChange} required
              placeholder="John Doe"
              className="w-full bg-bgElevated border border-borderBase rounded-xl px-4 py-2.5 text-sm text-textPrimary placeholder-textMuted focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-textMuted mb-1.5 uppercase tracking-wider">Email Address</label>
            <input
              name="email" type="email" value={form.email} onChange={handleChange} required
              placeholder="user@example.com"
              disabled={isEdit && editUser?.authProvider === 'google'}
              className="w-full bg-bgElevated border border-borderBase rounded-xl px-4 py-2.5 text-sm text-textPrimary placeholder-textMuted focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
            />
            {isEdit && editUser?.authProvider === 'google' && (
              <p className="text-[11px] text-textMuted mt-1">Email locked — Google OAuth account</p>
            )}
          </div>

          <CustomSelect
            label="Role"
            options={[
              { value: 'user', label: 'User' },
              { value: 'admin', label: 'Admin' }
            ]}
            value={form.role}
            onChange={(val) => setForm({ ...form, role: val })}
          />

          {!isEdit && (
            <div>
              <label className="block text-xs font-semibold text-textMuted mb-1.5 uppercase tracking-wider">Password</label>
              <input
                name="password" type="password" value={form.password} onChange={handleChange}
                placeholder="Set initial password"
                className="w-full bg-bgElevated border border-borderBase rounded-xl px-4 py-2.5 text-sm text-textPrimary placeholder-textMuted focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-borderBase text-textSecondary font-semibold text-sm hover:bg-bgElevated transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {loading ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create User')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ─── User Detail Modal ─── */
function UserDetailModal({ userId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/admin/users/${userId}`, { headers: authHeaders() })
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl bg-bgSurface border border-borderBase rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-borderBase flex justify-between items-center">
          <h3 className="text-base font-bold text-textPrimary">User Details</h3>
          <button onClick={onClose} className="p-2 text-textSecondary hover:text-textPrimary hover:bg-bgElevated rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-bgElevated rounded-xl animate-pulse" />)}</div>
          ) : data ? (
            <>
              <div className="flex items-center gap-4 p-4 bg-bgElevated rounded-xl mb-6">
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {(data.user.name || data.user.email)[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-base font-bold text-textPrimary">{data.user.name}</p>
                  <p className="text-sm text-textMuted">{data.user.email}</p>
                  <div className="flex gap-2 mt-1.5">
                    <Badge color={data.user.role}>{data.user.role}</Badge>
                    <Badge color={data.user.isVerified ? 'active' : 'expired'}>{data.user.isVerified ? 'Verified' : 'Unverified'}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Total', value: data.stats.total, color: 'text-textPrimary', icon: Package },
                  { label: 'Active', value: data.stats.active, color: 'text-emerald-500', icon: CheckCircle },
                  { label: 'Expiring', value: data.stats.expiringSoon, color: 'text-amber-500', icon: Clock },
                  { label: 'Expired', value: data.stats.expired, color: 'text-danger', icon: ShieldAlert },
                ].map(({ label, value, color, icon: Icon }) => (
                  <div key={label} className="bg-bgSurface border border-borderBase rounded-xl p-3 text-center">
                    <Icon size={16} className={`${color} mx-auto mb-1`} />
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                    <p className="text-[11px] text-textMuted">{label}</p>
                  </div>
                ))}
              </div>

              {data.products.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-textPrimary mb-3">Products ({data.products.length})</h4>
                  <div className="space-y-2">
                    {data.products.map(p => {
                      const isExpired = new Date(p.warrantyExpiryDate) <= new Date();
                      const daysLeft = Math.ceil((new Date(p.warrantyExpiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={p._id} className="flex items-center justify-between p-3 bg-bgElevated rounded-xl">
                          <div>
                            <p className="text-sm font-semibold text-textPrimary">{p.productName}</p>
                            <p className="text-xs text-textMuted">{p.category}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-xs font-bold ${isExpired ? 'text-danger' : daysLeft <= 7 ? 'text-amber-500' : 'text-emerald-500'}`}>
                              {isExpired ? 'Expired' : `${daysLeft}d left`}
                            </p>
                            <p className="text-[10px] text-textMuted">{new Date(p.warrantyExpiryDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-textMuted text-sm text-center py-8">Failed to load user details.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Filters ─── */
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Has Active' },
  { key: 'expiring', label: 'Expiring' },
  { key: 'expired', label: 'Has Expired' },
];

/* ─── Main Page ─── */
export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Modal states
  const [detailUserId, setDetailUserId] = useState(null);
  const [editUser, setEditUser] = useState(null);     // null=closed, obj=editing
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // user to delete
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState(null); // { message, type: 'success'|'error' }

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, filter]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/users', {
        params: { search: debouncedSearch, filter, page, limit: 15 },
        headers: authHeaders()
      });
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filter, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await API.delete(`/admin/users/${deleteTarget._id}`, { headers: authHeaders() });
      showToast(res.data.message);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete user', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-textPrimary">User Management</h2>
            <p className="text-textMuted text-sm mt-1">
              {pagination.total !== undefined ? `${pagination.total} total users` : 'Loading...'}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 shadow-md shadow-primary/30 transition-all"
          >
            <UserPlus size={16} /> Add User
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-9 py-2.5 text-sm bg-bgSurface border border-borderBase rounded-xl text-textPrimary placeholder-textMuted focus:outline-none focus:border-primary transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textPrimary">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${filter === f.key ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-bgSurface border border-borderBase text-textSecondary hover:border-primary/40'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-bgSurface border border-borderBase rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-borderBase bg-bgElevated/50">
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-textMuted uppercase tracking-wider">User</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-textMuted uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3.5 text-center text-xs font-bold text-textMuted uppercase tracking-wider">Total</th>
                  <th className="px-5 py-3.5 text-center text-xs font-bold text-textMuted uppercase tracking-wider">Active</th>
                  <th className="px-5 py-3.5 text-center text-xs font-bold text-textMuted uppercase tracking-wider">Expiring</th>
                  <th className="px-5 py-3.5 text-center text-xs font-bold text-textMuted uppercase tracking-wider">Expired</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-textMuted uppercase tracking-wider">Joined</th>
                  <th className="px-5 py-3.5 text-center text-xs font-bold text-textMuted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderBase">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i}>{[...Array(8)].map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 bg-bgElevated rounded animate-pulse" /></td>
                    ))}</tr>
                  ))
                ) : users.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-16 text-center">
                    <User size={40} className="mx-auto text-borderBase mb-3" />
                    <p className="text-textMuted text-sm">No users found</p>
                  </td></tr>
                ) : (
                  users.map((u, i) => (
                    <motion.tr key={u._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="hover:bg-bgElevated/40 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <button className="flex items-center gap-3 text-left w-full" onClick={() => setDetailUserId(u._id)}>
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                            {(u.name || u.email)[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-textPrimary truncate hover:text-primary transition-colors">{u.name}</p>
                            <p className="text-xs text-textMuted truncate">{u.email}</p>
                          </div>
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-bgElevated text-textMuted'}`}>
                          {u.role === 'admin' && <Shield size={10} />} {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-textPrimary">{u.totalProducts}</td>
                      <td className="px-5 py-4 text-center font-bold text-emerald-500">{u.activeCount}</td>
                      <td className="px-5 py-4 text-center font-bold text-amber-500">{u.expiringSoonCount}</td>
                      <td className="px-5 py-4 text-center font-bold text-danger">{u.expiredCount}</td>
                      <td className="px-5 py-4 text-xs text-textMuted">
                        {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditUser(u)}
                            title="Edit User"
                            className="p-1.5 rounded-lg text-textMuted hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(u)}
                            title="Delete User"
                            className="p-1.5 rounded-lg text-textMuted hover:text-danger hover:bg-danger/10 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-borderBase">
              <p className="text-xs text-textMuted">Page {pagination.page} of {pagination.pages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={pagination.page === 1}
                  className="p-2 rounded-lg border border-borderBase text-textSecondary hover:bg-bgElevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={pagination.page === pagination.pages}
                  className="p-2 rounded-lg border border-borderBase text-textSecondary hover:bg-bgElevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-xl text-sm font-semibold shadow-xl ${toast.type === 'error' ? 'bg-danger text-white' : 'bg-emerald-500 text-white'}`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {detailUserId && <UserDetailModal key="detail" userId={detailUserId} onClose={() => setDetailUserId(null)} />}
        {(editUser || showAddModal) && (
          <UserFormModal
            key="form"
            editUser={editUser || null}
            onClose={() => { setEditUser(null); setShowAddModal(false); }}
            onSaved={() => { fetchUsers(); showToast(editUser ? 'User updated successfully' : 'User created successfully'); }}
          />
        )}
        {deleteTarget && (
          <ConfirmDeleteModal
            key="delete"
            user={deleteTarget}
            loading={deleteLoading}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
