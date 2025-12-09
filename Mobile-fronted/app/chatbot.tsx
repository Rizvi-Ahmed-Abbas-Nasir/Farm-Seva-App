import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { ArrowLeft, User, MessageCircle, Bot, Send, X, Camera, Image as ImageIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
// Using fetch for base64 conversion (works on all platforms)

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  imageUri?: string;
}

const SYSTEM_PROMPT = `You are an expert AI assistant specialized in pig and poultry farm management. Your expertise includes:

1. **Pig Farming Management:**
   - Breeding and reproduction
   - Nutrition and feed management
   - Housing and environment
   - Health monitoring and disease prevention
   - Biosecurity measures

2. **Poultry Farming Management:**
   - Layer and broiler management
   - Vaccination schedules
   - Feed optimization
   - Egg production optimization
   - Flock health management

3. **Risk Assessment:**
   - Farm biosecurity evaluation
   - Disease risk analysis
   - Environmental risk factors
   - Infrastructure assessment
   - Climate risk evaluation

4. **Outbreak Management:**
   - Disease identification
   - Preventive measures
   - Quarantine procedures
   - Treatment protocols
   - Reporting procedures

Always provide practical, actionable advice based on best practices in farm management. Be concise but thorough.`;

export default function ChatbotScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your Farm Seva AI assistant. I can help you with pig and poultry management, risk assessment, and outbreak information. You can also send me images of animals, diseases, or farm conditions for analysis. How can I assist you today?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
  const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // Request camera and media library permissions
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
          console.log('Camera/Media permissions not granted');
        }
      }
    })();
  }, []);

  // Convert image to base64 using fetch (works on all platforms, no deprecated APIs)
  const imageToBase64 = async (uri: string): Promise<string> => {
    try {
      // Compress and resize image for API
      const manipulatedImage = await manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );

      // Use fetch to get the image and convert to base64
      // This works on both web and native platforms
      const response = await fetch(manipulatedImage.uri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = base64String.split(',')[1] || base64String;
          resolve(base64);
        };
        reader.onerror = (error) => {
          console.error('FileReader error:', error);
          reject(new Error('Failed to convert image to base64'));
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw error;
    }
  };

  // Pick image from gallery
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('Image selected:', imageUri);
        setSelectedImage(imageUri);
      } else {
        console.log('Image picker canceled');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please check permissions.');
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('Photo taken:', imageUri);
        setSelectedImage(imageUri);
      } else {
        console.log('Camera canceled');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please check camera permissions.');
    }
  };

  // Show image picker options
  const showImagePicker = () => {
    Alert.alert(
      'Add Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const sendMessage = async () => {
    if ((!inputText.trim() && !selectedImage) || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim() || (selectedImage ? 'Please analyze this image' : ''),
      sender: 'user',
      timestamp: new Date(),
      imageUri: selectedImage || undefined,
    };

    const imageUriToSend = selectedImage;
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setSelectedImage(null);
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('userToken');
      
      // Convert image to base64 if present
      let imageBase64: string | null = null;
      if (imageUriToSend) {
        try {
          imageBase64 = await imageToBase64(imageUriToSend);
        } catch (error) {
          console.error('Error converting image:', error);
          Alert.alert('Error', 'Failed to process image. Please try again.');
          setLoading(false);
          return;
        }
      }

      // Prepare the conversation history with image support
      const userParts: any[] = [];
      if (userMessage.text) {
        userParts.push({ text: userMessage.text });
      }
      if (imageBase64) {
        userParts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64,
          },
        });
      }

      const conversationHistory = [
        {
          role: 'user',
          parts: [{ text: SYSTEM_PROMPT }]
        },
        {
          role: 'model',
          parts: [{ text: 'I understand. I\'m ready to help with pig and poultry farm management, risk assessment, and outbreak information. I can also analyze images of animals, diseases, or farm conditions.' }]
        },
        ...messages.slice(-5).map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: msg.imageUri 
            ? [{ text: msg.text || 'Please analyze this image' }, { inlineData: { mimeType: 'image/jpeg', data: '...' } }] // Placeholder for history images
            : [{ text: msg.text }]
        })),
        {
          role: 'user',
          parts: userParts,
        }
      ];

      // Try backend API first if token is available
      let backendSuccess = false;
      
      if (API_URL && token) {
        try {
          const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: userMessage.text,
              image: imageBase64,
              history: messages.slice(-5).map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
              }))
            }),
          });

          if (response.status === 401) {
            // Token expired - remove it
            console.log('Token expired, removing and using direct API');
            await AsyncStorage.removeItem('userToken');
            // Continue to direct API call below
          } else if (response.ok) {
            const data = await response.json();
            const botMessage: Message = {
              id: (Date.now() + 1).toString(),
              text: data.response || data.message || 'I apologize, but I couldn\'t process your request.',
              sender: 'bot',
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, botMessage]);
            backendSuccess = true;
          } else {
            console.log(`Backend API failed with status ${response.status}, trying direct API`);
          }
        } catch (backendError: any) {
          console.log('Backend API error:', backendError.message, '- trying direct API');
        }
      }
      
      // If backend succeeded, we're done
      if (backendSuccess) {
        setLoading(false);
        return;
      }
      
      // Use direct Gemini API if backend failed or not available
      if (GEMINI_API_KEY) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: conversationHistory,
                generationConfig: {
                  temperature: 0.7,
                  topK: 40,
                  topP: 0.95,
                  maxOutputTokens: 1024,
                },
              }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || 'API request failed');
          }

          const data = await response.json();
          
          if (data.error) {
            throw new Error(data.error.message || 'AI service error');
          }
          
          const botText = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                         'I apologize, but I couldn\'t process your request.';
          
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: botText,
            sender: 'bot',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMessage]);
          return; // Success
        } catch (apiError: any) {
          console.error('Direct API error:', apiError);
          throw apiError; // Re-throw to be caught by outer catch
        }
      }
      
      // No API available - show helpful message
      if (!GEMINI_API_KEY) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: 'I\'m here to help with pig and poultry management, risk assessment, and outbreak information. However, the AI service is not configured. Please ensure GEMINI_API_KEY is set in your environment variables.',
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again or check your connection.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      text: 'How to assess farm biosecurity risks?',
      icon: '🛡️',
    },
    {
      text: 'What are common poultry diseases?',
      icon: '🐔',
    },
    {
      text: 'How to prevent pig diseases?',
      icon: '🐷',
    },
    {
      text: 'What to do during an outbreak?',
      icon: '🚨',
    },
  ];

  const handleQuickAction = (text: string) => {
    setInputText(text);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <LinearGradient
        colors={['#10B981', '#059669']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.botIconContainer}>
            <Bot size={28} color="#10B981" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Farm Seva AI</Text>
            <Text style={styles.headerSubtitle}>Your farming assistant</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Chat Messages */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Image */}
          {messages.length === 1 && (
            <View style={styles.welcomeContainer}>
              <View style={styles.imageContainer}>
                <View style={styles.imagePlaceholder}>
                  <Bot size={64} color="#10B981" />
                </View>
              </View>
              <Text style={styles.welcomeText}>
                Ask me anything about pig and poultry farming!
              </Text>
            </View>
          )}

          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.sender === 'user' ? styles.userMessage : styles.botMessage,
              ]}
            >
              {message.sender === 'bot' && (
                <View style={styles.botAvatar}>
                  <Bot size={20} color="#10B981" />
                </View>
              )}
              <LinearGradient
                colors={
                  message.sender === 'user'
                    ? ['#10B981', '#059669']
                    : ['#F3F4F6', '#E5E7EB']
                }
                style={styles.messageBubble}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {message.imageUri && (
                  <View style={styles.messageImageContainer}>
                    <Image
                      source={{ uri: message.imageUri }}
                      style={styles.messageImage}
                      resizeMode="cover"
                      onError={(error) => {
                        console.error('Image load error:', error);
                      }}
                    />
                  </View>
                )}
                {message.text && (
                  <Text
                    style={[
                      styles.messageText,
                      message.sender === 'user' && styles.userMessageText,
                      message.imageUri && styles.messageTextWithImage,
                    ]}
                  >
                    {message.text}
                  </Text>
                )}
              </LinearGradient>
              {message.sender === 'user' && (
                <View style={styles.userAvatar}>
                  <User size={20} color="#FFFFFF" />
                </View>
              )}
            </View>
          ))}

          {loading && (
            <View style={[styles.messageContainer, styles.botMessage]}>
              <View style={styles.botAvatar}>
                <Bot size={20} color="#10B981" />
              </View>
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color="#10B981" />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Actions */}
        {messages.length === 1 && (
          <View style={styles.quickActionsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickActionsContent}
            >
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickActionButton}
                  onPress={() => handleQuickAction(action.text)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickActionIcon}>{action.icon}</Text>
                  <Text style={styles.quickActionText} numberOfLines={2}>
                    {action.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input Container */}
        <View style={styles.inputContainer}>
          {selectedImage && (
            <View style={styles.selectedImageContainer}>
              <Image 
                source={{ uri: selectedImage }} 
                style={styles.selectedImage}
                onError={(error) => {
                  console.error('Selected image load error:', error);
                  Alert.alert('Error', 'Failed to load image preview');
                }}
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setSelectedImage(null)}
              >
                <X size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            style={styles.imageButton}
            onPress={showImagePicker}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              style={styles.imageButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <ImageIcon size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Ask about pig/poultry farming, risk assessment, or outbreaks..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendButton, ((!inputText.trim() && !selectedImage) || loading) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={(!inputText.trim() && !selectedImage) || loading}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={(inputText.trim() || selectedImage) && !loading ? ['#10B981', '#059669'] : ['#D1D5DB', '#9CA3AF']}
              style={styles.sendButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Send size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  botIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 10,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  imageContainer: {
    marginBottom: 20,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#10B981',
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
    gap: 8,
  },
  userMessage: {
    justifyContent: 'flex-end',
    flexDirection: 'row',
  },
  botMessage: {
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#1F2937',
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  loadingBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  quickActionsContainer: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  quickActionsContent: {
    gap: 12,
  },
  quickActionButton: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#10B981',
    marginRight: 12,
    alignItems: 'center',
    minWidth: 140,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    alignItems: 'flex-end',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sendButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedImageContainer: {
    position: 'relative',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  imageButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  imageButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageImageContainer: {
    width: '100%',
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  messageTextWithImage: {
    marginTop: 0,
  },
});

