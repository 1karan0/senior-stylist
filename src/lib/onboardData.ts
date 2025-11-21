export interface OnboardItemType {
  id: number;
  title: string;
  description: string;
  icon: any; // ImageRequireSource
}

const onboardData: OnboardItemType[] = [
  {
    id: 1,
    title: 'Connect with Experts',
    description: 'Hair SoS Emergency? Connect with a real Senior Stylist in real time.',
    icon: require('../assets/icons/icon1.png'),
  },
  {
    id: 2,
    title: 'Shop with Ease ',
    description: 'Browse thousands of products and get them delivered to your doorstep',
    icon: require('../assets/icons/icon2.png'),
  },
  {
    id: 3,
    title: 'Expert Consultants',
    description: 'Get professional advice from verified consultants in various fields.',
    icon: require('../assets/icons/icon3.png'),
  },
];

export default onboardData;
