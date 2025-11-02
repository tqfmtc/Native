import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_CONFIG } from '../constants/config';
import { LoginResponse } from '../utils/api';

// Types
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
  isOrphan?: boolean;
  guardianInfo?: { name?: string; contact?: string };
  isNonSchoolGoing?: boolean;
  schoolInfo?: { name?: string; class?: string };
  gender?: 'Male' | 'Female';
  medium?: 'English' | 'Hindi' | 'Urdu';
  aadharNumber?: string;
  assignedCenter?: string;
  assignedTutor?: string;
  subjects?: StudentSubject[];
  remarks?: string;
};

type TutorResponse = {
  _id: string;
  name: string;
  students?: Student[];
};

// Utilities
const buildUrl = (template: string, params: Record<string, string>) =>
  template.replace(/:([A-Za-z_]+)/g, (_, key) => encodeURIComponent(params[key] || ''));

interface Props {
  userData: LoginResponse; // contains token and tutor id
  onBack?: () => void; // Optional callback to go back to attendance
}

export default function StudentManagement({ userData, onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [tutor, setTutor] = useState<TutorResponse | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Modal state for View/Edit
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentDetail, setStudentDetail] = useState<Student | null>(null);

  // Editable form state (reused for view & edit)
  const [form, setForm] = useState<Partial<Student>>({});

  const authHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userData.token}`,
    }),
    [userData.token]
  );

  // Initial load: GET /tutors/:id and set students
  useEffect(() => {
    const loadTutor = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const path = buildUrl(API_CONFIG.ENDPOINTS.TUTOR, { id: userData._id });
        const url = `${API_CONFIG.BASE_URL}${path}`;
        const resp = await fetch(url, { headers: authHeaders });
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(`${resp.status}: ${text || resp.statusText}`);
        }
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

  // Open modal helper
  const openModal = (mode: 'view' | 'edit', id: string) => {
    setModalMode(mode);
    setSelectedStudentId(id);
    setModalVisible(true);
    void fetchStudent(id, mode);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedStudentId(null);
    setStudentDetail(null);
    setForm({});
  };

  // GET /students/:id
  const fetchStudent = async (id: string, mode: 'view' | 'edit') => {
    setStudentLoading(true);
    try {
      const path = buildUrl(API_CONFIG.ENDPOINTS.STUDENT, { id });
      const url = `${API_CONFIG.BASE_URL}${path}`;
      const resp = await fetch(url, { headers: authHeaders });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`${resp.status}: ${text || resp.statusText}`);
      }
      const data: Student = await resp.json();
      setStudentDetail(data);
      setForm({
        name: data.name,
        fatherName: data.fatherName,
        contact: data.contact,
        status: data.status || 'active',
        isOrphan: data.isOrphan || false,
        guardianInfo: data.guardianInfo || {},
        isNonSchoolGoing: data.isNonSchoolGoing || false,
        schoolInfo: data.schoolInfo || {},
        gender: data.gender,
        medium: data.medium,
        aadharNumber: data.aadharNumber,
        remarks: data.remarks,
        subjects: data.subjects || [],
      });
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to load student');
    } finally {
      setStudentLoading(false);
    }
  };

  // PUT /students/:id
  const saveStudent = async () => {
    if (!selectedStudentId) return;
    try {
      if (!form.name || !form.fatherName || !form.contact) {
        Alert.alert('Validation', 'Name, Father Name and Contact are required');
        return;
      }
      const payload: any = {
        ...form,
        subjects: Array.isArray(form.subjects) ? form.subjects.map(ss => ss._id) : [],
      };

      const path = buildUrl(API_CONFIG.ENDPOINTS.STUDENT, { id: selectedStudentId });
      const url = `${API_CONFIG.BASE_URL}${path}`;
      const resp = await fetch(url, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`${resp.status}: ${text || resp.statusText}`);
      }
      const updated: Student = await resp.json();
      setStudentDetail(updated);
      setForm({
        ...form,
        subjects: updated.subjects || [],
      });
      setStudents(prev => prev.map(s => (s._id === updated._id ? { ...s, ...updated } : s)));
      Alert.alert('Success', 'Student updated successfully');
      setModalMode('view');
    } catch (e: any) {
      Alert.alert('Update Failed', e?.message || 'Unable to update student');
    }
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

  const SubjectPills = ({ subjects }: { subjects?: StudentSubject[] }) => {
    if (!subjects || subjects.length === 0) {
      return <Text style={styles.muted}>No subjects</Text>;
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

  const FormField = ({
    label, value, onChangeText, editable = true, keyboardType = 'default', placeholder,
  }: {
    label: string;
    value?: string;
    onChangeText?: (t: string) => void;
    editable?: boolean;
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

  const renderModalContent = () => {
    const editable = modalMode === 'edit';
    return (
      <View style={styles.modalBody}>
        {studentLoading ? (
          <View style={styles.modalLoading}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.muted}>Loading student...</Text>
          </View>
        ) : studentDetail ? (
          <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            <Text style={styles.modalTitle}>
              {editable ? 'Edit Student' : 'Student Details'}
            </Text>

            <FormField
              label="Name"
              value={editable ? (form.name as string) : studentDetail.name}
              onChangeText={t => setForm(f => ({ ...f, name: t }))}
              editable={editable}
              placeholder="Student name"
            />
            <FormField
              label="Father's Name"
              value={editable ? (form.fatherName as string) : studentDetail.fatherName}
              onChangeText={t => setForm(f => ({ ...f, fatherName: t }))}
              editable={editable}
              placeholder="Father name"
            />
            <FormField
              label="Contact"
              value={editable ? (form.contact as string) : studentDetail.contact}
              onChangeText={t => setForm(f => ({ ...f, contact: t }))}
              editable={editable}
              keyboardType="phone-pad"
              placeholder="10-digit phone"
            />

            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Status</Text>
              <TextInput
                style={[styles.input, !editable && styles.inputReadonly]}
                value={editable ? (form.status || 'active') : (studentDetail.status || 'active')}
                onChangeText={t => setForm(f => ({ ...f, status: t === 'inactive' ? 'inactive' : 'active' }))}
                editable={editable}
                placeholder="active | inactive"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Subjects</Text>
              <SubjectPills subjects={editable ? (form.subjects as StudentSubject[]) : studentDetail.subjects} />
              {!editable ? null : (
                <Text style={styles.mutedSmall}>
                  Subject list is read-only here; send StudentSubject IDs on save from existing selections.
                </Text>
              )}
            </View>

            <FormField
              label="Gender"
              value={editable ? (form.gender as string) : (studentDetail.gender || '')}
              onChangeText={t => setForm(f => ({ ...f, gender: t as any }))}
              editable={editable}
              placeholder="Male | Female"
            />
            <FormField
              label="Medium"
              value={editable ? (form.medium as string) : (studentDetail.medium || '')}
              onChangeText={t => setForm(f => ({ ...f, medium: t as any }))}
              editable={editable}
              placeholder="English | Hindi | Urdu"
            />
            <FormField
              label="Aadhar"
              value={editable ? (form.aadharNumber as string) : (studentDetail.aadharNumber || '')}
              onChangeText={t => setForm(f => ({ ...f, aadharNumber: t }))}
              editable={editable}
              keyboardType="numeric"
              placeholder="1234 5678 9012"
            />
            <FormField
              label="Remarks"
              value={editable ? (form.remarks as string) : (studentDetail.remarks || '')}
              onChangeText={t => setForm(f => ({ ...f, remarks: t }))}
              editable={editable}
              placeholder="Notes"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.btn, styles.btnLight]} onPress={closeModal}>
                <Text style={styles.btnTextDark}>Close</Text>
              </TouchableOpacity>
              {editable && (
                <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={saveStudent}>
                  <Text style={styles.btnText}>Save</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        ) : (
          <Text style={styles.muted}>No data</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Header with 3 stacked rows: back, title, subtitle */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          {onBack ? (
            <TouchableOpacity style={styles.backBtn} onPress={onBack}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backBtnSpacer} />
          )}
        </View>

        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
          Students
        </Text>

        <Text style={styles.headerSub} numberOfLines={1} ellipsizeMode="tail">
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
          // keep content away from the header and center empty state nicely
          contentContainerStyle={{ padding: 16, paddingTop: 20, paddingBottom: 24, flexGrow: 1, justifyContent: students.length === 0 ? 'center' : 'flex-start' }}
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
          <View style={styles.modalCard}>{renderModalContent()}</View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f7f8' },

  // Header: three stacked rows (back, title, subtitle)
  header: {
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e8e8e8',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 36,
  },
  backBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  backBtnText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
  backBtnSpacer: {
    width: 72,
    height: 1,
  },
  headerTitle: { marginTop: 4, fontSize: 22, fontWeight: '700', color: '#111', textAlign: 'center' },
  headerSub: { marginTop: 4, fontSize: 13, color: '#666', textAlign: 'center' },

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
  status: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  badgeActive: { backgroundColor: '#E6F7EC', color: '#117A37' },
  badgeInactive: { backgroundColor: '#FBECEC', color: '#B00020' },

  actions: { flexDirection: 'row', marginTop: 10, gap: 8, justifyContent: 'flex-end' },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnPrimary: { backgroundColor: '#007AFF' },
  btnInfo: { backgroundColor: '#5856D6' },
  btnLight: { backgroundColor: '#EEE' },
  btnText: { color: '#fff', fontWeight: '600' },
  btnTextDark: { color: '#111', fontWeight: '600' },

  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#EBF2FF',
    borderRadius: 999,
  },
  pillText: { color: '#2257D6', fontSize: 12 },

  section: { marginTop: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 6 },

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
  modalBody: { flex: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, color: '#111' },
  modalLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },

  formRow: { marginBottom: 10 },
  formLabel: { fontSize: 13, color: '#666', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111',
  },
  inputReadonly: { backgroundColor: '#f5f5f5' },
});
