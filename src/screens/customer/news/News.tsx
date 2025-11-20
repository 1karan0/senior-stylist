import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ConsultationStackParamList } from '@/common/types';

type NewsNavigationProp = StackNavigationProp<ConsultationStackParamList, 'ConsultationHome'>;

interface Props {
  navigation: NewsNavigationProp;
}

const News: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Consultation Home</Text>
      <Button
        title="Go to Profile Details"
        onPress={() => navigation.navigate('ConsultationDetail')}
      />
      <Button title="Go to Profile Chat" onPress={() => navigation.navigate('ConsultationChat')} />
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

export default News;
