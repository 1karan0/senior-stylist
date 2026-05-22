import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';
import GradientBackground from '@/common/components/GradientBackground';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof schema>;

const Login = () => {
  const { login } = useAuth();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    await login(data.email, data.password);
  };

  return (
    <GradientBackground>
      <View className="items-center justify-center mt-10">
        <Text className="text-2xl font-bold text-white">Login</Text>
      </View>
      <View className="flex-1 items-center justify-center p-4">
        <View className="w-full gap-4">
        <View className="">
            <Text className="text-sm text-white">Email <Text className="text-red-500">*</Text></Text>
          </View>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="w-full rounded-md border-2 border-gray-300 p-2 text-white"
                placeholder="Email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            )}
          />
          {errors.email ? (
            <Text className="text-sm text-red-600">{errors.email.message}</Text>
          ) : null}

            <View className="">
              <Text className="text-sm text-white">Password <Text className="text-red-500">*</Text></Text>
            </View>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="w-full rounded-md border-2 border-gray-300 p-2 text-white"
                placeholder="Password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                autoCapitalize="none"
              />
            )}
          />
          {errors.password ? (
            <Text className="text-sm text-red-600">{errors.password.message}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          className="mt-3 w-full items-center justify-center rounded-md bg-green-500 p-3"
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-lg font-bold text-white">Login</Text>
          )}
        </TouchableOpacity>
      </View>
    </GradientBackground>
  );
};

export default Login;
