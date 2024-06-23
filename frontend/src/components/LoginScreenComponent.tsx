'use client'

import {
  Flex,
  Box,
  FormControl,
  FormLabel,
  Input,
  Checkbox,
  Stack,
  Button,
  Heading,
  Text,
  useColorModeValue,
  useToast,
  UseToastOptions
} from '@chakra-ui/react'
import { loginUser } from '../utils/Api'
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();

  const handleLogin = async () => {
    try {

      if (!email.trim() || !password.trim()) {
        toast({
          title: t('toastMessages.loginFailed'),
          description: t('toastMessages.invalidCredentials'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const result = await loginUser(email, password);
      const { access_token } = result;
      localStorage.setItem('access_token', access_token);

      toast({
        title: t('toastMessages.loginSuccessful'),
        description: t('toastMessages.loggedInSuccessfully'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      navigate('/');
    } catch (error:any) {
      if (error.response && error.response.status === 404) {
        toast({
          title: t('toastMessages.loginFailed'),
          description: t('toastMessages.userNotFound'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else if (error.response && error.response.status === 401) {
        toast({
          title: t('toastMessages.loginFailed'),
          description: t('toastMessages.invalidPassword'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else {
        console.error('Error during login:', error);
      }
    }
  };

  return (
    <Flex
      minH={'100vh'}
      align={'center'}
      justify={'center'}
      bg={useColorModeValue('gray.50', 'gray.800')}>
      <Stack spacing={8} mx={'auto'} maxW={'lg'} py={12} px={6}>
        <Stack align={'center'}>
          <Heading fontSize={'4xl'}>{t('loginPage.signIn')}</Heading>
        </Stack>
        <Box
          rounded={'lg'}
          bg={useColorModeValue('white', 'gray.700')}
          boxShadow={'lg'}
          p={8}>
          <Stack spacing={4}>
            <Box textAlign="center">
              <Heading fontSize={'4xl'}>{t('loginPage.rezumix')}</Heading>
            </Box>
            <FormControl id="email">
              <FormLabel>{t('loginPage.emailAddress')}</FormLabel>
              <Input type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)} />
            </FormControl>
            <FormControl id="password">
              <FormLabel>{t('loginPage.password')}</FormLabel>
              <Input type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)} />
            </FormControl>
            <Stack spacing={10}>
              <Stack
                direction={{ base: 'column', sm: 'row' }}
                align={'start'}
                justify={'space-between'}>
                <Link to="/register">
                  <Text color={'blue.400'}>{t('loginPage.dontHaveAccount')}</Text>
                </Link>
              </Stack>
              <Button
                bg={'blue.400'}
                color={'white'}
                _hover={{
                  bg: 'blue.500',
                }}
                onClick={handleLogin}>
                  {t('loginPage.signInButton')}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Flex>
  )
}
