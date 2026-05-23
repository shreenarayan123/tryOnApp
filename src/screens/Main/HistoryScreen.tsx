import React, {useEffect, useMemo, useState} from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Button from '../../components/common/Button';
import ZoomableImageView from '../../components/common/ZoomableImageView';
import ResultCard from '../../components/result/ResultCard';
import {COLORS} from '../../constants/colors';
import {useHistoryStore} from '../../store/useHistoryStore';
import {MainTabParamList, TryOnResult} from '../../types';

type Props = NativeStackScreenProps<MainTabParamList, 'HistoryTab'>;

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return `Today ${date.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})}`;
  }

  if (isYesterday) {
    return 'Yesterday';
  }

  return date.toLocaleDateString([], {month: 'short', day: 'numeric'});
};

const SkeletonCard = () => {
  const pulse = useSharedValue(0.4);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, {duration: 900, easing: Easing.inOut(Easing.quad)}), -1, true);
  }, [pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <Animated.View style={[styles.skeleton, style]}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonLine} />
    </Animated.View>
  );
};

const HistoryScreen = ({navigation}: Props) => {
  const results = useHistoryStore(state => state.results);
  const removeResult = useHistoryStore(state => state.removeResult);
  const clearAll = useHistoryStore(state => state.clearAll);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<TryOnResult | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(timer);
  }, []);

  const content = useMemo(() => {
    return results;
  }, [results]);

  const confirmClear = () => {
    Alert.alert('Clear all history?', 'This will remove every saved try-on result.', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Clear All', style: 'destructive', onPress: clearAll},
    ]);
  };

  const deleteItem = (item: TryOnResult) => {
    Alert.alert('Delete try-on?', 'Remove this result from your history.', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: () => removeResult(item.id)},
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.navigate('CameraTab')} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Your History</Text>
        {content.length > 0 ? (
          <Pressable onPress={confirmClear} hitSlop={12}>
            <Text style={styles.clearText}>Clear All</Text>
          </Pressable>
        ) : (
          <View style={{width: 52}} />
        )}
      </View>

      {loading ? (
        <View style={styles.grid}>
          {[0, 1, 2, 3].map(index => (
            <View key={index} style={styles.gridItem}>
              <SkeletonCard />
            </View>
          ))}
        </View>
      ) : content.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="hanger" size={68} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>No try-ons yet</Text>
          <Text style={styles.emptySubtitle}>Head to a store and snap your first outfit!</Text>
          <Button title="Open Camera" onPress={() => navigation.navigate('CameraTab')} />
        </View>
      ) : (
        <FlatList
          data={content}
          numColumns={2}
          keyExtractor={item => item.id}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          renderItem={({item}) => (
            <ResultCard
              imageUri={item.resultImagePath}
              timestampLabel={formatTimestamp(item.timestamp)}
              onPress={() => setSelectedResult(item)}
              onLongPress={() => deleteItem(item)}
            />
          )}
        />
      )}

      <Modal visible={Boolean(selectedResult)} animationType="slide" onRequestClose={() => setSelectedResult(null)}>
        <View style={styles.viewerContainer}>
          <View style={styles.viewerHeader}>
            <Pressable onPress={() => setSelectedResult(null)} hitSlop={12}>
              <MaterialCommunityIcons name="close" size={26} color={COLORS.textPrimary} />
            </Pressable>
            <Text style={styles.viewerTitle}>Full View</Text>
            <View style={{width: 26}} />
          </View>

          {selectedResult ? (
            <View style={styles.viewerImageWrap}>
              <Text style={styles.viewerTimestamp}>{formatTimestamp(selectedResult.timestamp)}</Text>
              <ZoomableImageView
                imageUri={selectedResult.resultImagePath}
                containerStyle={styles.viewerImage}
              />
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 18,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  clearText: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  listContent: {
    paddingBottom: 24,
  },
  columnWrapper: {
    gap: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  gridItem: {
    width: '50%',
  },
  skeleton: {
    margin: 6,
  },
  skeletonImage: {
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
  },
  skeletonLine: {
    height: 12,
    marginTop: 10,
    width: '70%',
    borderRadius: 999,
    backgroundColor: COLORS.surfaceLight,
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 18,
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  viewerTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  viewerImageWrap: {
    gap: 10,
    flex: 1,
  },
  viewerTimestamp: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  viewerImage: {
    width: '100%',
    flex: 1,
    minHeight: 420,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLight,
  },
});

export default HistoryScreen;
