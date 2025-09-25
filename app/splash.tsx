import { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Image } from "react-native";
import { useRouter } from "expo-router";

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(tabs)"); 
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/farmseva-logo.png")} 
        style={styles.logo}
      />
      <Text style={styles.title}>🌱 FarmSeva</Text>
      <ActivityIndicator size="large" color="green" style={{ marginTop: 20 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "green",
    marginTop: 16,
  },
});
