import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  StyleSheet,
  StatusBar,
  Image,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useApi } from '../context/ApiContext';

const CountriesScreen = ({ navigation }) => {
  const { fetchCountries, isLoading } = useApi();
  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCountries();
  }, []);

  useEffect(() => {
    filterCountries();
  }, [searchText, countries]);

  const loadCountries = async () => {
    try {
      const data = await fetchCountries();
      setCountries(data.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error loading countries:', error);
    }
  };

  const filterCountries = () => {
    if (!searchText.trim()) {
      setFilteredCountries(countries);
    } else {
      const filtered = countries.filter(country =>
        country.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredCountries(filtered);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCountries();
    setRefreshing(false);
  };

  const handleCountrySelect = (country) => {
    navigation.navigate('CountryPackages', { country });
  };

  const renderCountryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => handleCountrySelect(item)}
    >
      <View style={styles.countryContent}>
        <Image
          source={{ uri: item.image_url }}
          style={styles.countryFlag}
        />
        <Text style={styles.countryName}>{item.name}</Text>
        <Icon name="chevron-right" size={24} color="#9ca3af" />
      </View>
    </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Countries</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search countries..."
            placeholderTextColor="#9ca3af"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Icon name="close" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Countries List */}
      <FlatList
        data={filteredCountries}
        renderItem={renderCountryItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchText ? 'No countries found' : 'Loading countries...'}
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
    backgroundColor: 'white',
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  list: {
    flex: 1,
  },
  countryItem: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  countryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  countryName: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
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
  },
  countryFlag: {
    width: 32,
    height: 24,
    marginRight: 12,
    borderRadius: 2,
  },
});

export default CountriesScreen;