import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    Text,
    TextInput,
    Button,
    ScrollView,
    StyleSheet,
    ActivityIndicator
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { framework } from '../framework/offloading-framework';
import { TASKS } from '../framework/constants';
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
        return text.trim().split('\n').map(row => row.split(',').map(Number));
    };

    const handleCompute = async () => {
        setLoading(true);
        setMessage('');
        try {
            const matrixA = parseMatrix(matrixAInput);
            const matrixB = parseMatrix(matrixBInput);

            const response = await framework.execute(TASKS.MATRIX_MULTIPLY, {
                a: matrixA,
                b: matrixB,
                networkState: networkState,
            });
            setResult(response.data);
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
        <SafeAreaView style={styles.container}>
            <Text style={styles.header}>Matrix Multiplication</Text>

            <Text style={styles.label}>Matrix A (comma-separated rows):</Text>
            <TextInput
                multiline
                value={matrixAInput}
                onChangeText={setMatrixAInput}
                style={styles.input}
                placeholder="1,2\n3,4"
                placeholderTextColor="gray"
            />

            <Text style={styles.label}>Matrix B (comma-separated rows):</Text>
            <TextInput
                multiline
                value={matrixBInput}
                onChangeText={setMatrixBInput}
                style={styles.input}
                placeholder="5,6\n7,8"
                placeholderTextColor="gray"
            />

            <Button
                title={loading ? "Computing..." : "Compute Matrix Multiplication"}
                onPress={handleCompute}
                color="#1e90ff"
                disabled={loading}
            />
            {loading && <ActivityIndicator size="large" color="#ffffff" style={{ margin: 10 }} />}

            {message ? <Text style={styles.message}>{message}</Text> : null}

            <ScrollView style={styles.resultContainer}>
                {result ? (
                    typeof result === 'string' ? (
                        <Text style={styles.resultText}>{result}</Text>
                    ) : (
                        result.map((row, i) => (
                            <Text key={i} style={styles.resultText}>
                                {row.join(', ')}
                            </Text>
                        ))
                    )
                ) : (
                    <Text style={styles.resultText}>Results will appear here</Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        padding: 20,
    },
    header: {
        color: 'white',
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    label: {
        color: 'white',
        marginBottom: 5,
    },
    input: {
        height: 100,
        borderColor: 'gray',
        borderWidth: 1,
        color: 'white',
        marginBottom: 15,
        padding: 10,
        textAlignVertical: 'top',
        borderRadius: 8,
    },
    message: {
        color: 'lightgreen',
        marginTop: 15,
        fontSize: 16,
        textAlign: 'center',
    },
    resultContainer: {
        marginTop: 20,
    },
    resultText: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
        marginVertical: 2,
    },
});
