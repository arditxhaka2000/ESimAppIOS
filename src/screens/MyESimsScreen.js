import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
  StatusBar,
  Share,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { SupabaseService } from '../services/SupabaseService';

const MyESimsScreen = ({ navigation }) => {
  const { isAuthenticated, loading: authLoading, userEmail } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const supabaseService = SupabaseService.getInstance();

  useEffect(() => {
    if (isAuthenticated && userEmail) {
      loadMyPurchases();
    }
  }, [isAuthenticated, userEmail]);

  const loadMyPurchases = async () => {
    if (!userEmail) return;
    
    try {
      setIsLoading(true);
      const result = await supabaseService.getUserPurchases(userEmail);
      
      if (result.success) {
        setPurchases(result.data || []);
      } else {
        console.error('Error loading purchases:', result.error);
        setPurchases([]);
      }
    } catch (error) {
      console.error('Error loading purchases:', error);
      setPurchases([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    if (!isAuthenticated) return;
    
    setRefreshing(true);
    await loadMyPurchases();
    setRefreshing(false);
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'released':
        return '#10b981';
      case 'inactive':
        return '#f59e0b';
      case 'expired':
        return '#ef4444';
      case 'completed':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getDataUsageInfo = (esimData) => {
    if (!esimData) return { used: 'N/A', remaining: 'N/A', total: 'N/A' };
    
    const initial = esimData.initial_data_quantity || 0;
    const remaining = esimData.rem_data_quantity || 0;
    const unit = esimData.rem_data_unit || esimData.initial_data_unit || 'GB';
    const used = Math.max(0, initial - remaining);
    
    return {
      used: `${used} ${unit}`,
      remaining: `${remaining} ${unit}`,
      total: `${initial} ${unit}`,
      percentage: initial > 0 ? Math.round((used / initial) * 100) : 0
    };
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const handleShareQR = async (purchase) => {
    try {
      const qrCodeText = purchase.esim_data?.sim?.qr_code_text;
      if (!qrCodeText) {
        Alert.alert('Error', 'QR code not available');
        return;
      }

      await Share.share({
        message: `eSIM QR Code: ${qrCodeText}`,
        title: 'eSIM QR Code',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share QR code');
    }
  };

  const handleViewDetails = (purchase) => {
    const esim = purchase.esim_data;
    const dataInfo = getDataUsageInfo(esim);
    
    const details = `
Package: ${purchase.package_name}
ICCID: ${esim?.sim?.iccid || 'N/A'}
Status: ${esim?.status || purchase.status}
Data Usage: ${dataInfo.used} / ${dataInfo.total}
Remaining: ${dataInfo.remaining}
Activated: ${formatDate(esim?.date_activated)}
Expires: ${formatDate(esim?.date_expiry)}
Amount Paid: $${purchase.amount_paid} ${purchase.currency?.toUpperCase()}
Purchase Date: ${formatDate(purchase.created_at)}
    `.trim();

    Alert.alert('eSIM Details', details, [
      { text: 'OK' }
    ]);
  };

  const handleTopUp = (purchase) => {
    Alert.alert(
      'Top Up eSIM',
      `Would you like to top up this eSIM with ICCID: ${purchase.esim_data?.sim?.iccid}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Top Up', onPress: () => {
          Alert.alert('Coming Soon', 'Top up functionality will be available soon!');
        }},
      ]
    );
  };

  const renderPurchaseItem = ({ item }) => {
    const esim = item.esim_data;
    const dataInfo = getDataUsageInfo(esim);
    const isExpired = esim?.date_expiry && new Date(esim.date_expiry) < new Date();
    
    return (
      <View style={styles.eSimCard}>
        {/* Header */}
        <View style={styles.eSimHeader}>
          <View style={styles.eSimInfo}>
            <Text style={styles.eSimTitle}>{item.package_name}</Text>
            <Text style={styles.eSimIccid}>ICCID: {esim?.sim?.iccid || 'N/A'}</Text>
          </View>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: isExpired ? '#ef4444' : getStatusColor(esim?.status || item.status) }
          ]}>
            <Text style={styles.statusText}>
              {isExpired ? 'EXPIRED' : (esim?.status || item.status || 'Unknown').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Data Usage Progress */}
        <View style={styles.dataUsageContainer}>
          <View style={styles.dataUsageHeader}>
            <Text style={styles.dataUsageTitle}>Data Usage</Text>
            <Text style={styles.dataUsagePercentage}>{dataInfo.percentage}%</Text>
          </View>
          
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  width: `${Math.min(dataInfo.percentage, 100)}%`,
                  backgroundColor: dataInfo.percentage > 80 ? '#ef4444' : dataInfo.percentage > 50 ? '#f59e0b' : '#10b981'
                }
              ]} 
            />
          </View>
          
          <View style={styles.dataUsageStats}>
            <Text style={styles.dataUsageStat}>Used: {dataInfo.used}</Text>
            <Text style={styles.dataUsageStat}>Remaining: {dataInfo.remaining}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.eSimDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Data:</Text>
            <Text style={styles.detailValue}>{dataInfo.total}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Activated:</Text>
            <Text style={styles.detailValue}>
              {formatDate(esim?.date_activated)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Expires:</Text>
            <Text style={[
              styles.detailValue,
              isExpired && styles.expiredText
            ]}>
              {formatDate(esim?.date_expiry)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount Paid:</Text>
            <Text style={styles.detailValue}>
              ${item.amount_paid} {item.currency?.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.detailsButton]}
            onPress={() => handleViewDetails(item)}
          >
            <Icon name="info" size={16} color="white" />
            <Text style={styles.actionButtonText}>Details</Text>
          </TouchableOpacity>
          
          {esim?.sim?.qr_code_text && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.shareButton]}
              onPress={() => handleShareQR(item)}
            >
              <Icon name="qr-code" size={16} color="white" />
              <Text style={styles.actionButtonText}>Share QR</Text>
            </TouchableOpacity>
          )}
          
          {!isExpired && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.topUpButton]}
              onPress={() => handleTopUp(item)}
            >
              <Icon name="add" size={16} color="white" />
              <Text style={styles.actionButtonText}>Top Up</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (authLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#dc2626" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My eSIMs</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#dc2626" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My eSIMs</Text>
        </View>
        <View style={styles.notAuthenticatedContainer}>
          <Icon name="sim-card" size={64} color="#d1d5db" />
          <Text style={styles.notAuthenticatedTitle}>Login Required</Text>
          <Text style={styles.notAuthenticatedText}>
            Please log in to view and manage your eSIMs
          </Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLogin}
          >
            <Icon name="login" size={20} color="white" />
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#dc2626" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My eSIMs</Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={loadMyPurchases}
          disabled={isLoading}
        >
          <Icon name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={purchases}
        renderItem={renderPurchaseItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="sim-card" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No eSIMs Found</Text>
            <Text style={styles.emptyText}>
              {isLoading 
                ? 'Loading your eSIMs...' 
                : 'You don\'t have any eSIMs yet. Purchase your first package to get started!'
              }
            </Text>
            {!isLoading && (
              <TouchableOpacity 
                style={styles.exploreButton}
                onPress={() => navigation.navigate('Packages')}
              >
                <Text style={styles.exploreButtonText}>Explore Packages</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListHeaderComponent={() => 
          purchases.length > 0 ? (
            <View style={styles.headerSection}>
              <Text style={styles.sectionTitle}>Your eSIMs ({purchases.length})</Text>
              <Text style={styles.sectionSubtitle}>
                Manage your eSIMs and monitor data usage
              </Text>
            </View>
          ) : null
        }
      />
    </View>
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
  refreshButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  headerSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  eSimCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eSimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  eSimInfo: {
    flex: 1,
  },
  eSimTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  eSimIccid: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  dataUsageContainer: {
    marginBottom: 16,
  },
  dataUsageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dataUsageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  dataUsagePercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  dataUsageStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dataUsageStat: {
    fontSize: 12,
    color: '#6b7280',
  },
  eSimDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#1a1a1a',
    flex: 1,
  },
  expiredText: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flex: 1,
    marginHorizontal: 2,
  },
  detailsButton: {
    backgroundColor: '#6b7280',
  },
  shareButton: {
    backgroundColor: '#3b82f6',
  },
  topUpButton: {
    backgroundColor: '#dc2626',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notAuthenticatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  notAuthenticatedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  notAuthenticatedText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default MyESimsScreen;