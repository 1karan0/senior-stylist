import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ConsultationStackParamList } from '@/common/types';

type ConsultationNavigationProp = StackNavigationProp<
  ConsultationStackParamList,
  'ConsultationHome'
>;

interface Props {
  navigation: ConsultationNavigationProp;
}

const Consultation: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Consultation Home</Text>
      <Button
        title="Go to Consultation Details"
        onPress={() => navigation.navigate('ConsultationDetail')}
      />
      <Button
        title="Go to Consultation Chat"
        onPress={() => navigation.navigate('ConsultationChat')}
      />
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

export default Consultation;
