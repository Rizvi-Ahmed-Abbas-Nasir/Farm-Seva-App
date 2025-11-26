import { View, StyleSheet } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0-100
  color: string;
  height?: number;
}

export function ProgressBar({ progress, color, height = 8 }: ProgressBarProps) {
  return (
    <View style={[styles.container, { height }]}>
      <View 
        style={[
          styles.progress, 
          { 
            width: `${Math.min(100, Math.max(0, progress))}%`, 
            backgroundColor: color,
            height 
          }
        ]} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progress: {
    borderRadius: 4,
  },
});