// TruScan/FrontEnd/Components/Chevron.js
// Drawn chevron (no text glyph) so arrows sit perfectly centred in their boxes.
import React from 'react';
import { View } from 'react-native';

const ROT = { right: '-45deg', down: '45deg', left: '135deg', up: '-135deg' };

export default function Chevron({ color = '#888', size = 9, direction = 'right', thickness = 2 }) {
  const s = size * 0.35; // optical centring offset
  const off = {
    right: { left: -s }, left: { left: s }, down: { top: -s }, up: { top: s },
  }[direction];
  return (
    <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size, height: size,
          borderRightWidth: thickness, borderBottomWidth: thickness, borderColor: color,
          transform: [{ rotate: ROT[direction] }],
          position: 'relative', ...off,
        }}
      />
    </View>
  );
}
