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
      console.log('📡 Request Headers:', {
  Authorization: `Bearer ${userData?.token}`,
  tokenRaw: userData?.token,
  baseUrl: API_CONFIG.BASE_URL,
});

      const data: Student = await getStudent(id, userData.token);
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
