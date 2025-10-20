import React, { useState } from 'react';
import { SafeAreaView, Text, Button, ScrollView } from 'react-native';
import { sendMatrixForComputation } from './api';

export default function App() {
  const [result, setResult] = useState(null);

  // Example matrices, adjust as needed
  const matrixA = [
    [1, 2],
    [3, 4]
  ];
  const matrixB = [
    [5, 6],
    [7, 8]
  ];

  const handleCompute = async () => {
    setResult(''); // Clear previous result
    try {
      const res = await sendMatrixForComputation(matrixA, matrixB);
      setResult(res);
    } catch (error) {
      setResult('Could not connect to backend.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'black' }}>
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
          <Text style={{ color: 'white' }}>Press the button to compute</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
