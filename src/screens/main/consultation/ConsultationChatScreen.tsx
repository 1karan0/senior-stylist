import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ConsultationChatScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Consultation Chat</Text>
      <Text>Chat interface goes here</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default ConsultationChatScreen;