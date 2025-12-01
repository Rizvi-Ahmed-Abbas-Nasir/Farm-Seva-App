import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Activity, Bell, Thermometer } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function OptionsScreen() {
  const router = useRouter();

  const cards = [
    {
      title: "Smart Vet Connect",
      desc: "Instant veterinary help and AI diagnosis.",
      icon: Activity,
      route: "/smartVet",
      color: "#D1FAE5",
    },
    {
      title: "Government Schemes",
      desc: "All latest subsidies & programs.",
      icon: Bell,
      route: "/govSchemes",
      color: "#FEE2E2",
    },
    {
      title: "Outbreak Monitor",
      desc: "Track diseases & alerts near you.",
      icon: Thermometer,
      route: "/outbreak",
      color: "#DBEAFE",
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Smart Features</Text>
        <Text style={styles.subHeader}>
          Discover government schemes for farmers
        </Text>
      </View>

      <View style={styles.container2}>
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <TouchableOpacity
              key={i}
              style={[styles.card, { backgroundColor: c.color }]}
              onPress={() => router.push(c.route as any)}
              activeOpacity={0.8}
            >
              <Icon size={30} color="#111" />
              <Text style={styles.title}>{c.title}</Text>
              <Text style={styles.desc}>{c.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 20,
    backgroundColor: "#fff",
  },
  container2: {
    flex: 1,
    gap: 20,
    padding: 20,
    backgroundColor: "#fff",
  },
  card: {
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 10,
  },
  desc: {
    fontSize: 14,
    marginTop: 5,
    color: "#4B5563",
  },
  headerContainer: {
    backgroundColor: "#059669",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  subHeader: { fontSize: 15, color: "#D1FAE5", fontWeight: "500" },
});
