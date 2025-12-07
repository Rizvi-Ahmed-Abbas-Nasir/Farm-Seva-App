import React, { useState, useRef } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Animated,
  Easing,
  Image,
} from "react-native";
import {
  BarChart3,
  Activity,
  User,
  Bell,
  Wheat,
  Thermometer,
  CheckSquare,
  Menu,
} from "lucide-react-native";
import { useRouter } from "expo-router";


type TabRoute =
  | "/(tabs)"
  | "/(tabs)/health"
  | "/(tabs)/alerts"
  | "/(tabs)/profile"
  | "/(tabs)/feed"
  | "/(tabs)/environment"
  | "/(tabs)/tasks"
  | "/(tabs)/options";

const navigate = (router: ReturnType<typeof useRouter>, path: TabRoute) => {
  router.replace({ pathname: path } as any);
};

interface ExtraButton {
  icon: React.ComponentType<any>;
  route: TabRoute;
  label: string;
  color: string;
  gradient: string[];
}

interface CustomTabBarProps {
  state: {
    index: number;
    routes: Array<{ name: string; key: string }>;
  };
}

export default function CustomTabBar({ state }: CustomTabBarProps) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  const radius = 110;
  const animation = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Get current route name
  const currentRouteName = state.routes[state.index]?.name || 'index';

  const extraButtons: ExtraButton[] = [
    {
      icon: Activity,
      route: "/(tabs)/health",
      label: "Health",
      color: "#EF4444",
      gradient: ["#FEE2E2", "#EF4444"]
    },
    {
      icon: Wheat,
      route: "/(tabs)/feed",
      label: "Feed",
      color: "#F59E0B",
      gradient: ["#FEF3C7", "#F59E0B"]
    },
    {
      icon: Thermometer,
      route: "/(tabs)/environment",
      label: "Environment",
      color: "#3B82F6",
      gradient: ["#DBEAFE", "#3B82F6"]
    },
    {
      icon: CheckSquare,
      route: "/(tabs)/tasks",
      label: "Tasks",
      color: "#8B5CF6",
      gradient: ["#EDE9FE", "#8B5CF6"]
    },
    {
      icon: Bell,
      route: "/(tabs)/alerts",
      label: "Alerts",
      color: "#EC4899",
      gradient: ["#FCE7F3", "#EC4899"]
    },
  ];

  const toggleExpand = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);

    Animated.parallel([
      Animated.timing(rotation, {
        toValue: newExpanded ? 1 : 0,
        duration: 500,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: newExpanded ? 1 : 0,
        duration: 500,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: newExpanded ? 1.1 : 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const renderTab = (
    icon: React.ComponentType<any>,
    label: string,
    route: TabRoute,
    routeName: string
  ) => {
    const isActive = currentRouteName === routeName;
    const Icon = icon;

    return (
      <TouchableOpacity
        style={styles.tab}
        onPress={() => navigate(router, route)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.tabIconContainer,
          isActive && styles.tabIconContainerActive
        ]}>
          {isActive && (
            <View style={styles.activeIndicator} />
          )}
          <Icon
            size={26}
            color={isActive ? "#10B981" : "#6B7280"}
            strokeWidth={isActive ? 2.5 : 2}
          />
        </View>
        <Text style={[
          styles.label,
          isActive && styles.labelActive
        ]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.containerWrapper}>
      {expanded && (
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
              }),
            },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={toggleExpand}
            activeOpacity={1}
          />
        </Animated.View>
      )}

      <View style={styles.container}>
        <View style={styles.topBorder} />

        {renderTab(BarChart3, "Dashboard", "/(tabs)", "index")}
        {renderTab(Activity, "Health", "/(tabs)/health", "health")}

        <View style={styles.middleButtonWrapper}>
          {extraButtons.map((btn, i) => {
            const angleStep = 180 / (extraButtons.length - 1);
            const angle = i * angleStep;
            const x = radius * Math.cos((angle * Math.PI) / 180);
            const y = -radius * Math.sin((angle * Math.PI) / 180);

            return (
              <Animated.View
                key={btn.route}
                pointerEvents={expanded ? "auto" : "none"}
                style={[
                  styles.expandedButton,
                  {
                    transform: [
                      {
                        translateX: animation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, x],
                        }),
                      },
                      {
                        translateY: animation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, y],
                        }),
                      },
                      {
                        scale: animation.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0, 0.8, 1],
                        }),
                      },
                    ],
                    opacity: animation,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => {
                    toggleExpand();
                    navigate(router, btn.route);
                  }}
                  activeOpacity={0.8}
                  style={styles.circleButtonWrapper}
                >
                  <View style={[styles.circleButton, { backgroundColor: btn.color }]}>
                    {/* Gradient overlay */}
                    <View style={styles.circleGradientOverlay} />
                    {/* Icon backdrop */}
                    <View style={[styles.circleIconBackdrop, { backgroundColor: `${btn.color}40` }]} />
                    <btn.icon size={24} color="#fff" strokeWidth={2.5} />
                  </View>
                  <View style={styles.extraLabelContainer}>
                    <Text style={styles.extraLabel}>{btn.label}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}

          {/* Main Center Button */}
          <Animated.View
            style={[
              styles.middleButtonShadow,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.middleButton}
              onPress={toggleExpand}
              activeOpacity={0.9}
            >
              {/* Gradient background */}
              <View style={styles.middleButtonGradient} />

              {/* Rotating logo */}
              <Animated.View
                style={{
                  transform: [{ rotate: rotateInterpolate }],
                }}
              >
                <Image
                  source={require("../assets/images/logoFarm.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </Animated.View>

              {/* Pulse effect ring */}
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    opacity: animation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.6],
                    }),
                    transform: [
                      {
                        scale: animation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.4],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {renderTab(Menu, "Options", "/(tabs)/options", "options")}
        {renderTab(User, "Profile", "/(tabs)/profile", "profile")}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  containerWrapper: {
    position: 'relative',
  },
  backdrop: {
    position: 'absolute',
    top: -1000,
    left: 0,
    right: 0,
    height: 1000,
    backgroundColor: '#000',
    zIndex: 998,
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    height: 80,
    paddingBottom: 8,
    paddingTop: 12,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 12,
    elevation: 20,
    position: 'relative',
    zIndex: 999,
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: '20%',
    right: '20%',
    height: 4,
    backgroundColor: '#10B981',
    borderRadius: 2,
    opacity: 0.8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  tabIconContainer: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    position: 'relative',
  },
  tabIconContainerActive: {
    backgroundColor: '#ECFDF5',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 24,
    height: 4,
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  label: {
    fontSize: 11,
    marginTop: 4,
    color: "#6B7280",
    fontWeight: '600',
  },
  labelActive: {
    color: "#10B981",
    fontWeight: '700',
  },
  middleButtonWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  middleButtonShadow: {
    shadowColor: "#10B981",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 12,
  },
  middleButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    position: 'relative',
  },
  middleButtonGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoImage: {
    width: 52,
    height: 52,
  },
  pulseRing: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: '#10B981',
  },
  expandedButton: {
    position: "absolute",
    alignItems: "center",
    zIndex: 1000,
    elevation: 15,
  },
  circleButtonWrapper: {
    alignItems: 'center',
  },
  circleButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  circleGradientOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  circleIconBackdrop: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  extraLabelContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  extraLabel: {
    fontSize: 11,
    color: "#374151",
    fontWeight: '700',
    textAlign: "center",
  },
});