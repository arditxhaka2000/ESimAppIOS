import React, { useState, useRef } from 'react';
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
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { SupabaseService } from '../services/SupabaseService';

// Helper functions for card brand detection
const getCardBrandIcon = (brand) => {
  switch (brand?.toLowerCase()) {
    case 'visa':
      return 'credit-card';
    case 'mastercard':
      return 'credit-card';
    case 'amex':
    case 'american-express':
      return 'credit-card';
    case 'discover':
      return 'credit-card';
    default:
      return 'credit-card';
  }
};

const getCardBrandColor = (brand) => {
  switch (brand?.toLowerCase()) {
    case 'visa':
      return '#1a1f71';
    case 'mastercard':
      return '#eb001b';
    case 'amex':
    case 'american-express':
      return '#006fcf';
    case 'discover':
      return '#ff6000';
    default:
      return '#6b7280';
  }
};

const PaymentModal = ({
  visible,
  package: selectedPackage,
  onClose,
  onPurchaseSuccess
}) => {
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [cardComplete, setCardComplete] = useState(false);
  const [cardDetails, setCardDetails] = useState({});
  const [processingStep, setProcessingStep] = useState('');

  const stripe = useStripe();
  const supabaseService = SupabaseService.getInstance();

  const handlePurchase = async () => {
    console.log('Purchase button clicked');
    if (!validateForm()) return;
    if (!stripe) {
      Alert.alert('Error', 'Stripe is not ready. Please try again.');
      return;
    }

    setIsProcessing(true);

    try {
      const customerData = {
        email: customerEmail.trim(),
        name: customerName.trim(),
        phone: customerPhone.trim(),
      };

      // Step 1: Create payment intent via Supabase Edge Function
      setProcessingStep('Creating payment intent...');
      const paymentIntentResult = await supabaseService.createPaymentIntent(
        Math.round(parseFloat(selectedPackage.price) * 100), // Convert to cents
        'usd',
        customerData,
        selectedPackage.id, // package_id
        selectedPackage.name // package_name
      );

      if (!paymentIntentResult.success) {
        console.error('Payment intent creation failed:', paymentIntentResult.error);
        Alert.alert('Payment Error', paymentIntentResult.error || 'Failed to create payment intent');
        return;
      }

      console.log('Payment intent created successfully');

      // Step 2: Confirm payment with Stripe
      setProcessingStep('Processing payment...');
      const { error, paymentIntent } = await stripe.confirmPayment(
        paymentIntentResult.client_secret,
        {
          paymentMethodType: 'Card',
          paymentMethodData: {
            billingDetails: {
              email: customerData.email,
              name: customerData.name,
              phone: customerData.phone || undefined,
            },
          },
        }
      );

      if (error) {
        console.error('Stripe payment error:', error);
        Alert.alert('Payment Failed', error.message || 'Payment processing failed');
        return;
      }

      console.log('Payment confirmed, status:', paymentIntent.status);

      // Fix the payment status check to be case-insensitive
      if (paymentIntent.status.toLowerCase() === 'succeeded') {
        // Step 3: Purchase eSIM after successful payment
        await handleESimPurchase(customerData, paymentIntent.id);
      } else {
        Alert.alert('Payment Error', `Payment status: ${paymentIntent.status}`);
      }

    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', error.message || 'Purchase failed. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleESimPurchase = async (customerData, paymentId) => {
    try {
      // Step 3: Purchase eSIM via Supabase Edge Function
      setProcessingStep('Activating eSIM...');
      const esimResult = await supabaseService.purchaseESimPackage(
        selectedPackage.id,
        customerData,
        paymentId
      );

      if (esimResult.success) {
        setProcessingStep('Finalizing purchase...');

        const updateResult = await supabaseService.updatePurchaseWithESimData(
          paymentId,
          esimResult.data
        );

        console.log('About to call success callback with data:', esimResult.data);

        // Call the parent's success handler
        if (onPurchaseSuccess) {
          onPurchaseSuccess(esimResult.data, customerData);
        }

        // Clear form
        clearForm();
      } else {
        // Payment successful but eSIM purchase failed - initiate refund
        Alert.alert(
          'eSIM Activation Failed',
          'Your payment was successful but eSIM activation failed. We will process a refund within 24 hours. Please contact support if you need immediate assistance.',
          [{ text: 'OK', onPress: clearFormAndClose }]
        );

        // Initiate refund via Supabase
        try {
          await supabaseService.refundPayment(paymentId, 'eSIM activation failed');
        } catch (refundError) {
          console.error('Refund initiation failed:', refundError);
          // Still proceed - the refund can be processed manually
        }
      }

    } catch (error) {
      console.error('eSIM purchase error:', error);

      Alert.alert(
        'Purchase Error',
        'Payment was processed but eSIM activation failed. We will process a refund within 24 hours. Please contact support for assistance.',
        [{ text: 'OK', onPress: clearFormAndClose }]
      );

      // Initiate refund
      try {
        await supabaseService.refundPayment(paymentId, 'eSIM activation error: ' + error.message);
      } catch (refundError) {
        console.error('Refund initiation failed:', refundError);
      }
    }
  };

  const validateForm = () => {
    console.log('Validating form...');
    if (!customerEmail.trim()) {
      console.log('Email validation failed');
      Alert.alert('Error', 'Please enter your email address');
      return false;
    }

    if (!customerName.trim()) {
      console.log('Name validation failed');
      Alert.alert('Error', 'Please enter your name');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail.trim())) {
      console.log('Email format validation failed');
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (selectedPaymentMethod === 'card') {
      if (!cardComplete || !cardDetails.complete) {
        Alert.alert('Error', 'Please complete your card details');
        return false;
      }
    }

    console.log('Form validation passed');
    return true;
  };

  const clearFormAndClose = () => {
    setCustomerEmail('');
    setCustomerName('');
    setCustomerPhone('');
    setCardComplete(false);
    setCardDetails({});
    setSelectedPaymentMethod('card');
    setProcessingStep('');
    onClose();
  };

  const PaymentMethodOption = ({ method, title, icon, selected, onSelect, disabled = false }) => (
    <TouchableOpacity
      style={[
        styles.paymentOption,
        selected && styles.selectedPaymentOption,
        disabled && styles.disabledPaymentOption
      ]}
      onPress={() => !disabled && onSelect(method)}
      disabled={disabled}
    >
      <Icon name={icon} size={24} color={disabled ? '#d1d5db' : (selected ? '#dc2626' : '#6b7280')} />
      <Text style={[
        styles.paymentText,
        selected && styles.selectedPaymentText,
        disabled && styles.disabledPaymentText
      ]}>
        {title} {disabled && '(Coming Soon)'}
      </Text>
      {selected && !disabled && <Icon name="check-circle" size={20} color="#dc2626" />}
    </TouchableOpacity>
  );

  if (!selectedPackage) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={clearFormAndClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Complete Purchase</Text>
          <TouchableOpacity onPress={clearFormAndClose} style={styles.closeButton}>
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
              <View style={styles.inputWrapper}>
                <Icon name="email" size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={customerEmail}
                  onChangeText={setCustomerEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isProcessing}
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <View style={styles.inputWrapper}>
                <Icon name="person" size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  value={customerName}
                  onChangeText={setCustomerName}
                  editable={!isProcessing}
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
              <View style={styles.inputWrapper}>
                <Icon name="phone" size={20} color="#6b7280" style={styles.inputIcon} />
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

            {/* Additional payment methods can be added here */}
            <PaymentMethodOption
              method="apple_pay"
              title="Apple Pay"
              icon="smartphone"
              selected={selectedPaymentMethod === 'apple_pay'}
              onSelect={setSelectedPaymentMethod}
              disabled={true}
            />

            <PaymentMethodOption
              method="google_pay"
              title="Google Pay"
              icon="payment"
              selected={selectedPaymentMethod === 'google_pay'}
              onSelect={setSelectedPaymentMethod}
              disabled={true}
            />

            {/* Enhanced Stripe Card Field */}
            {selectedPaymentMethod === 'card' && (
              <View style={styles.cardContainer}>
                <Text style={styles.inputLabel}>Card Details *</Text>

                {/* Card Input with Custom Styling */}
                <View style={styles.cardInputWrapper}>
                  <CardField
                    postalCodeEnabled={true}
                    placeholders={{
                      number: '1234 5678 9012 3456',
                      expiry: 'MM/YY',
                      cvc: 'CVC',
                      postalCode: 'ZIP Code',
                    }}
                    cardStyle={{
                      backgroundColor: '#ffffff',
                      textColor: '#1f2937',
                      borderColor: 'transparent',
                      borderWidth: 0,
                      borderRadius: 0,
                      fontSize: 16,
                      placeholderColor: '#9ca3af',
                    }}
                    style={styles.cardField}
                    onCardChange={(details) => {
                      console.log('Card details changed:', details);
                      setCardDetails(details || {});
                      setCardComplete(details?.complete || false);
                    }}
                    disabled={isProcessing}
                  />
                </View>

                {/* Card Brand Icon and Status */}
                <View style={styles.cardStatusContainer}>
                  <View style={styles.cardBrandContainer}>
                    {cardDetails.brand && (
                      <View style={styles.cardBrandIndicator}>
                        <Icon
                          name={getCardBrandIcon(cardDetails.brand)}
                          size={24}
                          color={getCardBrandColor(cardDetails.brand)}
                        />
                        <Text style={styles.cardBrandText}>
                          {cardDetails.brand.toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>

                  {cardComplete && (
                    <View style={styles.validCardIndicator}>
                      <Icon name="check-circle" size={20} color="#10b981" />
                      <Text style={styles.validCardText}>Valid</Text>
                    </View>
                  )}
                </View>

                {/* Security Notice */}
                <View style={styles.securityNotice}>
                  <Icon name="security" size={16} color="#6b7280" />
                  <Text style={styles.securityText}>
                    Your card information is encrypted and secure
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Terms */}
          <View style={styles.section}>
            <View style={styles.termsContainer}>
              <Icon name="info-outline" size={16} color="#6b7280" />
              <Text style={styles.termsText}>
                By completing this purchase, you agree to our Terms of Service and Privacy Policy.
                eSIM details will be sent to your email address after successful activation.
              </Text>
            </View>
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
              <View style={styles.processingContainer}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.processingText}>
                  {processingStep || 'Processing...'}
                </Text>
              </View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  packageSummary: {
    marginTop: 16,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  packageName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  packageDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
  },
  priceLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  selectedPaymentOption: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  disabledPaymentOption: {
    backgroundColor: '#f9fafb',
    opacity: 0.6,
  },
  paymentText: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 12,
    flex: 1,
    fontWeight: '500',
  },
  selectedPaymentText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  disabledPaymentText: {
    color: '#9ca3af',
  },
  cardContainer: {
    marginTop: 16,
  },
  cardInputWrapper: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  cardField: {
    height: 50,
  },
  cardStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  cardBrandContainer: {
    flex: 1,
  },
  cardBrandIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardBrandText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  validCardIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  validCardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 4,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  securityText: {
    fontSize: 12,
    color: '#0369a1',
    marginLeft: 6,
    fontWeight: '500',
  },
  testCardInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  testCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 6,
  },
  testCardButton: {
    backgroundColor: '#fbbf24',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  testCardButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
    fontFamily: 'monospace',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  termsText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 5,
  },
  purchaseButton: {
    flexDirection: 'row',
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    shadowColor: '#9ca3af',
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  processingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
});

export default PaymentModal;