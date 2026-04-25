import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, ScrollView, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Timetable from './components/Timetable';
import ExtraPage from './components/ExtraPage'; 

const PRESET_COLORS = ['#FF0000CC', '#FFFF00CC', '#29b829cc', '#0f0fb8cc', '#8c3434cc', '#d801d8cc'];
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export default function App() {
  const [currentPage, setCurrentPage] = useState('main'); 
  const [schedules, setSchedules] = useState([]);
  const [colorIndex, setColorIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [inputText, setInputText] = useState('');
  const [simulationResults, setSimulationResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const saved = await AsyncStorage.getItem('@mangsang_schedules');
        if (saved) setSchedules(JSON.parse(saved));
      } catch (e) { console.log(e); }
    };
    loadData();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('@mangsang_schedules', JSON.stringify(schedules));
  }, [schedules]);

  const handleDragComplete = useCallback((min, max) => {
    const isOverlap = schedules.some(s => min <= s.endIdx && max >= s.startIdx);
    if (isOverlap) { Alert.alert("알림", "이미 플랜이 작성되었습니다."); return; }

    const formatTime = (idx) => {
      const totalMin = 6 * 60 + idx * 10;
      return `${Math.floor(totalMin / 60) % 24}시 ${(totalMin % 60).toString().padStart(2, '0')}분`;
    };

    setSelectedItem({
      startIdx: min,
      endIdx: max,
      timeStr: `${formatTime(min)} ~ ${formatTime(max + 1)}`,
      color: PRESET_COLORS[colorIndex]
    });

    setInputText('');
    setIsEditMode(false);
    setModalVisible(true);
  }, [schedules, colorIndex]);

  const saveAction = () => {
    if (!inputText.trim()) return;

    if (isEditMode) {
      setSchedules(prev =>
        prev.map(s =>
          s.id === selectedItem.id
            ? { ...s, action: inputText, color: selectedItem.color }
            : s
        )
      );
    } else {
      setSchedules(prev => [
        ...prev,
        { ...selectedItem, id: Date.now().toString(), action: inputText }
      ]);
      setColorIndex(prev => (prev + 1) % PRESET_COLORS.length);
    }

    setModalVisible(false);
  };

  const deleteItem = () => {
    setSchedules(prev => prev.filter(s => s.id !== selectedItem.id));
    setModalVisible(false);
  };

