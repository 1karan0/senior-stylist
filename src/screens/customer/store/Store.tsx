import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ConsultationStackParamList } from '@/common/types';
import GradientBackground from '@/common/components/GradientBackground';

type StoreNavigationProp = StackNavigationProp<ConsultationStackParamList, 'ConsultationHome'>;

interface Props {
  navigation: StoreNavigationProp;
}

const Store: React.FC<Props> = ({ navigation }) => {
  return (
    <GradientBackground>
      <View style={styles.container}>
        <Text style={styles.title}>Consultation Home</Text>
        <Button
          title="Go to Profile Details"
          onPress={() => navigation.navigate('ConsultationDetail')}
        />
        <Button
          title="Go to Profile Chat"
          onPress={() => navigation.navigate('ConsultationChat')}
        />
      </View>
    </GradientBackground>
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

export default Store;
