import React, { useState } from 'react';
import { View, Text, Button, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import * as Battery from 'expo-battery';
import { framework } from '../framework/offloading-framework';
import { TASKS } from '../framework/constants';
import { API_BASE_URL } from "../config";
import { localTaskExecutor } from '../framework/local-tasks';
import { remoteTaskExecutor } from '../framework/remote-tasks';

// --- This is the test task we will run ---
const TEST_MATRIX_SIZE = 100; // Change this to test different sizes

// Helper function to generate a test matrix
const generateMatrix = (size) => {
    return Array(size).fill(0).map(() => Array(size).fill(0).map(() => Math.random()));
};

export default function ProfilerScreen() {
    const [log, setLog] = useState('Press button to start benchmark...');
    const [loading, setLoading] = useState(false);

    // Helper function to measure latency
    const getLatency = async () => {
        const t0 = Date.now();
        try {
            await fetch(`${API_BASE_URL}/ping`);
            return Date.now() - t0;
        } catch (e) {
            return -1; // Indicate a failed ping
        }
    };

    // The main benchmark function
    const runBenchmark = async () => {
        setLoading(true);
        setLog('Starting benchmark...\n');

        try {
            // 1. --- GATHER INPUTS ---
            setLog(prev => prev + 'Gathering device context...\n');
            const network = await NetInfo.fetch();
            const battery = await Battery.getBatteryLevelAsync();
            const isCharging = (await Battery.getBatteryStateAsync()) === Battery.BatteryState.CHARGING;
            const latency = await getLatency();

            const testMatrixA = generateMatrix(TEST_MATRIX_SIZE);
            const testMatrixB = generateMatrix(TEST_MATRIX_SIZE);
            const taskParams = { a: testMatrixA, b: testMatrixB };

            const inputs = {
                task_name: TASKS.MATRIX_MULTIPLY,
                network_type: network.type,
                battery_level: battery,
                is_charging: isCharging,
                latency_ms: latency,
                matrix_size: TEST_MATRIX_SIZE,
                image_size_kb: 0,
            };
            setLog(prev => prev + `Context: ${network.type}, ${latency}ms, ${battery * 100}% bat\n`);

            // 2. --- RUN TASKS IN PARALLEL ---
            setLog(prev => prev + 'Running local and remote tasks...\n');

            // We run both tasks to get both times
            let t_local_ms = -1;
            let t_remote_ms = -1;

            // Local
            const t0 = Date.now();
            try {
                await localTaskExecutor[TASKS.MATRIX_MULTIPLY](taskParams);
                t_local_ms = Date.now() - t0;
            } catch (e) {
                setLog(prev => prev + `Local task failed: ${e.message}\n`);
            }
            setLog(prev => prev + `-> Local Time: ${t_local_ms}ms\n`);

            // Remote
            const t1 = Date.now();
            try {
                await remoteTaskExecutor[TASKS.MATRIX_MULTIPLY](taskParams);
                t_remote_ms = Date.now() - t1;
            } catch (e) {
                setLog(prev => prev + `Remote task failed: ${e.message}\n`);
            }
            setLog(prev => prev + `-> Remote Time: ${t_remote_ms}ms\n`);

            // 3. --- LOG THE DATA ---
            const outputs = {
                local_time_ms: t_local_ms,
                remote_time_ms: t_remote_ms,
            };

            if (t_local_ms === -1 || t_remote_ms === -1) {
                throw new Error('One or more tasks failed. Log will not be sent.');
            }

            setLog(prev => prev + 'Sending log to server...\n');

            await fetch(`${API_BASE_URL}/log-benchmark/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inputs, outputs }),
            });

            setLog(prev => prev + '\n--- Benchmark Complete! ---');

        } catch (error) {
            setLog(prev => prev + `Benchmark FAILED: ${error.message}\n`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Profiler</Text>
            <Button
                title={loading ? 'Benchmarking...' : `Run ${TEST_MATRIX_SIZE}x${TEST_MATRIX_SIZE} Benchmark`}
                onPress={runBenchmark}
                disabled={loading}
            />
            {loading && <ActivityIndicator size="large" color="#0000ff" />}
            <ScrollView style={styles.logContainer}>
                <Text style={styles.logText}>{log}</Text>
            </ScrollView>
        </View>
    );
}

// --- Add some basic styles ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    logContainer: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        borderColor: '#ccc',
        borderWidth: 1,
        marginTop: 20,
        padding: 10,
        height: 300,
    },
    logText: {
        fontSize: 12,
    },
});