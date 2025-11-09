import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_CONFIG } from '../constants/config';
import { LoginResponse } from '../utils/api';

type StudentSubject = {
  _id: string;
  subject?: { _id: string; name: string };
};

type Student = {
  _id: string;
  name: string;
  fatherName: string;
  contact: string;
  status?: 'active' | 'inactive';
  subjects?: StudentSubject[];
  remarks?: string;
};

type TutorResponse = {
  _id: string;
  name: string;
  students?: Student[];
};

const buildUrl = (template: string, params: Record<string, string>) =>
  template.replace(/:([A-Za-z_]+)/g, (_, key) => encodeURIComponent(params[key] || ''));

interface Props {
  userData: LoginResponse;
  onBack?: () => void;
}

export default function StudentManagement({ userData, onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [tutor, setTutor] = useState<TutorResponse | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentDetail, setStudentDetail] = useState<Student | null>(null);
  const [form, setForm] = useState<Partial<Student>>({});

    const authHeaders = useMemo(() => {
    const token = userData?.token;

    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
    };import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Popover from '../../common/Popover';

// Static select data (adjust if you already import these)
const sessionTypes = [
  { value: 'arabic', label: 'Arabic' },
  { value: 'tuition', label: 'Tuition' }
];

const sessionTimings = [
  { value: 'after_fajr', label: 'Post Fajr' },
  { value: 'after_zohar', label: 'Post Zohar' },
  { value: 'after_asar', label: 'Post Asar' },
  { value: 'after_maghrib', label: 'Post Maghrib' },
  { value: 'after_isha', label: 'Post Isha' }
];

const tuitionQualifications = [
  { value: 'graduation', label: 'Graduation' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'ssc', label: 'SSC' },
  { value: 'others', label: 'Others' }
];

const arabicQualifications = [
  { value: 'alim', label: 'Alim' },
  { value: 'hafiz', label: 'Hafiz' },
  { value: 'others', label: 'Others' }
];

const qualificationStatuses = [
  { value: 'pursuing', label: 'Pursuing' },
  { value: 'completed', label: 'Completed' }
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
];

const subjectsList = [
  { value: 'Mathematics', label: 'Mathematics' },
  { value: 'Science', label: 'Science' },
  { value: 'English', label: 'English' },
  { value: 'Social Studies', label: 'Social Studies' },
  { value: 'Islamic Studies', label: 'Islamic Studies' },
  { value: 'Urdu', label: 'Urdu' },
  { value: 'Hindi', label: 'Hindi' }
];

const initialState = {
  name: '',
  email: '',
  phone: '',
  password: '', // optional on update
  address: '',
  assignedCenter: '', // id
  subjects: [],
  sessionType: '',
  sessionTiming: '',
  qualificationType: '',
  qualificationOther: '',
  qualificationStatus: '',
  yearOfCompletion: '',
  madarsahName: '',
  collegeName: '',
  specialization: '',
  assignedHadiyaAmount: '',
  bankName: '',
  accountNumber: '',
  bankBranch: '',
  ifscCode: '',
  aadharNumber: '',
  status: 'active',
  // NEW
  students: []
};

const UpdateTutorForm = ({
  onSubmit,         // async (payload) => PUT /api/tutors/:id
  formData,         // initial tutor data (may include populated assignedCenter and students)
  fieldErrors,      // external validation
  isSubmitting,
  tutorId,
  onCancel
}) => {
  const navigate = useNavigate();

  // Core form state
  const [localForm, setLocalForm] = useState(initialState);
  const [validationErrors, setValidationErrors] = useState({});
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false
  });

  // Popovers
  const [showCancelPopover, setShowCancelPopover] = useState(false);
  const [showSuccessPopover, setShowSuccessPopover] = useState(false);
  const [showErrorPopover, setShowErrorPopover] = useState(false);

  // Centers state
  const [centers, setCenters] = useState([]);
  const [centersError, setCentersError] = useState(null);
  const [centerQuery, setCenterQuery] = useState('');
  const [showCenterDropdown, setShowCenterDropdown] = useState(false);

  // Students-by-center
  const [studentsByCenter, setStudentsByCenter] = useState([]);
  const [studentsError, setStudentsError] = useState(null);
  const [studentFilter, setStudentFilter] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Initialize with incoming tutor data
  useEffect(() => {
    if (!formData) return;
    const processed = { ...initialState, ...formData };

    // assignedCenter may be object or id
    processed.assignedCenter = formData.assignedCenter?._id || formData.assignedCenter || '';

    // subjects ensure array
    processed.subjects = Array.isArray(formData.subjects)
      ? formData.subjects
      : (formData.subjects ? [formData.subjects] : []);

    // students ensure id array
    processed.students = Array.isArray(formData.students)
      ? formData.students.map((s) => (typeof s === 'object' ? (s._id || s.id) : s))
      : (formData.students ? [formData.students] : []);

    setLocalForm(processed);
  }, [formData]);

  // Accept external field errors
  useEffect(() => {
    if (fieldErrors) setValidationErrors(fieldErrors);
  }, [fieldErrors]);

  // Fetch centers on mount
  useEffect(() => {
    const fetchCenters = async () => {
      setCentersError(null);
      try {
        const token = (() => {
          try { return JSON.parse(localStorage.getItem('userData'))?.token || null; } catch { return null; }
        })();
        const res = await fetch(`${import.meta.env.VITE_API_URL}/centers`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!res.ok) {
          setCentersError(res.status === 401 ? 'Unauthorized. Please log in again.' : 'Failed to load centers.');
          setCenters([]);
          return;
        }
        const data = await res.json();
        setCenters(Array.isArray(data) ? data : []);
      } catch {
        setCentersError('Error fetching centers.');
        setCenters([]);
      }
    };
    fetchCenters();
  }, []);

  const handleRetryCenters = () => {
    setCentersError(null);
    (async () => {
      try {
        const token = (() => {
          try { return JSON.parse(localStorage.getItem('userData'))?.token || null; } catch { return null; }
        })();
        const res = await fetch(`${import.meta.env.VITE_API_URL}/centers`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!res.ok) {
          setCentersError(res.status === 401 ? 'Unauthorized. Please log in again.' : 'Failed to load centers.');
          setCenters([]);
          return;
        }
        const data = await res.json();
        setCenters(Array.isArray(data) ? data : []);
      } catch {
        setCentersError('Error fetching centers.');
        setCenters([]);
      }
    })();
  };

  // Filtered centers for search dropdown
  const filteredCenters = useMemo(() => {
    const q = centerQuery.toLowerCase().trim();
    if (!q) return centers;
    return centers.filter((c) =>
      [c.name, c.area, c.city].filter(Boolean).some((f) => f.toLowerCase().includes(q))
    );
  }, [centers, centerQuery]);

  // Fetch students for a center
  const fetchStudentsForCenter = async (centerId) => {
    setStudentsError(null);
    setLoadingStudents(true);
    setStudentsByCenter([]);
    try {
      const token = (() => {
        try { return JSON.parse(localStorage.getItem('userData'))?.token || null; } catch { return null; }
      })();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/students/getByCenter/${centerId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        setStudentsError(res.status === 404 ? 'No students found for this center.' : 'Failed to fetch students.');
        return;
      }
      const data = await res.json();
      setStudentsByCenter(Array.isArray(data) ? data : []);
    } catch {
      setStudentsError('Error fetching students for this center.');
    } finally {
      setLoadingStudents(false);
    }
  };

  // Auto-load students for the existing center on first render/when center changes
  useEffect(() => {
    if (localForm.assignedCenter) {
      fetchStudentsForCenter(localForm.assignedCenter);
    } else {
      setStudentsByCenter([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localForm.assignedCenter]);

  // Handlers
  const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;
  const normalizeArray = (v) => (Array.isArray(v) ? v : (v ? [v] : []));

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === 'name') {
      const originalValue = value;
      newValue = value.replace(/[^a-zA-Z'\s]/g, '');
      if (newValue !== originalValue) {
        setValidationErrors((p) => ({ ...p, name: 'Only letters, spaces, and apostrophes are allowed.' }));
      }
      if (newValue.length > 50) {
        newValue = newValue.substring(0, 50);
        setValidationErrors((p) => ({ ...p, name: 'Name cannot exceed 50 characters.' }));
      }
    }

    if (name === 'address') {
      const originalValue = value;
      newValue = value.replace(/[^a-zA-Z0-9\s,.\-\\/|]/g, '');
      if (newValue !== originalValue) {
        setValidationErrors((p) => ({ ...p, address: 'Only letters, numbers, spaces, commas, periods, and hyphens are allowed.' }));
      }
      if (newValue.length > 200) {
        newValue = newValue.substring(0, 200);
        setValidationErrors((p) => ({ ...p, address: 'Address cannot exceed 200 characters.' }));
      }
    }

    if (name === 'password') {
      const pwd = value;
      setPasswordStrength({
        length: pwd.length >= 8,
        uppercase: /[A-Z]/.test(pwd),
        lowercase: /[a-z]/.test(pwd),
        number: /[0-9]/.test(pwd),
        specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
      });
      if (pwd.length > 10) {
        setValidationErrors((p) => ({ ...p, password: 'Password must be 10 characters or less' }));
      } else if (pwd.length > 0 && pwd.length < 8) {
        setValidationErrors((p) => ({ ...p, password: 'Password must be at least 8 characters' }));
      } else {
        setValidationErrors((p) => {
          const n = { ...p };
          delete n.password;
          return n;
        });
      }
    }

    if (name === 'yearOfCompletion') {
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length > 4) return;
      newValue = digitsOnly;
      if (digitsOnly.length === 4) {
        const year = parseInt(digitsOnly, 10);
        const currentYear = new Date().getFullYear();
        if (year < 1950 || year > currentYear + 10) {
          setValidationErrors((p) => ({ ...p, yearOfCompletion: `Year must be between 1950 and ${currentYear + 10}` }));
        } else {
          setValidationErrors((p) => {
            const n = { ...p };
            delete n.yearOfCompletion;
            return n;
          });
        }
      }
    }

    if (name === 'assignedHadiyaAmount') {
      const numeric = String(value).replace(/\D/g, '');
      if (numeric.length > 6) {
        setValidationErrors((p) => ({ ...p, assignedHadiyaAmount: 'Hadiya cannot exceed 6 digits' }));
        newValue = numeric.substring(0, 6);
      } else {
        newValue = numeric;
        const num = numeric ? parseInt(numeric, 10) : 0;
        if (num > 100000) {
          setValidationErrors((p) => ({ ...p, assignedHadiyaAmount: 'Hadiya cannot exceed 100,000' }));
        } else {
          setValidationErrors((p) => {
            const n = { ...p };
            delete n.assignedHadiyaAmount;
            return n;
          });
        }
      }
    }

    if (name === 'bankName') {
      const originalValue = value;
      newValue = value.replace(/[^a-zA-Z\s]/g, '');
      if (newValue !== originalValue) {
        setValidationErrors((p) => ({ ...p, bankName: 'Only letters and spaces are allowed.' }));
      }
      if (newValue.length > 30) {
        newValue = newValue.substring(0, 30);
        setValidationErrors((p) => ({ ...p, bankName: 'Bank name cannot exceed 30 characters.' }));
      }
    }

    if (name === 'bankBranch') {
      const originalValue = value;
      newValue = value.replace(/[^a-zA-Z0-9\s]/g, '');
      if (newValue !== originalValue) {
        setValidationErrors((p) => ({ ...p, bankBranch: 'Only letters, numbers, and spaces are allowed.' }));
      }
      if (newValue.length > 30) {
        newValue = newValue.substring(0, 30);
        setValidationErrors((p) => ({ ...p, bankBranch: 'Bank branch cannot exceed 30 characters.' }));
      }
    }

    if (name === 'specialization' || name === 'collegeName' || name === 'madarsahName' || name === 'qualificationOther') {
      const originalValue = value;
      newValue = value.replace(/[^a-zA-Z0-9\s,.\-]/g, '');
      if (newValue !== originalValue) {
        setValidationErrors((p) => ({ ...p, [name]: 'Only letters, numbers, spaces, commas, periods, and hyphens are allowed.' }));
      }
      if (newValue.length > 50) {
        newValue = newValue.substring(0, 50);
        setValidationErrors((p) => ({ ...p, [name]: 'Field cannot exceed 50 characters.' }));
      }
    }

    setLocalForm((prev) => ({ ...prev, [name]: newValue }));
    setValidationErrors((prev) => {
      const c = { ...prev };
      delete c[name];
      return c;
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length > 10) return;
      setLocalForm((p) => ({ ...p, phone: digitsOnly }));
      return;
    }

    if (name === 'accountNumber') {
      const originalValue = value;
      const digitsOnly = originalValue.replace(/\D/g, '');
      if (digitsOnly.length > 20) return;
      setLocalForm((p) => ({ ...p, accountNumber: digitsOnly }));
      if (digitsOnly !== originalValue) {
        setValidationErrors((pr) => ({ ...pr, accountNumber: 'Only digits are allowed' }));
      } else {
        setValidationErrors((pr) => {
          const n = { ...pr };
          delete n.accountNumber;
          return n;
        });
      }
      return;
    }

    if (name === 'aadharNumber') {
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length > 12) return;
      // space every 4 digits for readability
      let formatted = '';
      for (let i = 0; i < digitsOnly.length; i++) {
        if (i > 0 && i % 4 === 0) formatted += ' ';
        formatted += digitsOnly[i];
      }
      setLocalForm((p) => ({ ...p, aadharNumber: formatted }));
      return;
    }

    if (name === 'sessionType' || name === 'sessionTiming' || name === 'qualificationType' || name === 'qualificationStatus' || name === 'status') {
      setLocalForm((p) => ({ ...p, [name]: value }));
      return;
    }

    if (name === 'ifscCode') {
      let cleaned = value.toUpperCase().replace(/\s/g, '');
      if (cleaned.length > 11) cleaned = cleaned.substring(0, 11);
      setLocalForm((p) => ({ ...p, ifscCode: cleaned }));
      return;
    }

    // default
    setLocalForm((p) => ({ ...p, [name]: value }));
  };

  const getQualificationOptions = () => (localForm.sessionType === 'arabic' ? arabicQualifications : tuitionQualifications);

  const toggleSubject = (subjectValue) => {
    const current = Array.isArray(localForm.subjects) ? [...localForm.subjects] : [];
    const next = current.includes(subjectValue) ? current.filter((s) => s !== subjectValue) : [...current, subjectValue];
    setLocalForm((p) => ({ ...p, subjects: next }));
  };

  const toggleStudentSelection = (id) => {
    setLocalForm((prev) => {
      const current = Array.isArray(prev.students) ? prev.students : [];
      const exists = current.includes(id);
      return { ...prev, students: exists ? current.filter((x) => x !== id) : [...current, id] };
    });
  };

  const validate = () => {
    const errs = {};
    if (!/^\d{10}$/.test(localForm.phone || '')) errs.phone = 'Valid 10-digit phone number is required.';
    if (!localForm.assignedCenter) errs.assignedCenter = 'Assigned Center is required.';

    // subjects
    const subjectsArray = Array.isArray(localForm.subjects)
      ? localForm.subjects
      : (localForm.subjects ? [localForm.subjects] : []);
    if (subjectsArray.length === 0) errs.subjects = 'At least one subject must be selected.';

    // if password provided, enforce length 8-10
    if (localForm.password && (localForm.password.length < 8 || localForm.password.length > 10)) {
      errs.password = 'Password must be 8-10 characters.';
    }

    // optional numeric validations
    if (localForm.assignedHadiyaAmount && isNaN(Number(localForm.assignedHadiyaAmount))) {
      errs.assignedHadiyaAmount = 'Hadiya must be a number.';
    }

    if (localForm.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(localForm.ifscCode)) {
      errs.ifscCode = 'IFSC code must be in the format XXXX0XXXXXX.';
    }

    if (localForm.aadharNumber) {
      const digitsOnly = localForm.aadharNumber.replace(/\D/g, '');
      if (digitsOnly.length !== 12) errs.aadharNumber = 'Aadhar number must be 12 digits.';
    }

    return errs;
  };

  const buildUpdatePayload = () => {
    const payload = { ...localForm };
    payload.subjects = Array.isArray(payload.subjects) ? payload.subjects : (payload.subjects ? [payload.subjects] : []);
    payload.students = Array.isArray(payload.students) ? payload.students : (payload.students ? [payload.students] : []);

    // Remove empty strings
    Object.keys(payload).forEach((k) => {
      if (typeof payload[k] === 'string' && !payload[k].trim()) delete payload[k];
    });

    // Do not send password if blank
    if (!payload.password) delete payload.password;

    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsFormSubmitting(true);

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setIsFormSubmitting(false);
      return;
    }

    try {
      const payload = buildUpdatePayload();
      await onSubmit(payload); // parent will perform PUT /api/tutors/:id
      setShowSuccessPopover(true);
      setTimeout(() => {
        setShowSuccessPopover(false);
        if (onCancel) onCancel();
      }, 1500);
    } catch (error) {
      console.error('Error updating tutor:', error);
      setValidationErrors((p) => ({ ...p, general: error?.message || 'Failed to update tutor' }));
      setShowErrorPopover(true);
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleCancel = () => setShowCancelPopover(true);
  const handleCancelConfirmed = () => {
    if (onCancel) onCancel();
    else navigate('/admin-dashboard', { state: { activeTab: 'tutors' } });
  };

  // UI
  return (
    <div className="w-full max-w-full mx-auto p-2 bg-white rounded shadow-md border border-blue-100 overflow-x-auto">
      <h2 className="text-xl font-bold text-white mb-3 pb-2 bg-gradient-to-r from-blue-500 to-blue-700 rounded-t-lg p-3 -mx-3 -mt-3">
        Update Tutor
      </h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Main Grid Layout - 2 Columns */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start max-w-7xl mx-auto">

          {/* Left Column - Personal & Session Info */}
          <div className="space-y-4">
            {/* Personal Information */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm min-h-[320px] flex flex-col">
              <h3 className="text-lg font-semibold text-blue-800 mb-3 pb-2 border-b border-blue-200">Personal Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={localForm.name || ''}
                    onChange={handleChange}
                    name="name"
                    maxLength={50}
                    className={`w-full px-3 py-1.5 border ${validationErrors.name ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm`}
                  />
                  {validationErrors.name && <div className="text-red-500 text-sm mt-1">{validationErrors.name}</div>}
                  <div className="text-xs text-gray-500 mt-1">{(localForm.name || '').length}/50 characters</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    value={localForm.email || ''}
                    onChange={handleChange}
                    name="email"
                    maxLength={50}
                    className={`w-full px-3 py-1.5 border ${validationErrors.email ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                    placeholder="Enter email"
                    required
                  />
                  {validationErrors.email && <div className="text-red-500 text-sm mt-1">{validationErrors.email}</div>}
                  <div className="text-xs text-gray-500 mt-1">{(localForm.email || '').length}/50 characters</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone <span className="text-red-600">*</span> <span className="text-gray-500">(Login username)</span>
                  </label>
                  <input
                    type="tel"
                    value={localForm.phone || ''}
                    onChange={handleInputChange}
                    name="phone"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="1234567890"
                    required
                  />
                  <div className="text-gray-500 text-sm mt-1">
                    Enter exactly 10 digits. Currently: {localForm.phone ? localForm.phone.length : 0}/10
                  </div>
                  {validationErrors.phone && <div className="text-red-500 text-sm mt-1">{validationErrors.phone}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Login Password <span className="text-gray-500">(Leave blank to keep current)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={localForm.password || ''}
                      onChange={handleChange}
                      name="password"
                      maxLength={10}
                      className={`w-full px-3 py-1.5 border ${validationErrors.password ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                      placeholder="Enter new password or leave blank"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {validationErrors.password && <div className="text-red-500 text-sm mt-1">{validationErrors.password}</div>}
                  <div className="text-gray-500 text-sm mt-1">
                    {localForm.password ? `${localForm.password.length}/10 characters` : 'Optional'}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    value={localForm.address || ''}
                    onChange={handleChange}
                    name="address"
                    maxLength={200}
                    className={`w-full px-3 py-1.5 border ${validationErrors.address ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-vertical`}
                    rows="4"
                    style={{ minHeight: '80px' }}
                    required
                  />
                  {validationErrors.address && <div className="text-red-500 text-sm mt-1">{validationErrors.address}</div>}
                  <div className="text-xs text-gray-500 mt-1">{(localForm.address || '').length}/200 characters</div>
                </div>
              </div>

              {localForm.password && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                  <div className="flex flex-wrap gap-2">
                    <span className={passwordStrength.length ? 'text-green-600' : 'text-gray-500'}>
                      {passwordStrength.length ? '✓' : '✗'} 8+ chars
                    </span>
                    <span className={(passwordStrength.uppercase || passwordStrength.lowercase) ? 'text-green-600' : 'text-gray-500'}>
                      {(passwordStrength.uppercase || passwordStrength.lowercase) ? '✓' : '✗'} Letter
                    </span>
                    <span className={passwordStrength.number ? 'text-green-600' : 'text-gray-500'}>
                      {passwordStrength.number ? '✓' : '✗'} Number
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Session Information */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm min-h-[400px] flex flex-col">
              <h3 className="text-lg font-semibold text-blue-800 mb-3 pb-2 border-b border-blue-200">Session Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Session Type <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={localForm.sessionType || ''}
                    onChange={handleInputChange}
                    name="sessionType"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    required
                  >
                    <option value="">Select Session Type</option>
                    {sessionTypes.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Session Timing <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={localForm.sessionTiming || ''}
                    onChange={handleInputChange}
                    name="sessionTiming"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    required
                  >
                    <option value="">Select Timing</option>
                    {sessionTimings.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assigned Center + Students */}
              <div className="mt-4 space-y-4">
                {/* Assigned Center */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Center <span className="text-red-600">*</span>
                  </label>

                  {centersError ? (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm mb-2">
                      <span className="block">{centersError}</span>
                      <button
                        type="button"
                        onClick={handleRetryCenters}
                        className="mt-1 px-2 py-1 bg-red-500 hover:bg-red-700 text-white text-xs rounded"
                      >
                        Retry
                      </button>
                    </div>
                  ) : null}

                  <div className="relative">
                    <input
                      type="text"
                      value={centerQuery}
                      onChange={(e) => setCenterQuery(e.target.value)}
                      onFocus={() => setShowCenterDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCenterDropdown(false), 200)}
                      placeholder="Search for a center"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                    {showCenterDropdown && (
                      <div className="absolute z-10 w-full bg-white border border-gray-300 rounded shadow-lg mt-1 max-h-60 overflow-auto">
                        {filteredCenters.map((center) => (
                          <div
                            key={center._id}
                            className="px-3 py-1.5 hover:bg-gray-100 cursor-pointer"
                            onMouseDown={() => {
                              setLocalForm((prev) => ({ ...prev, assignedCenter: center._id, students: [] }));
                              setCenterQuery(center.name);
                              setShowCenterDropdown(false);
                              fetchStudentsForCenter(center._id);
                            }}
                          >
                            {center.name}{center.area ? `, ${center.area}` : ''}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {validationErrors.assignedCenter && (
                    <div className="text-red-500 text-sm mt-1">{validationErrors.assignedCenter}</div>
                  )}
                </div>

                {/* Students for selected center */}
                {localForm.assignedCenter ? (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-800">Students</h3>
                      {loadingStudents && <span className="text-sm text-gray-600">Loading…</span>}
                    </div>

                    {studentsError ? (
                      <div className="text-red-600 text-sm mb-2">{studentsError}</div>
                    ) : (
                      <>
                        <div className="mb-2">
                          <input
                            type="text"
                            value={studentFilter}
                            onChange={(e) => setStudentFilter(e.target.value)}
                            placeholder="Filter by student name"
                            className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          />
                        </div>

                        <div className="text-sm text-gray-600 mb-2">
                          Click to select/deselect; filtered by name only.
                        </div>

                        <div className="flex flex-wrap gap-2 max-h-64 overflow-auto">
                          {studentsByCenter
                            .filter((s) => (s?.name || '').toLowerCase().includes(studentFilter.toLowerCase()))
                            .map((s) => {
                              const id = s._id || s.id;
                              const selected = Array.isArray(localForm.students) && localForm.students.includes(id);
                              return (
                                <button
                                  key={id}
                                  type="button"
                                  onClick={() => toggleStudentSelection(id)}
                                  className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 ${
                                    selected
                                      ? 'bg-blue-100 text-blue-700 border-blue-700'
                                      : 'bg-white text-gray-700 border-gray-400 hover:bg-gray-100'
                                  }`}
                                  title={s.name}
                                >
                                  {s.name}
                                </button>
                              );
                            })}
                        </div>

                        {Array.isArray(localForm.students) && localForm.students.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {localForm.students.map((sid) => {
                              const s = studentsByCenter.find((x) => (x._id || x.id) === sid);
                              const label = s ? s.name : sid;
                              return (
                                <span
                                  key={sid}
                                  className="px-3 py-1.5 rounded-full text-sm font-medium border-2 bg-blue-50 text-blue-700 border-blue-700"
                                >
                                  {label}
                                  <button
                                    type="button"
                                    onClick={() => toggleStudentSelection(sid)}
                                    className="ml-2 text-blue-800 hover:text-blue-900"
                                    aria-label="Remove"
                                  >
                                    ×
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Subjects */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subjects <span className="text-red-600">*</span>
              </label>
              <p className="text-sm text-gray-500 mb-2">Select subjects by clicking on them</p>
              <div className="flex flex-wrap gap-2">
                {subjectsList.map((subject) => (
                  <button
                    type="button"
                    key={subject.value}
                    onClick={() => toggleSubject(subject.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 ${
                      localForm.subjects?.includes(subject.value)
                        ? 'bg-blue-100 text-blue-700 border-blue-700'
                        : 'bg-gray-50 text-gray-700 border-black hover:bg-gray-100'
                    }`}
                  >
                    {subject.label}
                  </button>
                ))}
              </div>
              {validationErrors.subjects && (
                <div className="text-red-500 text-sm mt-1">{validationErrors.subjects}</div>
              )}
            </div>
          </div>

          {/* Right Column - Educational Details & Other Info */}
          <div className="space-y-4">
            {/* Educational Details */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm min-h-[280px] flex flex-col">
              <h3 className="text-lg font-semibold text-blue-800 mb-3 pb-2 border-b border-blue-200">Educational Details</h3>

              {localForm.sessionType ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Qualification <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={localForm.qualificationType || ''}
                      onChange={handleInputChange}
                      name="qualificationType"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      required
                    >
                      <option value="">Select Qualification</option>
                      {(localForm.sessionType === 'tuition' ? tuitionQualifications : arabicQualifications).map((q) => (
                        <option key={q.value} value={q.value}>{q.label}</option>
                      ))}
                    </select>
                  </div>

                  {localForm.qualificationType === 'others' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Specify Other Qualification <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={localForm.qualificationOther || ''}
                        onChange={handleChange}
                        name="qualificationOther"
                        maxLength={50}
                        className={`w-full px-3 py-1.5 border ${validationErrors.qualificationOther ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                        placeholder="Enter qualification details"
                        required
                      />
                      {validationErrors.qualificationOther && (
                        <div className="text-red-500 text-sm mt-1">{validationErrors.qualificationOther}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">{(localForm.qualificationOther || '').length}/50 characters</div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={localForm.qualificationStatus || ''}
                      onChange={handleInputChange}
                      name="qualificationStatus"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      required
                    >
                      <option value="">Select Status</option>
                      {qualificationStatuses.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year of Completion <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={localForm.yearOfCompletion || ''}
                      onChange={handleChange}
                      name="yearOfCompletion"
                      className={`w-full px-3 py-1.5 border ${validationErrors.yearOfCompletion ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                      placeholder="YYYY"
                      maxLength={4}
                      required
                    />
                    {validationErrors.yearOfCompletion && (
                      <div className="text-red-500 text-sm mt-1">{validationErrors.yearOfCompletion}</div>
                    )}
                  </div>

                  {(localForm.sessionType === 'tuition' && (localForm.qualificationType === 'graduation' || localForm.qualificationType === 'intermediate')) && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Specialization <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={localForm.specialization || ''}
                        onChange={handleChange}
                        name="specialization"
                        maxLength={50}
                        className={`w-full px-3 py-1.5 border ${validationErrors.specialization ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                        placeholder="e.g., Computer Science"
                        required
                      />
                      {validationErrors.specialization && (
                        <div className="text-red-500 text-sm mt-1">{validationErrors.specialization}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">{(localForm.specialization || '').length}/50 characters</div>
                    </div>
                  )}

                  {localForm.sessionType === 'tuition' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        College Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={localForm.collegeName || ''}
                        onChange={handleChange}
                        name="collegeName"
                        maxLength={50}
                        className={`w-full px-3 py-1.5 border ${validationErrors.collegeName ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                        placeholder="Enter college name"
                        required
                      />
                      {validationErrors.collegeName && (
                        <div className="text-red-500 text-sm mt-1">{validationErrors.collegeName}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">{(localForm.collegeName || '').length}/50 characters</div>
                    </div>
                  )}

                  {localForm.sessionType === 'arabic' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Madarsah Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={localForm.madarsahName || ''}
                        onChange={handleChange}
                        name="madarsahName"
                        maxLength={50}
                        className={`w-full px-3 py-1.5 border ${validationErrors.madarsahName ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                        placeholder="Enter madarsah name"
                        required
                      />
                      {validationErrors.madarsahName && (
                        <div className="text-red-500 text-sm mt-1">{validationErrors.madarsahName}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">{(localForm.madarsahName || '').length}/50 characters</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Please select a session type first to configure educational details.</p>
                </div>
              )}
            </div>

            {/* Hadiya Information */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm min-h-[150px] flex flex-col">
              <h3 className="text-lg font-semibold text-blue-800 mb-3 pb-2 border-b border-blue-200">Hadiya Information</h3>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Hadiya Amount <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  value={localForm.assignedHadiyaAmount || ''}
                  onChange={handleChange}
                  name="assignedHadiyaAmount"
                  className={`w-full px-3 py-1.5 border ${validationErrors.assignedHadiyaAmount ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                  required
                />
                {validationErrors.assignedHadiyaAmount && (
                  <div className="text-red-500 text-sm mt-1">{validationErrors.assignedHadiyaAmount}</div>
                )}
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm min-h-[320px] flex flex-col">
              <h3 className="text-lg font-semibold text-blue-800 mb-3 pb-2 border-b border-blue-200">Bank Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number</label>
                  <input
                    type="text"
                    value={localForm.aadharNumber || ''}
                    onChange={handleInputChange}
                    name="aadharNumber"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="XXXX XXXX XXXX"
                  />
                  {validationErrors.aadharNumber && (
                    <div className="text-red-500 text-sm mt-1">{validationErrors.aadharNumber}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={localForm.bankName || ''}
                    onChange={handleChange}
                    name="bankName"
                    maxLength={30}
                    className={`w-full px-3 py-1.5 border ${validationErrors.bankName ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                    placeholder="e.g., State Bank of India"
                  />
                  {validationErrors.bankName && (
                    <div className="text-red-500 text-sm mt-1">{validationErrors.bankName}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Branch</label>
                  <input
                    type="text"
                    value={localForm.bankBranch || ''}
                    onChange={handleChange}
                    name="bankBranch"
                    maxLength={30}
                    className={`w-full px-3 py-1.5 border ${validationErrors.bankBranch ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                    placeholder="e.g., Main Branch"
                  />
                  {validationErrors.bankBranch && (
                    <div className="text-red-500 text-sm mt-1">{validationErrors.bankBranch}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={localForm.accountNumber || ''}
                    onChange={handleInputChange}
                    name="accountNumber"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="5-20 digits"
                    maxLength={20}
                  />
                  {validationErrors.accountNumber && (
                    <div className="text-red-500 text-sm mt-1">{validationErrors.accountNumber}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={localForm.ifscCode || ''}
                    onChange={handleInputChange}
                    name="ifscCode"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="e.g., SBIN0123456"
                    maxLength={11}
                  />
                  <div className="text-gray-500 text-sm mt-1">
                    Format XXXX0XXXXXX e.g., SBIN0123456. First 4 letters are bank code.
                  </div>
                  {validationErrors.ifscCode && (
                    <div className="text-red-500 text-sm mt-1">{validationErrors.ifscCode}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={localForm.status || 'active'}
                    onChange={handleInputChange}
                    name="status"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  >
                    {statusOptions.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Form error summary */}
        {Object.keys(validationErrors).length > 0 && validationErrors.general && (
          <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded text-sm">
            {validationErrors.general}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-3 py-1.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded font-medium text-sm shadow"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isFormSubmitting}
            className="px-3 py-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded font-medium text-sm shadow hover:shadow-md"
          >
            {isSubmitting || isFormSubmitting ? 'Updating…' : 'Update Tutor'}
          </button>
        </div>
      </form>

      {/* Popovers */}
      <Popover
        isOpen={showCancelPopover}
        onClose={() => setShowCancelPopover(false)}
        title="Cancel Update"
        message="Are you sure you want to cancel? All unsaved changes will be lost."
        onConfirm={handleCancelConfirmed}
        confirmText="Yes, Cancel"
        cancelText="Continue Editing"
        type="warning"
      />
      <Popover
        isOpen={showSuccessPopover}
        onClose={() => setShowSuccessPopover(false)}
        title="Success!"
        message="Tutor has been updated successfully"
        type="success"
      />
      <Popover
        isOpen={showErrorPopover}
        onClose={() => setShowErrorPopover(false)}
        title="Error!"
        message="Failed to update tutor. Please try again."
        type="error"
      />
    </div>
  );
};

export default UpdateTutorForm;

    }, [userData?.token]);


  useEffect(() => {
    const loadTutor = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const path = buildUrl(API_CONFIG.ENDPOINTS.TUTOR, { id: userData._id });
        const url = `${API_CONFIG.BASE_URL}${path}`;
        const resp = await fetch(url, { headers: authHeaders });
        console.log(authHeaders)
        if (!resp.ok) throw new Error(`${resp.status}: ${await resp.text()}`);
        const data: TutorResponse = await resp.json();
        setTutor(data);
        setStudents(Array.isArray(data.students) ? data.students : []);
      } catch (e: any) {
        setFetchError(e?.message || 'Failed to load tutor');
      } finally {
        setLoading(false);
      }
    };
    loadTutor();
  }, [userData._id, authHeaders]);

  const fetchStudent = async (id: string) => {
    setStudentLoading(true);
    try {
      const path = buildUrl(API_CONFIG.ENDPOINTS.STUDENT, { id });
      const url = `${API_CONFIG.BASE_URL}${path}`;
      const resp = await fetch(url, { headers: authHeaders });
      if (!resp.ok) throw new Error(`${resp.status}: ${await resp.text()}`);
      const data: Student = await resp.json();
      setStudentDetail(data);
      setForm(data);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to load student');
    } finally {
      setStudentLoading(false);
    }
  };

  const openModal = (mode: 'view' | 'edit', id: string) => {
    setModalMode(mode);
    setSelectedStudentId(id);
    setModalVisible(true);
    void fetchStudent(id);
  };

  const closeModal = () => {
    setModalVisible(false);
    setStudentDetail(null);
    setForm({});
  };

  const renderStudentItem = ({ item }: { item: Student }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{item.name}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.label}>Father</Text>
        <Text style={styles.value}>{item.fatherName}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.label}>Contact</Text>
        <Text style={styles.value}>{item.contact}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.label}>Status</Text>
        <Text
          style={[
            styles.status,
            item.status === 'inactive' ? styles.badgeInactive : styles.badgeActive,
          ]}
        >
          {item.status || 'active'}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, styles.btnInfo]}
          onPress={() => openModal('view', item._id)}
        >
          <Text style={styles.btnText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary]}
          onPress={() => openModal('edit', item._id)}
        >
          <Text style={styles.btnText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <SafeAreaView edges={['bottom']} style={styles.root}>
        {/* Compact header with bigger text */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Students</Text>
          <Text style={styles.headerSub}>
            Tutor: {tutor?.name || userData.name || 'Unknown'}
          </Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.muted}>Loading students...</Text>
          </View>
        ) : fetchError ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{fetchError}</Text>
          </View>
        ) : (
          <FlatList
            data={students}
            keyExtractor={item => item._id}
            renderItem={renderStudentItem}
            contentContainerStyle={{
              padding: 16,
              paddingTop: 20,
              paddingBottom: 24,
              flexGrow: 1,
              justifyContent:
                students.length === 0 ? 'center' : 'flex-start',
            }}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.muted}>No students found.</Text>
              </View>
            }
          />
        )}

        <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              {studentLoading ? (
                <ActivityIndicator size="large" color="#007AFF" />
              ) : (
                <View>
                  <Text style={styles.modalTitle}>
                    {modalMode === 'edit' ? 'Edit Student' : 'Student Details'}
                  </Text>
                  <Text style={styles.muted}>
                    {studentDetail ? studentDetail.name : 'No data'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f7f8' },

  // ✅ Compact header, but text is large and bold
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
    paddingVertical: 4, // minimal padding
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24, // Bigger text
    fontWeight: '800',
    color: '#111',
    textAlign: 'center',
    lineHeight: 28,
  },
  headerSub: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 2,
  },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { color: '#666' },
  errorText: { color: '#D32F2F' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  label: { color: '#777', width: 90 },
  value: { color: '#111', flex: 1, textAlign: 'right' },
  status: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeActive: { backgroundColor: '#E6F7EC', color: '#117A37' },
  badgeInactive: { backgroundColor: '#FBECEC', color: '#B00020' },

  actions: { flexDirection: 'row', marginTop: 10, gap: 8, justifyContent: 'flex-end' },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  btnPrimary: { backgroundColor: '#007AFF' },
  btnInfo: { backgroundColor: '#5856D6' },
  btnText: { color: '#fff', fontWeight: '600' },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '85%',
    padding: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, color: '#111' },
});
