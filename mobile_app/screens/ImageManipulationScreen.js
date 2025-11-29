import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    Image, 
    StyleSheet, 
    ScrollView, 
    ActivityIndicator,
    SafeAreaView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import NetInfo from '@react-native-community/netinfo';
import { useBatteryLevel } from 'expo-battery';
import { Ionicons } from '@expo/vector-icons';
import { framework } from "../framework/offloading-framework"
import { TASKS } from '../framework/constants';

// --- Custom Components ---

// Button for Picking Image
const PickImageButton = ({ onPress, disabled }) => (
    <TouchableOpacity 
        style={[styles.actionButton, styles.pickButton, disabled && styles.disabledButton]}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={disabled}
    >
        <Ionicons name="images-outline" size={24} color="#6C63FF" />
        <Text style={styles.pickButtonText}>Pick an Image</Text>
    </TouchableOpacity>
);

// Button for Processing Image
const ProcessImageButton = ({ onPress, loading, disabled }) => (
    <TouchableOpacity 
        style={[styles.actionButton, styles.processButton, (loading || disabled) && styles.disabledButton]}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={loading || disabled}
    >
        {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
        ) : (
            <>
                <Ionicons name="sync-outline" size={24} color="#FFF" />
                <Text style={styles.processButtonText}>Run Image Manipulation</Text>
            </>
        )}
    </TouchableOpacity>
);

// Battery and Network Info Display
const InfoPanel = ({ batteryLevel, networkState }) => {
    const batteryPct = Math.floor(batteryLevel * 100);
    const batteryColor = batteryPct > 50 ? '#00B894' : batteryPct > 20 ? '#FABE2C' : '#FF764D';
    const connectionType = networkState?.type === 'wifi' ? 'Wi-Fi' : networkState?.type === 'cellular' ? 'Cellular' : 'None';
    const isConnected = networkState?.isConnected;

    return (
        <View style={styles.infoPanel}>
            <View style={styles.infoItem}>
                <Ionicons 
                    name={isConnected ? "wifi-outline" : "wifi-off-outline"} 
                    size={20} 
                    color={isConnected ? '#6C63FF' : '#FF764D'} 
                />
                <Text style={styles.infoText}>{isConnected ? `${connectionType}` : 'Offline'}</Text>
            </View>
            <View style={styles.infoItem}>
                <Ionicons 
                    name={batteryPct > 20 ? "battery-half-outline" : "battery-dead-outline"} 
                    size={20} 
                    color={batteryColor} 
                />
                <Text style={[styles.infoText, { color: batteryColor }]}>{batteryPct}%</Text>
            </View>
        </View>
    );
}

// --- Main Screen Component ---

