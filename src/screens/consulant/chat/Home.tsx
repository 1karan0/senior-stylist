import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';

const Chat: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-800">Chat</Text>
      </View>

      {/* Content */}
      <View className="flex-1 justify-center items-center px-4">
        <Text className="text-2xl font-bold text-gray-800 mb-8">Consultant Chat</Text>

        <TouchableOpacity
          className="bg-green-500 px-6 py-4 rounded-lg w-64"
          onPress={() => setModalVisible(true)}
        >
          <Text className="text-white text-center text-lg font-semibold">Open Chat Modal</Text>
        </TouchableOpacity>
      </View>

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-2xl p-6 mx-4 w-80">
            <Text className="text-xl font-bold text-gray-800 mb-4 text-center">
              Chat with Clients
            </Text>
            <Text className="text-gray-600 mb-6 text-center">
              Manage your conversations with clients and provide consultations.
            </Text>
            <TouchableOpacity
              className="bg-green-500 px-4 py-3 rounded-lg"
              onPress={() => setModalVisible(false)}
            >
              <Text className="text-white text-center font-semibold">Close Modal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Chat;
