import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { offlineService } from '@/app/lib/offlineService';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showIndicator, setShowIndicator] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    const unsubscribe = offlineService.subscribe((online) => {
      setIsOnline(online);
      if (!online) {
        setShowIndicator(true);
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }).start();
      } else {
        // Delay hiding to show "back online" message
        setTimeout(() => {
          Animated.spring(slideAnim, {
            toValue: -100,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }).start(() => {
            setShowIndicator(false);
          });
        }, 2000);
      }
    });

    return unsubscribe;
  }, []);

  if (!showIndicator && isOnline) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={isOnline ? ['#10B981', '#059669'] : ['#EF4444', '#DC2626']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Feather
          name={isOnline ? 'wifi' : 'wifi-off'}
          size={16}
          color="#FFFFFF"
        />
        <Text style={styles.text}>
          {isOnline ? 'Back online - Syncing...' : 'You are offline - Working with cached data'}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
});

