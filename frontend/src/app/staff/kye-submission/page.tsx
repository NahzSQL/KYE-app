'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { getKyeStatus, submitPersonalDetails, uploadDocument, finalizeKye } from '@/lib/api';

const STEPS = [
  { label: 'Personal Details', icon: 'person' },
  { label: 'Documents', icon: 'description' },
  { label: 'Selfie Verification', icon: 'photo_camera' },
  { label: 'Review & Submit', icon: 'check_circle' },
];

export default function KyeSubmissionPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');

  const [idType, setIdType] = useState('passport');
  const [idFile, setIdFile] = useState<File | null>(null);
  const [addressFile, setAddressFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  const [idUploaded, setIdUploaded] = useState(false);
  const [addressUploaded, setAddressUploaded] = useState(false);
  const [selfieUploaded, setSelfieUploaded] = useState(false);

  const idRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getKyeStatus()
      .then((kye) => {
        if (kye.status === 'verified') {
          showToast('Your KYE is already verified!', 'info');
          router.replace('/staff/kye-status');
          return;
        }
        if (kye.status === 'pending_review') {
          showToast('Your KYE is under review.', 'info');
          router.replace('/staff/kye-status');
          return;
        }
        if (kye.personalDetails.fullName) setFullName(kye.personalDetails.fullName);
        if (kye.personalDetails.phone) setPhone(kye.personalDetails.phone);
        if (kye.personalDetails.dob) setDob(kye.personalDetails.dob);
        if (kye.personalDetails.address) setAddress(kye.personalDetails.address);
        if (kye.documents.hasIdDocument) setIdUploaded(true);
        if (kye.documents.hasAddressDoc) setAddressUploaded(true);
        if (kye.documents.hasSelfie) setSelfieUploaded(true);
      })
      .catch(() => {})
      .finally(() => setPageLoading(false));

    if (user) setEmail(user.email);
  }, []);

  const handleSavePersonal = async () => {
    if (!fullName || !phone || !dob || !address) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    setLoading(true);
    try {
      await submitPersonalDetails({ fullName, phone, dob, address });
      showToast('Personal details saved!');
      setCurrentStep(1);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDoc = async (type: 'id' | 'address', file: File) => {
    setLoading(true);
    try {
      await uploadDocument(type, file, type === 'id' ? idType : undefined);
      if (type === 'id') setIdUploaded(true);
      else setAddressUploaded(true);
      showToast(`${type === 'id' ? 'ID Document' : 'Proof of Address'} uploaded!`);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSelfie = async (file: File) => {
    setLoading(true);
    try {
      await uploadDocument('selfie', file);
      setSelfieUploaded(true);
      showToast('Selfie uploaded!');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    setLoading(true);
    try {
      const res = await finalizeKye();
      showToast(`KYE submitted! REF: ${res.refId}`);
      await refreshUser();
      router.push('/staff/kye-status');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-full p-12">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 lg:px-20 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">KYE Submission</h1>
        <p className="text-slate-500 mt-1">Complete each step to verify your identity within the Degxifi system.</p>
      </div>

      {/* Step Indicator */}
      <div className="glass-card rounded-2xl p-6 mb-8 animate-fade-in-up delay-100">
        <div className="flex items-center justify-between">
          {STEPS.map((step, i) => (
            <div key={i} className="flex-1 flex flex-col items-center relative">
              <button
                onClick={() => i <= currentStep && setCurrentStep(i)}
                className={`size-12 rounded-xl flex items-center justify-center border-2 transition-all z-10 ${
                  i < currentStep
                    ? 'bg-primary border-primary text-white'
                    : i === currentStep
                    ? 'bg-primary/10 border-primary text-primary animate-pulse-glow'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                {i < currentStep ? (
                  <span className="material-symbols-outlined text-xl">check</span>
                ) : (
                  <span className="material-symbols-outlined text-xl">{step.icon}</span>
                )}
              </button>
              <span className={`text-xs font-bold mt-2 text-center ${
                i <= currentStep ? 'text-primary' : 'text-slate-400'
              }`}>{step.label}</span>
              {i < STEPS.length - 1 && (
                <div className={`absolute top-6 left-[calc(50%+24px)] w-[calc(100%-48px)] h-0.5 ${
                  i < currentStep ? 'bg-primary' : 'bg-slate-200'
                }`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 0: Personal Details */}
      {currentStep === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 animate-fade-in-up delay-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">person</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Personal Details</h2>
              <p className="text-xs text-slate-500">Provide your basic information for identity verification</p>
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">Full Legal Name</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">badge</span>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder="As it appears on your government ID"
                  className="form-input w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm transition-all placeholder:text-slate-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                <input type="email" value={email} disabled
                  className="w-full pl-11 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 text-sm cursor-not-allowed" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Phone Number</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">phone</span>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 XXX XXX XXXX"
                    className="form-input w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm transition-all placeholder:text-slate-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Date of Birth</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">calendar_today</span>
                  <input type="date" value={dob} onChange={(e) => setDob(e.target.value)}
                    className="form-input w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm transition-all" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">Residential Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400 text-xl">home</span>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3}
                  placeholder="Full residential address"
                  className="form-input w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm transition-all resize-none placeholder:text-slate-400" />
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-8">
            <button onClick={handleSavePersonal} disabled={loading}
              className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2">
              {loading && <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>}
              Save & Continue
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Documents */}
      {currentStep === 1 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 animate-fade-in-up delay-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">description</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Document Upload</h2>
              <p className="text-xs text-slate-500">Upload clear, legible copies of your documents</p>
            </div>
          </div>
          <div className="space-y-6">
            {/* Government ID */}
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">badge</span>
                  <h3 className="text-sm font-bold text-slate-900">Government-Issued ID</h3>
                </div>
                {idUploaded && (
                  <span className="text-xs text-primary font-bold flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-full">
                    <span className="material-symbols-outlined text-sm">check_circle</span> Uploaded
                  </span>
                )}
              </div>
              <select value={idType} onChange={(e) => setIdType(e.target.value)}
                className="w-full mb-4 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-primary">
                <option value="passport">International Passport</option>
                <option value="drivers-license">Driver&apos;s License</option>
                <option value="nin">National ID (NIN)</option>
              </select>
              <input ref={idRef} type="file" accept=".png,.jpg,.jpeg,.pdf" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) { setIdFile(f); handleUploadDoc('id', f); } }} />
              <div
                onClick={() => !loading && idRef.current?.click()}
                className="upload-zone border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-3xl text-slate-400 mb-2">cloud_upload</span>
                <p className="text-sm font-medium text-slate-600">{idFile ? idFile.name : 'Click to upload or drag and drop'}</p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG or PDF up to 10MB</p>
              </div>
            </div>

            {/* Proof of Address */}
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500">home</span>
                  <h3 className="text-sm font-bold text-slate-900">Proof of Address</h3>
                </div>
                {addressUploaded && (
                  <span className="text-xs text-primary font-bold flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-full">
                    <span className="material-symbols-outlined text-sm">check_circle</span> Uploaded
                  </span>
                )}
              </div>
              <input ref={addressRef} type="file" accept=".png,.jpg,.jpeg,.pdf" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) { setAddressFile(f); handleUploadDoc('address', f); } }} />
              <div
                onClick={() => !loading && addressRef.current?.click()}
                className="upload-zone border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-3xl text-slate-400 mb-2">cloud_upload</span>
                <p className="text-sm font-medium text-slate-600">{addressFile ? addressFile.name : 'Click to upload or drag and drop'}</p>
                <p className="text-xs text-slate-400 mt-1">Utility bill, bank statement (recent)</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <button onClick={() => setCurrentStep(0)}
              className="px-6 py-3 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">arrow_back</span>Back
            </button>
            <button onClick={() => { if (idUploaded && addressUploaded) setCurrentStep(2); else showToast('Upload both documents first', 'error'); }}
              className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
              Continue<span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Selfie */}
      {currentStep === 2 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 animate-fade-in-up delay-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">photo_camera</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Selfie Verification</h2>
              <p className="text-xs text-slate-500">Upload a clear photo of your face for identity matching</p>
            </div>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 mb-6 flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-500 mt-0.5">tips_and_updates</span>
            <div className="text-xs text-slate-600">
              <p className="font-bold text-amber-600 mb-1">Photo Requirements</p>
              <ul className="space-y-1 list-disc list-inside text-slate-500">
                <li>Face clearly visible, well-lit</li>
                <li>No sunglasses or hats</li>
                <li>Plain background preferred</li>
              </ul>
            </div>
          </div>

          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">face</span>
                <h3 className="text-sm font-bold text-slate-900">Selfie Photo</h3>
              </div>
              {selfieUploaded && (
                <span className="text-xs text-primary font-bold flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-full">
                  <span className="material-symbols-outlined text-sm">check_circle</span> Uploaded
                </span>
              )}
            </div>
            <input ref={selfieRef} type="file" accept=".png,.jpg,.jpeg" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) { setSelfieFile(f); handleUploadSelfie(f); } }} />
            <div
              onClick={() => !loading && selfieRef.current?.click()}
              className="upload-zone border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-3xl text-slate-400 mb-2">add_a_photo</span>
              <p className="text-sm font-medium text-slate-600">{selfieFile ? selfieFile.name : 'Click to upload your selfie'}</p>
              <p className="text-xs text-slate-400 mt-1">PNG or JPG up to 5MB</p>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <button onClick={() => setCurrentStep(1)}
              className="px-6 py-3 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">arrow_back</span>Back
            </button>
            <button onClick={() => { if (selfieUploaded) setCurrentStep(3); else showToast('Upload selfie first', 'error'); }}
              className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
              Continue<span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Submit */}
      {currentStep === 3 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 animate-fade-in-up delay-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">checklist</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Review & Submit</h2>
              <p className="text-xs text-slate-500">Verify your information before final submission</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">person</span>Personal Details
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">Name:</span> <span className="font-medium text-slate-900">{fullName}</span></div>
                <div><span className="text-slate-500">Email:</span> <span className="font-medium text-slate-900">{email}</span></div>
                <div><span className="text-slate-500">Phone:</span> <span className="font-medium text-slate-900">{phone}</span></div>
                <div><span className="text-slate-500">DOB:</span> <span className="font-medium text-slate-900">{dob}</span></div>
              </div>
              <div className="mt-2 text-sm"><span className="text-slate-500">Address:</span> <span className="font-medium text-slate-900">{address}</span></div>
            </div>

            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">description</span>Documents
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-lg ${idUploaded ? 'text-primary' : 'text-red-400'}`}>
                    {idUploaded ? 'check_circle' : 'cancel'}
                  </span>
                  <span className="text-slate-900">Government ID ({idType})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-lg ${addressUploaded ? 'text-primary' : 'text-red-400'}`}>
                    {addressUploaded ? 'check_circle' : 'cancel'}
                  </span>
                  <span className="text-slate-900">Proof of Address</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-lg ${selfieUploaded ? 'text-primary' : 'text-red-400'}`}>
                    {selfieUploaded ? 'check_circle' : 'cancel'}
                  </span>
                  <span className="text-slate-900">Selfie Verification</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-6 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary mt-0.5">info</span>
            <p className="text-xs text-slate-500">By submitting, you confirm that all information provided is accurate and that you consent to Degxifi&apos;s identity verification process.</p>
          </div>

          <div className="flex justify-between mt-8">
            <button onClick={() => setCurrentStep(2)}
              className="px-6 py-3 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">arrow_back</span>Back
            </button>
            <button onClick={handleFinalize} disabled={loading || !idUploaded || !addressUploaded || !selfieUploaded}
              className="px-8 py-3.5 bg-primary text-white font-black rounded-xl hover:brightness-110 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center gap-2">
              {loading && <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>}
              <span className="material-symbols-outlined text-lg">send</span>
              Submit KYE for Review
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
