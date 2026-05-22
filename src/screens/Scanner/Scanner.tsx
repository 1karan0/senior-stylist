import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Camera } from 'react-native-camera-kit';
import { useCameraPermission } from 'react-native-vision-camera';
import { SafeAreaView } from 'react-native-safe-area-context';

const Scanner = () => {
  const isFocused = useIsFocused();
  const { hasPermission, requestPermission } = useCameraPermission();
  const [scannedValue, setScannedValue] = useState<string | null>(null);
  const [scanEnabled, setScanEnabled] = useState(true);
  const lastValueRef = useRef<string | null>(null);

  const handleReadCode = useCallback(
    (event: { nativeEvent: { codeStringValue?: string } }) => {
      const value = event.nativeEvent.codeStringValue;
      if (!value || value === lastValueRef.current) {
        return;
      }
      lastValueRef.current = value;
      setScannedValue(value);
      setScanEnabled(false);
    },
    [],
  );

  const handleScanAgain = useCallback(() => {
    lastValueRef.current = null;
    setScannedValue(null);
    setScanEnabled(true);
  }, []);

  if (!hasPermission) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#0E1B16] px-6">
        <Text className="mb-2 text-xl font-bold text-white">
          Camera access required
        </Text>
        <Text className="mb-5 text-center text-sm text-[#B8C9C0]">
          Allow camera access to scan QR codes on this device.
        </Text>
        <TouchableOpacity
          className="rounded-xl bg-[#27B07D] px-5 py-3"
          onPress={requestPermission}
        >
          <Text className="text-base font-semibold text-white">Allow camera</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {isFocused ? (
        <Camera
          style={{ flex: 1 }}
          scanBarcode={scanEnabled}
          showFrame
          laserColor="#27B07D"
          frameColor="#FFFFFF"
          onReadCode={handleReadCode}
        />
      ) : null}

      <SafeAreaView
        className="absolute inset-0 justify-between"
        pointerEvents="box-none"
      >
        <View className="items-center px-5 pt-3">
          <Text className="text-2xl font-bold text-white">Scan QR code</Text>
          <Text className="mt-1 text-sm text-[#E8F3ED]">
            Point the camera at a QR code
          </Text>
        </View>

        <View className="mx-5 mb-5 min-h-[100px] justify-center rounded-xl bg-[#0E1B16]/90 p-4">
          {scannedValue ? (
            <>
              <Text className="mb-1.5 text-xs font-semibold text-[#27B07D]">
                Scanned
              </Text>
              <Text className="text-base text-white" selectable>
                {scannedValue}
              </Text>
              <TouchableOpacity
                className="mt-3 items-center rounded-lg bg-[#27B07D] py-2.5"
                onPress={handleScanAgain}
              >
                <Text className="font-semibold text-white">Scan again</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View className="flex-row items-center gap-2.5">
              <ActivityIndicator color="#fff" />
              <Text className="text-sm text-white">Waiting for QR code…</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

export default Scanner;
