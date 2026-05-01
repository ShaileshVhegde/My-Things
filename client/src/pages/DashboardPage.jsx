import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ShieldCheck, AlertTriangle, CheckCircle, Clock, Package, TrendingUp, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import ErrorBoundary from '../components/ErrorBoundary';
import apiClient from '../utils/apiClient';

const CATEGORY_COLORS = ['#6C47FF', '#00D4AA', '#FF6B35', '#FF3B5C', '#00C896', '#7D5EFF', '#FFAD33'];

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }) };

function StatCard({ icon: Icon, label, value, color, delay }) {
  return (
    <motion.div custom={delay} variants={fadeUp} initial="hidden" animate="visible"
      className="bg-bgSurface border border-borderBase rounded-2xl p-5 flex items-center gap-4 hover:border-borderStrong transition-colors"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center`} style={{ backgroundColor: `${color}20` }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <p className="text-textMuted text-xs font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-display font-bold text-textPrimary mt-0.5">{value}</p>
      </div>
    </motion.div>
  );
}

function AlertItem({ item, idx }) {
  const urgency = item.daysLeft <= 7 ? 'danger' : item.daysLeft <= 14 ? 'warn' : 'accent';
  const colors = { danger: '#FF3B5C', warn: '#FF6B35', accent: '#00D4AA' };

  return (
    <motion.div custom={idx} variants={fadeUp} initial="hidden" animate="visible"
      className="flex items-center justify-between py-3 border-b border-borderBase last:border-0 group"
    >
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[urgency] }} />
        <div>
          <p className="text-sm font-semibold text-textPrimary">{item.name}</p>
          <p className="text-xs text-textMuted">Expires {new Date(item.expiryDate).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link to={`/analyze?productId=${item.id}`} className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a5 5 0 1 0 5 5"/><path d="M8.5 8.5c-.828 1.333-.828 4.167 0 5.5"/><path d="M15.5 8.5c.828 1.333.828 4.167 0 5.5"/><circle cx="12" cy="17" r="1"/><path d="M12 18v4"/><path d="M8 22h8"/></svg>
          Ask AI
        </Link>
        <Link to={`/products/${item.id}`} className="text-xs font-bold px-2 py-1 rounded-lg hover:opacity-80 transition-opacity"
          style={{ backgroundColor: `${colors[urgency]}20`, color: colors[urgency] }}>
          {item.daysLeft === 0 ? 'Today' : `${item.daysLeft}d left`}
        </Link>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    
    const fetchStats = async () => {
      try {
        const res = await apiClient.get('/products/stats');
        if (isMounted) {
          setStats(res.data);
          setError('');
        }
      } catch (err) {
        if (isMounted) {
          if (!err.response) {
            setError('Could not connect to the server. Please check your connection.');
          } else {
            setError(err.response?.data?.error || 'Failed to load dashboard statistics.');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchStats();
    
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto">
          <div className="bg-bgSurface border border-borderBase rounded-2xl p-8 flex flex-col items-center justify-center text-center mt-12">
            <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mb-4">
              <AlertTriangle className="text-danger" size={32} />
            </div>
            <h2 className="text-xl font-display font-bold text-textPrimary mb-2">Connection Error</h2>
            <p className="text-textMuted max-w-md">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-6 px-5 py-2 bg-primary hover:bg-primaryHover text-white rounded-xl transition-colors font-medium">
              Try Again
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const pieData = [
    { name: 'Active', value: stats.active, color: '#00C896' },
    { name: 'Expiring Soon', value: stats.expiringSoon, color: '#FF6B35' },
    { name: 'Expired', value: stats.expired, color: '#FF3B5C' },
  ].filter(d => d.value > 0);

  return (
    <AppLayout>
      <ErrorBoundary>
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} 
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl lg:text-3xl font-display font-bold text-textPrimary">Dashboard</h1>
              <p className="text-textMuted text-sm mt-1">Your warranty overview at a glance</p>
            </div>
            <Link to="/products/add" 
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primaryHover text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all w-full sm:w-auto"
            >
              <Package size={18} />
              Add New Product
            </Link>
          </motion.div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Package} label="Total Products" value={stats.total} color="#6C47FF" delay={0} />
            <StatCard icon={CheckCircle} label="Active" value={stats.active} color="#00C896" delay={1} />
            <StatCard icon={Clock} label="Expiring Soon" value={stats.expiringSoon} color="#FF6B35" delay={2} />
            <StatCard icon={AlertTriangle} label="Expired" value={stats.expired} color="#FF3B5C" delay={3} />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <ErrorBoundary>
              <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible"
                className="bg-bgSurface border border-borderBase rounded-2xl p-6"
              >
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp size={18} className="text-primary" />
                  <h2 className="font-display font-bold text-textPrimary">Warranty Status</h2>
                </div>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                        paddingAngle={3} dataKey="value">
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val, name) => [val, name]}
                        contentStyle={{ background: '#12141F', border: '1px solid #1E2235', borderRadius: 12, color: '#F0F0FF', fontSize: 12 }} />
                      <Legend iconType="circle" iconSize={8} formatter={(val) => <span style={{ color: '#A0A8CC', fontSize: 12 }}>{val}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center">
                    <p className="text-textMuted text-sm">No products yet. <span className="text-primary">Add one!</span></p>
                  </div>
                )}
              </motion.div>
            </ErrorBoundary>

            {/* Bar Chart */}
            <ErrorBoundary>
              <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible"
                className="bg-bgSurface border border-borderBase rounded-2xl p-6"
              >
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp size={18} className="text-accent" />
                  <h2 className="font-display font-bold text-textPrimary">Expiry Trend (6 months)</h2>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.monthlyTrend} barSize={28}>
                    <XAxis dataKey="month" tick={{ fill: '#6B7499', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6B7499', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: 'rgba(108,71,255,0.05)' }}
                      contentStyle={{ background: '#12141F', border: '1px solid #1E2235', borderRadius: 12, color: '#F0F0FF', fontSize: 12 }} />
                    <Bar dataKey="expiring" name="Expiring" fill="#6C47FF" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </ErrorBoundary>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alerts */}
            <ErrorBoundary>
              <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible"
                className="bg-bgSurface border border-borderBase rounded-2xl p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Bell size={18} className="text-warn" />
                  <h2 className="font-display font-bold text-textPrimary">Alerts — Expiring Soon</h2>
                </div>
                {stats.expiringSoonList.length > 0 ? (
                  <div>
                    {stats.expiringSoonList.slice(0, 5).map((item, i) => (
                      <AlertItem key={item.id} item={item} idx={i} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle size={32} className="text-success mx-auto mb-2" />
                    <p className="text-textMuted text-sm">No warranties expiring soon!</p>
                  </div>
                )}
              </motion.div>
            </ErrorBoundary>

            {/* Category Breakdown */}
            <ErrorBoundary>
              <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible"
                className="bg-bgSurface border border-borderBase rounded-2xl p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Package size={18} className="text-accent" />
                  <h2 className="font-display font-bold text-textPrimary">Category Insights</h2>
                </div>
                {stats.categoryBreakdown.length > 0 ? (
                  <div className="space-y-3">
                    {stats.categoryBreakdown.map((cat, i) => (
                      <div key={cat.name} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-textSecondary font-medium">{cat.name}</span>
                            <span className="text-textPrimary font-bold">{cat.count}</span>
                          </div>
                          <div className="h-1.5 bg-bgElevated rounded-full overflow-hidden">
                            <motion.div className="h-full rounded-full" initial={{ width: 0 }}
                              animate={{ width: `${(cat.count / stats.total) * 100}%` }}
                              transition={{ delay: i * 0.1 + 0.3, duration: 0.6 }}
                              style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-textMuted text-sm">No category data yet.</p>
                  </div>
                )}
              </motion.div>
            </ErrorBoundary>
          </div>
        </div>
      </ErrorBoundary>
    </AppLayout>
  );
}

