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
    };
  }, [userData?.token]);

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
    multiline = false,
  }: {
    label: string;
    value?: string;
    onChangeText?: (t: string) => void;
    editable: boolean;
    keyboardType?: 'default' | 'numeric' | 'phone-pad';
    placeholder?: string;
    multiline?: boolean;
  }) => (
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline, !editable && styles.inputReadonly]}
        value={value ?? ''}
        onChangeText={onChangeText}
        editable={editable}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#999"
        multiline={multiline}
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
      <ScrollView contentContainerStyle={{ paddingBottom: 12 }}>
        <Text style={styles.modalTitle}>
          {editable ? 'Edit Student' : 'Student Details'}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Info</Text>
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
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional</Text>
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
                multiline
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
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assignments</Text>
          <InfoRow label="Center" value={studentDetail.assignedCenter?.name} />
          <InfoRow label="Tutor" value={studentDetail.assignedTutor?.name} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>School</Text>
          <InfoRow label="School Name" value={studentDetail.schoolInfo?.name} />
          <InfoRow label="Class" value={studentDetail.schoolInfo?.class} />
          <InfoRow label="Non-School Going" value={studentDetail.isNonSchoolGoing ? 'Yes' : 'No'} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subjects</Text>
          <SubjectPills subjects={editable ? (form.subjects as StudentSubject[]) : studentDetail.subjects} />
          {editable && (
            <Text style={styles.mutedSmall}>
              Editing subjects here is disabled; include StudentSubject IDs when sending PUT.
            </Text>
          )}
        </View>

        <View style={styles.modalActions}>
          <TouchableOpacity style={[styles.btn, styles.btnLight]} onPress={closeModal}>
            <Text style={styles.btnTextDark}>Close</Text>
          </TouchableOpacity>
          {editable && (
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={() => {
                Alert.alert('Not wired', 'Hook up PUT /students/:id here.');
              }}
            >
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
  root: { flex: 1, backgroundColor: '#F7F7FA' },

  // Header
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E6EA',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 34,
    justifyContent: 'space-between',
  },
  backText: { color: '#007AFF', fontSize: 14, fontWeight: '600' },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
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
  mutedSmall: { color: '#6B7280', fontSize: 12, marginTop: 6 },

  errorText: { color: '#D32F2F' },

  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#F0F0F3',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  label: { color: '#7A7F87', width: 90, fontSize: 13, lineHeight: 16 },
  value: { color: '#111', flex: 1, textAlign: 'right', fontSize: 14, lineHeight: 18 },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    overflow: 'hidden',
  },
  badgeActive: { backgroundColor: '#E8F8EF', color: '#157F3F' },
  badgeInactive: { backgroundColor: '#EEEFF3', color: '#6B7280' },

  // Buttons
  actions: { flexDirection: 'row', marginTop: 12, gap: 8, justifyContent: 'flex-end' },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  btnPrimary: { backgroundColor: '#007AFF' },
  btnInfo: { backgroundColor: '#5856D6' },
  btnLight: { backgroundColor: '#EEE' },
  btnText: { color: '#fff', fontWeight: '700' },
  btnTextDark: { color: '#111', fontWeight: '700' },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    maxHeight: '85%',
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#F0F0F3',
  },
  modalTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8, color: '#111', textAlign: 'center' },

  // Sections inside modal
  section: {
    backgroundColor: '#FAFAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#EEEFF3',
    marginTop: 10,
  },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#374151', marginBottom: 8 },

  // Form
  formRow: { marginBottom: 10 },
  formLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E3E4EA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111',
    fontSize: 14,
    lineHeight: 18,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputReadonly: { backgroundColor: '#F8F8FA' },
  readonlyValue: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8F8FA',
    borderRadius: 10,
    color: '#111',
    fontSize: 14,
    lineHeight: 18,
  },

  // Subjects pills
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  pill: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#EBF2FF', borderRadius: 999 },
  pillText: { color: '#2257D6', fontSize: 12, fontWeight: '600' },

  // Modal actions
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 8 },
});
