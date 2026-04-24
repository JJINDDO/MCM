import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal
} from 'react-native';
import Timetable from './Timetable';

export default function ExtraPage({ schedules = [], results = {}, onBack }) {
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const selectedResult = selectedSchedule ? results[selectedSchedule.timeStr] : null;

  const getExtraPlans = () => {
    if (!selectedResult) return [];

    if (selectedResult.extras && Array.isArray(selectedResult.extras)) {
      return selectedResult.extras;
    }

    return [
      {
        name: selectedResult?.name || "엑스트라 1",
        action: selectedResult?.extraAction || "주연을 위해 배경에 녹아듭니다.",
      },
      {
        name: "엑스트라 2",
        action: "주연이 돋보이도록 주변 분위기를 정리합니다.",
      },
      {
        name: "엑스트라 3",
        action: "주연의 행동이 더 의미 있어 보이도록 리액션을 제공합니다.",
      },
    ];
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>엑스트라 플랜</Text>
        <Text style={styles.headerSubTitle}>Main Character Maker</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.leftSection}>
          {!selectedSchedule ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>엑스트라 플랜 예측을 확인하세요</Text>
              <Text style={styles.emptyText}>
                오른쪽 타임테이블에서 색칠된 시간을 클릭하세요.
              </Text>

              <ScrollView style={styles.timeButtonBox}>
                {[...schedules].sort((a, b) => a.startIdx - b.startIdx).map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.timeButton}
                    onPress={() => setSelectedSchedule(s)}
                  >
                    <Text style={styles.timeButtonText}>{s.timeStr}</Text>
                    <Text style={styles.timeButtonAction}>{s.action}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : (
            <>
              <View style={styles.selectedHeader}>
                <TouchableOpacity
                  style={styles.backArrow}
                  onPress={() => setSelectedSchedule(null)}
                >
                  <Text style={styles.backArrow}>‹</Text>
                </TouchableOpacity>

                <View style={styles.selectedTextBox}>
                  <Text style={styles.selectedAction}>내 행동 : {selectedSchedule.action}</Text>
                  <Text style={styles.selectedTime}>{selectedSchedule.timeStr}</Text>
                </View>
              </View>

              <View style={styles.extraContainer}>
                <Text style={styles.containerTitle}>엑스트라 플랜</Text>

                <ScrollView>
                  {getExtraPlans().map((extra, index) => (
                    <View key={index} style={styles.extraCard}>
                      <Text style={styles.extraName}>{extra.name}</Text>
                      <Text style={styles.extraAction}>{extra.action}</Text>
                    </View>
                  ))}

                  <View style={styles.fullStoryBox}>
                    <Text style={styles.fullStoryTitle}>전체 스토리</Text>
                    <Text style={styles.fullStoryText}>
                      {selectedResult?.fullStory || "전체 스토리가 아직 생성되지 않았습니다."}
                    </Text>
                  </View>
                </ScrollView>
              </View>
            </>
          )}
        </View>

        <View style={styles.rightSection}>
          <View style={styles.dateBox}>
            <Text style={styles.dateText}>2026-04-25</Text>
          </View>

          <Timetable
            schedules={schedules}
            onDragComplete={() => {}}
            previewColor="transparent"
            readOnly={true}
            onSchedulePress={(schedule) => setSelectedSchedule(schedule)}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>수정하러 돌아가기</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },

  header: {
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E9E9EE',
    alignItems: 'center'
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111111'
  },

  headerSubTitle: {
    marginTop: 4,
    fontSize: 11,
    color: '#888',
    fontWeight: '600'
  },

  content: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
    gap: 12
  },

  leftSection: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: '#484246',
    borderRadius: 18
  },

  rightSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E9E9EE'
  },

  dateBox: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#EFEFF3'
  },

  dateText: {
    color: '#111111',
    fontSize: 18,
    fontWeight: '900'
  },

  emptyBox: { flex: 1 },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8
  },

  emptyText: {
    fontSize: 13,
    color: '#DDD',
    lineHeight: 20,
    marginBottom: 18
  },

  timeButtonBox: { flex: 1 },

  timeButton: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10
  },

  timeButtonText: {
    fontSize: 11,
    color: '#8B8B95',
    fontWeight: '700',
    marginBottom: 4
  },

  timeButtonAction: {
    fontSize: 15,
    color: '#111111',
    fontWeight: '800'
  },

  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },

  backArrow: {
    fontSize: 30,
    color: '#fff',
    fontWeight: '700',
    lineHeight: 30,
    marginRight : 10,
  },

  selectedTextBox: {
    flex: 1
  },

  selectedAction: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6
  },

  selectedTime: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '700'
  },

  extraContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14
  },

  containerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 12
  },

  extraCard: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#EFEFF3'
  },

  extraName: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 6
  },

  extraAction: {
    fontSize: 13,
    color: '#333',
    lineHeight: 19
  },

  fullStoryBox: {
    marginTop: 14,
    padding: 14,
    backgroundColor: '#F7F8FA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEFF3'
  },

  fullStoryTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 8
  },

  fullStoryText: {
    fontSize: 13,
    color: '#333333',
    lineHeight: 20
  },

  backButton: {
    backgroundColor: '#333',
    padding: 15,
    margin: 15,
    borderRadius: 14,
    alignItems: 'center'
  },

  backButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
});