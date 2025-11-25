import { Image, Text, View } from 'react-native';
import { NewsArticle } from '@/common/types';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

interface ArticleCardProps {
  item: NewsArticle;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ item }) => {
  const { isDark } = useTheme();
  return (
    <View
      className={`${isDark ? 'bg-[#162721] border-[#273F36]' : 'bg-white border-[#DADADA]'}  rounded-xl  mb-4 shadow-sm border `}
    >
      {/* Category Chip */}
      <View>
        <View className="">
          <LinearGradient
            colors={['#2CCB91', '#23A76F']}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 10 }}
            className="z-50  absolute  top-2 left-2  px-3 py-1 "
          >
            <Text className="text-white text-sm font-bold">{item.category?.name}</Text>
          </LinearGradient>
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
        <Text className={` ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'} text-base mb-2`}>
          {item.excerpt}
        </Text>

        {/* Published time */}
        <View className="flex flex-row items-center gap-2">
          <Image source={require('@/assets/icons/clock.png')} className="w-5 h-5" />
          <Text className={`text-sm font-normal ${isDark ? 'text-[#8AA897]' : 'text-[#658176]'} `}>
            {item.published_date}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default ArticleCard;
