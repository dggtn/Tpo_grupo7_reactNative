import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  clearError,
  hideErrorScreen,
  selectCurrentError,
  ERROR_TYPES,
} from '../../store/slices/errorSlice';
import { logout } from '../../store/slices/authSlice';
import { showInfoToast, showSuccessToast } from '../../utils/toastUtils';

export default function ErrorScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const currentError = useSelector(selectCurrentError);
  
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');

  if (!currentError) {
    return null;
  }

  const getErrorIcon = () => {
    switch (currentError.type) {
      case ERROR_TYPES.NETWORK:
        return 'cloud-offline-outline';
      case ERROR_TYPES.AUTH:
        return 'lock-closed-outline';
      case ERROR_TYPES.FUNCTIONAL:
        return 'alert-circle-outline';
      case ERROR_TYPES.CRASH:
        return 'bug-outline';
      default:
        return 'warning-outline';
    }
  };

  const getErrorTitle = () => {
    switch (currentError.type) {
      case ERROR_TYPES.NETWORK:
        return 'Error de Conexión';
      case ERROR_TYPES.AUTH:
        return 'Error de Autenticación';
      case ERROR_TYPES.FUNCTIONAL:
        return 'Error Funcional';
      case ERROR_TYPES.CRASH:
        return 'Error Crítico';
      default:
        return 'Error de Aplicación';
    }
  };

  const getErrorSuggestions = () => {
    switch (currentError.type) {
      case ERROR_TYPES.NETWORK:
        return '• Verifica tu conexión a internet\n• Intenta nuevamente en unos momentos';
      case ERROR_TYPES.AUTH:
        return '• Tu sesión puede haber expirado\n• Necesitarás iniciar sesión nuevamente';
      case ERROR_TYPES.FUNCTIONAL:
        return '• Intenta la operación nuevamente\n• Si persiste, contacta soporte';
      case ERROR_TYPES.CRASH:
        return '• La aplicación se reiniciará\n• Tus datos están seguros';
      default:
        return '• Intenta reiniciar la aplicación\n• Contacta soporte si el problema persiste';
    }
  };

  const handleRetry = () => {
    dispatch(clearError());
    dispatch(hideErrorScreen());
    showInfoToast('Reintentando', 'Volviendo a intentar la operación');
    
    if (currentError.type === ERROR_TYPES.AUTH) {
      handleGoToLogin();
    } else {
      navigation.goBack();
    }
  };

  const handleGoHome = () => {
    dispatch(clearError());
    dispatch(hideErrorScreen());
    showSuccessToast('Navegando', 'Volviendo al inicio');
    navigation.navigate('Home');
  };

  const handleGoToLogin = async () => {
    dispatch(clearError());
    dispatch(hideErrorScreen());
    
    if (currentError.type === ERROR_TYPES.AUTH) {
      await dispatch(logout());
      showInfoToast('Sesión Cerrada', 'Por favor, inicia sesión nuevamente');
    }
    
    navigation.navigate('Login');
  };

  const handleContactSupport = () => {
    const message = `
      Error en Gym App:
      Tipo: ${currentError.type}
      Mensaje: ${currentError.message}
      Pantalla: ${currentError.source}
      Detalles: ${currentError.details || 'N/A'}
      Timestamp: ${new Date(currentError.timestamp).toLocaleString()}
          `.trim();

    setSupportMessage(message);
    setShowSupportModal(true);
  };

  const handleCopyToClipboard = () => {
    // En React Native web o con expo-clipboard
    showSuccessToast('Copiado', 'Información del error copiada');
    setShowSupportModal(false);
  };

  const shouldShowRetry = currentError.type !== ERROR_TYPES.CRASH;
  const shouldShowHome = currentError.type !== ERROR_TYPES.AUTH && currentError.type !== ERROR_TYPES.CRASH;
  const shouldShowRestart = currentError.type === ERROR_TYPES.CRASH || currentError.type === ERROR_TYPES.AUTH;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Error Icon */}
      <View style={styles.iconContainer}>
        <Ionicons name={getErrorIcon()} size={96} color="#f44336" />
      </View>

      {/* Error Title */}
      <Text style={styles.title}>{getErrorTitle()}</Text>

      {/* Error Message */}
      <Text style={styles.message}>
        {currentError.message}
        {currentError.source && currentError.source !== 'Unknown' && (
          `\n\nOcurrió en: ${currentError.source}`
        )}
      </Text>

      {/* Suggestions */}
      <Text style={styles.suggestions}>{getErrorSuggestions()}</Text>

      {/* Details (if available) */}
      {currentError.details && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Detalles:</Text>
          <Text style={styles.detailsText}>{currentError.details}</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        {shouldShowRetry && (
          <TouchableOpacity style={styles.primaryButton} onPress={handleRetry}>
            <Ionicons name="refresh-outline" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        )}

        {shouldShowHome && (
          <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
            <Ionicons name="home-outline" size={20} color="#74C1E6" />
            <Text style={styles.secondaryButtonText}>Ir al Inicio</Text>
          </TouchableOpacity>
        )}

        {shouldShowRestart && (
          <TouchableOpacity style={styles.warningButton} onPress={handleGoToLogin}>
            <Ionicons name="log-in-outline" size={20} color="#fff" />
            <Text style={styles.warningButtonText}>
              {currentError.type === ERROR_TYPES.CRASH ? 'Reiniciar App' : 'Ir al Login'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Separator */}
        <View style={styles.separator} />

        {/* Contact Support Button */}
        <TouchableOpacity style={styles.ghostButton} onPress={handleContactSupport}>
          <Ionicons name="help-circle-outline" size={20} color="#666" />
          <Text style={styles.ghostButtonText}>Contactar Soporte</Text>
        </TouchableOpacity>
      </View>

      {/* Additional Info */}
      <Text style={styles.footer}>
        Si el problema persiste, por favor contacta a nuestro equipo de soporte técnico.
      </Text>

      {/* Support Modal */}
      <Modal
        visible={showSupportModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSupportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="information-circle" size={48} color="#74C1E6" />
            <Text style={styles.modalTitle}>Información del Error</Text>
            
            <ScrollView style={styles.supportMessageContainer}>
              <Text style={styles.supportMessageText}>{supportMessage}</Text>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowSupportModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={handleCopyToClipboard}
              >
                <Ionicons name="copy-outline" size={18} color="#fff" />
                <Text style={styles.modalButtonPrimaryText}>Copiar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flexGrow: 1,
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    marginVertical: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#121212',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  suggestions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'left',
    marginBottom: 24,
    lineHeight: 22,
  },
  detailsContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    marginBottom: 32,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  buttonsContainer: {
    width: '100%',
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#74C1E6',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#74C1E6',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#74C1E6',
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningButton: {
    flexDirection: 'row',
    backgroundColor: '#FF9800',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  warningButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  ghostButton: {
    flexDirection: 'row',
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ghostButtonText: {
    color: '#666',
    fontSize: 14,
  },
  footer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 20,
    maxWidth: 400,
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
    color: '#121212',
  },
  supportMessageContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    maxHeight: 300,
    width: '100%',
    marginBottom: 20,
  },
  supportMessageText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#74C1E6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalButtonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondaryText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
});