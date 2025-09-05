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
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../context/ApiContext';

const MyESimsScreen = ({ navigation }) => {
  const { isAuthenticated } = useAuth();
  const { fetchMyESims, topUpESim, isLoading } = useApi();
  const [eSims, setESims] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadMyESims();
    }
  }, [isAuthenticated]);

  const loadMyESims = async () => {
    try {
      const data = await fetchMyESims();
      setESims(data.sort((a, b) => new Date(b.date_created) - new Date(a.date_created)));
    } catch (error) {
      console.error('Error loading eSIMs:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyESims();
    setRefreshing(false);
  };

  const handleTopUp = async (eSim) => {
    Alert.alert(
      'Top Up eSIM',
      `Would you like to top up ${eSim.iccid}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Top Up', onPress: () => performTopUp(eSim) },
      ]
    );
  };

  const performTopUp = async (eSim) => {
    try {
      // This would normally show a package selection screen
      // For now, we'll just show an alert
      Alert.alert('Top Up', 'Top up functionality - select a package to continue');
    } catch (error) {
      Alert.alert('Error', `Failed to top up eSIM: ${error.message}`);
    }
  };

  const handleViewDetails = (eSim) => {
    Alert.alert(
      'eSIM Details',
      `ICCID: ${eSim.iccid}\nStatus: ${eSim.status}\nCreated: ${new Date(eSim.date_created).toLocaleDateString()}`,
      [{ text: 'OK' }]
    );
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#10b981';
      case 'inactive':
        return '#f59e0b';
      case 'expired':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const renderESimItem = ({ item }) => (
    <View style={styles.eSimCard}>
      <View style={styles.eSimHeader}>
        <View style={styles.eSimInfo}>
          <Text style={styles.eSimTitle}>eSIM</Text>
          <Text style={styles.eSimIccid}>{item.iccid}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status || 'Unknown'}</Text>
        </View>
      </View>

      <View style={styles.eSimDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Package:</Text>
          <Text style={styles.detailValue}>{item.package_name || 'N/A'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Data:</Text>
          <Text style={styles.detailValue}>{item.data_remaining || item.data || 'N/A'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Created:</Text>
          <Text style={styles.detailValue}>
            {new Date(item.date_created).toLocaleDateString()}
          </Text>
        </View>

        {item.expiry_date && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Expires:</Text>
            <Text style={styles.detailValue}>
              {new Date(item.expiry_date).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.detailsButton]}
          onPress={() => handleViewDetails(item)}
        >
          <Icon name="info" size={16} color="white" />
          <Text style={styles.actionButtonText}>Details</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.topUpButton]}
          onPress={() => handleTopUp(item)}
        >
          <Icon name="add" size={16} color="white" />
          <Text style={styles.actionButtonText}>Top Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#dc2626" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My eSIMs</Text>
        </View>
        <View style={styles.notAuthenticatedContainer}>
          <Icon name="sim-card" size={64} color="#d1d5db" />
          <Text style={styles.notAuthenticatedTitle}>Please Log In</Text>
          <Text style={styles.notAuthenticatedText}>
            You need to log in to view your eSIMs
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#dc2626" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My eSIMs</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadMyESims}>
          <Icon name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* eSIMs List */}
      <FlatList
        data={eSims}
        renderItem={renderESimItem}
        keyExtractor={(item) => item.id?.toString() || item.iccid}
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
              {isLoading ? 'Loading your eSIMs...' : 'You don\'t have any eSIMs yet. Purchase your first package to get started!'}
            </Text>
          </View>
        )}
        ListHeaderComponent={() => 
          eSims.length > 0 ? (
            <View style={styles.headerSection}>
              <Text style={styles.sectionTitle}>Your eSIMs</Text>
              <Text style={styles.sectionSubtitle}>
                Manage your active eSIMs and top up when needed
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  eSimIccid: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    textTransform: 'uppercase',
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
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#1a1a1a',
    flex: 1,
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
    paddingHorizontal: 16,
    flex: 1,
    marginHorizontal: 4,
  },
  detailsButton: {
    backgroundColor: '#6b7280',
  },
  topUpButton: {
    backgroundColor: '#dc2626',
  },
  actionButtonText: {
    fontSize: 14,
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
  },
});

export default MyESimsScreen;