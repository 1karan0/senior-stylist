export interface OnboardItemType {
  id: number;
  title: string;
  description: string;
  image: any; // ImageRequireSource
}

const onboardData = [
  {
    id: 1,
    title: 'Connect with a Senior Stylist',
    description:
      'Connect with a Stylist anywhere in the world. When just need that second opinion.',
    image: require('@/assets/images/first-screen.jpg'),
  },
  {
    id: 2,
    title: 'Professional Consultation',
    description: 'Connect with a Senior Stylist, from various fields within the beauty sector.',
    image: require('@/assets/images/second-screen.jpg'),
  },
  {
    id: 3,
    title: 'Shop with Ease',
    description: 'Browse thousands of products and get them delivered to your doorstep.',
    image: require('@/assets/images/third-screen.jpg'),
  },
];

export default onboardData;
