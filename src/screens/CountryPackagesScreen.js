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
import { useApi } from '../context/ApiContext';

const CountryPackagesScreen = ({ navigation, route }) => {
  const { country } = route.params;
  const { fetchPackagesByCountry, purchasePackage, purchaseDataOnlyPackage, isLoading } = useApi();
  const [packages, setPackages] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const data = await fetchPackagesByCountry(country.id);
      setPackages(data);
    } catch (error) {
      console.error('Error loading packages:', error);
      Alert.alert('Error', 'Failed to load packages for this country');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPackages();
    setRefreshing(false);
  };

  const handlePackagePurchase = async (packageItem) => {
    try {
      const confirmed = await new Promise((resolve) => {
        Alert.alert(
          'Confirm Purchase',
          `Purchase ${packageItem.name} for ${packageItem.display_price || packageItem.price}?`,
          [
            { text: 'Cancel', onPress: () => resolve(false) },
            { text: 'Buy Now', onPress: () => resolve(true) },
          ]
        );
      });

      if (!confirmed) return;

      let result;
      if (packageItem.package_type === 'DATA-ONLY') {
        result = await purchaseDataOnlyPackage(packageItem.id);
      } else {
        result = await purchasePackage(packageItem.id);
      }

      if (result.success) {
        Alert.alert('Success', 'Package purchased successfully!');
      } else {
        Alert.alert('Error', 'Failed to purchase package. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', `Purchase failed: ${error.message}`);
    }
  };

  const renderPackageItem = ({ item }) => (
    <View style={styles.packageCard}>
      <View style={styles.packageHeader}>
        <Text style={styles.packageName}>{item.name}</Text>
        {/* <Text style={styles.packagePrice}>${item.display_price || item.price}</Text> */}
      </View>

      <View style={styles.packageDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Data:</Text>
            <Text style={styles.detailValue}>
              {item.data_quantity === -1 ? 'Unlimited' : `${item.data_quantity}${item.data_unit}`}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Validity:</Text>
            <Text style={styles.detailValue}>{item.package_validity} {item.package_validity_unit}s</Text>
          </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Type:</Text>
          <Text style={styles.detailValue}>{item.package_type || 'Standard'}</Text>
        </View>

        {item.description && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Description:</Text>
            <Text style={styles.detailDescription}>{item.description}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity 
        style={styles.buyButton}
        onPress={() => handlePackagePurchase(item)}
      >
        <Text style={styles.buyButtonText}>
          Buy Package - ${item.display_price || item.price}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#dc2626" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{country.name}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Packages List */}
      <FlatList
        data={packages}
        renderItem={renderPackageItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {isLoading ? 'Loading packages...' : 'No packages available for this country'}
            </Text>
          </View>
        )}
        ListHeaderComponent={() => (
          <View style={styles.headerSection}>
            <Text style={styles.sectionTitle}>Available Packages</Text>
            <Text style={styles.sectionSubtitle}>
              Choose from the following eSIM packages for {country.name}
            </Text>
          </View>
        )}
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
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
  packageCard: {
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
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  packageName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  packageDetails: {
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
  detailDescription: {
    fontSize: 14,
    color: '#1a1a1a',
    flex: 1,
    lineHeight: 20,
  },
  buyButton: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default CountryPackagesScreen;