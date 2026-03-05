'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { getAdminStaff, inviteStaff, removeStaff, approveKye, rejectKye } from '@/lib/api';
import { StaffMember, AdminStaffResponse } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  pending_submission: { label: 'Not Submitted', color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200', icon: 'schedule' },
  pending_review: { label: 'Pending Review', color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: 'pending' },
  verified: { label: 'Verified', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', icon: 'verified' },
  rejected: { label: 'Rejected', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: 'cancel' },
};

export default function AdminStaffManagement() {
  const { showToast } = useToast();
  const [data, setData] = useState<AdminStaffResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showInvite, setShowInvite] = useState(false);
  const [invName, setInvName] = useState('');
  const [invEmail, setInvEmail] = useState('');
  const [invDept, setInvDept] = useState('');
  const [invRole, setInvRole] = useState('');
  const [inviting, setInviting] = useState(false);

  const [showReject, setShowReject] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchData = () => {
    setLoading(true);
    getAdminStaff({ search, status: statusFilter })
      .then(setData)
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [search, statusFilter]);

  const handleInvite = async () => {
    if (!invName || !invEmail) { showToast('Name and email required', 'error'); return; }
    setInviting(true);
    try {
      const res = await inviteStaff({ name: invName, email: invEmail, department: invDept, role: invRole });
      showToast(`Staff invited! Temp password: ${res.tempPassword}`);
      setShowInvite(false);
      setInvName(''); setInvEmail(''); setInvDept(''); setInvRole('');
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (staffId: string, name: string) => {
    if (!confirm(`Remove ${name}? This cannot be undone.`)) return;
    try {
      await removeStaff(staffId);
      showToast(`${name} removed`);
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleApprove = async (staffId: string) => {
    try {
      await approveKye(staffId);
      showToast('KYE approved!');
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleReject = async (staffId: string) => {
    if (!rejectReason) { showToast('Please provide a reason', 'error'); return; }
    try {
      await rejectKye(staffId, rejectReason);
      showToast('KYE rejected');
      setShowReject(null);
      setRejectReason('');
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="px-6 py-8 lg:px-10 max-w-[1440px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Staff Management</h1>
          <p className="text-slate-500 mt-1">Manage staff accounts, KYE verifications, and access control.</p>
        </div>
        <button onClick={() => setShowInvite(true)}
          className="px-5 py-3 bg-primary text-white font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 self-start">
          <span className="material-symbols-outlined text-lg">person_add</span>
          Invite New Staff
        </button>
      </div>

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-in-up delay-100">
          {[
            { label: 'Total Staff', value: data.stats.total, icon: 'groups', iconColor: 'text-primary', borderColor: 'border-primary/20' },
            { label: 'Pending Review', value: data.stats.pending, icon: 'pending', iconColor: 'text-amber-500', borderColor: 'border-amber-500/20' },
            { label: 'Verified', value: data.stats.verified, icon: 'verified', iconColor: 'text-primary', borderColor: 'border-primary/20' },
            { label: 'Rejected', value: data.stats.rejected, icon: 'cancel', iconColor: 'text-red-500', borderColor: 'border-red-500/20' },
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
            <input type="text" placeholder="Search by name, email or department..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="form-input w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm transition-all placeholder:text-slate-400" />
          </div>
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-primary">
          <option value="all">All Status</option>
          <option value="pending_submission">Not Submitted</option>
          <option value="pending_review">Pending Review</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Staff Table */}
      {loading ? (
        <div className="flex justify-center p-12">
          <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
        </div>
      ) : !data || data.staff.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300">group_off</span>
          <p className="text-slate-500 mt-3">No staff members found</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-fade-in-up delay-300">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-3">Staff Member</th>
                  <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-3">Department</th>
                  <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-3">KYE Status</th>
                  <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.staff.map((s) => {
                  const cfg = STATUS_CONFIG[s.kyeStatus] || STATUS_CONFIG.pending_submission;
                  return (
                    <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                            {getInitials(s.name)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{s.name}</div>
                            <div className="text-xs text-slate-500">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{s.department}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                          <span className="material-symbols-outlined text-sm">{cfg.icon}</span>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {s.kyeStatus === 'pending_review' && (
                            <>
                              <Link href={`/admin/kye-review?staffId=${s.id}`}
                                className="px-3 py-1.5 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 text-xs font-bold rounded-lg transition-all border border-blue-500/20">
                                Review
                              </Link>
                              <button onClick={() => handleApprove(s.id)}
                                className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold rounded-lg transition-all border border-primary/20">
                                Approve
                              </button>
                              <button onClick={() => setShowReject(s.id)}
                                className="px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-bold rounded-lg transition-all border border-red-500/20">
                                Reject
                              </button>
                            </>
                          )}
                          {s.kyeStatus === 'verified' && (
                            <span className="text-xs text-primary font-bold flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                              <span className="material-symbols-outlined text-sm">verified</span> Verified
                            </span>
                          )}
                          <button onClick={() => handleRemove(s.id, s.name)}
                            className="px-3 py-1.5 bg-slate-100 text-slate-500 hover:bg-red-500/10 hover:text-red-500 text-xs font-medium rounded-lg transition-all ml-auto border border-slate-200 hover:border-red-500/20">
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">person_add</span>
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">Invite Staff Member</h2>
                <p className="text-xs text-slate-500">A temporary password will be generated</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Full Name</label>
                <input type="text" placeholder="e.g. John Doe" value={invName} onChange={(e) => setInvName(e.target.value)}
                  className="form-input w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm transition-all placeholder:text-slate-400" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Email Address</label>
                <input type="email" placeholder="e.g. john@degxifi.com" value={invEmail} onChange={(e) => setInvEmail(e.target.value)}
                  className="form-input w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm transition-all placeholder:text-slate-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1.5">Department</label>
                  <input type="text" placeholder="e.g. Engineering" value={invDept} onChange={(e) => setInvDept(e.target.value)}
                    className="form-input w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm transition-all placeholder:text-slate-400" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1.5">Role</label>
                  <input type="text" placeholder="e.g. Developer" value={invRole} onChange={(e) => setInvRole(e.target.value)}
                    className="form-input w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm transition-all placeholder:text-slate-400" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowInvite(false)}
                className="flex-1 py-3 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all text-sm">Cancel</button>
              <button onClick={handleInvite} disabled={inviting}
                className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 text-sm disabled:opacity-50">
                {inviting ? 'Inviting...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showReject && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500">cancel</span>
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">Reject KYE Submission</h2>
                <p className="text-xs text-slate-500">Provide a reason for the rejection</p>
              </div>
            </div>
            <textarea placeholder="Describe the reason for rejection..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4}
              className="form-input w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm transition-all resize-none placeholder:text-slate-400" />
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowReject(null); setRejectReason(''); }}
                className="flex-1 py-3 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all text-sm">Cancel</button>
              <button onClick={() => handleReject(showReject)}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all text-sm">
                Reject Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
