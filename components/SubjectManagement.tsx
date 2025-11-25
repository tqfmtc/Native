import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_CONFIG } from '../constants/config';
import {
    LoginResponse,
    addStudentSubjectMarks,
    getSubjectsByStudent,
    deleteStudentSubjectRecord,
    updateStudentSubjectRecord,
} from '../utils/api';

// Types
type Student = {
  _id: string;
  name: string;
  fatherName: string;
  contact: string;
  status?: 'active' | 'inactive';
};

type TutorResponse = { 
  _id: string; 
  name: string; 
  students?: Student[] 
};

type MarksPercentageRecord = {
  _id?: string;
  percentage: number;
  examDate?: string;
  recordedAt?: string;
};

type SubjectRecord = {
  _id: string;
  student: string;
  subject: {
    _id: string;
    subjectName: string;
  };
  marksPercentage: MarksPercentageRecord[];
  createdAt?: string;
};

// Utils
const buildUrl = (template: string, params: Record<string, string>) =>
  template.replace(/:([A-Za-z_]+)/g, (_, key) => encodeURIComponent(params[key] || ''));

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  } catch {
    return dateStr;
  }
};

// Convert DD-MM-YY to YYYY-MM-DD for API
const convertToApiFormat = (ddmmyy: string): string => {
  if (!ddmmyy) return '';
  // Handle DD-MM-YY format
  const parts = ddmmyy.split('-');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const fullYear = parseInt(y) < 30 ? 2000 + parseInt(y) : 1900 + parseInt(y);
    return `${fullYear}-${m}-${d}`;
  }
  // If already YYYY-MM-DD, return as is
  if (ddmmyy.match(/^\d{4}-\d{2}-\d{2}$/)) return ddmmyy;
  return ddmmyy;
};

// Convert YYYY-MM-DD to DD-MM-YY for display
const convertToDisplayFormat = (yyyymmdd: string): string => {
  if (!yyyymmdd) return '';
  // If YYYY-MM-DD format
  if (yyyymmdd.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [y, m, d] = yyyymmdd.split('-');
    const shortYear = y.slice(-2);
    return `${d}-${m}-${shortYear}`;
  }
  // If already DD-MM-YY, return as is
  return yyyymmdd;
};

interface Props {
  userData: LoginResponse;
  onBack?: () => void;
}

