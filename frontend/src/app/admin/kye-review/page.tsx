'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { getStaffDetail, approveKye, rejectKye, reopenKye } from '@/lib/api';
import { StaffDetail } from '@/types';

const STATUS_CFG: Record<string, { label: string; badgeClass: string; icon: string }> = {
  pending_submission: { label: 'Not Submitted', badgeClass: 'bg-slate-100 text-slate-500 border-slate-200', icon: 'schedule' },
  pending_review: { label: 'Pending Review', badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: 'pending' },
  verified: { label: 'Verified', badgeClass: 'bg-primary/10 text-primary border-primary/20', icon: 'verified' },
  rejected: { label: 'Rejected', badgeClass: 'bg-red-500/10 text-red-500 border-red-500/20', icon: 'cancel' },
};

export default function KyeReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const staffId = searchParams.get('staffId');
  const { showToast } = useToast();

  const [staff, setStaff] = useState<StaffDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!staffId) { router.replace('/admin/staff-management'); return; }
    getStaffDetail(staffId)
      .then(setStaff)
      .catch((err) => { showToast(err.message, 'error'); router.replace('/admin/staff-management'); })
      .finally(() => setLoading(false));
  }, [staffId]);

  const handleApprove = async () => {
    if (!staffId) return;
    setActionLoading(true);
    try {
      await approveKye(staffId);
      showToast('KYE approved!');
      router.push('/admin/staff-management');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!staffId || !rejectReason) { showToast('Provide a reason', 'error'); return; }
    setActionLoading(true);
    try {
      await rejectKye(staffId, rejectReason);
      showToast('KYE rejected');
      router.push('/admin/staff-management');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopen = async () => {
    if (!staffId) return;
    setActionLoading(true);
    try {
      await reopenKye(staffId);
      showToast('KYE reopened for resubmission');
      router.push('/admin/staff-management');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !staff) {
    return (
      <div className="flex items-center justify-center h-full p-12">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  const kye = staff.kye;
  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const cfg = kye ? (STATUS_CFG[kye.status] || STATUS_CFG.pending_submission) : STATUS_CFG.pending_submission;

  return (
    <div className="px-6 py-8 lg:px-10 max-w-5xl mx-auto w-full">
      {/* Back */}
      <button onClick={() => router.push('/admin/staff-management')}
        className="flex items-center gap-1 text-slate-500 hover:text-primary text-sm mb-6 transition-colors font-medium">
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Back to Staff Management
      </button>

      {/* Staff Header Card */}
      <div className="glass-card rounded-2xl p-6 mb-6 animate-fade-in-up">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-lg font-bold">
            {getInitials(staff.name)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-slate-900">{staff.name}</h1>
            <p className="text-slate-500 text-sm">{staff.email} · {staff.role} · {staff.department}</p>
          </div>
          {kye && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${cfg.badgeClass}`}>
              <span className="material-symbols-outlined text-sm">{cfg.icon}</span>
              {cfg.label}
            </span>
          )}
        </div>
      </div>

      {!kye ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300">description</span>
          <p className="text-slate-500 mt-3">No KYE submission found for this staff member.</p>
        </div>
      ) : (
        <>
          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 animate-fade-in-up delay-100">
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">person</span>Personal Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Full Name</span><span className="font-medium text-slate-900">{kye.fullName || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Phone</span><span className="font-medium text-slate-900">{kye.phone || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Date of Birth</span><span className="font-medium text-slate-900">{kye.dob || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Address</span><span className="font-medium text-slate-900 text-right max-w-[200px]">{kye.address || '—'}</span></div>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">info</span>Submission Info
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Reference</span><span className="font-mono font-bold text-primary text-xs">{kye.refId || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Submitted</span><span className="font-medium text-slate-900">{kye.submittedDate ? new Date(kye.submittedDate).toLocaleDateString() : '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Risk Score</span><span className="font-medium text-slate-900">{kye.riskScore.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Documents</span><span className="font-medium text-slate-900">{kye.documentsUploaded}/{kye.documentsRequired}</span></div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 animate-fade-in-up delay-200">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">folder</span>Uploaded Documents
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Government ID', ok: kye.hasIdDocument, detail: kye.idType || 'Not uploaded', icon: 'badge' },
                { label: 'Proof of Address', ok: kye.hasAddressDoc, detail: kye.hasAddressDoc ? 'Uploaded' : 'Not uploaded', icon: 'home' },
                { label: 'Selfie Verification', ok: kye.hasSelfie, detail: kye.hasSelfie ? 'Uploaded' : 'Not uploaded', icon: 'face' },
              ].map((d) => (
                <div key={d.label} className={`p-4 rounded-xl border ${d.ok ? 'bg-primary/5 border-primary/20' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`material-symbols-outlined ${d.ok ? 'text-primary' : 'text-slate-400'}`}>{d.icon}</span>
                    <span className="text-sm font-bold text-slate-900">{d.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`material-symbols-outlined text-lg ${d.ok ? 'text-primary' : 'text-slate-300'}`}>
                      {d.ok ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span className="text-xs text-slate-500">{d.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Notes */}
          {(kye.rejectReason || kye.adminComment) && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 mb-6 animate-fade-in-up delay-300">
              <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500">note</span>Admin Notes
              </h3>
              {kye.rejectReason && (
                <div className="flex items-start gap-2 mb-2">
                  <span className="material-symbols-outlined text-red-500 text-lg mt-0.5">warning</span>
                  <p className="text-sm text-red-600"><strong>Reject Reason:</strong> {kye.rejectReason}</p>
                </div>
              )}
              {kye.adminComment && <p className="text-sm text-slate-600 ml-7">Comment: {kye.adminComment}</p>}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 animate-fade-in-up delay-400">
            {kye.status === 'pending_review' && (
              <>
                <button onClick={handleApprove} disabled={actionLoading}
                  className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  Approve KYE
                </button>
                <button onClick={() => setShowReject(true)} disabled={actionLoading}
                  className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">cancel</span>
                  Reject KYE
                </button>
              </>
            )}
            {(kye.status === 'rejected' || kye.status === 'verified') && (
              <button onClick={handleReopen} disabled={actionLoading}
                className="px-6 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">refresh</span>
                Reopen for Resubmission
              </button>
            )}
          </div>
        </>
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
              <button onClick={() => { setShowReject(false); setRejectReason(''); }}
                className="flex-1 py-3 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all text-sm">Cancel</button>
              <button onClick={handleReject} disabled={actionLoading}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all text-sm disabled:opacity-50">
                Reject Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
