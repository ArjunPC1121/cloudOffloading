import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Assuming you are using Expo or have Ionicons available

// Configuration for the fancy buttons
const buttonData = [
    { title: "Matrix Multiplication", screen: 'MatrixMultiplication', icon: 'calculator-outline', color: '#6C63FF' },
    { title: "Image Flipping & Rotation", screen: 'ImageManipulation', icon: 'image-outline', color: '#00B894' },
    { title: "Grayscale Image Processing", screen: 'Grayscale', icon: 'color-filter-outline', color: '#FD79A8' },
    { title: "Profiler", screen: 'Profiler', icon: 'speedometer-outline', color: '#FABE2C' },
    { title: "Profiler (Image Manipulation)", screen: 'ProfilerImage', icon: 'bar-chart-outline', color: '#FF764D' },
];

// Custom Button Component for a sleek look
const FancyButton = ({ title, onPress, icon, color }) => (
    <TouchableOpacity 
        style={[styles.button, { backgroundColor: color + '20', borderColor: color }]} // 20 adds opacity for a subtle background
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={styles.buttonContent}>
            <Ionicons name={icon} size={24} color={color} style={styles.buttonIcon} />
            <Text style={[styles.buttonText, { color: color }]}>{title}</Text>
        </View>
    </TouchableOpacity>
);

export default function HomeScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.header}>
                    <Text style={styles.title}>Cloud Offloading</Text>
                    <Text style={styles.subtitle}>Mobile Optimization Tasks</Text>
                </View>

                {buttonData.map((item, index) => (
                    <FancyButton
                        key={index}
                        title={item.title}
                        onPress={() => navigation.navigate(item.screen)}
                        icon={item.icon}
                        color={item.color}
                    />
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#1C1C1E', // Dark background for a modern feel
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
        paddingTop: 50,
        alignItems: 'center',
    },
    header: {
        marginBottom: 50,
        width: '100%',
        alignItems: 'center',
    },
    title: {
        color: '#E0E0E0', // Light grey title
        fontSize: 32,
        fontWeight: '900', // Extra bold for impact
        marginBottom: 5,
        textAlign: 'center'
    },
    subtitle: {
        color: '#A0A0A0', // Subtler grey subtitle
        fontSize: 16,
        fontWeight: '300',
        textAlign: 'center',
    },
    // FancyButton Styles
    button: {
        width: '100%',
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderRadius: 15, // Smoother rounded corners
        marginBottom: 15,
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5, // For Android shadow
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonIcon: {
        marginRight: 15,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '700',
    },
});