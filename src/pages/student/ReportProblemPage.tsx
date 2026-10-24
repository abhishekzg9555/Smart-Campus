import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Building,
  ProblemCategory,
  Priority
} from '../../types';
import { createComplaint } from '../../services/complaintService';
import { uploadPhoto } from '../../services/storageService';
import { ImageUpload } from '../../components/common/ImageUpload';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import confetti from 'canvas-confetti';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Building2,
  MapPin,
  Tag,
  Layers,
  Sparkles,
  ArrowRight,
  FileText
} from 'lucide-react';

interface ReportProblemPageProps {
  onComplaintSubmitted?: (complaintId: string, docId: string) => void;
  onViewMyComplaints?: () => void;
  onComplaintCreated?: (createdId: string) => void;
  onCancel?: () => void;
}

const BUILDINGS: Building[] = [
  'CSE Department',
  'Mechanical Department',
  'Library',
  'Admin Block',
  'Hostel',
  'Other',
];

const CATEGORIES: ProblemCategory[] = [
  'Electrical',
  'Plumbing',
  'Cleanliness',
  'Furniture',
  'Infrastructure',
  'Safety',
  'Other',
];

const FLOORS = [
  'Ground Floor',
  '1st Floor',
  '2nd Floor',
  '3rd Floor',
  '4th Floor',
  'Basement',
  'Rooftop / Terrace',
  'Outdoor Campus Area',
];

