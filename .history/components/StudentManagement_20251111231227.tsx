import React, { useEffect, useMemo, useReducer, useState, memo, useCallback } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_CONFIG } from '../constants/config';
import { LoginResponse, getStudent, putStudent, markStudentAttendance } from '../utils/api';

type StudentSubject = { _id: string; subject?: { _id: string; name: string } };
type AttendanceRecord = { month: string; presentDays: number; totalDays: number };
type RefId = { _id: string; name?: string };

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
  assignedCenter?: RefId | string;
  assignedTutor?: RefId | string;
  subjects?: StudentSubject[];
  remarks?: string;
  joiningDate?: string;
  createdAt?: string;
  attendance?: AttendanceRecord[];
};

type TutorResponse = { _id: string; name: string; students?: Student[] };

const buildUrl = (template: string, params: Record<string, string>) =>
  template.replace(/:([A-Za-z_]+)/g, (_, key) => encodeURIComponent(params[key] || ''));

type FormAction =
  | { key: keyof Student; value: any }
  | { key: 'schoolInfo'; value: { name?: string; class?: string } }
  | { key: 'guardianInfo'; value: { name?: string; contact?: string } };

function formReducer(state: Partial<Student>, action: FormAction): Partial<Student> {
  if (action.key === 'schoolInfo') return { ...state, schoolInfo: { ...(state.schoolInfo || {}), ...action.value } };
  if (action.key === 'guardianInfo') return { ...state, guardianInfo: { ...(state.guardianInfo || {}), ...action.value } };
  return { ...state, [action.key]: action.value };
}

const Field = memo(function Field({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  placeholder,
}: {
  label: string;
  value?: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
  placeholder?: string;
}) {
  return (
    <View style={styles.infoPair}>
      <Text style={styles.infoLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value ?? ''}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#9AA0A6"
      />
    </View>
  );
}); [file:368][web:382]

const Segmented = memo(function Segmented({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <View style={styles.infoPair}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.segmented}>
        {options.map(opt => {
          const active = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.segment, active && styles.segmentActive]}
              onPress={() => onChange(opt.value)}
              activeOpacity={0.8}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}); [file:368][web:385]

const BinaryToggle = memo(function BinaryToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.infoPair}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.segmented}>
        {[
          { label: 'No', value: false },
          { label: 'Yes', value: true },
        ].map(opt => {
          const active = value === opt.value;
          return (
            <TouchableOpacity
              key={String(opt.value)}
              style={[styles.segment, active && styles.segmentActive]}
              onPress={() => onChange(opt.value)}
              activeOpacity={0.8}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}); [file:368][web:381]

const InfoPair = memo(function InfoPair({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.infoPair}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '-'}</Text>
    </View>
  );
}); [file:368][web:344]

const SubjectsBlock = memo(function SubjectsBlock({ subjects }: { subjects?: StudentSubject[] }) {
  if (!subjects || subjects.length === 0) return <Text style={styles.mutedCenter}>Empty array currently</Text>;
  return (
    <View style={styles.pillsRow}>
      {subjects.map(s => (
        <View key={s._id} style={styles.pill}>
          <Text style={styles.pillText}>{s.subject?.name || 'Unknown'}</Text>
        </View>
      ))}
    </View>
  );
}); [file:368][web:90]

const Section = memo(function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}); [file:368][web:90]

interface Props {
  userData: LoginResponse;
  onBack?: () => void;
}

