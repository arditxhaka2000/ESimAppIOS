import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Dimensions,
  StyleSheet,
  StatusBar,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../context/ApiContext';
import CountriesModal from '../components/CountriesModal';
import PaymentModal from '../components/PaymentModal';
import ESimSuccessModal from '../screens/ESimSuccessModal';
import LoadingScreen from '../screens/LoadingScreen';

const { width: screenWidth } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { 
    isAuthenticated, 
    userDisplayName, 
    userEmail,
    profile,
    loading: authLoading,
  } = useAuth();
  
  const {
    fetchGlobalPackages,
    fetchCountries,
    fetchContinents,
    checkDeviceCompatibility,
    isLoading,
    error,
  } = useApi();

  const [searchText, setSearchText] = useState('');
  const [selectedTab, setSelectedTab] = useState('PAKO');
  const [specialPackages, setSpecialPackages] = useState([]);
  const [countries, setCountries] = useState([]);
  const [continents, setContinents] = useState([]);
  const [deviceCompatibility, setDeviceCompatibility] = useState('Checking device...');
  const [refreshing, setRefreshing] = useState(false);
  const [apiDataLoading, setApiDataLoading] = useState(true);
  const [dataLoadAttempted, setDataLoadAttempted] = useState(false);
  
  const [coverageModalVisible, setCoverageModalVisible] = useState(false);
  const [selectedPackageCountries, setSelectedPackageCountries] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPackageForPurchase, setSelectedPackageForPurchase] = useState(null);
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [esimData, setESimData] = useState(null);
  const [customerData, setCustomerData] = useState(null);

  const promoBanners = [
    {
      title: 'Your friend gets €3.',
      subtitle: 'You get €3.',
      image: require('../assets/banner_first.png'),
    },
    {
      title: 'Special Offer!',
      subtitle: 'Save 50%',
      image: require('../assets/banner_second.png'),
    },
  ];

  useEffect(() => {
    if (!dataLoadAttempted) {
      loadInitialData();
    }
  }, [dataLoadAttempted]);

  useEffect(() => {
    if (isAuthenticated) {
      checkDeviceCompatibilityStatus();
    }
  }, [isAuthenticated]);

  const loadInitialData = async () => {
    try {
      setApiDataLoading(true);
      setDataLoadAttempted(true);
      console.log('Starting API data loading...');
      
      const startTime = Date.now();
      
      const [packagesData, countriesData, continentsData] = await Promise.all([
        fetchGlobalPackages(),
        fetchCountries(),
        fetchContinents(),
      ]);

      console.log('API data received:', {
        packages: packagesData.length,
        countries: countriesData.length,
        continents: continentsData.length
      });

      setSpecialPackages(packagesData.slice(0, 6));
      setCountries(countriesData.sort((a, b) => a.name.localeCompare(b.name)));
      setContinents(continentsData);
      
      // Ensure minimum loading time for better UX
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1500 - elapsedTime);
      
      setTimeout(() => {
        setApiDataLoading(false);
        console.log('API loading completed');
      }, remainingTime);
      
    } catch (error) {
      console.error('Error loading API data:', error);
      
      // Still hide loading after error
      setTimeout(() => {
        setApiDataLoading(false);
        Alert.alert('Error', 'Failed to load data. Please try again.');
      }, 1500);
    }
  };

  const checkDeviceCompatibilityStatus = async () => {
    try {
      setDeviceCompatibility('Checking device compatibility...');
      
      const imei = await getDeviceIMEI();
      
      if (imei) {
        const response = await checkDeviceCompatibility(imei);
        if (response) {
          setDeviceCompatibility(
            response.status && response.esim_compatible
              ? '✅ Your device supports eSIM'
              : '❌ Your device doesn\'t support eSIM'
          );
        } else {
          setDeviceCompatibility('Unable to check compatibility');
        }
      } else {
        setDeviceCompatibility('Unable to get device information');
      }
    } catch (error) {
      setDeviceCompatibility('Error checking compatibility');
      console.error('Error checking compatibility:', error);
    }
  };

  const getDeviceIMEI = async () => {
    try {
      return '356303489131464';
    } catch (error) {
      console.error('Error getting IMEI:', error);
      return null;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setDataLoadAttempted(false); // Reset to trigger reload
    await loadInitialData();
    setRefreshing(false);
  };

  const handleTabPress = (tab) => {
    setSelectedTab(tab);
  };

  const handleSearch = () => {
    if (searchText.trim()) {
      Alert.alert('Search', `Searching for: ${searchText}`);
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleProfile = () => {
    if (isAuthenticated) {
      navigation.navigate('Profile');
    } else {
      navigation.navigate('Login');
    }
  };

  const handlePackagePurchase = (packageItem) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'You need to log in to purchase packages.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }
    
    setSelectedPackageForPurchase(packageItem);
    setPaymentModalVisible(true);
  };

  const handlePurchaseSuccess = (esimResult, custData) => {
    console.log('Purchase success in HomeScreen:', { esimResult, custData });
    
    setPaymentModalVisible(false);
    setESimData(esimResult);
    setCustomerData(custData);
    
    setTimeout(() => {
      setShowSuccessModal(true);
    }, 300);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setESimData(null);
    setCustomerData(null);
  };

  const handleCountrySelect = (country) => {
    navigation.navigate('CountryPackages', { country });
  };

  const handleContinentSelect = (continent) => {
    Alert.alert('Continent', `Selected: ${continent.name}`);
  };

  const handleViewCoverage = (packageItem) => {
    if (packageItem.countries) {
      setSelectedPackageCountries(packageItem.countries);
      setCoverageModalVisible(true);
    } else {
      Alert.alert('Coverage', 'Coverage information not available');
    }
  };

  const renderPackageCard = (packageItem) => (
    <View key={packageItem.id} style={styles.packageCard}>
      <View style={styles.packageHeader}>
        <Text style={styles.packageHeaderText}>Data</Text>
        <Text style={styles.packageHeaderText}>Validity</Text>
        <Text style={styles.packageHeaderText}>Connectivity</Text>
      </View>

      <View style={styles.packageValues}>
        <Text style={styles.packageValue}>
          {packageItem.data_quantity === -1 ? 'Unlimited' : `${packageItem.data_quantity}${packageItem.data_unit}`}
        </Text>
        <Text style={styles.packageValue}>{packageItem.package_validity} {packageItem.package_validity_unit}s</Text>
        <Text style={styles.packageValue}>5G</Text>
      </View>

      <View style={styles.packageFeatures}>
        <View style={styles.featureItem}>
          <Text style={styles.featureLabel}>Tether / Hotspot</Text>
          <Text style={styles.featureValue}>Yes</Text>
        </View>
        
        <View style={styles.featureItem}>
          <Text style={styles.featureLabel}>Coverage</Text>
          <TouchableOpacity onPress={() => handleViewCoverage(packageItem)}>
            <Text style={[styles.featureValue, styles.coverageLink]}>View</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[
            styles.buyButton,
            !isAuthenticated && styles.buyButtonDisabled
          ]}
          onPress={() => handlePackagePurchase(packageItem)}
        >
          <Text style={[
            styles.buyButtonText,
            !isAuthenticated && styles.buyButtonTextDisabled
          ]}>
            {!isAuthenticated ? 'Login to Buy' : `Buy - $${packageItem.display_price || packageItem.price}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'PAKO':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.debugText}>Packages: {specialPackages.length}</Text>
            {specialPackages.map(renderPackageCard)}
          </View>
        );
      
      case 'SHTETET':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>5 Pakot më të kërkuara</Text>
            <Text style={styles.debugText}>Countries: {countries.length}</Text>
            {countries.map((country) => (
              <TouchableOpacity
                key={country.id}
                style={styles.countryItem}
                onPress={() => handleCountrySelect(country)}
              >
                <Image
                  source={{ uri: country.image_url }}
                  style={styles.countryFlag}
                />
                <Text style={styles.countryName}>{country.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      
      case 'RAJONET':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Rajonet</Text>
            <Text style={styles.debugText}>Continents: {continents.length}</Text>
            {continents.map((continent) => (
              <TouchableOpacity
                key={continent.id}
                style={styles.countryItem}
                onPress={() => handleContinentSelect(continent)}
              >
                <Text style={styles.countryName}>{continent.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      
      default:
        return null;
    }
  };

  // Show loading screen while API data is being fetched
  if (apiDataLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#dc2626" />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoNext}>Next</Text>
            <Text style={styles.logoESim}>eSim</Text>
          </View>
          
          <TouchableOpacity style={styles.profileButton} onPress={handleProfile}>
            <Text style={styles.profileIcon}>👤</Text>
            <Text style={styles.profileText}>
              {isAuthenticated ? userDisplayName : 'Kyçu'}
            </Text>
          </TouchableOpacity>
        </View>

        {!isAuthenticated && (
          <View style={styles.loginPrompt}>
            <Text style={styles.loginPromptText}>
              View packages and coverage. Login to purchase eSIMs.
            </Text>
            <TouchableOpacity 
              style={styles.loginPromptButton} 
              onPress={handleLogin}
            >
              <Text style={styles.loginPromptButtonText}>Login</Text>
            </TouchableOpacity>
          </View>
        )}

        {isAuthenticated && (
          <View style={styles.userInfoBar}>
            <Text style={styles.welcomeText}>Welcome back, {userDisplayName}!</Text>
            <Text style={styles.deviceCompatibility}>{deviceCompatibility}</Text>
          </View>
        )}

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Kërko..."
              placeholderTextColor="#9ca3af"
              value={searchText}
              onChangeText={setSearchText}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchIcon}>🔍</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.carouselContainer}
        >
          {promoBanners.map((item, index) => (
            <View key={index} style={[styles.promoBanner, { width: screenWidth - 40 }]}>
              <View style={styles.promoOverlay}>
                <Text style={styles.promoTitle}>{item.title}</Text>
                <View style={styles.promoSubtitleContainer}>
                  <Text style={styles.promoSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.tabContainer}>
          <View style={styles.tabRow}>
            {['PAKO', 'SHTETET', 'RAJONET'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabButton,
                  selectedTab === tab && styles.activeTabButton,
                ]}
                onPress={() => handleTabPress(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedTab === tab && styles.activeTabText,
                  ]}
                >
                  {tab === 'PAKO' ? 'PAKO SPECIALE' : tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {renderTabContent()}
      </ScrollView>

      <CountriesModal
        visible={coverageModalVisible}
        countries={selectedPackageCountries}
        onClose={() => setCoverageModalVisible(false)}
      />
      
      {isAuthenticated && (
        <PaymentModal
          visible={paymentModalVisible}
          package={selectedPackageForPurchase}
          onClose={() => setPaymentModalVisible(false)}
          onPurchaseSuccess={handlePurchaseSuccess}
        />
      )}

      {isAuthenticated && (
        <ESimSuccessModal
          visible={showSuccessModal}
          onClose={handleSuccessModalClose}
          esimData={esimData}
          customerData={customerData}
          packageData={selectedPackageForPurchase}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'white',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  logoNext: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  logoESim: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
    marginBottom: 6,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dc2626',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  profileIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  profileText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#dc2626',
    maxWidth: 100,
  },
  loginPrompt: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loginPromptText: {
    fontSize: 14,
    color: '#dc2626',
    flex: 1,
    marginRight: 12,
  },
  loginPromptButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  loginPromptButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userInfoBar: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 4,
  },
  deviceCompatibility: {
    fontSize: 12,
    color: '#6b7280',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  searchButton: {
    backgroundColor: '#dc2626',
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    fontSize: 16,
    color: 'white',
  },
  carouselContainer: {
    paddingBottom: 20,
  },
  promoBanner: {
    height: 120,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    marginHorizontal: 5,
    overflow: 'hidden',
  },
  promoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
    justifyContent: 'space-between',
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  promoSubtitleContainer: {
    backgroundColor: '#dc2626',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  promoSubtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  tabContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tabButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#dc2626',
  },
  tabText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#6b7280',
    textAlign: 'center',
  },
  activeTabText: {
    color: 'white',
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  debugText: {
    fontSize: 12,
    color: 'red',
    marginBottom: 8,
  },
  packageCard: {
    backgroundColor: '#dc2626',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  packageHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  packageValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  packageValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  packageFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  featureItem: {
    flex: 1,
  },
  featureLabel: {
    fontSize: 12,
    color: 'white',
    opacity: 0.9,
    marginBottom: 4,
  },
  featureValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  coverageLink: {
    textDecorationLine: 'underline',
  },
  buyButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginLeft: 8,
  },
  buyButtonDisabled: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  buyButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#dc2626',
    textAlign: 'center',
  },
  buyButtonTextDisabled: {
    color: '#6b7280',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    padding: 16,
    marginBottom: 2,
  },
  countryName: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  countryFlag: {
    width: 32,
    height: 24,
    marginRight: 12,
    borderRadius: 2,
  },
});

export default HomeScreen;