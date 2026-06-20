import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Icon } from '@/components/icons';
import { useTheme, ThemeType } from '@/hooks/useTheme';

export default function ThemeSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme, setTheme, colors } = useTheme();

  const handleThemeChange = (newTheme: ThemeType) => {
    setTheme(newTheme);
  };

  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    headerTitle: { color: colors.text },
    card: { backgroundColor: colors.surface, borderColor: colors.border },
    text: { color: colors.text },
    textMuted: { color: colors.textMuted },
  };

  return (
    <View style={[styles.container, dynamicStyles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow_back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Giao diện</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, dynamicStyles.card]}>
          <ThemeOption
            title="Sáng"
            description="Giao diện nền sáng truyền thống"
            icon="light_mode"
            isSelected={theme === 'light'}
            onSelect={() => handleThemeChange('light')}
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <ThemeOption
            title="Tối"
            description="Giao diện nền tối giúp dịu mắt"
            icon="dark_mode"
            isSelected={theme === 'dark'}
            onSelect={() => handleThemeChange('dark')}
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <ThemeOption
            title="Tự động"
            description="Tự động theo cài đặt hệ thống"
            icon="settings_brightness"
            isSelected={theme === 'system'}
            onSelect={() => handleThemeChange('system')}
            colors={colors}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function ThemeOption({ title, description, icon, isSelected, onSelect, colors }: any) {
  return (
    <Pressable style={styles.optionRow} onPress={onSelect}>
      <View style={[styles.iconContainer, { backgroundColor: colors.surfaceHighlight }]}>
        <Icon name={icon} size={24} color={colors.primary} />
      </View>
      <View style={styles.optionInfo}>
        <Text style={[styles.optionTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.optionDesc, { color: colors.textMuted }]}>{description}</Text>
      </View>
      <View style={styles.radioContainer}>
        {isSelected ? (
          <Icon name="radio_button_checked" size={24} color={colors.primary} />
        ) : (
          <Icon name="radio_button_unchecked" size={24} color={colors.textMuted} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: 20,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    marginLeft: 60,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 13,
  },
  radioContainer: {
    marginLeft: 16,
  }
});