export const ReportProblemPage: React.FC<ReportProblemPageProps> = ({
  onComplaintSubmitted,
  onViewMyComplaints,
  onComplaintCreated,
  onCancel,
}) => {
  const { user, userProfile, updateStudentId } = useAuth();

  const handleMyComplaints = onViewMyComplaints || onCancel || (() => {});
  const handleSubmitSuccess = (complaintId: string, docId: string) => {
    if (onComplaintSubmitted) {
      onComplaintSubmitted(complaintId, docId);
    } else if (onComplaintCreated) {
      onComplaintCreated(docId);
    } else if (onViewMyComplaints) {
      onViewMyComplaints();
    }
  };

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [building, setBuilding] = useState<Building>('CSE Department');
  const [floor, setFloor] = useState<string>('Ground Floor');
  const [location, setLocation] = useState<string>('');
  const [category, setCategory] = useState<ProblemCategory>('Electrical');
  const [priority, setPriority] = useState<Priority>('Normal');
  const [description, setDescription] = useState<string>('');
  const [rollNumberInput, setRollNumberInput] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success state
  const [submittedData, setSubmittedData] = useState<{
    complaintId: string;
    docId: string;
    building: string;
    location: string;
    category: string;
    priority: Priority;
  } | null>(null);

  const handleImageSelected = (file: File | null, dataUrl: string | null) => {
    setSelectedFile(file);
    setPhotoPreview(dataUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form Validations
    if (!photoPreview) {
      setErrorMessage('Please attach a photograph of the problem (or select a sample test photo).');
      return;
    }

    if (!location.trim()) {
      setErrorMessage('Please specify the exact room or location (e.g. Room 204, East Wing corridor).');
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      setErrorMessage('Please describe the problem in at least 10 characters so maintenance can assess tools.');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalPhotoUrl = photoPreview;

      // If selectedFile was passed without compressed preview, do instant convert
      if (selectedFile && (!photoPreview || !photoPreview.startsWith('data:image/'))) {
        finalPhotoUrl = await uploadPhoto(selectedFile, 'complaints', user?.uid || 'student');
      }

      const effectiveUid = userProfile?.uid || user?.uid || 'student_guest';
      const effectiveEmail = userProfile?.email || user?.email || 'student@campuscare.edu';
      const effectiveName = userProfile?.name || user?.displayName || 'Campus Student';
      const enteredRoll = rollNumberInput.trim().toUpperCase();
      const effectiveStudentId = userProfile?.rollNo || userProfile?.studentId || (enteredRoll || 'Pending Assignment');

      if (!userProfile?.studentId && !userProfile?.rollNo && enteredRoll && updateStudentId) {
        try {
          await updateStudentId(enteredRoll);
        } catch {
          // non-blocking
        }
      }

      const result = await createComplaint({
        studentUid: effectiveUid,
        studentId: effectiveStudentId,
        studentName: effectiveName,
        studentEmail: effectiveEmail,
        building,
        floor,
        location: location.trim(),
        category,
        priority,
        description: description.trim(),
        photoUrl: finalPhotoUrl,
      });

      // Trigger Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // no-op
      }

      setSubmittedData({
        complaintId: result.complaintId,
        docId: result.id,
        building,
        location: location.trim(),
        category,
        priority,
      });

      // Clear Form for next submission
      setSelectedFile(null);
      setPhotoPreview(null);
      setLocation('');
      setDescription('');
    } catch (err: any) {
      console.error('Error creating complaint:', err);
      setErrorMessage(err.message || 'Failed to submit complaint. Please check your connection.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setSubmittedData(null);
    setSelectedFile(null);
    setPhotoPreview(null);
    setLocation('');
    setDescription('');
    setPriority('Normal');
    setCategory('Electrical');
    setBuilding('CSE Department');
    setFloor('Ground Floor');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Report Campus Infrastructure Problem
            </h1>
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Form
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Submit broken or unsafe infrastructure details to the central maintenance office.
          </p>
        </div>

        <button
          type="button"
          onClick={handleMyComplaints}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors shrink-0"
        >
          <FileText className="w-4 h-4 text-blue-600" />
          <span>View My Past Complaints</span>
        </button>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs sm:text-sm text-red-700 flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. Photo Upload Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              1
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Upload Problem Photograph</h3>
          </div>
          <ImageUpload
            onImageSelected={handleImageSelected}
            previewUrl={photoPreview}
            label="Problem Photograph"
            helperText="Upload a clear photograph showing the damage or malfunction. (JPG/PNG/WEBP)"
            required
          />
        </div>

        {/* 2. Campus Location Details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              2
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Campus Location</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Department Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Department *</span>
              </label>
              <select
                value={building}
                onChange={(e) => setBuilding(e.target.value as Building)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              >
                {BUILDINGS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Floor Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Floor Level *</span>
              </label>
              <select
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              >
                {FLOORS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Room / Exact Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Room Number / Specific Location *</span>
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Room 204 (Lab 3), Boys Washroom 1st Floor, Main Staircase"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Student Roll Number (if not already set in profile) */}
          {!userProfile?.studentId && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Student Roll / Registration ID</span>
                </span>
                <span className="text-[11px] font-normal text-slate-400">Optional</span>
              </label>
              <input
                type="text"
                value={rollNumberInput}
                onChange={(e) => setRollNumberInput(e.target.value)}
                placeholder="e.g. STU-2024-001 (will be saved to your profile)"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>
          )}
        </div>

        {/* 3. Category & Priority */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              3
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Classification & Urgency</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                <span>Problem Category *</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProblemCategory)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Cards */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Priority Level *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Normal', 'Medium', 'High'] as Priority[]).map((p) => {
                  const isSelected = priority === p;
                  let colorClasses = '';
                  if (p === 'High') {
                    colorClasses = isSelected
                      ? 'bg-red-600 text-white border-red-600 ring-2 ring-red-300'
                      : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
                  } else if (p === 'Medium') {
                    colorClasses = isSelected
                      ? 'bg-amber-600 text-white border-amber-600 ring-2 ring-amber-300'
                      : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100';
                  } else {
                    colorClasses = isSelected
                      ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300'
                      : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
                  }

                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${colorClasses}`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Problem Description *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue clearly (e.g. Sparks coming from switchboard near bench 4, posing fire risk; water pooling on floor)..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Minimum 10 characters. Please provide enough details so the technicians can bring appropriate replacement parts.
            </p>
          </div>
        </div>

        {/* Submit Button & Progress Bar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          {isSubmitting && uploadProgress > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-600 font-semibold">
                <span>Uploading photo & registering in Firestore...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Submitting Campus Complaint...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Complaint to Maintenance</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Success Modal */}
      <Modal
        isOpen={submittedData !== null}
        onClose={resetForm}
        title="Complaint Submitted Successfully 🎉"
        subtitle="Your request has been routed to the Campus Maintenance & Estate Cell"
        maxWidth="md"
      >
        {submittedData && (
          <div className="space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Unique Tracking Reference
              </p>
              <h2 className="text-3xl font-extrabold text-blue-700 font-mono tracking-tight mt-1">
                {submittedData.complaintId}
              </h2>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Initial Status:</span>
                <StatusBadge status="Reported" size="sm" />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Priority:</span>
                <PriorityBadge priority={submittedData.priority} size="sm" />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department & Room:</span>
                <span className="font-semibold text-slate-900">
                  {submittedData.building?.replace('Building', 'Department')} ({submittedData.location})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Category:</span>
                <span className="font-semibold text-slate-900">{submittedData.category}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              You will receive real-time notifications as facility managers review your complaint, assign
              technicians, and complete the repair with photographic proof.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const docId = submittedData.docId;
                  const customId = submittedData.complaintId;
                  resetForm();
                  handleSubmitSuccess(customId, docId);
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Track Complaint Timeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Report Another
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
