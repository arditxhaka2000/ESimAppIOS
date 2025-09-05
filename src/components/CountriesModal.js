import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

const CountriesModal = ({ visible, countries, onClose }) => {
  const [searchText, setSearchText] = useState('');
  
  // Convert countries object to array
  const countriesArray = countries ? Object.values(countries) : [];
  
  // Filter countries based on search
  const filteredCountries = countriesArray.filter(country =>
    country.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderCountryItem = ({ item }) => (
    <View style={styles.countryItem}>
      <Image source={{ uri: item.image_url }} style={styles.flagImage} />
      <Text style={styles.countryName}>{item.name}</Text>
    </View>
  );

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
          <Text style={styles.title}>Coverage Countries</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color="#374151" />
          </TouchableOpacity>
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
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchText ? 'No countries found' : 'No coverage information available'}
              </Text>
            </View>
          )}
          ListHeaderComponent={() => (
            <View style={styles.headerInfo}>
              <Text style={styles.countText}>
                {filteredCountries.length} countries available
              </Text>
            </View>
          )}
        />
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  headerInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  countText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  list: {
    flex: 1,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  flagImage: {
    width: 32,
    height: 24,
    marginRight: 12,
    borderRadius: 2,
  },
  countryName: {
    fontSize: 16,
    color: '#1f2937',
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
    textAlign: 'center',
  },
});

export default CountriesModal;