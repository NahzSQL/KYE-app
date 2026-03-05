'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { getDashboard, markAllNotificationsRead } from '@/lib/api';
import { DashboardResponse } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string; iconBoxClass: string; icon: string; badgeIcon: string; desc: string; color: string }> = {
  pending_submission: {
    label: 'Pending Submission', color: 'amber',
    badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    iconBoxClass: 'bg-amber-500/10 border-amber-500/20',
    icon: 'pending_actions', badgeIcon: 'schedule',
    desc: 'Please submit your KYE documents to begin the verification process.',
  },
  pending_review: {
    label: 'Pending Review', color: 'amber',
    badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    iconBoxClass: 'bg-amber-500/10 border-amber-500/20',
    icon: 'pending_actions', badgeIcon: 'schedule',
    desc: 'Your documents are being reviewed by the compliance team.',
  },
  verified: {
    label: 'Verified', color: 'primary',
    badgeClass: 'bg-primary/10 text-primary border-primary/20',
    iconBoxClass: 'bg-primary/10 border-primary/20',
    icon: 'verified', badgeIcon: 'check',
    desc: 'Your identity has been verified. You now have full access.',
  },
  rejected: {
    label: 'Rejected', color: 'red',
    badgeClass: 'bg-red-500/10 text-red-500 border-red-500/20',
    iconBoxClass: 'bg-red-500/10 border-red-500/20',
    icon: 'cancel', badgeIcon: 'close',
    desc: 'Your submission was rejected. Please review and resubmit.',
  },
};

