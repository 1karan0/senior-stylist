import { Image, Text, View } from 'react-native';

import { NewsArticle } from '@/common/types';
import { useTheme } from '@/contexts/ThemeContext';
interface ArticleCardProps {
  item: NewsArticle;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ item }) => {
  const { isDark } = useTheme();
  return (
    <View
      className={`${isDark ? 'bg-buttonSecondaryText border-commonGradientStop7' : 'bg-white border-commonGradientStop11'}  rounded-xl  mb-4 shadow-sm border `}
    >
      {/* Category Chip */}
      <View>
        <View className="">
          <View
            style={{
              borderRadius: 10,
              backgroundColor: '#2CCB91',
            }}
            className="z-50  absolute  top-2 left-2  px-3 py-1 "
          >
            <Text className="text-white text-sm font-bold">{item.category?.name}</Text>
          </View>
        </View>

        {/* Image */}
        <Image source={{ uri: item.image_url }} className="w-full h-48 rounded-md mb-3" />
      </View>

      {/* Title */}
      <View className="p-3">
        <Text className={`text-lg font-semibold  ${isDark ? 'text-white' : 'text-gray-900'}  mb-1`}>
          {item.title}
        </Text>

        {/* Excerpt */}
        <Text className={` ${isDark ? 'text-textSecondary' : 'text-textMuted'} text-base mb-2`}>
          {item.excerpt}
        </Text>

        {/* Published time */}
        <View className="flex flex-row items-center gap-2">
          <Image source={require('@/assets/icons/clock.png')} className="w-5 h-5" />
          <Text
            className={`text-sm font-normal ${isDark ? 'text-textSecondary' : 'text-textMuted'} `}
          >
            {item.published_date}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default ArticleCard;
