import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const {
    user,
    profile,
    isAuthenticated,
    loading: authLoading,
    logout,
    refreshProfile,
    isGuest,
    userDisplayName,
    userEmail,
  } = useAuth();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
    }
  }, [isAuthenticated]);

  const handleRefreshProfile = async () => {
    setRefreshing(true);
    try {
      const result = await refreshProfile();
      if (!result.success) {
        Alert.alert('Error', 'Failed to refresh profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh profile');
    } finally {
      setRefreshing(false);
    }
  };

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
              navigation.navigate('Login');
            } else {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    // Navigate to edit profile screen (to be implemented)
    Alert.alert('Edit Profile', 'Edit profile functionality coming soon!');
  };

  const ProfileItem = ({ icon, label, value, onPress, showArrow = false }) => (
    <TouchableOpacity
      style={styles.profileItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.profileItemLeft}>
        <Icon name={icon} size={24} color="#dc2626" />
        <View style={styles.profileItemText}>
          <Text style={styles.profileItemLabel}>{label}</Text>
          {value && <Text style={styles.profileItemValue}>{value}</Text>}
        </View>
      </View>
      {showArrow && (
        <Icon name="chevron-right" size={20} color="#9ca3af" />
      )}
    </TouchableOpacity>
  );

  const StatCard = ({ icon, label, value, color = '#dc2626' }) => (
    <View style={styles.statCard}>
      <Icon name={icon} size={32} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#dc2626" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!isAuthenticated || !profile) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={64} color="#dc2626" />
        <Text style={styles.errorText}>Profile not found</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.retryButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          onPress={handleRefreshProfile}
          style={styles.refreshButton}
          disabled={refreshing}
        >
          <Icon
            name="refresh"
            size={24}
            color="#1f2937"
            style={refreshing ? styles.spinning : null}
          />
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userDisplayName?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          {isGuest && (
            <View style={styles.guestBadge}>
              <Text style={styles.guestBadgeText}>GUEST</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.displayName}>{userDisplayName}</Text>
        <Text style={styles.email}>{userEmail}</Text>
        
        {profile.referral_code && (
          <View style={styles.referralContainer}>
            <Text style={styles.referralLabel}>Your Referral Code</Text>
            <Text style={styles.referralCode}>{profile.referral_code}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditProfile}
        >
          <Icon name="edit" size={16} color="#dc2626" />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <StatCard
          icon="shopping-cart"
          label="Purchases"
          value={profile.total_purchases || 0}
        />
        <StatCard
          icon="attach-money"
          label="Total Spent"
          value={`$${profile.total_spent || '0.00'}`}
          color="#10b981"
        />
      </View>

      {/* Profile Details */}
      <View style={styles.profileDetails}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        <ProfileItem
          icon="email"
          label="Email"
          value={profile.email}
        />
        
        <ProfileItem
          icon="person"
          label="Full Name"
          value={profile.full_name || 'Not set'}
        />
        
        <ProfileItem
          icon="phone"
          label="Phone"
          value={profile.phone || 'Not set'}
        />
        
        <ProfileItem
          icon="public"
          label="Country"
          value={profile.country_code || 'Not set'}
        />
        
        <ProfileItem
          icon="language"
          label="Language"
          value={profile.preferred_language || 'English'}
        />
        
        <ProfileItem
          icon="star"
          label="Subscription"
          value={profile.subscription_status || 'Free'}
        />
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        <ProfileItem
          icon="history"
          label="Purchase History"
          onPress={() => Alert.alert('Coming Soon', 'Purchase history feature coming soon!')}
          showArrow
        />
        
        <ProfileItem
          icon="notifications"
          label="Notifications"
          onPress={() => Alert.alert('Coming Soon', 'Notification settings coming soon!')}
          showArrow
        />
        
        <ProfileItem
          icon="help"
          label="Help & Support"
          onPress={() => Alert.alert('Coming Soon', 'Help & support coming soon!')}
          showArrow
        />
        
        <ProfileItem
          icon="info"
          label="About"
          onPress={() => Alert.alert('About', 'NexteSim v1.0.0\nYour global eSIM solution')}
          showArrow
        />
      </View>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Icon name="logout" size={20} color="#dc2626" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Account Info */}
      <View style={styles.accountInfo}>
        <Text style={styles.accountInfoText}>
          Member since: {new Date(profile.created_at).toLocaleDateString()}
        </Text>
        <Text style={styles.accountInfoText}>
          Last login: {profile.last_login_at 
            ? new Date(profile.last_login_at).toLocaleDateString()
            : 'N/A'}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#dc2626',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'white',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  refreshButton: {
    padding: 8,
  },
  spinning: {
    transform: [{ rotate: '45deg' }],
  },
  profileCard: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  guestBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  guestBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  referralContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  referralLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  referralCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
    fontFamily: 'monospace',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  editButtonText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '600',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  profileDetails: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  actionsContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    padding: 20,
    paddingBottom: 8,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemText: {
    marginLeft: 16,
    flex: 1,
  },
  profileItemLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  profileItemValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  logoutContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
    marginLeft: 8,
  },
  accountInfo: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  accountInfoText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
});

export default ProfileScreen;