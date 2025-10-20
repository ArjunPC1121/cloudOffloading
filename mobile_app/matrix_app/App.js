import React, { useState } from 'react';
import { SafeAreaView, Text, TextInput, Button, ScrollView, View } from 'react-native';
import { sendMatrixForComputation } from './api';

export default function App() {
  const [matrixAInput, setMatrixAInput] = useState('1,2\n3,4'); // default text for matrix A
  const [matrixBInput, setMatrixBInput] = useState('5,6\n7,8'); // default text for matrix B
  const [result, setResult] = useState(null);

  const parseMatrix = (text) => {
    // Parses string like '1,2\n3,4' into [[1,2],[3,4]]
    return text.trim().split('\n').map(row => row.split(',').map(Number));
  };

  const handleCompute = async () => {
    try {
      const matrixA = parseMatrix(matrixAInput);
      const matrixB = parseMatrix(matrixBInput);
      const res = await sendMatrixForComputation(matrixA, matrixB);
      setResult(res);
    } catch (error) {
      setResult('Error computing matrix. Check input format.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 20, backgroundColor: 'black' }}>
      <Text style={{ color: 'white', marginBottom: 5 }}>Enter Matrix A (rows as comma separated values):</Text>
      <TextInput
        style={{ height: 100, borderColor: 'gray', borderWidth: 1, color: 'white', marginBottom: 15, padding: 10, textAlignVertical: 'top' }}
        multiline
        value={matrixAInput}
        onChangeText={setMatrixAInput}
        placeholder="1,2\n3,4"
        placeholderTextColor="gray"
      />

      <Text style={{ color: 'white', marginBottom: 5 }}>Enter Matrix B (rows as comma separated values):</Text>
      <TextInput
        style={{ height: 100, borderColor: 'gray', borderWidth: 1, color: 'white', marginBottom: 15, padding: 10, textAlignVertical: 'top' }}
        multiline
        value={matrixBInput}
        onChangeText={setMatrixBInput}
        placeholder="5,6\n7,8"
        placeholderTextColor="gray"
      />

      <Button title="Compute Matrix Multiplication" onPress={handleCompute} />

      <ScrollView style={{ marginTop: 20 }}>
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
