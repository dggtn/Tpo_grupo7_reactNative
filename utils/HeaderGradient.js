import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';

export const HeaderGradient = () => (
  <LinearGradient
    colors={[ '#ffb5a045', '#c8e0ebff', '#76adb3ff']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={{ flex: 1 }}
  />
);