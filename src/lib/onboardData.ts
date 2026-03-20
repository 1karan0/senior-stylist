export interface OnboardItemType {
  id: number;
  title: string;
  description: string;
  image: any; // ImageRequireSource
}

const onboardData = [
  {
    id: 1,
    title: 'Confidence starts with a connection',
    description:
      'We believe that when you look your best, you feel unstoppable. But great hair isn’t just about a service—it’s about finding a stylist who truly sees you. We’ve brought together the world’s most elite senior stylists to ensure that every appointment is more than a booking; it’s a sanctuary for your self-expression.',
    image: require('@/assets/images/first-screen.jpg'),
  },
  {
    id: 2,
    title: 'Because You Deserve to Be Seen',
    description:
      "We believe the right connection changes everything. That’s why we provide direct access to the beauty sector's most seasoned experts—to bring your unique vision to life.",
    image: require('@/assets/images/second-screen.jpg'),
  },
  {
    id: 3,
    title: 'Professional Care, Curated for You',
    description:
      'We believe your hair deserves the same standard of care at home as it gets in the chair. Access the elite tools and products chosen by our Senior Stylists to keep your vision alive every single day.',
    image: require('@/assets/images/third-screen.jpg'),
  },
];

export default onboardData;
