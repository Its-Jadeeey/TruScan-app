// TruScan/FrontEnd/Components/ScreenHeader.js
// Shared header: back arrow slot | centred title | equal empty slot.
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Chevron from './Chevron';
import { SPACING } from '../Service/theme';

export default function ScreenHeader({ title, navigation, COLORS, fontSize }) {
  const canBack = !!navigation?.canGoBack?.();
  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center',
        height: 56, paddingHorizontal: SPACING.lg,
        borderBottomWidth: 1, borderBottomColor: COLORS.border,
      }}
    >
      <View style={{ width: 40, alignItems: 'flex-start' }}>
        {canBack && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            hitSlop={10}
            accessibilityLabel="Go back"
            style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' }}
          >
            <Chevron direction="left" color={COLORS.ink} size={11} thickness={2.5} />
          </TouchableOpacity>
        )}
      </View>
      <Text
        style={{
          flex: 1, textAlign: 'center', color: COLORS.ink,
          fontWeight: '800', letterSpacing: 1, fontSize: fontSize.sm,
        }}
      >
        {title}
      </Text>
      <View style={{ width: 40 }} />
    </View>
  );
}
