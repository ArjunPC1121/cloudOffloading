import React, { useState } from 'react';
import { SafeAreaView, Text, TextInput, Button, ScrollView, StyleSheet } from 'react-native';
import { sendMatrixForComputation } from '../api';

export default function MatrixMultiplicationScreen() {
  const [matrixAInput, setMatrixAInput] = useState('1,2\n3,4');
  const [matrixBInput, setMatrixBInput] = useState('5,6\n7,8');
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');

  const parseMatrix = (text) => {
    return text.trim().split('\n').map(row => row.split(',').map(Number));
  };

  const multiplyMatricesLocally = (A, B) => {
    const rowsA = A.length;
    const colsA = A[0].length;
    const rowsB = B.length;
    const colsB = B[0].length;

    if (colsA !== rowsB) {
      throw new Error('Incompatible matrix dimensions for multiplication');
    }

    const product = [];
    for (let i = 0; i < rowsA; i++) {
      product[i] = [];
      for (let j = 0; j < colsB; j++) {
        product[i][j] = 0;
        for (let k = 0; k < colsA; k++) {
          product[i][j] += A[i][k] * B[k][j];
        }
      }
    }
    return product;
  };

  const handleCompute = async () => {
    try {
      const matrixA = parseMatrix(matrixAInput);
      const matrixB = parseMatrix(matrixBInput);
      const orderA = matrixA.length;
      const orderB = matrixB.length;

      const startTime = Date.now();

      if (orderA < 30 && orderB < 30) {
        // Local computation
        const localResult = multiplyMatricesLocally(matrixA, matrixB);
        const timeTaken = Date.now() - startTime;
        setMessage(`Computed on mobile device in ${timeTaken} ms`);
        setResult(localResult);
      } else {
        // Remote computation
        const res = await sendMatrixForComputation(matrixA, matrixB);
        const timeTaken = Date.now() - startTime;
        setMessage(`Computed on backend server in ${timeTaken} ms`);
        setResult(res);
      }
    } catch (error) {
      setMessage('Error computing matrix: ' + error.message);
      setResult(null);
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

      <Button title="Compute Matrix Multiplication" onPress={handleCompute} color="#1e90ff" />

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
