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
import { LoginResponse, getStudent, putStudent } from '../utils/api';

type StudentSubject = {
  _id: string;
  subject?: { _id: string; name: string };
};

type AttendanceRecord = {
  month: string; // ISO or yyyy-MM
  presentDays: number;
  totalDays: number;
};

type CenterRef = { _id: string; name: string };
type TutorRef = { _id: string; name: string };

type Student = {
  _id: string;
  name: string;
  fatherName: string;
  contact: string;
  status?: 'active' | 'inactive';
  gender?: 'Male' | 'Female';
  medium?: 'English' | 'Hindi' | 'Urdu';
  aadharNumber?: string;
  isOrphan?: boolean;
  guardianInfo?: { name?: string; contact?: string };
  isNonSchoolGoing?: boolean;
  schoolInfo?: { name?: string; class?: string };
  assignedCenter?: CenterRef | string;
  assignedTutor?: TutorRef | string;
  subjects?: StudentSubject[];
  remarks?: string;
  createdAt?: string;
  joiningDate?: string;
  attendance?: AttendanceRecord[];
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

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Detail + form state (kept stable to avoid keyboard closing)
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentDetail, setStudentDetail] = useState<Student | null>(null);
  const [form, setForm] = useState<Partial<Student>>({});

  const authHeaders = useMemo(() => {
    const token = userData?.token;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }, [userData?.token]);

  // Tutor + students
  useEffect(() => {
    const loadTutor = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const path = buildUrl(API_CONFIG.ENDPOINTS.TUTOR, { id: userData._id });
        const url = `${API_CONFIG.BASE_URL}${path}`;
        const resp = await fetch(url, { headers: authHeaders });
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

  // Fetch student
  const fetchStudent = async (id: string) => {
    setStudentLoading(true);
    try {
      const data: Student = await getStudent(id, userData.token);
      setStudentDetail(data);
      // Fill editable form
      setForm({
        name: data.name,
        fatherName: data.fatherName,
        contact: data.contact,
        status: data.status || 'active',
        gender: data.gender,
        medium: data.medium,
        aadharNumber: data.aadharNumber,
        isOrphan: data.isOrphan,
        guardianInfo: data.guardianInfo,
        isNonSchoolGoing: data.isNonSchoolGoing,
        schoolInfo: data.schoolInfo,
        assignedCenter: data.assignedCenter,
        assignedTutor: data.assignedTutor,
        subjects: data.subjects || [],
        remarks: data.remarks,
      });
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to load student');
    } finally {
      setStudentLoading(false);
    }
  };

  const openModal = (mode: 'view' | 'edit', id: string) => {
    // Do NOT toggle visibility repeatedly while user types; open once and keep it stable
    setModalMode(mode);
    setSelectedStudentId(id);
    setModalVisible(true);
    void fetchStudent(id);
  };

  const closeModal = () => {
    setModalVisible(false);
    // Keep state cleanup minimal to avoid flashing on next open
    setSelectedStudentId(null);
    setStudentDetail(null);
    setForm({});
  };

  // Save (PUT)
  const handleSave = async () => {
    if (!selectedStudentId) return;
    // Basic validation to avoid closing keyboard inadvertently
    if (!form.name || !form.fatherName || !form.contact) {
      Alert.alert('Validation', 'Name, Father Name and Contact are required');
      return;
    }

    // Build payload (normalize references to IDs if needed by backend)
    const payload: any = {
      name: (form.name || '').trim(),
      fatherName: (form.fatherName || '').trim(),
      contact: (form.contact || '').trim(),
      gender: form.gender,
      medium: form.medium,
      aadharNumber: (form.aadharNumber || '').trim(),
      isOrphan: !!form.isOrphan,
      isNonSchoolGoing: !!form.isNonSchoolGoing,
      remarks: (form.remarks || '').trim(),
      status: form.status || 'active',
      // guardianInfo
      ...(form.isOrphan
        ? { guardianInfo: { name: form.guardianInfo?.name || '', contact: form.guardianInfo?.contact || '' } }
        : {}),
      // schoolInfo
      ...(!form.isNonSchoolGoing
        ? { schoolInfo: { name: form.schoolInfo?.name || '', class: form.schoolInfo?.class || '' } }
        : {}),
      // assigned refs
      assignedCenter:
        typeof form.assignedCenter === 'string'
          ? form.assignedCenter
          : (form.assignedCenter as CenterRef | undefined)?._id,
      assignedTutor:
        typeof form.assignedTutor === 'string'
          ? form.assignedTutor
          : (form.assignedTutor as TutorRef | undefined)?._id,
      // subjects as StudentSubject IDs
      subjects: Array.isArray(form.subjects) ? form.subjects.map(ss => ss._id) : [],
    };

    try {
      const updated = await putStudent(selectedStudentId, payload, userData.token);
      // Update detail + list
      setStudentDetail(prev => (prev ? { ...prev, ...updated } : updated));
      setStudents(prev => prev.map(s => (s._id === updated._id ? { ...s, ...updated } : s)));
      Alert.alert('Success', 'Student updated successfully');
      setModalMode('view'); // stay open, flip back to view (avoid closing keyboard until done)
    } catch (e: any) {
      Alert.alert('Update Failed', e?.message || 'Unable to update student');
    }
  };

  const renderStudentItem = ({ item }: { item: Student }) => (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={[styles.badge, item.status === 'inactive' ? styles.badgeInactive : styles.badgeActive]}>
          {item.status || 'active'}
        </Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.label}>Father</Text>
        <Text style={styles.value}>{item.fatherName}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.label}>Contact</Text>
        <Text style={styles.value}>{item.contact}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, styles.btnInfo]} onPress={() => openModal('view', item._id)}>
          <Text style={styles.btnText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => openModal('edit', item._id)}>
          <Text style={styles.btnText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // View-only row
  const InfoPair = ({ label, value }: { label: string; value?: string }) => (
    <View style={styles.infoPair}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '-'}</Text>
    </View>
  );

  // Editable field
  const Field = ({
    label,
    value,
    onChangeText,
    keyboardType = 'default',
    placeholder,
    multiline = false,
  }: {
    label: string;
    value?: string;
    onChangeText: (t: string) => void;
    keyboardType?: 'default' | 'numeric' | 'phone-pad';
    placeholder?: string;
    multiline?: boolean;
  }) => (
    <View style={styles.infoPair}>
      <Text style={styles.infoLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value ?? ''}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#9AA0A6"
        multiline={multiline}
      />
    </View>
  );

  const SubjectsBlock = ({ subjects }: { subjects?: StudentSubject[] }) => {
    if (!subjects || subjects.length === 0) {
      return <Text style={styles.mutedCenter}>Empty array currently</Text>;
    }
    return (
      <View style={styles.pillsRow}>
        {subjects.map(ss => (
          <View key={ss._id} style={styles.pill}>
            <Text style={styles.pillText}>{ss.subject?.name || 'Unknown'}</Text>
          </View>
        ))}
      </View>
    );
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const formatMonthPretty = (iso: string) => {
    // iso may be yyyy-MM or full ISO date
    try {
      const parts = iso.includes('-') && iso.length <= 7 ? iso.split('-') : null; // yyyy-MM
      if (parts && parts.length >= 2) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = new Date(y, m, 1);
        return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
      const d = new Date(iso);
      if (!isNaN(d.valueOf())) {
        return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
    } catch {}
    return iso || '-';
  };

  const renderModalBody = () => {
    const editable = modalMode === 'edit';
    if (studentLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5B7CFF" />
        </View>
      );
    }
    if (!studentDetail) {
      return <Text style={styles.mutedCenter}>No data</Text>;
    }

    return (
      <ScrollView
        contentContainerStyle={{ paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Personal Information */}
        <Section title="Personal Information">
          {editable ? (
            <>
              <Field
                label="Name"
                value={form.name as string}
                onChangeText={t => setForm(f => ({ ...f, name: t }))}
                placeholder="Student name"
              />
              <Field
                label="Father's Name"
                value={form.fatherName as string}
                onChangeText={t => setForm(f => ({ ...f, fatherName: t }))}
                placeholder="Father's name"
              />
              <Field
                label="Contact"
                value={form.contact as string}
                onChangeText={t => setForm(f => ({ ...f, contact: t }))}
                keyboardType="phone-pad"
                placeholder="10-digit phone"
              />
              <Field
                label="Gender"
                value={form.gender as string}
                onChangeText={t => setForm(f => ({ ...f, gender: t as any }))}
                placeholder="Male | Female"
              />
              <Field
                label="Medium"
                value={form.medium as string}
                onChangeText={t => setForm(f => ({ ...f, medium: t as any }))}
                placeholder="English | Hindi | Urdu"
              />
              <Field
                label="Aadhar Number"
                value={form.aadharNumber as string}
                onChangeText={t => setForm(f => ({ ...f, aadharNumber: t }))}
                keyboardType="numeric"
                placeholder="1234 5678 9012"
              />
            </>
          ) : (
            <>
              <InfoPair label="Name" value={studentDetail.name} />
              <InfoPair label="Father's Name" value={studentDetail.fatherName} />
              <InfoPair label="Contact" value={studentDetail.contact} />
              <InfoPair label="Gender" value={studentDetail.gender} />
              <InfoPair label="Medium" value={studentDetail.medium} />
              <InfoPair label="Aadhar Number" value={studentDetail.aadharNumber} />
            </>
          )}
        </Section>

        {/* School Information */}
        <Section title="School Information">
          {editable ? (
            <>
              <Field
                label="School Name"
                value={form.schoolInfo?.name as string}
                onChangeText={t => setForm(f => ({ ...f, schoolInfo: { ...(f.schoolInfo || {}), name: t } }))}
                placeholder="School name"
              />
              <Field
                label="Class"
                value={form.schoolInfo?.class as string}
                onChangeText={t => setForm(f => ({ ...f, schoolInfo: { ...(f.schoolInfo || {}), class: t } }))}
                placeholder="e.g., 5th"
              />
            </>
          ) : (
            <>
              <InfoPair label="School Name" value={studentDetail.schoolInfo?.name || '-'} />
              <InfoPair label="Class" value={studentDetail.schoolInfo?.class || '-'} />
            </>
          )}
        </Section>

        {/* Subjects */}
        <Section title="Subjects">
          {editable ? (
            <SubjectsBlock subjects={form.subjects as StudentSubject[]} />
          ) : (
            <SubjectsBlock subjects={studentDetail.subjects} />
          )}
        </Section>

        {/* Non-School Going */}
        <Section title="Non-School Going">
          <InfoPair label="Non-School Going" value={studentDetail.isNonSchoolGoing ? 'Yes' : 'No'} />
        </Section>

        {/* Joining Date */}
        <Section title="Joining Date">
          <InfoPair
            label="Joining Date"
            value={
              studentDetail.joiningDate
                ? new Date(studentDetail.joiningDate).toLocaleDateString('en-IN')
                : '-'
            }
          />
        </Section>

        {/* Attendance History */}
        <Section title="Attendance History">
          {studentDetail.attendance && studentDetail.attendance.length > 0 ? (
            <View style={styles.attendanceList}>
              {studentDetail.attendance.map((rec, idx) => (
                <View key={`${rec.month}-${idx}`} style={styles.attendanceItem}>
                  <Text style={styles.attendanceMonth}>{formatMonthPretty(rec.month)}</Text>
                  <Text style={styles.attendanceMeta}>
                    {rec.presentDays}/{rec.totalDays} days
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.mutedCenter}>No attendance records found</Text>
          )}
        </Section>

        {/* Actions */}
        <View style={styles.modalActions}>
          <TouchableOpacity style={[styles.btn, styles.btnLight]} onPress={closeModal}>
            <Text style={styles.btnTextDark}>Close</Text>
          </TouchableOpacity>
          {editable ? (
            <TouchableOpacity style={[styles.btn, styles.btnPrimaryGrad]} onPress={handleSave}>
              <Text style={styles.btnText}>Save</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.btn, styles.btnInfoGrad]}
              onPress={() => setModalMode('edit')}
            >
              <Text style={styles.btnText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <SafeAreaView edges={['bottom']} style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            {onBack ? (
              <TouchableOpacity onPress={onBack}>
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 48 }} />
            )}
            <Text style={styles.headerTitle}>Students</Text>
            <View style={{ width: 48 }} />
          </View>
          <Text style={styles.headerSub}>Tutor: {tutor?.name || userData.name || 'Unknown'}</Text>
        </View>

        {/* Body */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#5B7CFF" />
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
              paddingHorizontal: 16,
              paddingVertical: 16,
              flexGrow: 1,
              justifyContent: students.length === 0 ? 'center' : 'flex-start',
            }}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.muted}>No students found.</Text>
              </View>
            }
            keyboardShouldPersistTaps="handled"
          />
        )}

        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={closeModal}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>{renderModalBody()}</View>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F6F7FB' },

  // Header
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8EAF0',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 34,
    justifyContent: 'space-between',
  },
  backText: { color: '#2563EB', fontSize: 14, fontWeight: '700' },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 20,
    textAlign: 'center',
  },
  headerSub: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 2,
  },

  // Empty/center
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { color: '#6B7280' },
  mutedCenter: { color: '#6B7280', textAlign: 'center' },
  errorText: { color: '#D32F2F' },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ECEEF5',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  label: { color: '#7C838D', width: 100, fontSize: 13, lineHeight: 16 },
  value: { color: '#0F172A', flex: 1, textAlign: 'right', fontSize: 14, lineHeight: 18 },

  // Badge
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    fontSize: 12,
    overflow: 'hidden',
    fontWeight: '700',
  },
  badgeActive: { backgroundColor: '#EAF8EE', color: '#157F3F' },
  badgeInactive: { backgroundColor: '#F1F2F6', color: '#6B7280' },

  // Buttons
  actions: { flexDirection: 'row', marginTop: 12, gap: 8, justifyContent: 'flex-end' },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  btnPrimary: { backgroundColor: '#2563EB' },
  btnInfo: { backgroundColor: '#5856D6' },
  btnLight: { backgroundColor: '#EEF1F7' },
  btnText: { color: '#fff', fontWeight: '800' },
  btnTextDark: { color: '#0F172A', fontWeight: '800' },

  // Gradient-like buttons (approximation without extra libs)
  btnPrimaryGrad: { backgroundColor: '#4F46E5' }, // indigo
  btnInfoGrad: { backgroundColor: '#0EA5E9' }, // sky

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    maxHeight: '85%',
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ECEEF5',
  },

  // Sections inside modal
  section: {
    backgroundColor: '#FAFBFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E9ECF3',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 10,
  },

  // Info rows
  infoPair: { marginBottom: 10 },
  infoLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  infoValue: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F5F7FB',
    borderRadius: 10,
    color: '#111827',
    fontSize: 14,
    lineHeight: 18,
  },

  // Inputs
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E3E7EF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111827',
    fontSize: 14,
    lineHeight: 18,
  },
  inputMultiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },

  // Subjects pills
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#EBF2FF', borderRadius: 999 },
  pillText: { color: '#2257D6', fontSize: 12, fontWeight: '700' },

  // Attendance list
  attendanceList: { gap: 8 },
  attendanceItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E9ECF3',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  attendanceMonth: { fontWeight: '800', color: '#111827' },
  attendanceMeta: { color: '#374151', fontWeight: '600' },

  // Modal actions
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14, gap: 8 },
});