const goToExtraPage = async () => {
    if (schedules.length === 0) {
      return Alert.alert("알림", "일정을 먼저 입력해주세요! 🎬");
    }

    setIsLoading(true);

    try {
      // 🔥 [체크 포인트 1] 프론트엔드에서 API를 1번만 쏘는지 확인하는 로그
      console.log(`🚀 API 단 1회 호출 시작! (현재 일정 개수: ${schedules.length}개)`);

      // 1. 모든 일정을 하나의 배열로 묶기
      const scheduleData = schedules.map(s => ({
        time: s.timeStr,
        myAction: s.action
      }));

      // 2. API를 딱 한 번만 호출! (바깥에 다른 map이나 Promise.all이 없어야 합니다)
      const res = await fetch(`${API_URL}/app/story`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ schedules: scheduleData }), // 배열 전체를 한 번에 보냄
      });

      console.log("🚀 API 응답 도착 완료!");

      const json = await res.json();

      if (!res.ok) {
        throw new Error("서버 응답 에러");
      }

      // 3. 백엔드에서 받은 배열을 ExtraPage 포맷에 맞게 변환
      const finalResults = {};
      if (json.data && Array.isArray(json.data)) {
        json.data.forEach(item => {
          finalResults[item.time] = {
            time: item.time,
            extras: item.extras,
            fullStory: item.fullStory
          };
        });
      }

      setSimulationResults(finalResults);
      setCurrentPage('extra');

    } catch (e) {
      console.log("분석 실패:", e);
      Alert.alert("에러", "스토리 생성 중 문제가 발생했습니다. 서버를 확인해주세요!");
    } finally {
      setIsLoading(false);
    }
  };

  if (currentPage === 'extra') {
    return (
      <ExtraPage
        schedules={schedules}
        results={simulationResults}
        onBack={() => setCurrentPage('main')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>망상 플래너</Text>
        <Text style={styles.headerSubTitle}>Main Character Maker</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Text style={styles.sectionTitle}>오늘의 플랜</Text>

          <ScrollView style={styles.planList}>
            {[...schedules].sort((a, b) => a.startIdx - b.startIdx).map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.listItem}
                onPress={() => {
                  setSelectedItem(s);
                  setInputText(s.action);
                  setIsEditMode(true);
                  setModalVisible(true);
                }}
              >
                <View style={styles.listLeft}>
                  <View style={[styles.dot, { backgroundColor: s.color }]} />
                  <View>
                    <Text style={styles.listTime}>{s.timeStr}</Text>
                    <Text style={styles.listAction}>{s.action}</Text>
                  </View>
                </View>

                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 왼쪽 플랜 밑으로 이동한 버튼 */}
          <TouchableOpacity style={styles.extraButton} onPress={goToExtraPage} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.extraButtonText}>엑스트라 플랜 생성</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.rightSection}>
          {/* 타임테이블 위 날짜 공백 */}
          <View style={styles.dateBox}>
            <Text style={styles.dateText}>2026-04-25</Text>
          </View>

          <Timetable
            schedules={schedules}
            onDragComplete={handleDragComplete}
            previewColor={PRESET_COLORS[colorIndex]}
          />
        </View>
      </View>

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTime}>{selectedItem?.timeStr}</Text>

            <TextInput
              style={styles.modalInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="행동 입력"
              placeholderTextColor="#999"
              autoFocus
            />

            <View style={styles.bottomContainer}>
              <View style={styles.colorPicker}>
                {isEditMode && PRESET_COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorCircle,
                      {
                        backgroundColor: c,
                        borderWidth: selectedItem.color === c ? 2 : 0,
                        borderColor: '#333'
                      }
                    ]}
                    onPress={() => setSelectedItem({ ...selectedItem, color: c })}
                  />
                ))}
              </View>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                  <Text style={styles.btnText}>취소</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={saveAction} style={styles.saveBtn}>
                  <Text style={[styles.btnText, { color: '#fff', fontWeight: 'bold' }]}>
                    {isEditMode ? "수정" : "저장"}
                  </Text>
                </TouchableOpacity>

                {isEditMode && (
                  <TouchableOpacity onPress={deleteItem} style={styles.deleteBtn}>
                    <Text style={[styles.btnText, { color: '#fff' }]}>삭제</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },

  header: {
    paddingVertical: 16,
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E9E9EE',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 23,
    fontWeight: '900',
    textAlign: 'center',
    color: '#111111',
  },

  headerSubTitle: {
    marginTop: 3,
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
  },

  content: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },

  leftSection: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E9E9EE',
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 12,
    color: '#111111',
  },

  planList: {
    flex: 1,
  },

  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#EFEFF3',
  },

  listLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  dot: {
    width: 8,
    height: 32,
    borderRadius: 6,
    marginRight: 12,
  },

  listTime: {
    fontSize: 11,
    color: '#8B8B95',
    marginBottom: 3,
    fontWeight: '700',
  },

  listAction: {
    fontSize: 15,
    color: '#111111',
    fontWeight: '800',
  },

  arrow: {
    fontSize: 24,
    color: '#C3C3CC',
    marginLeft: 8,
  },

  rightSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E9E9EE',
  },

  dateBox: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#EFEFF3',
  },

  dateText: {
    color: '#111111',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  extraButton: {
    backgroundColor: '#111111',
    paddingVertical: 16,
    marginTop: 14,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 3,
  },

  extraButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    width: '88%',
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 25,
    elevation: 10,
  },

  modalTime: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#111',
  },

  modalInput: {
    borderBottomWidth: 2,
    borderColor: '#eee',
    marginBottom: 20,
    padding: 10,
    fontSize: 16,
    color: '#111',
  },

  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  colorPicker: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  colorCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginRight: 5,
  },

  modalBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  btnText: {
    fontSize: 13,
  },

  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    marginLeft: 8,
  },

  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#eee',
    borderRadius: 8,
  },

  deleteBtn: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#FF5252',
    borderRadius: 8,
    marginLeft: 8,
  },
});