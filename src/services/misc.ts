import { ChatbotResponse } from '@/types/api';
import { apiCore, withData } from './core';
import { normalizeFavorites, normalizeSubscriptions, field, asString } from './normalizers';

export async function getFavorites() {
  const response = await apiCore.request({ method: 'GET', url: '/Favorite', authPolicy: 'required' });
  return withData(response, normalizeFavorites(response.data));
}

export async function addFavorite(cameraId: string) {
  return apiCore.request({ method: 'POST', url: `/Favorite/${cameraId}`, authPolicy: 'required' });
}

export async function removeFavorite(cameraId: string) {
  return apiCore.request({ method: 'DELETE', url: `/Favorite/${cameraId}`, authPolicy: 'required' });
}

export async function getSubscriptions() {
  const response = await apiCore.request({ method: 'GET', url: '/subscriptions', authPolicy: 'required' });
  return withData(response, normalizeSubscriptions(response.data));
}

export async function createSubscription(data: { wardId: string; thresholdProbability?: number }) {
  return apiCore.request({ method: 'POST', url: '/subscriptions', data, authPolicy: 'required' });
}

export async function updateSubscription(id: string, data: { thresholdProbability?: number; isEnabled?: boolean }) {
  return apiCore.request({ method: 'PUT', url: `/subscriptions/${id}`, data, authPolicy: 'required' });
}

export async function deleteSubscription(id: string) {
  return apiCore.request({ method: 'DELETE', url: `/subscriptions/${id}`, authPolicy: 'required' });
}

export async function debugChatbot() {
  return apiCore.request({ method: 'GET', url: '/Chatbot/debug', authPolicy: 'public' });
}

export async function sendChatbotMessage(message: string) {
  const response = await apiCore.request({ method: 'POST', url: '/Chatbot/message', data: { message }, authPolicy: 'public' });
  const reply = asString(field(response.data, 'reply') ?? field(response.data, 'message'), 'Xin lỗi, tôi chưa có phản hồi phù hợp.');
  return withData<ChatbotResponse>(response, { reply, message: reply });
}
