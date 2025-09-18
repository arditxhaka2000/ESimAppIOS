import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    ScrollView,
    Alert,
    StyleSheet,
    Share,
    Linking,
    Platform,
    Clipboard,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

const ESimSuccessModal = ({
    visible,
    onClose,
    esimData,
    customerData,
    packageData
}) => {
    const [isInstalling, setIsInstalling] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);

    // Debug logging
    console.log('ESimSuccessModal rendered with:', {
        visible,
        hasEsimData: !!esimData,
        hasCustomerData: !!customerData,
        esimData
    });

    // Auto-detect device compatibility
    const isIOS = Platform.OS === 'ios';
    const isAndroid = Platform.OS === 'android';

    // Check iOS version for eSIM support (iOS 12+)
    const iosVersionSupported = isIOS && parseInt(Platform.Version, 10) >= 12;

    // eSIM data from the successful purchase - handle nested structure
    const qrCodeText = esimData?.sim?.qr_code_text || esimData?.qr_code_text;
    const iccid = esimData?.sim?.iccid || esimData?.iccid;
    const smdpAddress = esimData?.sim?.smdp_address || esimData?.smdp_address;
    const matchingId = esimData?.sim?.matching_id || esimData?.matching_id;
    const expiryDate = esimData?.date_expiry;
    const dataQuantity = esimData?.initial_data_quantity || esimData?.rem_data_quantity || 1;
    const dataUnit = esimData?.initial_data_unit || esimData?.rem_data_unit || 'GB';

    // Handle automatic eSIM installation on iOS
    const handleAutomaticInstall = async () => {
        setIsInstalling(true);

        try {
            if (Platform.OS === 'ios') {
                // iOS approach (this works well)
                const canOpen = await Linking.canOpenURL('prefs:root=MOBILE_DATA_SETTINGS_ID');

                if (canOpen) {
                    Alert.alert(
                        'Install eSIM',
                        'This will open Cellular Settings where you can add your eSIM plan. Look for "Add Cellular Plan" or "Add eSIM".',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            {
                                text: 'Open Settings',
                                onPress: async () => {
                                    await Linking.openURL('prefs:root=MOBILE_DATA_SETTINGS_ID');
                                    // Copy code to clipboard
                                    if (qrCodeText) {
                                        await Clipboard.setString(qrCodeText);
                                        setTimeout(() => {
                                            Alert.alert('Code Copied', 'Activation code copied to clipboard');
                                        }, 1000);
                                    }
                                }
                            }
                        ]
                    );
                } else {
                    showManualInstructions();
                }
            } else {
                // Android approach - more limited, focus on guidance
                Alert.alert(
                    'Install eSIM',
                    'Android eSIM setup varies by manufacturer. We\'ll copy your activation code and guide you to the right settings.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Continue',
                            onPress: () => showAndroidGuidance()
                        }
                    ]
                );
            }
        } catch (error) {
            console.error('Error in automatic install:', error);
            showManualInstructions();
        } finally {
            setIsInstalling(false);
        }
    };
    const showAndroidGuidance = async () => {
        // Copy activation code first
        if (qrCodeText) {
            await Clipboard.setString(qrCodeText);
        }

        // Try to open general settings
        try {
            const canOpenSettings = await Linking.canOpenURL('android.settings.SETTINGS');
            if (canOpenSettings) {
                await Linking.openURL('android.settings.SETTINGS');
            }
        } catch (error) {
            console.log('Could not open settings automatically');
        }

        // Show detailed Android instructions
        Alert.alert(
            'eSIM Setup Guide',
            `Your activation code is copied to clipboard.\n\nCommon paths:\n• Settings > Network & Internet > SIMs\n• Settings > Connections > SIM Manager\n• Settings > Mobile Networks > Add eSIM\n\nLook for "Add eSIM", "Add mobile plan", or "+" button.`,
            [
                { text: 'Show Instructions', onPress: () => setShowInstructions(true) },
                { text: 'Got it', style: 'cancel' }
            ]
        );
    };

    const showManualInstructions = () => {
        Alert.alert(
            'Manual Setup',
            Platform.OS === 'ios'
                ? 'Go to Settings > Cellular > Add Cellular Plan and enter your activation code.'
                : 'Go to Settings > Network & Internet > Mobile Networks and look for eSIM options.',
            [
                { text: 'Copy Code', onPress: copyQRCode },
                { text: 'OK', style: 'cancel' }
            ]
        );
    };
    // Copy QR code text to clipboard
    const copyQRCode = async () => {
        if (qrCodeText) {
            await Clipboard.setString(qrCodeText);
            Alert.alert('Copied!', 'eSIM activation code copied to clipboard');
        }
    };

    // Share eSIM details
    const shareESimDetails = async () => {
        const message = `Your eSIM is ready!\n\nPackage: ${packageData?.name || 'eSIM Package'}\nData: ${dataQuantity}${dataUnit}\nExpires: ${expiryDate}\n\nActivation Code: ${qrCodeText}\n\nUse this activation code in your device settings to install the eSIM.`;

        try {
            await Share.share({
                message: message,
                title: 'Your eSIM Details',
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    // Installation instructions for different platforms
    const getInstallationInstructions = () => {
        if (isIOS) {
            return [
                'Open Settings on your iPhone',
                'Tap "Cellular" or "Mobile Data"',
                'Tap "Add Cellular Plan"',
                'Enter the activation code manually (or scan if you have a QR scanner app)',
                'Follow the prompts to complete setup'
            ];
        } else if (isAndroid) {
            return [
                'Open Settings on your Android device',
                'Go to "Network & Internet" or "Connections"',
                'Tap "Mobile Networks" or "SIM Manager"',
                'Tap "Add mobile plan" or "Add eSIM"',
                'Enter the activation code'
            ];
        } else {
            return [
                'Access your device network settings',
                'Look for eSIM or mobile plan options',
                'Enter the activation code manually',
                'Follow device-specific instructions'
            ];
        }
    };

    if (!visible) return null;

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
                    <View style={styles.successIcon}>
                        <Icon name="check-circle" size={32} color="#10b981" />
                    </View>
                    <Text style={styles.title}>eSIM Ready!</Text>
                    <Text style={styles.subtitle}>Your eSIM has been successfully activated</Text>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Package Summary */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Package Details</Text>
                        <View style={styles.summaryCard}>
                            <Text style={styles.packageName}>{packageData?.name || 'eSIM Package'}</Text>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Data:</Text>
                                <Text style={styles.detailValue}>{dataQuantity}{dataUnit}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Expires:</Text>
                                <Text style={styles.detailValue}>{expiryDate}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>ICCID:</Text>
                                <Text style={styles.detailValueMono}>{iccid}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Activation Code Display */}
                    <View style={styles.qrContainer}>
  <View style={styles.codeDisplay}>
    {qrCodeText ? (
      <QRCode
        value={qrCodeText}
        size={200}
      />
    ) : (
      <Icon name="qr-code" size={80} color="#dc2626" />
    )}
    <Text style={styles.codeNote}>
      Scan this QR code to install your eSIM, or use the activation code below.
    </Text>
  </View>
</View>


                    {/* Activation Code Details */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Manual Entry Details</Text>
                        <View style={styles.codeContainer}>
                            <View style={styles.codeRow}>
                                <Text style={styles.codeLabel}>SM-DP+ Address:</Text>
                                <Text style={styles.codeValue}>{smdpAddress}</Text>
                            </View>
                            <View style={styles.codeRow}>
                                <Text style={styles.codeLabel}>Activation Code:</Text>
                                <Text style={styles.codeValue}>{matchingId}</Text>
                            </View>
                            <View style={styles.codeRow}>
                                <Text style={styles.codeLabel}>Full Code:</Text>
                                <Text style={styles.codeValueFull}>{qrCodeText}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Installation Instructions */}
                    <View style={styles.section}>
                        <View style={styles.instructionsHeader}>
                            <Text style={styles.sectionTitle}>Installation Instructions</Text>
                            <TouchableOpacity
                                style={styles.toggleButton}
                                onPress={() => setShowInstructions(!showInstructions)}
                            >
                                <Icon
                                    name={showInstructions ? "expand-less" : "expand-more"}
                                    size={24}
                                    color="#6b7280"
                                />
                            </TouchableOpacity>
                        </View>

                        {showInstructions && (
                            <View style={styles.instructionsContainer}>
                                <Text style={styles.instructionsTitle}>
                                    For {isIOS ? 'iPhone' : isAndroid ? 'Android' : 'Your Device'}:
                                </Text>
                                {getInstallationInstructions().map((step, index) => (
                                    <View key={index} style={styles.instructionStep}>
                                        <Text style={styles.stepNumber}>{index + 1}</Text>
                                        <Text style={styles.stepText}>{step}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Important Notes */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Important Notes</Text>
                        <View style={styles.notesContainer}>
                            <View style={styles.noteItem}>
                                <Icon name="info-outline" size={20} color="#f59e0b" />
                                <Text style={styles.noteText}>
                                    Install your eSIM before traveling to ensure proper activation
                                </Text>
                            </View>
                            <View style={styles.noteItem}>
                                <Icon name="wifi" size={20} color="#f59e0b" />
                                <Text style={styles.noteText}>
                                    WiFi connection required for eSIM installation
                                </Text>
                            </View>
                            <View style={styles.noteItem}>
                                <Icon name="schedule" size={20} color="#f59e0b" />
                                <Text style={styles.noteText}>
                                    Your data package is valid until {expiryDate}
                                </Text>
                            </View>
                            <View style={styles.noteItem}>
                                <Icon name="email" size={20} color="#10b981" />
                                <Text style={styles.noteText}>
                                    eSIM details have been sent to {customerData?.email}
                                </Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>

                {/* Action Buttons */}
                <View style={styles.footer}>
                    {iosVersionSupported && (
                        <TouchableOpacity
                            style={[styles.primaryButton, isInstalling && styles.disabledButton]}
                            onPress={handleAutomaticInstall}
                            disabled={isInstalling}
                        >
                            <Icon name="settings" size={20} color="white" />
                            <Text style={styles.primaryButtonText}>
                                {isInstalling ? 'Opening Settings...' : 'Install eSIM'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.secondaryButton, iosVersionSupported && { marginTop: 12 }]}
                        onPress={onClose}
                    >
                        <Text style={styles.secondaryButtonText}>Done</Text>
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
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 32,
        paddingTop: 60,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    successIcon: {
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
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
    summaryCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    packageName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    detailValueMono: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
        fontFamily: 'monospace',
    },
    qrContainer: {
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    codeDisplay: {
        alignItems: 'center',
        padding: 20,
    },
    codeNote: {
        marginTop: 16,
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    qrActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
        gap: 24,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    actionButtonText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    codeContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 2,
    },
    codeRow: {
        marginBottom: 12,
    },
    codeLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    codeValue: {
        fontSize: 16,
        fontFamily: 'monospace',
        color: '#1f2937',
        backgroundColor: '#f3f4f6',
        padding: 8,
        borderRadius: 6,
    },
    codeValueFull: {
        fontSize: 12,
        fontFamily: 'monospace',
        color: '#1f2937',
        backgroundColor: '#f3f4f6',
        padding: 8,
        borderRadius: 6,
        lineHeight: 18,
    },
    instructionsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    toggleButton: {
        padding: 8,
    },
    instructionsContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginTop: 8,
    },
    instructionsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 16,
    },
    instructionStep: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-start',
    },
    stepNumber: {
        backgroundColor: '#dc2626',
        color: 'white',
        width: 24,
        height: 24,
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: 'bold',
        lineHeight: 24,
        marginRight: 12,
    },
    stepText: {
        flex: 1,
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 20,
    },
    notesContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
    },
    noteItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    noteText: {
        flex: 1,
        fontSize: 14,
        color: '#4b5563',
        marginLeft: 12,
        lineHeight: 20,
    },
    footer: {
        padding: 16,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    primaryButton: {
        flexDirection: 'row',
        backgroundColor: '#dc2626',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        backgroundColor: '#9ca3af',
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        marginLeft: 8,
    },
    secondaryButton: {
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4b5563',
    },
});

export default ESimSuccessModal;