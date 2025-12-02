import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BiometricPromptModal({
  visible,
  onAccept,
  onDecline,
  onLater,
  biometricType = 'Huella Digital',
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onLater}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Ionicons name="finger-print" size={64} color="#74C1E6" />
          
          <Text style={styles.modalTitle}>
            ¿Activar Autenticación Biométrica?
          </Text>
          
          <Text style={styles.modalMessage}>
            Puedes usar {biometricType === 'PIN del Dispositivo' ? 'el PIN de tu dispositivo' : biometricType} para iniciar sesión más rápido y de forma segura.
          </Text>

          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.benefitText}>Acceso rápido</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
              <Text style={styles.benefitText}>Mayor seguridad</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="timer" size={20} color="#4CAF50" />
              <Text style={styles.benefitText}>Sin contraseñas</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onAccept}
          >
            <Ionicons name="finger-print" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Activar Ahora</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onDecline}
          >
            <Text style={styles.secondaryButtonText}>No, gracias</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.laterButton}
            onPress={onLater}
          >
            <Text style={styles.laterButtonText}>Recordármelo después</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    marginHorizontal: 20,
    maxWidth: 400,
    width: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
    color: '#121212',
  },
  modalMessage: {
    fontSize: 15,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  benefitsList: {
    width: '100%',
    marginBottom: 24,
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#444',
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#74C1E6',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '600',
  },
  laterButton: {
    paddingVertical: 8,
  },
  laterButtonText: {
    color: '#74C1E6',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});