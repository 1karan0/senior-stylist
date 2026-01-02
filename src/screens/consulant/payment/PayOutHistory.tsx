import { Text, View } from 'react-native';

const PayOutHistory = () => {
  return (
    <View>
      <Text className="text-2xl font-urbanist-bold text-textDark">Pay Out History</Text>
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-sm font-urbanist-regular text-textMuted">Total Earnings</Text>
          <Text className="text-xl font-urbanist-bold text-textDark">$8,542</Text>
        </View>
      </View>
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-sm font-urbanist-regular text-textMuted">Total Earnings</Text>
          <Text className="text-xl font-urbanist-bold text-textDark">$8,542</Text>
        </View>
      </View>
    </View>
  );
};

export default PayOutHistory;
