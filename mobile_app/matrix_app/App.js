import React, { useState } from 'react';
import { SafeAreaView, Text, TextInput, Button, ScrollView } from 'react-native';
import { sendMatrixForComputation } from './api';

export default function App() {
  const [matrixAInput, setMatrixAInput] = useState('1,2\n3,4');
  const [matrixBInput, setMatrixBInput] = useState('5,6\n7,8');
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');
  const [timeTaken, setTimeTaken] = useState(null);

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

      if (orderA < 30 && orderB < 30) {
        const start = Date.now();
        const localResult = multiplyMatricesLocally(matrixA, matrixB);
        const end = Date.now();
        //setTimeTaken((end - start) + ' ms');
        setMessage(`Computed on mobile device in ${end - start} ms`);
        setResult(localResult);
      } else {
        const start = Date.now();
        const res = await sendMatrixForComputation(matrixA, matrixB);
        const end = Date.now();
        //setTimeTaken((end - start) + ' ms');
        setMessage(`Computed on backend server in ${end - start} ms`);
        setResult(res);
      }
    } catch (error) {
      setMessage('');
      setResult('Error computing matrix. ' + error.message);
      setTimeTaken(null);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 20, backgroundColor: 'black' }}>
      <Text style={{ color: 'white', marginBottom: 5 }}>Matrix A (comma-separated rows):</Text>
      <TextInput
        multiline
        value={matrixAInput}
        onChangeText={setMatrixAInput}
        style={{ height: 100, borderColor: 'gray', borderWidth: 1, color: 'white', marginBottom: 15, padding: 10, textAlignVertical: 'top' }}
        placeholder="1,2\n3,4"
        placeholderTextColor="gray"
      />

      <Text style={{ color: 'white', marginBottom: 5 }}>Matrix B (comma-separated rows):</Text>
      <TextInput
        multiline
        value={matrixBInput}
        onChangeText={setMatrixBInput}
        style={{ height: 100, borderColor: 'gray', borderWidth: 1, color: 'white', marginBottom: 15, padding: 10, textAlignVertical: 'top' }}
        placeholder="5,6\n7,8"
        placeholderTextColor="gray"
      />

      <Button title="Compute Matrix Multiplication" onPress={handleCompute} />

      <Text style={{ color: 'lightblue', marginTop: 15 }}>{message}</Text>
      {timeTaken && <Text style={{ color: 'lightgreen' }}>Time taken: {timeTaken}</Text>}

      <ScrollView style={{ marginTop: 20, flex: 1 }}>
        {result ? (
          typeof result === 'string' ? (
            <Text style={{ color: 'white' }}>{result}</Text>
          ) : (
            result.map((row, i) => (
              <Text key={i} style={{ color: 'white' }}>
                {row.join(', ')}
              </Text>
            ))
          )
        ) : (
          <Text style={{ color: 'white' }}>Results will appear here</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
