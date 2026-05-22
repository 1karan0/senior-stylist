import AsyncStorage from '@react-native-async-storage/async-storage';

export const setStorageItem = async (key: string, value: string) => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error('Error setting item:', error);
  }
};

export const getStorageItem = async (key: string) => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error('Error getting item:', error);
  }
};

export const removeItem = async (key: string) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing storage item:', error);
  }
};