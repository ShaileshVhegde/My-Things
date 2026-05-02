import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import { Users, Package, ShieldAlert, Clock, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import AdminLayout from '../../components/navigation/AdminLayout';



function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-bgSurface border border-borderBase rounded-2xl p-5 flex items-center gap-4"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-textPrimary">{value ?? '—'}</p>
        <p className="text-xs font-medium text-textMuted mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get('/admin/stats', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setStats(res.data);
      } catch (err) {
        console.error('Error fetching admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { icon: Users, label: 'Total Users', value: stats?.totalUsers, color: 'bg-primary', delay: 0 },
    { icon: Package, label: 'Total Products', value: stats?.totalProducts, color: 'bg-indigo-500', delay: 0.05 },
    { icon: TrendingUp, label: 'Active Products', value: stats?.activeProducts, color: 'bg-emerald-500', delay: 0.1 },
    { icon: Clock, label: 'Expiring Soon', value: stats?.expiringSoonProducts, color: 'bg-amber-500', delay: 0.15 },
    { icon: ShieldAlert, label: 'Expired Products', value: stats?.expiredProducts, color: 'bg-danger', delay: 0.2 },
  ];

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-textPrimary">Platform Overview</h2>
          <p className="text-textMuted text-sm mt-1">Real-time statistics across all users and products.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-bgSurface border border-borderBase rounded-2xl p-5 h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {statCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-bgSurface border border-borderBase rounded-2xl p-6"
        >
          <h3 className="text-base font-bold text-textPrimary mb-4">Quick Navigation</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a href="/admin/users" className="flex items-center gap-3 p-4 rounded-xl bg-bgElevated hover:bg-primary/10 hover:border-primary/30 border border-borderBase transition-all group">
              <Users size={20} className="text-primary" />
              <div>
                <p className="text-sm font-semibold text-textPrimary group-hover:text-primary transition-colors">Manage Users</p>
                <p className="text-xs text-textMuted">View all users, search, and inspect product stats</p>
              </div>
            </a>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