export default function SubjectManagement({ userData, onBack }: Props) {
  // Views: 'students' | 'subjects'
  const [currentView, setCurrentView] = useState<'students' | 'subjects'>('students');

  // Students list
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Subject list for selected student
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [subjectRecords, setSubjectRecords] = useState<SubjectRecord[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  // Subject details modal
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectRecord | null>(null);

  // Add marks modal and form state
  const [addMarksModalVisible, setAddMarksModalVisible] = useState(false);
  const [selectedSubjectForMarks, setSelectedSubjectForMarks] = useState<SubjectRecord | null>(null);
  const [marksFormData, setMarksFormData] = useState({
    subjectId: '',
    marksPercentage: '',
    examDate: convertToDisplayFormat(new Date().toISOString().split('T')[0]), // DD-MM-YY display format
  });
  const [isAddingMarks, setIsAddingMarks] = useState(false);

  // Edit/Delete marks mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingMarksId, setEditingMarksId] = useState<string | null>(null);
  const [editingMarksData, setEditingMarksData] = useState({
    marksPercentage: '',
    examDate: '',
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${userData.token}`,
  };

  // Fetch students list on mount
  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const path = buildUrl(API_CONFIG.ENDPOINTS.TUTOR, { id: userData._id });
        const url = `${API_CONFIG.BASE_URL}${path}`;
        const resp = await fetch(url, { headers: authHeaders });
        if (!resp.ok) throw new Error(`${resp.status}: ${await resp.text()}`);
        const data: TutorResponse = await resp.json();
        setStudents(Array.isArray(data.students) ? data.students : []);
      } catch (e: any) {
        setFetchError(e?.message || 'Failed to load students');
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, [userData._id]);

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // If on subjects view, go back to students
      if (currentView === 'subjects') {
        handleBackFromSubjects();
        return true;
      }
      // If on students view, call onBack to go to attendance
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [currentView, onBack]);

  // Fetch subjects for a student
  const fetchSubjects = async (studentId: string) => {
    setSubjectsLoading(true);
    try {
      const data = await getSubjectsByStudent(studentId, userData.token);
      console.log('✅ API Success:', data);
      setSubjectRecords(Array.isArray(data) ? data : []);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to load subject records');
      setSubjectRecords([]);
    } finally {
      setSubjectsLoading(false);
    }
  };

  // Handle student selection
  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setCurrentView('subjects');
    void fetchSubjects(student._id);
  };

  // Handle back from subjects view
  const handleBackFromSubjects = () => {
    setCurrentView('students');
    setSelectedStudent(null);
    setSubjectRecords([]);
  };

  // Open subject details modal
  const openSubjectDetails = (subject: SubjectRecord) => {
    setSelectedSubject(subject);
    setDetailModalVisible(true);
  };

  const closeSubjectDetails = () => {
    setDetailModalVisible(false);
    setSelectedSubject(null);
  };

  // Open add marks modal
  const openAddMarksModal = () => {
    if (!selectedStudent || subjectRecords.length === 0) {
      Alert.alert('Error', 'No subjects available. Please select a student first.');
      return;
    }
    setSelectedSubjectForMarks(subjectRecords[0]);
    setMarksFormData({
      subjectId: subjectRecords[0]._id,
      marksPercentage: '',
      examDate: convertToDisplayFormat(new Date().toISOString().split('T')[0]), // DD-MM-YY format
    });
    setAddMarksModalVisible(true);
  };

  const closeAddMarksModal = () => {
    setAddMarksModalVisible(false);
    setSelectedSubjectForMarks(null);
    setMarksFormData({
      subjectId: '',
      marksPercentage: '',
      examDate: convertToDisplayFormat(new Date().toISOString().split('T')[0]), // DD-MM-YY format
    });
  };

  // Handle date picker - simple text input approach with validation
  const handleDateChange = (text: string) => {
    // Allow user to type any date format, but validate it
    setMarksFormData(prev => ({ ...prev, examDate: text }));
  };

  // Handle add marks submission
  const submitAddMarks = async () => {
    // Validation
    if (!marksFormData.subjectId) {
      Alert.alert('Error', 'Please select a subject');
      return;
    }
    if (!marksFormData.marksPercentage || isNaN(Number(marksFormData.marksPercentage))) {
      Alert.alert('Error', 'Please enter valid marks percentage (0-100)');
      return;
    }
    const percentage = Number(marksFormData.marksPercentage);
    if (percentage < 0 || percentage > 100) {
      Alert.alert('Error', 'Marks must be between 0 and 100');
      return;
    }
    if (!marksFormData.examDate) {
      Alert.alert('Error', 'Please select exam date');
      return;
    }

    setIsAddingMarks(true);
    try {
      // Convert display format (DD-MM-YY) to API format (YYYY-MM-DD)
      const apiExamDate = convertToApiFormat(marksFormData.examDate);
      
      await addStudentSubjectMarks(
        selectedStudent!._id,
        marksFormData.subjectId,
        userData.token,
        {
          marksPercentage: percentage,
          examDate: apiExamDate,
        }
      );
      Alert.alert('Success', 'Marks added successfully!');
      closeAddMarksModal();
      // Refresh subject records
      if (selectedStudent) {
        await fetchSubjects(selectedStudent._id);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to add marks');
    } finally {
      setIsAddingMarks(false);
    }
  };

  // Handle edit marks - enter edit mode
  const startEditMarks = (mark: any) => {
    setEditingMarksId(mark._id);
    setEditingMarksData({
      marksPercentage: String(mark.percentage),
      examDate: formatDate(mark.examDate || mark.recordedAt),
    });
    setIsEditMode(true);
  };

  // Cancel edit mode
  const cancelEditMarks = () => {
    setIsEditMode(false);
    setEditingMarksId(null);
    setEditingMarksData({
      marksPercentage: '',
      examDate: '',
    });
  };

  // Handle delete marks with confirmation
  const handleDeleteMarks = (mark: any) => {
    Alert.alert(
      'Delete Marks Record',
      `Are you sure you want to delete this record?\n\nDate: ${formatDate(mark.examDate || mark.recordedAt)}\nMarks: ${mark.percentage}%\n\nThis action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await confirmDeleteMarks(mark);
          },
        },
      ]
    );
  };

  // Confirm and execute delete
  const confirmDeleteMarks = async (mark: any) => {
    if (!selectedSubject || !selectedStudent) return;

    try {
      setIsSubmittingEdit(true);
      await deleteStudentSubjectRecord(
        selectedStudent._id,
        selectedSubject._id,
        userData.token
      );
      Alert.alert('Success', 'Marks record deleted successfully!');
      // Refresh subject records
      await fetchSubjects(selectedStudent._id);
      closeSubjectDetails();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to delete marks');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Handle save edited marks with confirmation
  const handleSaveEditMarks = () => {
    if (!editingMarksData.marksPercentage || isNaN(Number(editingMarksData.marksPercentage))) {
      Alert.alert('Error', 'Please enter valid marks percentage (0-100)');
      return;
    }
    const percentage = Number(editingMarksData.marksPercentage);
    if (percentage < 0 || percentage > 100) {
      Alert.alert('Error', 'Marks must be between 0 and 100');
      return;
    }
    if (!editingMarksData.examDate) {
      Alert.alert('Error', 'Please select exam date');
      return;
    }

    // Show confirmation before saving
    Alert.alert(
      'Confirm Update',
      `Are you sure you want to update this marks record?\n\nNew Marks: ${percentage}%\nNew Date: ${editingMarksData.examDate}\n\nThis will overwrite the previous data.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Update',
          style: 'default',
          onPress: async () => {
            await confirmSaveEditMarks(percentage);
          },
        },
      ]
    );
  };

  // Confirm and execute save edit
  const confirmSaveEditMarks = async (percentage: number) => {
    if (!selectedSubject || !selectedStudent || !editingMarksId) return;

    try {
      setIsSubmittingEdit(true);
      // Convert display format (DD-MM-YY) to API format (YYYY-MM-DD)
      const apiExamDate = convertToApiFormat(editingMarksData.examDate);

      await updateStudentSubjectRecord(
        selectedStudent._id,
        selectedSubject._id,
        userData.token,
        {
          marksPercentage: percentage,
          examDate: apiExamDate,
        }
      );
      Alert.alert('Success', 'Marks record updated successfully!');
      cancelEditMarks();
      // Refresh subject records
      await fetchSubjects(selectedStudent._id);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update marks');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Render student card
  const renderStudentCard = ({ item }: { item: Student }) => (
    <TouchableOpacity 
      style={styles.studentCard}
      onPress={() => handleSelectStudent(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.studentName}>{item.name}</Text>
        <Text style={[styles.badge, item.status === 'inactive' ? styles.badgeInactive : styles.badgeActive]}>
          {item.status || 'active'}
        </Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Father</Text>
        <Text style={styles.cardValue}>{item.fatherName}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Contact</Text>
        <Text style={styles.cardValue}>{item.contact}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.tapHint}>Tap to view subjects →</Text>
      </View>
    </TouchableOpacity>
  );

  // Render subject card
  const renderSubjectCard = ({ item }: { item: SubjectRecord }) => {
    const subjectName = item.subject?.subjectName || 'Unknown Subject';
    const marksCount = item.marksPercentage?.length || 0;

    return (
      <TouchableOpacity 
        style={styles.subjectCard}
        onPress={() => openSubjectDetails(item)}
        activeOpacity={0.7}
      >
        <View style={styles.subjectHeader}>
          <Text style={styles.subjectName}>{subjectName}</Text>
          <View style={styles.marksCountBadge}>
            <Text style={styles.marksCountText}>{marksCount} records</Text>
          </View>
        </View>
        
        {marksCount > 0 && (
          <>
            <View style={styles.subjectMeta}>
              <Text style={styles.metaLabel}>Latest Marks:</Text>
              <Text style={styles.metaValue}>
                {item.marksPercentage[marksCount - 1]?.percentage}%
              </Text>
            </View>
            <View style={styles.subjectMeta}>
              <Text style={styles.metaLabel}>Latest Date:</Text>
              <Text style={styles.metaValue}>
                {formatDate(item.marksPercentage[marksCount - 1]?.examDate || item.marksPercentage[marksCount - 1]?.recordedAt)}
              </Text>
            </View>
          </>
        )}

        {marksCount === 0 && (
          <Text style={styles.noMarksText}>No marks recorded yet</Text>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.tapHint}>Tap to view details →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render marks history table
  const renderMarksHistory = () => {
    if (!selectedSubject || !selectedSubject.marksPercentage || selectedSubject.marksPercentage.length === 0) {
      return <Text style={styles.noMarksText}>No marks records found</Text>;
    }

    // If in edit mode, show edit form
    if (isEditMode && editingMarksId) {
      const editingMark = selectedSubject.marksPercentage.find(m => m._id === editingMarksId);
      if (!editingMark) return null;

      return (
        <View style={styles.editFormContainer}>
          <Text style={styles.editFormTitle}>Edit Marks Record</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Marks Percentage</Text>
            <TextInput
              style={styles.editInput}
              value={editingMarksData.marksPercentage}
              onChangeText={(text) => setEditingMarksData(prev => ({ ...prev, marksPercentage: text }))}
              keyboardType="number-pad"
              placeholder="0-100"
              editable={!isSubmittingEdit}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Exam Date (DD-MM-YY)</Text>
            <TextInput
              style={styles.editInput}
              value={editingMarksData.examDate}
              onChangeText={(text) => setEditingMarksData(prev => ({ ...prev, examDate: text }))}
              placeholder="DD-MM-YY"
              editable={!isSubmittingEdit}
            />
          </View>

          <View style={styles.editFormActions}>
            <TouchableOpacity 
              style={[styles.editBtn, styles.editBtnCancel]} 
              onPress={cancelEditMarks}
              disabled={isSubmittingEdit}
            >
              {isSubmittingEdit ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.editBtnText}>Cancel</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.editBtn, styles.editBtnSave]} 
              onPress={handleSaveEditMarks}
              disabled={isSubmittingEdit}
            >
              {isSubmittingEdit ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.editBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.marksTable}>
        {/* Table Header */}
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.tableHeader, { flex: 0.6 }]}>S.No</Text>
          <Text style={[styles.tableCell, styles.tableHeader, { flex: 1.5 }]}>Exam Date</Text>
          <Text style={[styles.tableCell, styles.tableHeader, { flex: 1 }]}>Percentage</Text>
          <Text style={[styles.tableCell, styles.tableHeader, { flex: 1.2 }]}>Actions</Text>
        </View>

        {/* Table Rows */}
        {selectedSubject.marksPercentage.map((mark, idx) => (
          <View key={mark._id || idx} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 0.6 }]}>{idx + 1}</Text>
            <Text style={[styles.tableCell, { flex: 1.5 }]}>
              {formatDate(mark.examDate || mark.recordedAt)}
            </Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>
              {mark.percentage}%
            </Text>
            <View style={[{ flex: 1.2 }, styles.actionButtons]}>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.actionBtnEdit]}
                onPress={() => startEditMarks(mark)}
              >
                <Text style={styles.actionBtnText}>✎</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.actionBtnDelete]}
                onPress={() => handleDeleteMarks(mark)}
              >
                <Text style={styles.actionBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // STUDENTS VIEW
  if (currentView === 'students') {
    return (
      <>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.root}>
          <View style={styles.topBar}>
            {onBack ? (
              <TouchableOpacity onPress={onBack}>
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 48 }} />
            )}
          </View>

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Subject Management</Text>
            <Text style={styles.headerSub}>Select a student to view their subjects</Text>
          </View>

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
              renderItem={renderStudentCard}
              contentContainerStyle={{ 
                paddingHorizontal: 16, 
                paddingVertical: 16, 
                flexGrow: 1,
              }}
              ListEmptyComponent={
                <View style={styles.center}>
                  <Text style={styles.muted}>No students found</Text>
                </View>
              }
              keyboardShouldPersistTaps="handled"
            />
          )}
        </SafeAreaView>
      </>
    );
  }

  // SUBJECTS VIEW
  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.root}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleBackFromSubjects}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openAddMarksModal} style={styles.addMarksButtonPill}>
            <Text style={styles.addMarksButtonPillText}>Add Marks</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Subjects - {selectedStudent?.name}</Text>
          <Text style={styles.headerSub}>Select a subject to view marks history</Text>
        </View>

        {subjectsLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#5B7CFF" />
            <Text style={styles.muted}>Loading subjects...</Text>
          </View>
        ) : (
          <FlatList
            data={subjectRecords}
            keyExtractor={item => item._id}
            renderItem={renderSubjectCard}
            contentContainerStyle={{ 
              paddingHorizontal: 16, 
              paddingVertical: 16, 
              flexGrow: 1,
            }}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.muted}>No subjects found for this student</Text>
              </View>
            }
            keyboardShouldPersistTaps="handled"
          />
        )}

        {/* Subject Details Modal */}
        <Modal visible={detailModalVisible} transparent animationType="fade" onRequestClose={closeSubjectDetails}>
          <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {selectedSubject?.subject?.subjectName}
                  </Text>
                  <View style={styles.headerActions}>
                    {!isEditMode && (
                      <TouchableOpacity 
                        style={styles.headerEditBtn}
                        onPress={() => setIsEditMode(true)}
                      >
                        <Text style={styles.headerEditBtnText}>Edit</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={closeSubjectDetails}>
                      <Text style={styles.closeButton}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView contentContainerStyle={{ paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Marks History</Text>
                    {renderMarksHistory()}
                  </View>

                  {selectedSubject?.marksPercentage && selectedSubject.marksPercentage.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Summary</Text>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total Records:</Text>
                        <Text style={styles.summaryValue}>{selectedSubject.marksPercentage.length}</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Highest Marks:</Text>
                        <Text style={styles.summaryValue}>
                          {Math.max(...selectedSubject.marksPercentage.map(m => m.percentage))}%
                        </Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Lowest Marks:</Text>
                        <Text style={styles.summaryValue}>
                          {Math.min(...selectedSubject.marksPercentage.map(m => m.percentage))}%
                        </Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Average Marks:</Text>
                        <Text style={styles.summaryValue}>
                          {(selectedSubject.marksPercentage.reduce((sum, m) => sum + m.percentage, 0) / selectedSubject.marksPercentage.length).toFixed(2)}%
                        </Text>
                      </View>
                    </View>
                  )}
                </ScrollView>

                <View style={styles.modalActions}>
                  {isEditMode ? (
                    <>
                      <TouchableOpacity 
                        style={[styles.btn, styles.btnLight]} 
                        onPress={cancelEditMarks}
                        disabled={isSubmittingEdit}
                      >
                        <Text style={styles.btnTextDark}>Cancel Edit</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity style={[styles.btn, styles.btnLight]} onPress={closeSubjectDetails}>
                      <Text style={styles.btnTextDark}>Close</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Add Marks Modal */}
        <Modal visible={addMarksModalVisible} transparent animationType="fade" onRequestClose={closeAddMarksModal}>
          <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add Marks Record</Text>
                  <TouchableOpacity onPress={closeAddMarksModal}>
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={{ paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
                  <View style={styles.section}>
                    {/* Subject Dropdown */}
                    <View style={styles.infoPair}>
                      <Text style={styles.infoLabel}>Subject</Text>
                      <View style={styles.dropdownContainer}>
                        <ScrollView 
                          horizontal 
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={{ gap: 8, paddingVertical: 8 }}
                        >
                          {subjectRecords.map((subject) => (
                            <TouchableOpacity
                              key={subject._id}
                              style={[
                                styles.dropdownOption,
                                marksFormData.subjectId === subject._id && styles.dropdownOptionActive,
                              ]}
                              onPress={() =>
                                setMarksFormData(prev => ({ 
                                  ...prev, 
                                  subjectId: subject._id 
                                }))
                              }
                            >
                              <Text
                                style={[
                                  styles.dropdownOptionText,
                                  marksFormData.subjectId === subject._id && styles.dropdownOptionTextActive,
                                ]}
                              >
                                {subject.subject?.subjectName}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </View>

                    {/* Marks Percentage Input */}
                    <View style={styles.infoPair}>
                      <Text style={styles.infoLabel}>Marks Percentage (0-100)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter marks (e.g., 85)"
                        placeholderTextColor="#9AA0A6"
                        keyboardType="number-pad"
                        value={marksFormData.marksPercentage}
                        onChangeText={(text) =>
                          setMarksFormData(prev => ({ ...prev, marksPercentage: text }))
                        }
                        maxLength={3}
                      />
                    </View>

                    {/* Exam Date Input */}
                    <View style={styles.infoPair}>
                      <Text style={styles.infoLabel}>Exam Date (DD-MM-YY)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g., 24-11-25"
                        placeholderTextColor="#9AA0A6"
                        value={marksFormData.examDate}
                        onChangeText={handleDateChange}
                      />
                      <Text style={styles.helperText}>Format: DD-MM-YY</Text>
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={[styles.btn, styles.btnLight]} 
                    onPress={closeAddMarksModal}
                    disabled={isAddingMarks}
                  >
                    <Text style={styles.btnTextDark}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.btn, styles.btnPrimary]}
                    onPress={submitAddMarks}
                    disabled={isAddingMarks}
                  >
                    {isAddingMarks ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.btnTextLight}>Add Marks</Text>
                    )}
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

  topBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAF0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 50,
  },

  backText: { 
    color: '#2563EB', 
    fontSize: 14, 
    fontWeight: '700' 
  },

  addMarksButtonPill: {
    backgroundColor: '#3B82F6',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  addMarksButtonPillText: { 
    color: '#fff', 
    fontWeight: '900', 
    fontSize: 13 
  },

  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAF0',
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },

  headerTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#0F172A', 
    marginBottom: 4
  },

  headerSub: { 
    fontSize: 12, 
    color: '#6B7280',
  },

  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20,
  },

  muted: { 
    color: '#6B7280', 
    marginTop: 12,
    fontSize: 14,
  },

  errorText: { 
    color: '#D32F2F',
    fontSize: 14,
  },

  noMarksText: { 
    color: '#9AA0A6', 
    fontSize: 13, 
    fontStyle: 'italic',
    marginTop: 8,
  },

  // Student Card Styles
  studentCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 14, 
    padding: 14, 
    marginBottom: 12, 
    shadowColor: '#000', 
    shadowOpacity: 0.06, 
    shadowRadius: 8, 
    shadowOffset: { width: 0, height: 3 }, 
    elevation: 2, 
    borderWidth: 1,
    borderColor: '#ECEEF5',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  studentName: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#111827',
  },

  badge: { 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 999, 
    fontSize: 11, 
    fontWeight: '700' 
  },

  badgeActive: { 
    backgroundColor: '#EAF8EE', 
    color: '#157F3F' 
  },

  badgeInactive: { 
    backgroundColor: '#F1F2F6', 
    color: '#6B7280' 
  },

  cardRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 4,
    marginBottom: 2,
  },

  cardLabel: { 
    color: '#7C838D', 
    fontSize: 12,
    fontWeight: '500',
  },

  cardValue: { 
    color: '#0F172A', 
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },

  cardFooter: {
    marginTop: 10,
    alignItems: 'flex-end',
  },

  tapHint: { 
    color: '#5856D6', 
    fontSize: 12, 
    fontWeight: '600' 
  },

  // Subject Card Styles
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#ECEEF5',
  },

  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  subjectName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
  },

  marksCountBadge: {
    backgroundColor: '#EBF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  marksCountText: {
    color: '#2257D6',
    fontSize: 11,
    fontWeight: '700',
  },

  subjectMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginBottom: 4,
  },

  metaLabel: {
    color: '#7C838D',
    fontSize: 12,
    fontWeight: '500',
  },

  metaValue: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '600',
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    padding: 12,
  },

  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#ECEEF5',
    overflow: 'hidden',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECF3',
    backgroundColor: '#FAFBFF',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    flex: 1,
  },

  closeButton: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: 'bold',
  },

  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECF3',
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 12,
  },

  marksTable: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },

  tableCell: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },

  tableHeader: {
    backgroundColor: '#F3F4F6',
    color: '#111827',
    fontWeight: '800',
    paddingVertical: 12,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },

  summaryLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },

  summaryValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '800',
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E9ECF3',
    backgroundColor: '#FAFBFF',
  },

  btn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },

  btnLight: {
    backgroundColor: '#EEF1F7',
  },

  btnTextDark: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 14,
  },

  btnPrimary: {
    backgroundColor: '#3B82F6',
    marginLeft: 10,
  },

  btnTextLight: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },

  // Form Input Styles
  infoPair: {
    marginBottom: 16,
  },

  infoLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },

  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },

  helperText: {
    fontSize: 11,
    color: '#9AA0A6',
    marginTop: 6,
    fontStyle: 'italic',
  },

  // Dropdown Styles
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 8,
    backgroundColor: '#F9FAFB',
    minHeight: 50,
    justifyContent: 'center',
  },

  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#EEF1F7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    minWidth: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dropdownOptionActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#2563EB',
  },

  dropdownOptionText: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
  },

  dropdownOptionTextActive: {
    color: '#fff',
  },

  // Edit Form Styles
  editFormContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },

  editFormTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0C4A6E',
    marginBottom: 16,
  },

  formGroup: {
    marginBottom: 12,
  },

  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },

  editInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },

  editFormActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 16,
  },

  editBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  editBtnCancel: {
    backgroundColor: '#E5E7EB',
  },

  editBtnSave: {
    backgroundColor: '#3B82F6',
  },

  editBtnText: {
    fontWeight: '700',
    fontSize: 13,
    color: '#fff',
  },

  // Action Buttons in Table
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
  },

  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },

  actionBtnEdit: {
    backgroundColor: '#DBEAFE',
  },

  actionBtnDelete: {
    backgroundColor: '#FEE2E2',
  },

  actionBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Modal Header Actions
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  headerEditBtn: {
    backgroundColor: '#DBEAFE',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerEditBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0C4A6E',
  },
});
