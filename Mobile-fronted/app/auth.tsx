import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  Platform, KeyboardAvoidingView, ScrollView
} from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from "../app/lib/supabaseClient";


// this is my local IP address, replace it with your machine's local IP my pc
// const API_URL = "http://192.168.0.167:5000";


const API_URL = process.env.EXPO_PUBLIC_API_URL;


const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [location, setLocation] = useState('');
  const [role, setRole] = useState('Farmer');

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    setLoading(true);

    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Alert.alert("Error", error.message);
        setLoading(false);
        return;
      }

      const token = data.session.access_token;

      await AsyncStorage.setItem("userToken", token);

      router.replace("/(tabs)");
    } else {
      // SIGNUP using Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            fullName,
            phone,
            state,
            location,
            role,
          },
        },
      });

      if (error) {
        Alert.alert("Error", error.message);
        setLoading(false);
        return;
      }

      // Create profile in profiles table
      if (data.user) {
        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", data.user.id)
          .single();

        if (!existingProfile) {
          const { error: profileError } = await supabase
            .from("profiles")
            .insert({
              id: data.user.id,
              full_name: fullName,  // Use snake_case for DB
              phone,
              state,
              location,
              role,
            });

          if (profileError) {
            console.error("Error creating profile:", profileError);
            Alert.alert("Warning", "Account created but profile setup incomplete. You can update it later.");
          } else {
            console.log("✅ Profile created successfully");
          }
        } else {
          console.log("ℹ️ Profile already exists, skipping creation");
        }
      }

      Alert.alert("Success", "Account created! Please login.");
      setIsLogin(true);
    }

    setLoading(false);
  };


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>

          <Text style={styles.title}>
            {isLogin ? "Farmer Login" : "Register as Farmer"}
          </Text>

          {!isLogin && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={fullName}
                onChangeText={setFullName}
              />

              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                keyboardType="numeric"
                value={phone}
                onChangeText={setPhone}
              />

              <View style={styles.dropdown}>
                <Picker
                  selectedValue={state}
                  onValueChange={setState}
                >
                  <Picker.Item label="Select State" value="" />
                  {indianStates.map((st, index) => (
                    <Picker.Item key={index} label={st} value={st} />
                  ))}
                </Picker>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Village / District / Location"
                value={location}
                onChangeText={setLocation}
              />

              <View style={styles.dropdown}>
                <Picker selectedValue={role} onValueChange={setRole}>
                  <Picker.Item label="Farmer" value="farmer" />
                  <Picker.Item label="Admin" value="admin" />
                  <Picker.Item label="Retail" value="retail" />
                </Picker>
              </View>
            </>
          )}

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.button} onPress={handleAuth}>
            <Text style={styles.buttonText}>
              {loading ? "Processing..." : isLogin ? "Login" : "Create Account"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.switchText}>
              {isLogin ? "New Farmer? Register Here" : "Already have an account? Login"}
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 24,
    elevation: 7,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: "#2e7d32",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#81c784",
    backgroundColor: "#f1f8e9",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#81c784",
    backgroundColor: "#f1f8e9",
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#2e7d32",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 12,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
  },
  switchText: {
    textAlign: "center",
    color: "#1b5e20",
    fontWeight: "600",
    marginTop: 8,
  },
});
