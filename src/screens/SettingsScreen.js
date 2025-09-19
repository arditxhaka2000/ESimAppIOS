import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StyleSheet,
  StatusBar,
  Linking,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Constants from 'expo-constants';

const SettingsScreen = ({ navigation }) => {
  const { 
    isAuthenticated, 
    logout, 
    user, 
    profile, 
    userDisplayName, 
    userEmail, 
    isGuest 
  } = useAuth();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    profile?.notification_preferences?.push ?? true
  );
  const [emailNotifications, setEmailNotifications] = useState(
    profile?.notification_preferences?.email ?? true
  );
  const [smsNotifications, setSmsNotifications] = useState(
    profile?.notification_preferences?.sms ?? false
  );

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            const result = await logout();
            if (result.success) {
              Alert.alert('Success', 'You have been logged out');
            }
          }
        },
      ]
    );
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleViewProfile = () => {
    navigation.navigate('Profile');
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://gloesim.com/privacy');
  };

  const handleTermsOfService = () => {
    Linking.openURL('https://gloesim.com/terms');
  };

  const handleSupport = () => {
    Linking.openURL('mailto:support@gloesim.com');
  };

  const handleAbout = async () => {
    const version = Constants.expoConfig?.version || '1.0.0';
    const buildNumber = Constants.expoConfig?.android?.versionCode || Constants.expoConfig?.ios?.buildNumber || '1';
    
    Alert.alert(
      'About Next eSIM',
      `Version: ${version} (${buildNumber})\n\nA modern eSIM management application for seamless connectivity worldwide.`,
      [{ text: 'OK' }]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showArrow = true, 
    rightComponent,
    iconBgColor = '#fee2e2'
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
          <Icon name={icon} size={24} color="#dc2626" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showArrow && <Icon name="chevron-right" size={24} color="#9ca3af" />}
      </View>
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const ProfileCard = () => {
    if (!isAuthenticated) return null;

    return (
      <TouchableOpacity style={styles.profileCard} onPress={handleViewProfile}>
        <View style={styles.profileLeft}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {userDisplayName?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userDisplayName}</Text>
            <Text style={styles.profileEmail}>{userEmail}</Text>
            {isGuest && (
              <View style={styles.guestBadge}>
                <Text style={styles.guestBadgeText}>GUEST</Text>
              </View>
            )}
          </View>
        </View>
        <Icon name="chevron-right" size={24} color="#9ca3af" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#dc2626" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Profile Card */}
        {isAuthenticated && <ProfileCard />}
        
        {/* Account Section */}
        <SectionHeader title="Account" />
        
        {isAuthenticated ? (
          <>
            <SettingItem
              icon="person"
              title="Profile & Account"
              subtitle="Manage your personal information"
              onPress={handleViewProfile}
            />
            
            <SettingItem
              icon="history"
              title="Purchase History"
              subtitle="View your eSIM purchases"
              onPress={() => navigation.navigate('MyeSims')}
            />
            
            <SettingItem
              icon="logout"
              title="Logout"
              subtitle="Sign out of your account"
              onPress={handleLogout}
              showArrow={false}
              iconBgColor="#fef2f2"
            />
          </>
        ) : (
          <SettingItem
            icon="login"
            title="Login"
            subtitle="Sign in to your account"
            onPress={handleLogin}
            iconBgColor="#dbeafe"
          />
        )}

        {/* Preferences Section */}
        <SectionHeader title="Preferences" />
        
        <SettingItem
          icon="notifications"
          title="Push Notifications"
          subtitle="Receive app notifications"
          onPress={() => {}}
          showArrow={false}
          rightComponent={
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#d1d5db', true: '#dc2626' }}
              thumbColor={notificationsEnabled ? '#ffffff' : '#f4f3f4'}
            />
          }
        />
        
        {isAuthenticated && (
          <>
            <SettingItem
              icon="email"
              title="Email Notifications"
              subtitle="Receive notifications via email"
              onPress={() => {}}
              showArrow={false}
              rightComponent={
                <Switch
                  value={emailNotifications}
                  onValueChange={setEmailNotifications}
                  trackColor={{ false: '#d1d5db', true: '#dc2626' }}
                  thumbColor={emailNotifications ? '#ffffff' : '#f4f3f4'}
                />
              }
            />
            
            <SettingItem
              icon="sms"
              title="SMS Notifications"
              subtitle="Receive notifications via SMS"
              onPress={() => {}}
              showArrow={false}
              rightComponent={
                <Switch
                  value={smsNotifications}
                  onValueChange={setSmsNotifications}
                  trackColor={{ false: '#d1d5db', true: '#dc2626' }}
                  thumbColor={smsNotifications ? '#ffffff' : '#f4f3f4'}
                />
              }
            />
          </>
        )}

        {/* Data & Storage */}
        <SectionHeader title="Data & Storage" />
        
        <SettingItem
          icon="storage"
          title="Clear Cache"
          subtitle="Clear app cache data"
          onPress={() => Alert.alert('Clear Cache', 'Cache cleared successfully')}
          iconBgColor="#f3e8ff"
        />
        
        <SettingItem
          icon="cloud-download"
          title="Data Usage"
          subtitle="View data consumption"
          onPress={() => Alert.alert('Data Usage', 'Data usage statistics coming soon')}
          iconBgColor="#ecfdf5"
        />

        {/* Support & Legal */}
        <SectionHeader title="Support & Legal" />
        
        <SettingItem
          icon="help"
          title="Help & Support"
          subtitle="Get help or contact support"
          onPress={handleSupport}
          iconBgColor="#fef3c7"
        />
        
        <SettingItem
          icon="security"
          title="Privacy Policy"
          subtitle="Read our privacy policy"
          onPress={handlePrivacyPolicy}
          iconBgColor="#dbeafe"
        />
        
        <SettingItem
          icon="description"
          title="Terms of Service"
          subtitle="Read terms and conditions"
          onPress={handleTermsOfService}
          iconBgColor="#f3e8ff"
        />

        {/* About */}
        <SectionHeader title="About" />
        
        <SettingItem
          icon="info"
          title="About Next eSIM"
          subtitle="App version and information"
          onPress={handleAbout}
          iconBgColor="#ecfdf5"
        />
        
        <SettingItem
          icon="star"
          title="Rate App"
          subtitle="Rate us on the app store"
          onPress={() => Alert.alert('Rate App', 'Thank you for considering rating our app!')}
          iconBgColor="#fef3c7"
        />

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Next eSIM v1.0.0</Text>
          <Text style={styles.footerSubtext}>
            Developed with care for seamless connectivity
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  guestBadge: {
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  guestBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 32,
    marginBottom: 16,
    marginHorizontal: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default SettingsScreen;