export default function ImageManipulationScreen() {
    const [originalImage, setOriginalImage] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [networkState, setNetworkState] = useState(null);
    
    // Hook: Get battery level (0 to 1)
    const batteryLevel = useBatteryLevel(); 

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setNetworkState(state);
        });
        return () => unsubscribe();
    }, []);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
        });

        if (!result.canceled) {
            setOriginalImage(result.assets[0].uri);
            setProcessedImage(null);
            setMessage('');
        }
    };

    const handleProcess = async () => {
        if (!originalImage) {
            setMessage('Please select an image first.');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            // 1. Call the framework
            const response = await framework.execute(TASKS.MANIPULATE, {
                originalImage: originalImage,
                networkState: networkState, // NetInfo state passed to framework
                batteryLevel: batteryLevel, // Battery level passed to framework
            });

            // 2. Set results from the framework's response, the framework returns URI (data)
            setProcessedImage(response.data.imageUri);
            setMessage(
                `Computed on ${response.ranOn} in ${response.timeMs} ms. Reason: ${response.reason}`
            );
        } catch (error) {
            setMessage('Error processing image: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const hasImage = originalImage !== null;

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.title}>Image Manipulation</Text>
                <Text style={styles.subtitle}>Offloading for Flipping & Rotation</Text>
                
                {/* Info Panel for Offloading Context */}
                <InfoPanel 
                    batteryLevel={batteryLevel} 
                    networkState={networkState} 
                />

                <View style={styles.imageContainer}>
                    {/* Displaying Images */}
                    {processedImage ? (
                        <View style={styles.imageWrapper}>
                            <Text style={styles.imageLabel}>Processed Image</Text>
                            <Image source={{ uri: processedImage }} style={styles.image} />
                        </View>
                    ) : originalImage ? (
                         <View style={styles.imageWrapper}>
                            <Text style={styles.imageLabel}>Original Image</Text>
                            <Image source={{ uri: originalImage }} style={styles.image} />
                        </View>
                    ) : (
                        <View style={styles.placeholder}>
                            <Ionicons name="camera-outline" size={60} color="#606060" />
                            <Text style={styles.placeholderText}>No Image Selected</Text>
                        </View>
                    )}
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonGroup}>
                    <PickImageButton onPress={pickImage} disabled={loading} />
                    <ProcessImageButton 
                        onPress={handleProcess} 
                        loading={loading} 
                        disabled={!hasImage} 
                    />
                </View>
                
                {/* Result Message */}
                {message ? (
                    <View style={styles.resultBox}>
                        <Ionicons 
                            name={message.startsWith('Error') ? "warning-outline" : "information-circle-outline"} 
                            size={20} 
                            color={message.startsWith('Error') ? "#FF764D" : "#00B894"} 
                        />
                        <Text style={[styles.message, message.startsWith('Error') ? styles.errorMessage : styles.successMessage]}>
                            {message}
                        </Text>
                    </View>
                ) : null}

            </ScrollView>
        </SafeAreaView>
    );
}

// --- Updated Styles ---

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#1C1C1E', // Dark background
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
        paddingTop: 50,
    },
    title: {
        color: '#E0E0E0',
        fontSize: 30,
        fontWeight: '900',
        textAlign: 'center',
    },
    subtitle: {
        color: '#A0A0A0',
        fontSize: 16,
        fontWeight: '300',
        textAlign: 'center',
        marginBottom: 30,
    },
    // Info Panel Styles
    infoPanel: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#2C2C2E',
        padding: 15,
        borderRadius: 12,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#404040',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoText: {
        color: '#A0A0A0',
        fontSize: 14,
        marginLeft: 8,
        fontWeight: '600',
    },
    // Image Display Styles
    imageContainer: {
        width: '100%',
        minHeight: 300,
        marginBottom: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageWrapper: {
        width: '100%',
        alignItems: 'center',
    },
    imageLabel: {
        color: '#A0A0A0',
        fontSize: 14,
        marginBottom: 10,
        fontWeight: '600',
    },
    image: {
        width: '100%',
        height: 300,
        resizeMode: 'contain',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#404040', 
        backgroundColor: '#2C2C2E',
    },
    placeholder: {
        width: '100%',
        height: 300,
        borderRadius: 12,
        backgroundColor: '#2C2C2E', 
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#404040',
    },
    placeholderText: {
        color: '#606060',
        marginTop: 10,
        fontSize: 18,
    },

    // Button Styles
    buttonGroup: {
        flexDirection: 'column',
        gap: 15,
        marginBottom: 30,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    pickButton: {
        backgroundColor: '#6C63FF20', // Subtle purple background
        borderColor: '#6C63FF',
        borderWidth: 1,
    },
    pickButtonText: {
        color: '#6C63FF',
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 10,
    },
    processButton: {
        backgroundColor: '#00B894', // Teal primary color
    },
    processButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 10,
    },
    disabledButton: {
        opacity: 0.5,
    },
    
    // Message/Result Styles
    resultBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 15,
        borderRadius: 10,
        backgroundColor: '#2C2C2E',
        borderLeftWidth: 4,
        borderLeftColor: '#404040',
    },
    message: {
        flexShrink: 1,
        fontSize: 14,
        marginLeft: 10,
        lineHeight: 20,
        fontWeight: '500',
    },
    successMessage: {
        color: '#00B894', // Teal for success
    },
    errorMessage: {
        color: '#FF764D', // Red/Orange for error
    }
});