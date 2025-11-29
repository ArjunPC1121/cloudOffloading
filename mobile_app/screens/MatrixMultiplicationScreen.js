import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    Text,
    TextInput,
    TouchableOpacity, // Used for custom button
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    View // Added for better grouping/layout
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { framework } from '../framework/offloading-framework';
import { TASKS } from '../framework/constants';

// --- Custom Components ---

// Button for Compute Action
const ComputeButton = ({ onPress, loading, disabled }) => (
    <TouchableOpacity 
        style={[styles.actionButton, (loading || disabled) && styles.disabledButton]}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={loading || disabled}
    >
        {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
        ) : (
            <>
                <Ionicons name="calculator-outline" size={24} color="#FFF" />
                <Text style={styles.buttonText}>Compute Matrix Multiplication</Text>
            </>
        )}
    </TouchableOpacity>
);

// Component to display the computed matrix result
const MatrixResultDisplay = ({ result }) => {
    if (!result) {
        return <Text style={styles.resultPlaceholder}>Results will appear here</Text>;
    }

    // Handle case where error message might be a string
    if (typeof result === 'string') {
        return <Text style={[styles.resultText, styles.resultError]}>{result}</Text>;
    }

    // Display the matrix
    return (
        <View style={styles.matrixContainer}>
            <Text style={styles.resultLabel}>Result Matrix C (A x B):</Text>
            {result.map((row, i) => (
                <Text key={i} style={styles.resultRowText}>
                    {row.map(num => num.toFixed(2)).join(' | ')} 
                </Text>
            ))}
        </View>
    );
};

// --- Main Screen Component ---

export default function MatrixMultiplicationScreen() {
    const [matrixAInput, setMatrixAInput] = useState('1,2\n3,4');
    const [matrixBInput, setMatrixBInput] = useState('5,6\n7,8');
    const [result, setResult] = useState(null);
    const [message, setMessage] = useState('');
    const [networkState, setNetworkState] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setNetworkState(state);
        });
        return () => unsubscribe();
    }, []);

    const parseMatrix = (text) => {
        // Robust parsing: split rows by newline, split columns by comma, trim whitespace
        return text.trim().split('\n').map(row => 
            row.split(',').map(Number).filter(n => !isNaN(n)) // Filter out non-numbers
        );
    };

    const handleCompute = async () => {
        setLoading(true);
        setMessage('');
        setResult(null); // Clear previous result on new computation
        try {
            const matrixA = parseMatrix(matrixAInput);
            const matrixB = parseMatrix(matrixBInput);

            // Basic validation: Check if matrices are valid for multiplication
            if (matrixA.length === 0 || matrixB.length === 0 || matrixA[0].length !== matrixB.length) {
                throw new Error("Invalid matrices for multiplication. Columns of A must equal rows of B.");
            }

            const response = await framework.execute(TASKS.MATRIX_MULTIPLY, {
                a: matrixA,
                b: matrixB,
                networkState: networkState,
            });
            
            setResult(response.data.result);
            setMessage(
                `Computed on ${response.ranOn} in ${response.timeMs} ms. Reason: ${response.reason}`
            );
        } catch (error) {
            setMessage('Error computing matrix: ' + error.message);
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.title}>Matrix Multiplication</Text>
                <Text style={styles.subtitle}>Compute-Intensive Offloading Task</Text>

                <Text style={styles.label}>Matrix A (Rows by comma-separated values):</Text>
                <TextInput
                    multiline
                    value={matrixAInput}
                    onChangeText={setMatrixAInput}
                    style={styles.input}
                    placeholder="e.g., 1,2\n3,4"
                    placeholderTextColor="#606060"
                />

                <Text style={styles.label}>Matrix B (Rows by comma-separated values):</Text>
                <TextInput
                    multiline
                    value={matrixBInput}
                    onChangeText={setMatrixBInput}
                    style={styles.input}
                    placeholder="e.g., 5,6\n7,8"
                    placeholderTextColor="#606060"
                />

                <ComputeButton 
                    onPress={handleCompute}
                    loading={loading}
                />
                
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

                {/* Matrix Result Display */}
                <View style={styles.resultContainer}>
                    <MatrixResultDisplay result={result} />
                </View>

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
        marginBottom: 40,
    },
    label: {
        color: '#E0E0E0',
        fontSize: 16,
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        minHeight: 80,
        backgroundColor: '#2C2C2E',
        borderColor: '#404040',
        borderWidth: 1,
        color: '#E0E0E0',
        marginBottom: 20,
        padding: 15,
        textAlignVertical: 'top',
        borderRadius: 10,
        fontSize: 16,
        // Remove padding from placeholder to align with text
        paddingTop: 15,
    },
    
    // Custom Button Styles
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 12,
        backgroundColor: '#6C63FF', // Primary button color
        shadowColor: '#6C63FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 10,
    },
    disabledButton: {
        opacity: 0.5,
    },
    
    // Message/Result Box Styles
    resultBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 15,
        borderRadius: 10,
        backgroundColor: '#2C2C2E',
        borderLeftWidth: 4,
        borderLeftColor: '#404040',
        marginTop: 20,
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
    },

    // Result Display Styles
    resultContainer: {
        marginTop: 30,
        padding: 15,
        backgroundColor: '#2C2C2E',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#404040',
        minHeight: 100,
        justifyContent: 'center',
    },
    matrixContainer: {
        alignItems: 'center',
    },
    resultLabel: {
        color: '#A0A0A0',
        fontSize: 14,
        marginBottom: 10,
        fontWeight: '600',
    },
    resultRowText: {
        color: '#E0E0E0',
        fontSize: 18,
        fontFamily: 'monospace', // Use monospace for matrix text
        marginVertical: 4,
        fontWeight: '700',
    },
    resultPlaceholder: {
        color: '#606060',
        fontSize: 16,
        textAlign: 'center',
    }
});