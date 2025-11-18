export interface OnboardItemType {
  id: number;
  title: string;
  description: string;
  icon: any; // ImageRequireSource
}

const onboardData: OnboardItemType[] = [
  {
    id: 1,
    title: "Connect with Experts",
    description: "Hair SoS Emergency? Connect with a real Senior Stylist in real time.",
    icon: require("../assets/icon1.png"),
  },
  {
    id: 2,
    title: "Personalized Solutions",
    description: "Get instant hair care suggestions based on your hair type.",
    icon: require("../assets/icon2.png"),
  },
  {
    id: 3,
    title: "Track Your Routine",
    description: "Stay consistent with your hair goals using daily check-ins.",
    icon: require("../assets/icon3.png"),
  },
];

export default onboardData;
