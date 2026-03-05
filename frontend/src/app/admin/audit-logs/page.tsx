'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import { getAuditLogs, clearAuditLogs } from '@/lib/api';
import { AuditLogResponse } from '@/types';

export default function AuditLogsPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<AuditLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const fetchData = () => {
    setLoading(true);
    getAuditLogs({
      search: search || undefined,
      action: actionFilter !== 'all' ? actionFilter : undefined,
      date: dateFilter || undefined,
    })
      .then(setData)
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [search, actionFilter, dateFilter]);

  const handleClear = async () => {
    if (!confirm('Clear all audit logs? This cannot be undone.')) return;
    try {
      await clearAuditLogs();
      showToast('Audit logs cleared');
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleExport = () => {
    if (!data || data.logs.length === 0) { showToast('No logs to export', 'error'); return; }
    const csv = ['Admin,Action,Date,Details'];
    data.logs.forEach((l) => {
      csv.push(`"${l.admin}","${l.action}","${new Date(l.date).toLocaleString()}","${l.details || ''}"`);
    });
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported!');
  };

  const getActionColor = (action: string) => {
    if (action.includes('approve') || action.includes('verify')) return 'text-primary bg-primary/10 border-primary/20';
    if (action.includes('reject')) return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (action.includes('remove') || action.includes('delete') || action.includes('clear')) return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (action.includes('invite') || action.includes('create')) return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    return 'text-slate-500 bg-slate-100 border-slate-200';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('approve') || action.includes('verify')) return 'check_circle';
    if (action.includes('reject')) return 'cancel';
    if (action.includes('remove') || action.includes('delete')) return 'delete';
    if (action.includes('invite') || action.includes('create')) return 'person_add';
    if (action.includes('clear')) return 'clear_all';
    if (action.includes('reopen')) return 'refresh';
    return 'history';
  };

  return (
    <div className="px-6 py-8 lg:px-10 max-w-[1440px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Audit Logs</h1>
          <p className="text-slate-500 mt-1">Track all administrative actions and compliance events.</p>
        </div>
        <div className="flex gap-2 self-start">
          <button onClick={handleExport}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">download</span>
            Export CSV
          </button>
          <button onClick={handleClear}
            className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold rounded-xl hover:bg-red-500/20 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">delete</span>
            Clear Logs
          </button>
        </div>
      </div>

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-in-up delay-100">
          {[
            { label: 'Total Actions', value: data.stats.total, icon: 'history', iconColor: 'text-primary', borderColor: 'border-primary/20' },
            { label: 'Approvals', value: data.stats.approvals, icon: 'check_circle', iconColor: 'text-primary', borderColor: 'border-primary/20' },
            { label: 'Rejections', value: data.stats.rejections, icon: 'cancel', iconColor: 'text-red-500', borderColor: 'border-red-500/20' },
            { label: 'Other Actions', value: data.stats.other, icon: 'more_horiz', iconColor: 'text-blue-500', borderColor: 'border-blue-500/20' },
          ].map((s) => (
            <div key={s.label} className={`bg-white border ${s.borderColor} rounded-xl p-5 stat-card`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{s.label}</span>
                <span className={`material-symbols-outlined ${s.iconColor}`}>{s.icon}</span>
              </div>
              <p className="text-3xl font-black text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-center animate-fade-in-up delay-200">
        <div className="flex-1 min-w-[220px]">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
            <input type="text" placeholder="Search by admin, action or details..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="form-input w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm transition-all placeholder:text-slate-400" />
          </div>
        </div>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-primary">
          <option value="all">All Actions</option>
          <option value="approve">Approvals</option>
          <option value="reject">Rejections</option>
          <option value="invite">Invitations</option>
          <option value="remove">Removals</option>
        </select>
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-primary" />
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex justify-center p-12">
          <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
        </div>
      ) : !data || data.logs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300">receipt_long</span>
          <p className="text-slate-500 mt-3">No audit logs found</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-fade-in-up delay-300">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-3">Admin</th>
                  <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-3">Action</th>
                  <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-3">Date & Time</th>
                  <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {data.logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900">{log.admin}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getActionColor(log.action)}`}>
                        <span className="material-symbols-outlined text-sm">{getActionIcon(log.action)}</span>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(log.date).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 max-w-[300px] truncate">{log.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
