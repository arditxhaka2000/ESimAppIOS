import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Linking,
  StyleSheet,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

const SupportModal = ({ visible, onClose }) => {
  const isVisible = visible === true || visible === 'true';

  const handleEmailPress = () => {
    Linking.openURL('mailto:support@gloesim.com?subject=Support Request');
  };

  const handleWebsitePress = () => {
    Linking.openURL('https://gloesim.com/support');
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Need Help?</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={22} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.text}>
              We're here to assist you with your eSIM or account questions.
            </Text>

            <TouchableOpacity style={styles.button} onPress={handleEmailPress}>
              <Icon name="email" size={20} color="white" style={styles.icon} />
              <Text style={styles.buttonText}>Email Support</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.buttonOutline} onPress={handleWebsitePress}>
              <Icon name="language" size={20} color="#dc2626" style={styles.icon} />
              <Text style={styles.buttonOutlineText}>Visit Support Page</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 6,
  },
  content: {
    alignItems: 'center',
  },
  text: {
    fontSize: 15,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  icon: {
    marginRight: 8,
  },
  buttonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  buttonOutlineText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default SupportModal;
