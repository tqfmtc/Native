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
import { LoginResponse, getStudent } from '../utils/api';

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
  gender?: 'Male' | 'Female';
  medium?: 'English' | 'Hindi' | 'Urdu';
  aadharNumber?: string;
  isOrphan?: boolean;
  guardianInfo?: { name?: string; contact?: string };
  isNonSchoolGoing?: boolean;
  schoolInfo?: { name?: string; class?: string };
  assignedCenter?: { _id: string; name: string };
  assignedTutor?: { _id: string; name: string };
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

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentDetail, setStudentDetail] = useState<Student | null>(null);

  // Reusable form model
  const [form, setForm] = useState<Partial<Student>>({});

  const authHeaders = useMemo(() => {
    const token = userData?.token;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }, [userData?.token]);

  // Load tutor + students
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

  // Fetch full student
  const fetchStudent = async (id: string) => {
    setStudentLoading(true);
    try {
      const data: Student = await getStudent(id, userData.token);
      setStudentDetail(data);
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
    setModalMode(mode);
    setSelectedStudentId(id);
    setModalVisible(true);
    void fetchStudent(id);
  };

  const closeModal = () => {
    setModalVisible(false);
    setStudentDetail(null);
    setForm({});
    setSelectedStudentId(null);
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
        <Text style={[styles.status, item.status === 'inactive' ? styles.badgeInactive : styles.badgeActive]}>
          {item.status || 'active'}
        </Text>
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

  const InfoRow = ({ label, value }: { label: string; value?: string }) => (
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{label}</Text>
      <Text style={styles.readonlyValue}>{value ?? '—'}</Text>
    </View>
  );

  const Field = ({
    label,
    value,
    onChangeText,
    editable,
    keyboardType = 'default',
    placeholder,
  }: {
    label: string;
    value?: string;
    onChangeText?: (t: string) => void;
    editable: boolean;
    keyboardType?: 'default' | 'numeric' | 'phone-pad';
    placeholder?: string;
  }) => (
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={[styles.input, !editable && styles.inputReadonly]}
        value={value ?? ''}
        onChangeText={onChangeText}
        editable={editable}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#999"
      />
    </View>
  );

  const SubjectPills = ({ subjects }: { subjects?: StudentSubject[] }) => {
    if (!subjects || subjects.length === 0) {
      return <Text style={styles.mutedSmall}>No subjects</Text>;
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

  const renderModalBody = () => {
    const editable = modalMode === 'edit';
    if (studentLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      );
    }
    if (!studentDetail) {
      return <Text style={styles.muted}>No data</Text>;
    }

    return (
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        <Text style={styles.modalTitle}>
          {editable ? 'Edit Student' : 'Student Details'}
        </Text>

        {/* Primary fields */}
        <Field
          label="Name"
          value={editable ? (form.name as string) : studentDetail.name}
          onChangeText={t => setForm(f => ({ ...f, name: t }))}
          editable={editable}
          placeholder="Student name"
        />
        <Field
          label="Father's Name"
          value={editable ? (form.fatherName as string) : studentDetail.fatherName}
          onChangeText={t => setForm(f => ({ ...f, fatherName: t }))}
          editable={editable}
          placeholder="Father name"
        />
        <Field
          label="Contact"
          value={editable ? (form.contact as string) : studentDetail.contact}
          onChangeText={t => setForm(f => ({ ...f, contact: t }))}
          editable={editable}
          keyboardType="phone-pad"
          placeholder="10-digit phone"
        />
        <Field
          label="Status"
          value={editable ? (form.status as string) : (studentDetail.status || 'active')}
          onChangeText={t => setForm(f => ({ ...f, status: t === 'inactive' ? 'inactive' : 'active' }))}
          editable={editable}
          placeholder="active | inactive"
        />

        {/* Secondary fields (show read-only when viewing) */}
        {editable ? (
          <>
            <Field
              label="Gender"
              value={form.gender as string}
              onChangeText={t => setForm(f => ({ ...f, gender: t as any }))}
              editable={editable}
              placeholder="Male | Female"
            />
            <Field
              label="Medium"
              value={form.medium as string}
              onChangeText={t => setForm(f => ({ ...f, medium: t as any }))}
              editable={editable}
              placeholder="English | Hindi | Urdu"
            />
            <Field
              label="Aadhar"
              value={form.aadharNumber as string}
              onChangeText={t => setForm(f => ({ ...f, aadharNumber: t }))}
              editable={editable}
              keyboardType="numeric"
              placeholder="1234 5678 9012"
            />
            <Field
              label="Remarks"
              value={form.remarks as string}
              onChangeText={t => setForm(f => ({ ...f, remarks: t }))}
              editable={editable}
              placeholder="Notes"
            />
          </>
        ) : (
          <>
            <InfoRow label="Gender" value={studentDetail.gender} />
            <InfoRow label="Medium" value={studentDetail.medium} />
            <InfoRow label="Aadhar" value={studentDetail.aadharNumber} />
            <InfoRow label="Remarks" value={studentDetail.remarks} />
          </>
        )}

        {/* Assigned and school info (read-only display) */}
        <InfoRow label="Center" value={studentDetail.assignedCenter?.name} />
        <InfoRow label="Tutor" value={studentDetail.assignedTutor?.name} />
        <InfoRow label="School" value={studentDetail.schoolInfo?.name} />
        <InfoRow label="Class" value={studentDetail.schoolInfo?.class} />

        {/* Subjects */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subjects</Text>
          <SubjectPills subjects={editable ? (form.subjects as StudentSubject[]) : studentDetail.subjects} />
          {editable && (
            <Text style={styles.mutedSmall}>
              Editing subjects here is disabled; send StudentSubject IDs in PUT as needed.
            </Text>
          )}
        </View>

        <View style={styles.modalActions}>
          <TouchableOpacity style={[styles.btn, styles.btnLight]} onPress={closeModal}>
            <Text style={styles.btnTextDrark}>Close</Text>
          </TouchableOpacity>
          {editable && (
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => {
              Alert.alert('Not wired', 'Hook up PUT /students/:id when backend is ready.');
            }}>
              <Text style={styles.btnText}>Save</Text>
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
        {/* Compact header */}
        <View style={styles.header}>
          {onBack ? (
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={onBack}>
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Students</Text>
              <View style={{ width: 48 }} />
            </View>
          ) : (
            <Text style={[styles.headerTitle, { textAlign: 'center' }]}>Students</Text>
          )}
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
              paddingTop: 16,
              paddingBottom: 20,
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

        <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>{renderModalBody()}</View>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f7f8' },

  // Compact header
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
    justifyContent: 'space-between',
  },
  backText: { color: '#007AFF', fontSize: 14, fontWeight: '600' },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
    lineHeight: 20,
  },
  headerSub: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 2,
  },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { color: '#666' },
  mutedSmall: { color: '#888', fontSize: 12, marginTop: 6 },
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
  btnLight: { backgroundColor: '#EEE' },
  btnText: { color: '#fff', fontWeight: '600' },

  // Modal
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
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: '#111' },

  // Form
  formRow: { marginBottom: 10 },
  formLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#111',
    fontSize: 14,
    lineHeight: 18,
  },
  inputReadonly: { backgroundColor: '#f5f5f5' },
  readonlyValue: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    color: '#111',
    fontSize: 14,
    lineHeight: 18,
  },

  // Subjects
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#EBF2FF', borderRadius: 999 },
  pillText: { color: '#2257D6', fontSize: 12 },

  // Modal actions
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 8 },
});
