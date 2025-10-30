import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, StyleSheet, Platform } from 'react-native';

export const HeaderGradient = ({ withShadow = true }) => (
  <View style={styles.container}>
    <LinearGradient
    colors={[ '#ffb5a045', '#c8e0ebff', '#76adb3ff']}
     start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.gradient}
    />
    {withShadow && (
      <>
        {/* Border sutil */}
        <View style={styles.border} />
        {/* Sombra degradada */}
        <LinearGradient
          colors={[
            'rgba(0, 0, 0, 0.25)',
            'rgba(0, 0, 0, 0.15)',
            'rgba(0, 0, 0, 0.05)',
            'transparent'
          ]}
          style={styles.shadowGradient}
        />
      </>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  border: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  shadowGradient: {
    position: 'absolute',
    bottom: -8,
    left: 0,
    right: 0,
    height: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});