import { View, Text, StyleSheet } from 'react-native';
import { 
  Users, 
  TrendingDown, 
  TrendingUp, 
  Wheat, 
  ShieldAlert,
  FileText,
  Cloud
} from 'lucide-react-native';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  bgColor?: string;
  iconColor?: string;
  textColor?: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeType, 
  icon,
  bgColor = '#FFFFFF',
  iconColor,
  textColor = '#111827'
}: MetricCardProps) {
  const getIcon = () => {
    const color = iconColor || '#6366F1';
    const size = 26;
    
    switch (icon) {
      case 'users':
        return <Users size={size} color={color} strokeWidth={2.5} />;
      case 'trending-down':
        return <TrendingDown size={size} color={color} strokeWidth={2.5} />;
      case 'trending-up':
        return <TrendingUp size={size} color={color} strokeWidth={2.5} />;
      case 'wheat':
        return <Wheat size={size} color={color} strokeWidth={2.5} />;
      case 'shield-alert':
        return <ShieldAlert size={size} color={color} strokeWidth={2.5} />;
      case 'file-text':
        return <FileText size={size} color={color} strokeWidth={2.5} />;
      case 'cloud':
        return <Cloud size={size} color={color} strokeWidth={2.5} />;
      default:
        return <Users size={size} color={color} strokeWidth={2.5} />;
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

  const getChangeIcon = () => {
    if (changeType === 'positive') {
      return <TrendingUp size={13} color="#10B981" strokeWidth={2.5} />;
    } else if (changeType === 'negative') {
      return <TrendingDown size={13} color="#EF4444" strokeWidth={2.5} />;
    }
    return null;
  };

  return (
    <View style={[styles.card, { backgroundColor: bgColor }]}>
      {/* Icon container */}
      <View style={[styles.iconContainer, { 
        backgroundColor: iconColor ? `${iconColor}25` : '#EEF2FF' 
      }]}>
        {getIcon()}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { 
          color: textColor === '#111827' ? '#6B7280' : textColor 
        }]}>
          {title}
        </Text>
        <Text style={[styles.value, { color: textColor }]}>
          {value}
        </Text>
        
        {/* Change indicator */}
        <View style={styles.changeContainer}>
          {getChangeIcon()}
          <Text style={[styles.change, { 
            color: getChangeColor(),
            marginLeft: getChangeIcon() ? 4 : 0 
          }]}>
            {change}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  change: {
    fontSize: 12,
    fontWeight: '600',
  },
});