import React, { useState } from 'react';
import { View, Text } from 'react-native';
import RequestList, { RequestItem } from './List';
import RequestDetailsModal from './DetailsModal';

const Request: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('Pending');
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);

  // Mock data for requests
  const requests: RequestItem[] = [
    {
      id: 1,
      initials: 'JS',
      name: 'John Smith',
      time: '5 min ago',
      hasAttachment: true,
      attachmentName: 'Photo Attached',
      requirements:
        'I need help with styling for a corporate event next week. Looking for formal yet modern looks that make a statement.',
    },
    {
      id: 2,
      initials: 'JS',
      name: 'John Smith',
      time: '5 min ago',
      hasAttachment: false,
      requirements:
        'Need advice on financial planning and investment strategies for long-term growth.',
    },
  ];

  const handleAcceptRequest = (requestId: number) => {
    const request = requests.find((req) => req.id === requestId);
    setSelectedRequest(request || null);
    setModalVisible(true);
  };

  const handleViewDetails = (request: RequestItem) => {
    setSelectedRequest(request);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedRequest(null);
  };

  return (
    <View className="flex-1 bg-white p-3">
      {/* Header */}
      <View className="flex-col items-start p-4">
        <Text className="text-2xl font-urbanist font-bold text-[#162721]">
          Consultation Requests
        </Text>
        <Text className="font-poppins text-sm text-[#658176]">
          Accept requests to start earning
        </Text>
      </View>

      {/* Stats Section */}
      <View className="">
        <View className="flex-row justify-between items-center">
          {/* Pending Box */}
          <View className="flex-1 items-center bg-white rounded-xl border border-[#DAE7E0] p-4 mx-2">
            <Text className="text-3xl font-urbanist font-bold text-[#162721]">2</Text>
            <Text className="font-poppins text-[#658176] text-sm mt-1">Pending</Text>
          </View>

          {/* This Month Box */}
          <View className="flex-1 items-center bg-white rounded-xl border border-[#DAE7E0] p-4 mx-2">
            <Text className="text-3xl font-urbanist font-bold text-[#162721]">24</Text>
            <Text className="font-poppins text-[#658176] text-sm mt-1">This Month</Text>
          </View>
        </View>
      </View>

      {/* Requests List */}
      <RequestList
        requests={requests}
        onAcceptRequest={handleAcceptRequest}
        onViewDetails={handleViewDetails}
      />

      {/* Request Details Modal */}
      <RequestDetailsModal
        visible={modalVisible}
        onClose={handleCloseModal}
        request={selectedRequest || requests[0]}
      />
    </View>
  );
};

export default Request;
