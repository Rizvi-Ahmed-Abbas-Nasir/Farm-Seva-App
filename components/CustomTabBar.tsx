import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, Text, Animated } from "react-native";
import {
  BarChart3,
  Activity,
  User,
  Bell,
  Wheat,
  Thermometer,
  CheckSquare,
} from "lucide-react-native";
import { useRouter } from "expo-router";

type TabRoute =
  | "/(tabs)"
  | "/(tabs)/health"
  | "/(tabs)/alerts"
  | "/(tabs)/profile"
  | "/(tabs)/feed"
  | "/(tabs)/environment"
  | "/(tabs)/tasks";

const navigate = (router: ReturnType<typeof useRouter>, path: TabRoute) => {
  router.replace({ pathname: path } as any);
};

interface ExtraButton {
  icon: React.ComponentType<any>;
  route: TabRoute;
  label: string;
}

interface CustomTabBarProps {
  state: { index: number };
}

export default function CustomTabBar({ state }: CustomTabBarProps) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  const radius = 100;

  // Buttons shown on expansion
  const extraButtons: ExtraButton[] = [
    { icon: Activity, route: "/(tabs)/health", label: "Health" },
    { icon: Wheat, route: "/(tabs)/feed", label: "Feed" },
    { icon: Thermometer, route: "/(tabs)/environment", label: "Environment" },
    { icon: CheckSquare, route: "/(tabs)/tasks", label: "Tasks" },
    { icon: Bell, route: "/(tabs)/alerts", label: "Alerts" },
  ];

  return (
    <View style={styles.container}>
      {/* Left Tabs */}
      <TouchableOpacity
        style={styles.tab}
        onPress={() => navigate(router, "/(tabs)")}
      >
        <BarChart3
          size={26}
          color={state.index === 0 ? "#10B981" : "#6B7280"}
        />
        <Text style={styles.label}>Dashboard</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tab}
        onPress={() => navigate(router, "/(tabs)/health")}
      >
        <Activity
          size={26}
          color={state.index === 1 ? "#10B981" : "#6B7280"}
        />
        <Text style={styles.label}>Health</Text>
      </TouchableOpacity>

      {/* Middle Expand Button */}
      <View style={styles.middleButtonWrapper}>
        {expanded &&
          extraButtons.map((btn, i) => {
            const angleStep = 180 / (extraButtons.length - 1); // spread in semi-circle
            const angle = i * angleStep;
            const x = radius * Math.cos((angle * Math.PI) / 180);
            const y = -radius * Math.sin((angle * Math.PI) / 180);

            return (
              <Animated.View
                key={btn.route}
                style={[
                  styles.expandedButton,
                  { transform: [{ translateX: x }, { translateY: y }] },
                ]}
              >
                <TouchableOpacity
                  onPress={() => {
                    setExpanded(false);
                    navigate(router, btn.route);
                  }}
                  style={styles.circleButton}
                >
                  <btn.icon size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.extraLabel}>{btn.label}</Text>
              </Animated.View>
            );
          })}

        <TouchableOpacity
          style={styles.middleButton}
          onPress={() => setExpanded(!expanded)}
        >
          <Wheat size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Right Tabs */}
      <TouchableOpacity
        style={styles.tab}
        onPress={() => navigate(router, "/(tabs)/tasks")}
      >
        <CheckSquare
          size={26}
          color={state.index === 2 ? "#10B981" : "#6B7280"}
        />
        <Text style={styles.label}>Tasks</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tab}
        onPress={() => navigate(router, "/(tabs)/profile")}
      >
        <User
          size={26}
          color={state.index === 3 ? "#10B981" : "#6B7280"}
        />
        <Text style={styles.label}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    height: 70,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 12,
    marginTop: 2,
    color: "#374151",
  },
  middleButtonWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  middleButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
expandedButton: {
  position: "absolute",
  alignItems: "center",
  zIndex: 1000,        
  elevation: 10,      
},
  circleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  extraLabel: {
    marginTop: 5,
    fontSize: 10,
    color: "#374151",
    textAlign: "center",
  },
});
