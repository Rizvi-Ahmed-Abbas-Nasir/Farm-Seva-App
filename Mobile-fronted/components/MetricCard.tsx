import { View, Text, StyleSheet } from 'react-native';
import { 
  Users, 
  TrendingDown, 
  TrendingUp, 
  Wheat, 
  ShieldAlert 
} from 'lucide-react-native';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
}

export function MetricCard({ title, value, change, changeType, icon }: MetricCardProps) {
  const getIcon = () => {
    switch (icon) {
      case 'users':
        return <Users size={24} color="#10B981" />;
      case 'trending-down':
        return <TrendingDown size={24} color="#10B981" />;
      case 'trending-up':
        return <TrendingUp size={24} color="#EF4444" />;
      case 'wheat':
        return <Wheat size={24} color="#F59E0B" />;
      case 'shield-alert':
        return <ShieldAlert size={24} color="#EF4444" />;
      default:
        return <Users size={24} color="#10B981" />;
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return '#10B981';
      case 'negative':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        {getIcon()}
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.value}>{value}</Text>
        <Text style={[styles.change, { color: getChangeColor() }]}>
          {change}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    marginBottom: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#6B7280',
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  change: {
    fontSize: 12,
    fontWeight: 'normal',
  },
});