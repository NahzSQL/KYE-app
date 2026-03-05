'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { getKyeStatus } from '@/lib/api';
import { KyeStatusResponse } from '@/types';

const WORKFLOW_STEPS = [
  { label: 'Submission', desc: 'Submit documents & personal details', icon: 'upload_file' },
  { label: 'Document Review', desc: 'Compliance team reviews documents', icon: 'fact_check' },
  { label: 'Face Verification', desc: 'Selfie matched against ID photo', icon: 'face' },
  { label: 'Final Approval', desc: 'Admin grants system access', icon: 'verified' },
];

export default function KyeStatusPage() {
  const { showToast } = useToast();
  const [kye, setKye] = useState<KyeStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getKyeStatus()
      .then(setKye)
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !kye) {
    return (
      <div className="flex items-center justify-center h-full p-12">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  const statusConfig: Record<string, { label: string; badgeClass: string; icon: string; bannerClass: string; desc: string }> = {
    pending_submission: {
      label: 'Pending Submission', icon: 'schedule',
      badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      bannerClass: 'bg-amber-500/5 border-amber-500/20',
      desc: 'Please submit your documents to begin verification.',
    },
    pending_review: {
      label: 'Under Review', icon: 'pending',
      badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      bannerClass: 'bg-amber-500/5 border-amber-500/20',
      desc: 'Your documents are being reviewed by the compliance team.',
    },
    verified: {
      label: 'Verified', icon: 'verified',
      badgeClass: 'bg-primary/10 text-primary border-primary/20',
      bannerClass: 'bg-primary/5 border-primary/20',
      desc: 'Your identity has been verified. Full system access granted.',
    },
    rejected: {
      label: 'Rejected', icon: 'cancel',
      badgeClass: 'bg-red-500/10 text-red-500 border-red-500/20',
      bannerClass: 'bg-red-500/5 border-red-500/20',
      desc: kye.rejectReason ? `Verification rejected: ${kye.rejectReason}` : 'Your submission was rejected. Please contact compliance.',
    },
  };

  const cfg = statusConfig[kye.status] || statusConfig.pending_submission;

  return (
    <div className="px-6 py-8 lg:px-20 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">KYE Status</h1>
        <p className="text-slate-500 mt-1">Track your identity verification progress in real-time.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Banner */}
          <div className={`rounded-2xl border p-6 ${cfg.bannerClass} animate-fade-in-up delay-100`}>
            <div className="flex items-center gap-4">
              <div className={`size-14 rounded-xl border flex items-center justify-center ${cfg.badgeClass}`}>
                <span className="material-symbols-outlined text-3xl">{cfg.icon}</span>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-lg font-black text-slate-900">Verification Status</h2>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full border uppercase tracking-wider ${cfg.badgeClass}`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{cfg.desc}</p>
              </div>
            </div>
          </div>

          {/* Verification Workflow Stepper */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 animate-fade-in-up delay-200">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary">route</span>Verification Workflow
            </h3>
            <div className="space-y-0">
              {WORKFLOW_STEPS.map((ws, i) => {
                const completed = i < kye.step;
                const current = i === kye.step;
                return (
                  <div key={i} className="flex items-start gap-4 relative">
                    {/* Connector line */}
                    {i < WORKFLOW_STEPS.length - 1 && (
                      <div className={`absolute top-12 left-5 w-0.5 h-[calc(100%-8px)] ${completed ? 'bg-primary' : 'bg-slate-200'}`}></div>
                    )}
                    <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 z-10 border-2 transition-all ${
                      completed ? 'bg-primary border-primary text-white' :
                      current ? 'bg-primary/10 border-primary text-primary animate-pulse-glow' :
                      'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                      {completed ? (
                        <span className="material-symbols-outlined text-xl">check</span>
                      ) : (
                        <span className="material-symbols-outlined text-xl">{ws.icon}</span>
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <div className={`text-sm font-bold ${completed ? 'text-primary' : current ? 'text-slate-900' : 'text-slate-400'}`}>
                        {ws.label}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{ws.desc}</p>
                      {completed && (
                        <span className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-1 bg-primary/5 px-2 py-0.5 rounded-full">
                          <span className="material-symbols-outlined text-xs">check</span>Complete
                        </span>
                      )}
                      {current && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-500 font-medium mt-1 bg-amber-500/5 px-2 py-0.5 rounded-full">
                          <span className="material-symbols-outlined text-xs">pending</span>In Progress
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submission Details */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 animate-fade-in-up delay-300">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">info</span>Submission Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-500 block mb-1">Reference ID</span>
                <span className="font-mono font-bold text-primary text-xs">{kye.refId || '—'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-500 block mb-1">Submitted Date</span>
                <span className="font-bold text-slate-900">{kye.submittedDate ? new Date(kye.submittedDate).toLocaleDateString() : '—'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-500 block mb-1">Documents</span>
                <span className="font-bold text-slate-900">{kye.documentsUploaded} / {kye.documentsRequired}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-500 block mb-1">Risk Score</span>
                <span className="font-bold text-slate-900">{kye.riskScore.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Documents Status */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 animate-slide-in-right delay-200">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">folder</span>Documents
            </h4>
            <div className="space-y-3">
              {[
                { label: 'Government ID', ok: kye.documents.hasIdDocument, icon: 'badge' },
                { label: 'Proof of Address', ok: kye.documents.hasAddressDoc, icon: 'home' },
                { label: 'Selfie Verification', ok: kye.documents.hasSelfie, icon: 'face' },
              ].map((d) => (
                <div key={d.label} className={`flex items-center gap-3 p-3 rounded-lg border ${d.ok ? 'bg-primary/5 border-primary/20' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`material-symbols-outlined ${d.ok ? 'text-primary' : 'text-slate-400'}`}>{d.icon}</span>
                  <span className={`text-sm flex-1 ${d.ok ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>{d.label}</span>
                  <span className={`material-symbols-outlined text-lg ${d.ok ? 'text-primary' : 'text-slate-300'}`}>
                    {d.ok ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 animate-slide-in-right delay-300">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">lightbulb</span>Next Steps
            </h4>
            {kye.status === 'pending_submission' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">Complete these to proceed:</p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm">arrow_right</span>Submit personal details</li>
                  <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm">arrow_right</span>Upload government ID</li>
                  <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm">arrow_right</span>Upload proof of address</li>
                  <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm">arrow_right</span>Take selfie for verification</li>
                </ul>
              </div>
            )}
            {kye.status === 'pending_review' && (
              <p className="text-sm text-slate-500">Your submission is being reviewed. Typical review time is 1-2 business days.</p>
            )}
            {kye.status === 'verified' && (
              <p className="text-sm text-slate-500">No further action required. You have full system access.</p>
            )}
            {kye.status === 'rejected' && (
              <p className="text-sm text-slate-500">Please review the rejection reason and resubmit your documents.</p>
            )}
          </div>

          {/* Action */}
          {(kye.status === 'pending_submission' || kye.status === 'rejected') && (
            <Link href="/staff/kye-submission"
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 animate-slide-in-right delay-400">
              <span className="material-symbols-outlined text-lg">upload_file</span>
              {kye.status === 'rejected' ? 'Resubmit Documents' : 'Start Submission'}
            </Link>
          )}

          {/* Help */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex items-start gap-4 animate-slide-in-right delay-500">
            <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary">help</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 mb-1">Need Help?</p>
              <p className="text-xs text-slate-500 mb-3">Questions about your verification?</p>
              <a className="text-primary text-xs font-bold flex items-center gap-1 hover:underline" href="mailto:compliance@degxifi.com">
                Contact Compliance <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
