'use client'

import {
  Button,
  Flex,
  Heading,
  Image,
  Stack,
  Text,
  useBreakpointValue,
  useToast
} from '@chakra-ui/react'
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function HomeComponent() {
  const toast = useToast()
  const navigate = useNavigate();
  const { t } = useTranslation();
  let tokenExisting: boolean = localStorage.getItem('access_token') ? true : false;

  const handleLoginClick = () => {
    if (tokenExisting) {
      // Show a notification that the user is already logged in
      toast({
        title: t("homePage.alreadyLoggedIn"),
        description: t('homePage.youAreLoggedIn'),
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
    } else {
      navigate('/login')
    }
  };

  return (
    <Stack minH={'100vh'} direction={{ base: 'column', md: 'row' }}>
      <Flex p={8} flex={1} align={'center'} justify={'center'}>
        <Stack spacing={6} w={'full'} maxW={'lg'}>
          <Heading fontSize={{ base: '3xl', md: '4xl', lg: '5xl' }}>
            <Text
              as={'span'}
              position={'relative'}
              _after={{
                content: "''",
                width: 'full',
                height: useBreakpointValue({ base: '20%', md: '30%' }),
                position: 'absolute',
                bottom: 1,
                left: 0,
                bg: 'blue.400',
                zIndex: -1,
              }}>
              {t('homePage.title')}
            </Text>
            <br />{' '}
            <Text color={'blue.400'} as={'span'}>
              {t('homePage.subtitle')}
            </Text>{' '}
          </Heading>
          <Text fontSize={{ base: 'md', lg: 'lg' }} color={'gray.500'}>
            {t('homePage.description')}
          </Text>
          <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
            <Link to="/register">
                <Button
                rounded={'full'}
                bg={'blue.400'}
                color={'white'}
                _hover={{
                    bg: 'blue.500',
                }}>
                  {t('homePage.signup')}
                </Button>
              </Link> 
              <Button
              rounded={'full'}
              onClick={handleLoginClick}>
                {t('homePage.login')}
              </Button>
          </Stack>
        </Stack>
      </Flex>
      <Flex flex={1}>
        <Image
          alt={'Login Image'}
          objectFit={'cover'}
          src={
            '/Men_write_resume.jpg'
          }
        />
      </Flex>
    </Stack>
  )
}