export default function StaffDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full p-12">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  const kyeConfig = STATUS_CONFIG[data.kye.status] || STATUS_CONFIG.pending_submission;
  const progressPercent = data.kye.totalSteps > 0 ? (data.kye.step / data.kye.totalSteps) * 100 : 0;
  const isVerified = data.kye.status === 'verified';

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="px-6 py-8 lg:px-20 max-w-7xl mx-auto w-full">
      {/* Welcome */}
      <div className="mb-10 animate-fade-in-up">
        <p className="text-slate-500 text-sm font-medium mb-1">{getGreeting()},</p>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">{data.user.name}</h1>
        <p className="text-slate-500 mt-1">Here&apos;s your verification overview and access status.</p>
      </div>

      {/* KYE Status Hero Card */}
      <div className="glass-card rounded-2xl p-8 mb-8 relative overflow-hidden animate-fade-in-up delay-100">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className={`size-20 rounded-2xl ${kyeConfig.iconBoxClass} border flex items-center justify-center`}>
                <span className={`material-symbols-outlined text-4xl ${
                  kyeConfig.color === 'amber' ? 'text-amber-500' :
                  kyeConfig.color === 'red' ? 'text-red-500' : 'text-primary'
                }`}>{kyeConfig.icon}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-black text-slate-900">KYE Verification</h2>
                <span className={`px-3 py-1 text-xs font-bold rounded-full border uppercase tracking-wider ${kyeConfig.badgeClass}`}>
                  {kyeConfig.label}
                </span>
              </div>
              <p className="text-slate-500 text-sm">{kyeConfig.desc}</p>
              <div className="flex items-center gap-4 mt-3">
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  Submitted: {data.kye.submittedDate ? new Date(data.kye.submittedDate).toLocaleDateString() : '—'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/staff/kye-status"
              className="flex items-center gap-2 px-5 py-3 bg-primary text-white font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-lg">visibility</span>View Status
            </Link>
            <Link href="/staff/kye-submission"
              className="flex items-center gap-2 px-5 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-50 transition-all border border-slate-200">
              <span className="material-symbols-outlined text-lg">edit</span>Update
            </Link>
          </div>
        </div>
        <div className="relative z-10 mt-8">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-slate-500">Verification Progress</span>
            <span className={`${kyeConfig.color === 'amber' ? 'text-amber-500' : kyeConfig.color === 'red' ? 'text-red-500' : 'text-primary'}`}>
              Step {data.kye.step} of {data.kye.totalSteps}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-amber-500 rounded-full shadow-[0_0_12px_rgba(16,183,127,0.4)] animate-progress"
              style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5 animate-fade-in-up delay-200 hover:shadow-lg hover:shadow-slate-100 transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Documents</span>
            <span className="material-symbols-outlined text-primary">description</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{data.kye.documentsUploaded} / {data.kye.documentsRequired}</p>
          <p className="text-xs text-primary mt-1 font-medium">
            {data.kye.documentsUploaded >= data.kye.documentsRequired ? 'All uploaded' : 'Upload required'}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 animate-fade-in-up delay-300 hover:shadow-lg hover:shadow-slate-100 transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Step</span>
            <span className="material-symbols-outlined text-amber-500">hourglass_top</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{data.kye.stepLabel}</p>
          <p className="text-xs text-amber-500 mt-1 font-medium">Step {data.kye.step} of {data.kye.totalSteps}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 animate-fade-in-up delay-400 hover:shadow-lg hover:shadow-slate-100 transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Access Level</span>
            <span className={`material-symbols-outlined ${isVerified ? 'text-primary' : 'text-slate-500'}`}>
              {isVerified ? 'lock_open' : 'lock'}
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900">{data.accessLevel}</p>
          <p className={`text-xs mt-1 font-medium ${isVerified ? 'text-primary' : 'text-slate-500'}`}>
            {isVerified ? 'Full access granted' : 'KYE required for access'}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 animate-fade-in-up delay-500 hover:shadow-lg hover:shadow-slate-100 transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Risk Score</span>
            <span className="material-symbols-outlined text-emerald-400">verified</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{data.kye.riskScore.toFixed(2)}</p>
          <p className="text-xs text-emerald-400 mt-1 font-medium">Low Risk</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Support System Gate */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 relative overflow-hidden animate-fade-in-up delay-400">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-2xl">support_agent</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Degxifi Support System</h3>
                  <p className="text-xs text-slate-500">Access customer support tools and ticketing</p>
                </div>
              </div>
              {isVerified ? (
                <div>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary mt-0.5">check_circle</span>
                    <div>
                      <p className="text-sm font-bold text-primary">Access Granted</p>
                      <p className="text-xs text-slate-500 mt-1">Your KYE is approved. You now have full access to the Support System.</p>
                    </div>
                  </div>
                  <button className="mt-4 w-full py-3 bg-primary text-white font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">open_in_new</span>Open Support System
                  </button>
                </div>
              ) : (
                <div>
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
                    <span className="material-symbols-outlined text-amber-500 mt-0.5">warning</span>
                    <div>
                      <p className="text-sm font-bold text-amber-500">Access Pending</p>
                      <p className="text-xs text-slate-500 mt-1">Your KYE verification must be approved before you can access the Support System.</p>
                    </div>
                  </div>
                  <button disabled className="mt-4 w-full py-3 bg-slate-100 text-slate-500 font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">lock</span>Access Locked — KYE Required
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 animate-fade-in-up delay-500">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary">timeline</span>Activity Timeline
            </h3>
            {data.activities.length === 0 ? (
              <p className="text-slate-500 text-sm">No recent activity</p>
            ) : (
              <div className="space-y-6">
                {data.activities.slice(0, 8).map((a) => (
                  <div key={a.id} className="timeline-item flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      a.type === 'success' ? 'bg-primary/10 text-primary' :
                      a.type === 'error' ? 'bg-red-500/10 text-red-500' :
                      'bg-blue-500/10 text-blue-500'
                    }`}>
                      <span className="material-symbols-outlined text-xl">{a.icon || 'info'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-900">{a.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{a.description}</div>
                      <div className="text-xs text-slate-400 mt-1">{timeAgo(a.date)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 animate-slide-in-right delay-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="size-14 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center overflow-hidden">
                <span className="material-symbols-outlined text-primary text-3xl">person</span>
              </div>
              <div>
                <p className="font-bold text-slate-900">{data.user.name}</p>
                <p className="text-xs text-slate-500">{data.user.email}</p>
                <p className="text-xs text-primary font-medium mt-0.5">{data.user.role}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Department</span>
                <span className="font-medium text-slate-900">{data.user.department}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Region</span>
                <span className="font-medium text-slate-900">Nigeria</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Staff ID</span>
                <span className="font-mono text-primary font-medium text-xs">{data.user.staffId}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 animate-slide-in-right delay-400">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">bolt</span>Quick Actions
            </h4>
            <div className="space-y-3">
              <Link href="/staff/kye-submission"
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-primary/30 transition-all group">
                <span className="material-symbols-outlined text-primary">upload_file</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">Update Documents</p>
                  <p className="text-[10px] text-slate-500">Re-upload or update KYE files</p>
                </div>
                <span className="material-symbols-outlined text-sm text-slate-500">chevron_right</span>
              </Link>
              <Link href="/staff/kye-status"
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-primary/30 transition-all group">
                <span className="material-symbols-outlined text-amber-500">visibility</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">View Detailed Status</p>
                  <p className="text-[10px] text-slate-500">Check review step progress</p>
                </div>
                <span className="material-symbols-outlined text-sm text-slate-500">chevron_right</span>
              </Link>
              <div className={`flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 ${isVerified ? 'hover:border-primary/30 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                <span className={`material-symbols-outlined ${isVerified ? 'text-primary' : 'text-slate-500'}`}>support_agent</span>
                <div className="flex-1">
                  <p className={`text-sm font-bold ${isVerified ? 'text-slate-900' : 'text-slate-500'}`}>Support System</p>
                  <p className="text-[10px] text-slate-500">{isVerified ? 'Full access available' : 'Requires KYE approval'}</p>
                </div>
                <span className="material-symbols-outlined text-sm text-slate-600">{isVerified ? 'chevron_right' : 'lock'}</span>
              </div>
            </div>
          </div>

          {/* Help */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex items-start gap-4 animate-slide-in-right delay-500">
            <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary">help</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 mb-1">Need Help?</p>
              <p className="text-xs text-slate-500 mb-3">Questions about verification or access?</p>
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
