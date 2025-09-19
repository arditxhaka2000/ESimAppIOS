import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const LoginScreen = ({ navigation, route }) => {
  const { login, register, resetPassword } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    referralCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const { email, password, confirmPassword, fullName } = formData;

    if (!email.trim()) {
      Alert.alert('Error', 'Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Password is required');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }

    if (!isLogin) {
      if (!fullName.trim()) {
        Alert.alert('Error', 'Full name is required');
        return false;
      }

      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return false;
      }
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      console.log('Attempting login...');
      const result = await login(formData.email, formData.password);

      if (result.success) {
        console.log('Login successful, navigating back...');
        
        Alert.alert('Success', 'Login successful!', [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to the previous screen or to Home
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('Main');
              }
            },
          },
        ]);
      } else {
        console.log('Login failed:', result.error);
        Alert.alert('Login Failed', result.error || 'Please check your credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await register({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone,
        referralCode: formData.referralCode,
      });

      if (result.success) {
        Alert.alert('Success', result.message || 'Registration successful! Please check your email to verify your account.', [
          {
            text: 'OK',
            onPress: () => setIsLogin(true),
          },
        ]);
      } else {
        Alert.alert('Registration Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter your email address first');
      return;
    }

    Alert.alert(
      'Reset Password',
      'Send password reset link to your email?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await resetPassword(formData.email);
              if (result.success) {
                Alert.alert('Success', result.message);
              } else {
                Alert.alert('Error', result.error);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to send reset email');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setFormData(prev => ({
      ...prev,
      password: '',
      confirmPassword: '',
      fullName: '',
      phone: '',
      referralCode: '',
    }));
  };

  const renderInput = (
    key,
    placeholder,
    icon,
    secureTextEntry = false,
    keyboardType = 'default',
    showToggle = false
  ) => (
    <View style={styles.inputContainer} key={key}>
      <View style={styles.inputWrapper}>
        <Icon name={icon} size={20} color="#6b7280" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          value={formData[key]}
          onChangeText={(value) => handleInputChange(key, value)}
          secureTextEntry={secureTextEntry && (key === 'password' ? !showPassword : !showConfirmPassword)}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
          autoCorrect={false}
          editable={!loading}
        />
        {showToggle && (
          <TouchableOpacity
            onPress={() => {
              if (key === 'password') {
                setShowPassword(!showPassword);
              } else {
                setShowConfirmPassword(!showConfirmPassword);
              }
            }}
            style={styles.passwordToggle}
          >
            <Icon
              name={
                key === 'password'
                  ? showPassword
                    ? 'visibility-off'
                    : 'visibility'
                  : showConfirmPassword
                  ? 'visibility-off'
                  : 'visibility'
              }
              size={20}
              color="#6b7280"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('Main');
              }
            }}
          >
            <Icon name="arrow-back" size={24} color="#dc2626" />
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <Text style={styles.logoNext}>Next</Text>
            <Text style={styles.logoESim}>eSim</Text>
          </View>
          <Text style={styles.headerTitle}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isLogin
              ? 'Sign in to access your eSIM packages'
              : 'Join us and stay connected worldwide'}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {renderInput('email', 'Email Address', 'email', false, 'email-address')}
          
          {!isLogin && renderInput('fullName', 'Full Name', 'person')}
          
          {renderInput('password', 'Password', 'lock', true, 'default', true)}
          
          {!isLogin && renderInput('confirmPassword', 'Confirm Password', 'lock', true, 'default', true)}
          
          {!isLogin && renderInput('phone', 'Phone Number (Optional)', 'phone', false, 'phone-pad')}
          
          {!isLogin && renderInput('referralCode', 'Referral Code (Optional)', 'card-giftcard')}

          {/* Forgot Password Link - Login only */}
          {isLogin && (
            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          {/* Main Action Button */}
          <TouchableOpacity
            style={[styles.actionButton, loading && styles.disabledButton]}
            onPress={isLogin ? handleLogin : handleRegister}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.actionButtonText}>
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </Text>
              </View>
            ) : (
              <>
                <Icon
                  name={isLogin ? 'login' : 'person-add'}
                  size={20}
                  color="white"
                />
                <Text style={styles.actionButtonText}>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Toggle Auth Mode */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
            </Text>
            <TouchableOpacity onPress={toggleAuthMode} disabled={loading}>
              <Text style={styles.toggleLink}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Additional Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Icon name="security" size={16} color="#6b7280" />
            <Text style={styles.infoText}>
              Your data is encrypted and secure
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="public" size={16} color="#6b7280" />
            <Text style={styles.infoText}>
              Global eSIM coverage available
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  logoNext: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  logoESim: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 4,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 0,
  },
  passwordToggle: {
    padding: 4,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    shadowColor: '#9ca3af',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    color: '#6b7280',
  },
  toggleLink: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 12,
    flex: 1,
  },
});

export default LoginScreen;