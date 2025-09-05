import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

const PaymentModal = ({ 
  visible, 
  package: selectedPackage, 
  onClose, 
  onPurchase 
}) => {
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');

  const handlePurchase = async () => {
    if (!customerEmail.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!customerName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsProcessing(true);
    
    try {
      const customerData = {
        email: customerEmail,
        name: customerName,
        phone: customerPhone,
        paymentMethod: selectedPaymentMethod,
      };

      await onPurchase(selectedPackage, customerData);
      
      // Clear form
      setCustomerEmail('');
      setCustomerName('');
      setCustomerPhone('');
      
    } catch (error) {
      Alert.alert('Error', 'Purchase failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const PaymentMethodOption = ({ method, title, icon, selected, onSelect }) => (
    <TouchableOpacity 
      style={[styles.paymentOption, selected && styles.selectedPaymentOption]}
      onPress={() => onSelect(method)}
    >
      <Icon name={icon} size={24} color={selected ? '#dc2626' : '#6b7280'} />
      <Text style={[styles.paymentText, selected && styles.selectedPaymentText]}>
        {title}
      </Text>
      {selected && <Icon name="check-circle" size={20} color="#dc2626" />}
    </TouchableOpacity>
  );

  if (!selectedPackage) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Complete Purchase</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Package Summary */}
          <View style={styles.packageSummary}>
            <Text style={styles.sectionTitle}>Package Details</Text>
            <View style={styles.summaryCard}>
              <Text style={styles.packageName}>{selectedPackage.name}</Text>
              <View style={styles.packageDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Data:</Text>
                  <Text style={styles.detailValue}>
                    {selectedPackage.data_quantity === -1 
                      ? 'Unlimited' 
                      : `${selectedPackage.data_quantity}${selectedPackage.data_unit}`
                    }
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Validity:</Text>
                  <Text style={styles.detailValue}>
                    {selectedPackage.package_validity} {selectedPackage.package_validity_unit}s
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>{selectedPackage.package_type}</Text>
                </View>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Total:</Text>
                <Text style={styles.priceValue}>${selectedPackage.price}</Text>
              </View>
            </View>
          </View>

          {/* Customer Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Information</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={customerEmail}
                onChangeText={setCustomerEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isProcessing}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={customerName}
                onChangeText={setCustomerName}
                editable={!isProcessing}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                value={customerPhone}
                onChangeText={setCustomerPhone}
                keyboardType="phone-pad"
                editable={!isProcessing}
              />
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            
            <PaymentMethodOption
              method="card"
              title="Credit/Debit Card"
              icon="credit-card"
              selected={selectedPaymentMethod === 'card'}
              onSelect={setSelectedPaymentMethod}
            />
            
            <PaymentMethodOption
              method="paypal"
              title="PayPal"
              icon="payment"
              selected={selectedPaymentMethod === 'paypal'}
              onSelect={setSelectedPaymentMethod}
            />
            
            <PaymentMethodOption
              method="apple"
              title="Apple Pay"
              icon="phone-iphone"
              selected={selectedPaymentMethod === 'apple'}
              onSelect={setSelectedPaymentMethod}
            />
          </View>

          {/* Terms */}
          <View style={styles.section}>
            <Text style={styles.termsText}>
              By completing this purchase, you agree to our Terms of Service and Privacy Policy. 
              eSIM details will be sent to your email address.
            </Text>
          </View>
        </ScrollView>

        {/* Purchase Button */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.purchaseButton, isProcessing && styles.disabledButton]}
            onPress={handlePurchase}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Icon name="shopping-cart" size={20} color="white" />
                <Text style={styles.purchaseButtonText}>
                  Purchase for ${selectedPackage.price}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  packageSummary: {
    marginTop: 16,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  packageName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  packageDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  priceLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  selectedPaymentOption: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  paymentText: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 12,
    flex: 1,
  },
  selectedPaymentText: {
    color: '#dc2626',
    fontWeight: '500',
  },
  termsText: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  purchaseButton: {
    flexDirection: 'row',
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
});

export default PaymentModal;