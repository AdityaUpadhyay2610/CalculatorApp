import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { evaluate } from 'mathjs';

type HistoryItem = string;

const App = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async (): Promise<void> => {
    setIsLoadingHistory(true);
    try {
      const savedHistory = await AsyncStorage.getItem('calcHistory');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Error loading history:", error);
      setResult('Failed to load history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const saveHistory = async (newHistory: HistoryItem[]): Promise<void> => {
    try {
      await AsyncStorage.setItem('calcHistory', JSON.stringify(newHistory));
    } catch (error) {
      console.error("Error saving history:", error);
    }
  };

  const handlePress = (value: string): void => {
    if (!value) return;

    if (value === '=') {
      if (!input.trim()) {
        setResult('Empty Input');
        return;
      }

      try {
        let expression = input.replace(/√/g, 'sqrt').replace(/\^/g, '**');
        
        // Validate expression before evaluation
        if (/\/\s*0(?!\.)/.test(expression)) {
          setResult('Cannot divide by zero');
          return;
        }

        const evalResult = evaluate(expression).toString();
        setResult(evalResult);

        const newHistory = [...history, `${input} = ${evalResult}`].slice(-10);
        setHistory(newHistory);
        saveHistory(newHistory);
      } catch (error) {
        console.error('Evaluation error:', error);
        setResult('Invalid Expression');
      }
    } else if (value === 'C') {
      setInput('');
      setResult('');
    } else if (value === 'DEL') {
      setInput(input.slice(0, -1));
    } else if (value === 'History') {
      setShowHistoryModal(true);
    } else {
      setInput(input + value);
    }
  };

  const renderButton = (value: string) => (
    <Animatable.View animation="bounceIn" delay={100}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => handlePress(value)}
      >
        <Text style={styles.buttonText}>
          {value}
        </Text>
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Calculator
        </Text>
      </View>

      <Text style={styles.input}>
        {input || '0'}
      </Text>
      <Text style={styles.result}>
        {result}
      </Text>

      <Modal
        visible={showHistoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowHistoryModal(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            <ScrollView style={styles.modalScrollView}>
              {isLoadingHistory ? (
                <Text style={styles.historyText}>
                  Loading history...
                </Text>
              ) : history.length === 0 ? (
                <Text style={styles.historyText}>
                  No history available
                </Text>
              ) : (
                history.slice(-5).map((item, index) => (
                  <Text key={index} style={styles.historyText}>
                    {item}
                  </Text>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={styles.row}>
        {['7', '8', '9', '/'].map(renderButton)}
      </View>
      <View style={styles.row}>
        {['4', '5', '6', '*'].map(renderButton)}
      </View>
      <View style={styles.row}>
        {['1', '2', '3', '-'].map(renderButton)}
      </View>
      <View style={styles.row}>
        {['C', '0', '=', '+'].map(renderButton)}
      </View>
      <View style={styles.row}>
        {['(', ')', '%', '√'].map(renderButton)}
      </View>
      <View style={styles.row}>
        {['^','History'].map(renderButton)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    backgroundColor: '#f5f5f5',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  input: {
    fontSize: 40,
    marginBottom: 20,
    padding: 10,
    width: '90%',
    textAlign: 'right',
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
  },
  result: {
    fontSize: 24,
    marginBottom: 20,
    color: 'green',
  },
  history: {
    height: 100,
    width: '90%',
    backgroundColor: '#e3e3e3',
    padding: 5,
    borderRadius: 5,
    marginBottom: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    maxHeight: '60%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalScrollView: {
    marginTop: 30,
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  historyText: {
    fontSize: 16,
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#e0e0e0',
    padding: 25,
    margin: 8,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
    elevation: 3,
  },
  buttonText: {
    fontSize: 28,
    color: '#333',
    fontWeight: '500',
  },
});

export default App;