export default function StudentManagement({ userData, onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [tutor, setTutor] = useState<TutorResponse | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null); [file:368][web:382]

  // modal + detail
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentDetail, setStudentDetail] = useState<Student | null>(null);
  const [form, dispatch] = useReducer(formReducer, {}); [file:368][web:385]

  // attendance modal
  const [attModalVisible, setAttModalVisible] = useState(false);
  const [attSelections, setAttSelections] = useState<Record<string, boolean>>({});
  const [attSubmitting, setAttSubmitting] = useState(false);
  const [attDate, setAttDate] = useState(() => new Date().toISOString().slice(0, 10)); [file:368][web:385]

  const authHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userData.token}`,
    }),
    [userData.token]
  ); [web:374][web:377]

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
  }, [userData._id, authHeaders]); [file:368][web:374]

  const fetchStudent = async (id: string) => {
    setStudentLoading(true);
    try {
      const data: Student = await getStudent(id, userData.token);
      setStudentDetail(data);
      dispatch({ key: 'name', value: data.name });
      dispatch({ key: 'fatherName', value: data.fatherName });
      dispatch({ key: 'contact', value: data.contact });
      dispatch({ key: 'status', value: data.status || 'active' });
      dispatch({ key: 'gender', value: data.gender });
      dispatch({ key: 'medium', value: data.medium });
      dispatch({ key: 'aadharNumber', value: data.aadharNumber });
      dispatch({ key: 'isOrphan', value: !!data.isOrphan });
      dispatch({ key: 'guardianInfo', value: data.guardianInfo || {} });
      dispatch({ key: 'isNonSchoolGoing', value: !!data.isNonSchoolGoing });
      dispatch({ key: 'schoolInfo', value: data.schoolInfo || {} });
      dispatch({ key: 'assignedCenter', value: data.assignedCenter });
      dispatch({ key: 'assignedTutor', value: data.assignedTutor });
      dispatch({ key: 'subjects', value: data.subjects || [] });
      dispatch({ key: 'remarks', value: data.remarks });
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to load student');
    } finally {
      setStudentLoading(false);
    }
  }; [file:368][web:382]

  const openModal = (mode: 'view' | 'edit', id: string) => {
    setModalMode(mode);
    setSelectedStudentId(id);
    setModalVisible(true);
    void fetchStudent(id);
  }; [web:385][web:379]

  const closeModal = () => {
    setModalVisible(false);
    setSelectedStudentId(null);
    setStudentDetail(null);
  }; [web:385]

  const toId = (val?: RefId | string) => (typeof val === 'string' ? val : (val?._id || undefined)); [file:368]

  const handleSave = async () => {
    if (!selectedStudentId) return;
    if (!form.name || !form.fatherName || !form.contact) {
      Alert.alert('Validation', 'Name, Father Name and Contact are required');
      return;
    }
    const payload: any = {
      name: String(form.name).trim(),
      fatherName: String(form.fatherName).trim(),
      contact: String(form.contact).trim(),
      status: (form.status as string) || 'active',
      gender: form.gender,
      medium: form.medium,
      aadharNumber: (form.aadharNumber as string) || '',
      isOrphan: !!form.isOrphan,
      isNonSchoolGoing: !!form.isNonSchoolGoing,
      remarks: (form.remarks as string) || '',
      guardianInfo: form.isOrphan ? { name: form.guardianInfo?.name || '', contact: form.guardianInfo?.contact || '' } : undefined,
      schoolInfo: !form.isNonSchoolGoing ? { name: form.schoolInfo?.name || '', class: form.schoolInfo?.class || '' } : undefined,
      assignedCenter: toId(form.assignedCenter as any),
      assignedTutor: toId(form.assignedTutor as any),
      subjects: Array.isArray(form.subjects) ? (form.subjects as StudentSubject[]).map(s => s._id) : [],
    };
    try {
      // ensure JSON body is properly formed in utils/api putStudent
      const updated = await putStudent(selectedStudentId, userData.token, payload);
      setStudentDetail(prev => (prev ? { ...prev, ...updated } : updated));
      setStudents(prev => prev.map(s => (s._id === updated._id ? { ...s, ...updated } : s)));
      Alert.alert('Success', 'Student updated successfully');
      setModalMode('view');
    } catch (e: any) {
      Alert.alert('Update Failed', e?.message || 'Unable to update student');
    }
  }; [web:374][web:377]

  // Attendance button handlers
  const openAttendance = () => {
    // prefill selections off; keep modal stable
    setAttSelections({});
    setAttDate(new Date().toISOString().slice(0, 10));
    setAttModalVisible(true);
  }; [web:385]

  const toggleStudentCheck = (id: string) => {
    setAttSelections(prev => ({ ...prev, [id]: !prev[id] }));
  }; [web:90]

  const submitAttendance = async () => {
    const selectedIds = Object.keys(attSelections).filter(id => attSelections[id]);
    if (!attDate || selectedIds.length === 0) {
      Alert.alert('Required', 'Pick at least one student and ensure date is set');
      return;
    }
    const studentsPayload = selectedIds.map(studentId => ({ studentId, status: 'Present' }));
    try {
      setAttSubmitting(true);
      // controller expects: { date, students: [{studentId, status}] }
      const res = await markStudentAttendance({ date: attDate, students: studentsPayload }, userData.token);
      Alert.alert('Attendance', Array.isArray(res) ? `Marked: ${res.length}` : 'Marked');
      setAttModalVisible(false);
    } catch (e: any) {
      Alert.alert('Attendance Failed', e?.message || 'Unable to mark attendance');
    } finally {
      setAttSubmitting(false);
    }
  }; [file:368][web:374]

  const SectionTitle = useCallback(({ t }: { t: string }) => <Text style={styles.sectionTitle}>{t}</Text>, []); [web:344]

  const formatMonthPretty = (iso: string) => {
    try {
      const parts = iso.includes('-') && iso.length <= 7 ? iso.split('-') : null;
      if (parts && parts.length >= 2) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = new Date(y, m, 1);
        return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
      const d = new Date(iso);
      if (!isNaN(d.valueOf())) return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {}
    return iso || '-';
  }; [web:344]

  const renderModalBody = () => {
    const editable = modalMode === 'edit';
    if (studentLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#5B7CFF" /></View>;
    if (!studentDetail) return <Text style={styles.mutedCenter}>No data</Text>;
    const joinDate = studentDetail.joiningDate || studentDetail.createdAt
      ? new Date(studentDetail.joiningDate || studentDetail.createdAt!).toLocaleDateString('en-IN')
      : '-';
    return (
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
        <Section title="Personal Information">
          {editable ? (
            <>
              <Field label="Name" value={form.name as string} onChangeText={t => dispatch({ key: 'name', value: t })} />
              <Field label="Father's Name" value={form.fatherName as string} onChangeText={t => dispatch({ key: 'fatherName', value: t })} />
              <Field label="Contact" value={form.contact as string} onChangeText={t => dispatch({ key: 'contact', value: t })} keyboardType="phone-pad" />
              <Segmented
                label="Gender"
                value={form.gender as string}
                onChange={v => dispatch({ key: 'gender', value: v as 'Male' | 'Female' })}
                options={[{ label: 'Male', value: 'Male' }, { label: 'Female', value: 'Female' }]}
              />
              <Field label="Medium" value={form.medium as string} onChangeText={t => dispatch({ key: 'medium', value: t })} />
              <Field label="Aadhar Number" value={form.aadharNumber as string} onChangeText={t => dispatch({ key: 'aadharNumber', value: t })} keyboardType="numeric" />
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
        <Section title="School Information">
          {editable ? (
            <>
              <Field
                label="School Name"
                value={studentDetail.schoolInfo?.name ?? (form.schoolInfo as any)?.name}
                onChangeText={t => dispatch({ key: 'schoolInfo', value: { name: t } })}
              />
              <Field
                label="Class"
                value={studentDetail.schoolInfo?.class ?? (form.schoolInfo as any)?.class}
                onChangeText={t => dispatch({ key: 'schoolInfo', value: { class: t } })}
              />
            </>
          ) : (
            <>
              <InfoPair label="School Name" value={studentDetail.schoolInfo?.name || '-'} />
              <InfoPair label="Class" value={studentDetail.schoolInfo?.class || '-'} />
            </>
          )}
        </Section>
        <Section title="Subjects">
          {editable ? <SubjectsBlock subjects={form.subjects as StudentSubject[]} /> : <SubjectsBlock subjects={studentDetail.subjects} />}
        </Section>
        <Section title="Non-School Going">
          {editable ? (
            <BinaryToggle label="Non-School Going" value={!!form.isNonSchoolGoing} onChange={v => dispatch({ key: 'isNonSchoolGoing', value: v })} />
          ) : (
            <InfoPair label="Non-School Going" value={studentDetail.isNonSchoolGoing ? 'Yes' : 'No'} />
          )}
        </Section>
        <Section title="Is Orphan">
          {editable ? (
            <BinaryToggle label="Is Orphan" value={!!form.isOrphan} onChange={v => dispatch({ key: 'isOrphan', value: v })} />
          ) : (
            <InfoPair label="Is Orphan" value={studentDetail.isOrphan ? 'Yes' : 'No'} />
          )}
        </Section>
        <Section title="Joining Date">
          <InfoPair label="Joining Date" value={joinDate} />
        </Section>
        <Section title="Attendance History">
          {studentDetail.attendance && studentDetail.attendance.length > 0 ? (
            <View style={styles.attendanceList}>
              {studentDetail.attendance.map((rec, idx) => (
                <View key={`${rec.month}-${idx}`} style={styles.attendanceItem}>
                  <Text style={styles.attendanceMonth}>{formatMonthPretty(rec.month)}</Text>
                  <Text style={styles.attendanceMeta}>{rec.presentDays}/{rec.totalDays} days</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.mutedCenter}>No attendance records found</Text>
          )}
        </Section>
        <View style={styles.modalActions}>
          <TouchableOpacity style={[styles.btn, styles.btnLight]} onPress={closeModal}>
            <Text style={styles.btnTextDark}>Close</Text>
          </TouchableOpacity>
          {modalMode === 'edit' ? (
            <TouchableOpacity style={[styles.btn, styles.btnPrimaryGrad]} onPress={handleSave}>
              <Text style={styles.btnText}>Save</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.btn, styles.btnInfoGrad]} onPress={() => setModalMode('edit')}>
              <Text style={styles.btnText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  }; [file:368][web:379]

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <SafeAreaView edges={['bottom']} style={styles.root}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            {onBack ? (
              <TouchableOpacity onPress={onBack}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
            ) : (<View style={{ width: 48 }} />)}
            <Text style={styles.headerTitle}>Students</Text>
            <View style={{ width: 48 }} />
          </View>
          <Text style={styles.headerSub}>Tutor: {tutor?.name || userData.name || 'Unknown'}</Text>
        </View>

        {/* Top actions */}
        <View style={styles.topActionsRow}>
          <TouchableOpacity onPress={openAttendance} style={styles.attButton}>
            <Text style={styles.attButtonText}>Mark Attendance (Green)</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#5B7CFF" />
            <Text style={styles.muted}>Loading students...</Text>
          </View>
        ) : fetchError ? (
          <View style={styles.center}><Text style={styles.errorText}>{fetchError}</Text></View>
        ) : (
          <FlatList
            data={students}
            keyExtractor={item => item._id}
            renderItem={renderStudentItem}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, flexGrow: 1, justifyContent: students.length === 0 ? 'center' : 'flex-start' }}
            ListEmptyComponent={<View style={styles.center}><Text style={styles.muted}>No students found.</Text></View>}
            keyboardShouldPersistTaps="handled"
          />
        )}

        {/* Detail modal */}
        <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}>
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>{renderModalBody()}</View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Attendance modal */}
        <Modal visible={attModalVisible} transparent animationType="fade" onRequestClose={() => setAttModalVisible(false)}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}>
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Mark Attendance</Text>
                <View style={styles.infoPair}>
                  <Text style={styles.infoLabel}>Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.input}
                    value={attDate}
                    onChangeText={setAttDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9AA0A6"
                  />
                </View>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Students</Text>
                  <View style={{ maxHeight: 320 }}>
                    <ScrollView keyboardShouldPersistTaps="handled">
                      {students.map(s => {
                        const checked = !!attSelections[s._id];
                        return (
                          <TouchableOpacity key={s._id} onPress={() => toggleStudentCheck(s._id)} activeOpacity={0.8} style={styles.checkRow}>
                            <Text style={styles.checkRowName}>{s.name}</Text>
                            <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                              {checked ? <Text style={styles.checkboxTick}>✓</Text> : null}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>
                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.btn, styles.btnLight]} onPress={() => setAttModalVisible(false)}>
                    <Text style={styles.btnTextDark}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btn, styles.btnGreen]} onPress={submitAttendance} disabled={attSubmitting}>
                    {attSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit Attendance</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F6F7FB' },

  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8EAF0',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', minHeight: 34, justifyContent: 'space-between' },
  backText: { color: '#2563EB', fontSize: 14, fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', lineHeight: 20, textAlign: 'center' },
  headerSub: { fontSize: 12, color: '#6B7280', textAlign: 'center', lineHeight: 14, marginTop: 2 },

  topActionsRow: { paddingHorizontal: 16, paddingTop: 10 },
  attButton: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  attButtonText: { color: '#fff', fontWeight: '900', fontSize: 16 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { color: '#6B7280' },
  mutedCenter: { color: '#6B7280', textAlign: 'center' },
  errorText: { color: '#D32F2F' },

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
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  label: { color: '#7C838D', width: 100, fontSize: 13, lineHeight: 16 },
  value: { color: '#0F172A', flex: 1, textAlign: 'right', fontSize: 14, lineHeight: 18 },

  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, fontSize: 12, fontWeight: '700' },
  badgeActive: { backgroundColor: '#EAF8EE', color: '#157F3F' },
  badgeInactive: { backgroundColor: '#F1F2F6', color: '#6B7280' },

  actions: { flexDirection: 'row', marginTop: 12, gap: 8, justifyContent: 'flex-end' },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  btnPrimary: { backgroundColor: '#2563EB' },
  btnInfo: { backgroundColor: '#5856D6' },
  btnLight: { backgroundColor: '#EEF1F7' },
  btnGreen: { backgroundColor: '#22C55E' },
  btnText: { color: '#fff', fontWeight: '800' },
  btnTextDark: { color: '#0F172A', fontWeight: '800' },
  btnPrimaryGrad: { backgroundColor: '#4F46E5' },
  btnInfoGrad: { backgroundColor: '#0EA5E9' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.35)', justifyContent: 'center', padding: 12 },
  modalCard: { backgroundColor: '#ffffff', borderRadius: 16, maxHeight: '85%', padding: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: '#ECEEF5' },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#111827', textAlign: 'center', marginBottom: 8 },

  section: { backgroundColor: '#FAFBFF', borderRadius: 12, padding: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: '#E9ECF3', marginTop: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: '#111827', marginBottom: 10 },

  infoPair: { marginBottom: 10 },
  infoLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  infoValue: { paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#F5F7FB', borderRadius: 10, color: '#111827', fontSize: 14, lineHeight: 18 },

  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E3E7EF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#111827', fontSize: 14, lineHeight: 18 },

  segmented: { flexDirection: 'row', backgroundColor: '#EEF1F7', borderRadius: 10, padding: 2, gap: 6 },
  segment: { flex: 1, backgroundColor: 'transparent', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  segmentActive: { backgroundColor: '#ffffff', borderWidth: StyleSheet.hairlineWidth, borderColor: '#DDE2EA' },
  segmentText: { color: '#475569', fontWeight: '700' },
  segmentTextActive: { color: '#111827', fontWeight: '900' },

  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#EBF2FF', borderRadius: 999 },
  pillText: { color: '#2257D6', fontSize: 12, fontWeight: '700' },

  attendanceList: { gap: 8 },
  attendanceItem: { backgroundColor: '#FFFFFF', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: '#E9ECF3', flexDirection: 'row', justifyContent: 'space-between' },
  attendanceMonth: { fontWeight: '800', color: '#111827' },
  attendanceMeta: { color: '#374151', fontWeight: '600' },

  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14, gap: 8 },

});
