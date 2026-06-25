import { sendChatbotMessage } from '@/services/misc';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { Icon } from '@/components/icons';


interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatbotScreen() {
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'assistant',
      content:
        'Xin chào! Tôi là trợ lý HCMVision. Tôi có thể giúp bạn kiểm tra tình hình mưa, ngập, kẹt xe hoặc gợi ý cách di chuyển an toàn.',
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    return () => clearTimeout(timeout);
  }, [messages]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || loading) return;

    const userMsg: Message = {
      id: `${Date.now()}_u`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await sendChatbotMessage(content);
      const botMsg: Message = {
        id: `${Date.now()}_a`,
        role: 'assistant',
        content: response.data.reply || response.data.message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error('Chatbot request failed:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}_e`,
          role: 'assistant',
          content: 'Đã xảy ra lỗi kết nối với hệ thống AI. Vui lòng thử lại sau.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow_back" color="#d4e4fa" size={24} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Trợ lý HCMVision</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Trực tuyến</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((msg) => (
          <Animated.View
            key={msg.id}
            entering={FadeInUp.duration(300)}
            style={[
              styles.messageWrapper,
              msg.role === 'user' ? styles.messageWrapperUser : styles.messageWrapperAssistant,
            ]}
          >
            {msg.role === 'assistant' && (
              <View style={styles.avatarAssistant}>
                <Icon name="smart_toy" color="#00f2ea" size={16} />
              </View>
            )}
            <View
              style={[
                styles.messageBubble,
                msg.role === 'user' ? styles.messageBubbleUser : styles.messageBubbleAssistant,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  msg.role === 'user' ? styles.messageTextUser : styles.messageTextAssistant,
                ]}
              >
                {msg.content}
              </Text>
              <Text
                style={[
                  styles.messageTime,
                  msg.role === 'user' ? styles.messageTimeUser : styles.messageTimeAssistant,
                ]}
              >
                {formatTime(msg.timestamp)}
              </Text>
            </View>
          </Animated.View>
        ))}

        {loading && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.typingIndicator}>
            <ActivityIndicator size="small" color="#00f2ea" />
            <Text style={styles.typingText}>Trợ lý đang phản hồi...</Text>
          </Animated.View>
        )}
      </ScrollView>

      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TextInput
          style={styles.input}
          placeholder="Hỏi về thời tiết, kẹt xe..."
          placeholderTextColor="#849492"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          multiline
        />
        <Pressable
          style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || loading}
        >
          <Icon name="arrow_forward" color={!input.trim() || loading ? '#64748b' : '#00f2ea'} size={22} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#051424' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', backgroundColor: '#0b1120' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#d4e4fa', marginBottom: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  statusText: { fontSize: 11, color: '#849492' },
  scrollContent: { padding: 16, paddingBottom: 24 },
  messageWrapper: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16, maxWidth: '85%' },
  messageWrapperUser: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  messageWrapperAssistant: { alignSelf: 'flex-start', justifyContent: 'flex-start' },
  avatarAssistant: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0, 242, 234, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 8, borderWidth: 1, borderColor: 'rgba(0, 242, 234, 0.2)' },
  messageBubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18 },
  messageBubbleUser: { backgroundColor: '#00f2ea', borderBottomRightRadius: 4 },
  messageBubbleAssistant: { backgroundColor: 'rgba(25, 30, 40, 0.8)', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  messageText: { fontSize: 15, lineHeight: 22 },
  messageTextUser: { color: '#003735' },
  messageTextAssistant: { color: '#d4e4fa' },
  messageTime: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  messageTimeUser: { color: 'rgba(0, 55, 53, 0.6)' },
  messageTimeAssistant: { color: '#64748b' },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(25, 30, 40, 0.5)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, marginLeft: 36, gap: 8 },
  typingText: { fontSize: 13, color: '#849492', fontStyle: 'italic' },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', backgroundColor: '#0b1120', gap: 12 },
  input: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, minHeight: 44, maxHeight: 100, paddingHorizontal: 16, paddingVertical: 10, color: '#d4e4fa', fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0, 242, 234, 0.1)', justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { backgroundColor: 'transparent' },
});
