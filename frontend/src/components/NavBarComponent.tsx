'use client'

import {
  Box,
  Flex,
  HStack,
  Text,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  useColorModeValue,
  useColorMode,
  Stack,
  Center,
  Image,
  Select
} from '@chakra-ui/react'
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons'
import { MoonIcon, SunIcon } from '@chakra-ui/icons'
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { decodeToken } from '../utils/Api';
import { useTranslation } from 'react-i18next';
import i18n, { handleChangeLanguage } from '../i18n';

const LanguageSwitcher = () => {
  const handleSelectChange = (event: any) => {
    handleChangeLanguage(event.target.value);
  };

  return (
    <Select
      width="150px"
      defaultValue={i18n.language}
      onChange={handleSelectChange}
    >
      <option value="en">EN</option>
      <option value="ru">RU</option>
    </Select>
  );
};

const NavLink = (props: { url: string; children: React.ReactNode }) => {
  const { url, children } = props;
  return (
    <Box
      as="a"
      px={2}
      py={1}
      rounded={'md'}
      _hover={{
        textDecoration: 'none',
        bg: useColorModeValue('gray.200', 'gray.700'),
      }}
      href={url}
    >
      {children}
    </Box>
  );
};

const mapRoleIdToRoleName = (role_id_fk: number, t: any) => {
  switch (role_id_fk) {
    case 1:
      return t('administrator');
    case 2:
      return t('employer');
    case 3:
      return t('applicant');
    default:
      return t('unknownRole');
  }
};

export default function NavBarComponent() {
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [user, setUser] = useState<{ email?: string; role?: string } | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  let userData:any = undefined;
  let tokenExistence = localStorage.getItem('access_token') ? true : false;

  const [links, setLinks] = useState([
    { label: t('home'), url: '/' },
  ]);

  const updateLinksBasedOnRole = (role: string | undefined) => {
    let updatedLinks = [
      { label: t('home'), url: '/' },
    ];

    switch(role) {
      case t('administrator'):
        updatedLinks.push({ label: t('profile'), url: '/user/profile'  });
        updatedLinks.push({ label: t('userList'), url: '/user/list'  });
        updatedLinks.push({ label: t('resumeList'), url: '/resume/list' });
        updatedLinks.push({ label: t('statistics'), url: '/resume/statistics' });
        updatedLinks.push({ label: t('teamList'), url: '/team/list' });
        updatedLinks.push({ label: t('chatList'), url: '/chat/list' });
        break;
      case t('employer'):
        updatedLinks.push({ label: t('profile'), url: '/user/profile'  });
        updatedLinks.push({ label: t('resumeList'), url: '/resume/list' });
        updatedLinks.push({ label: t('statistics'), url: '/resume/statistics' });
        updatedLinks.push({ label: t('teamList'), url: '/team/list' });
        updatedLinks.push({ label: t('createTeam'), url: '/team' });
        updatedLinks.push({ label: t('technicalSupport'), url: '/chat/tech' });
        break;
      case t('applicant'):
        updatedLinks.push({ label: t('profile'), url: '/user/profile'  });
        updatedLinks.push({ label: t('yourResume'), url: '/resume' }); 
        updatedLinks.push({ label: t('resumeList'), url: '/resume/list' });
        updatedLinks.push({ label: t('statistics'), url: '/resume/statistics' });
        updatedLinks.push({ label: t('technicalSupport'), url: '/chat/tech' });
        break;
      default:
        updatedLinks =  [ { label: t('home'), url: '/' },];
    }
    setLinks(updatedLinks);
  };

  const fetchData = async () => {
    try {
      const response = await decodeToken();
      userData = {
        email: response.email,
        role: mapRoleIdToRoleName(response.role_id_fk, t),
      };
      setUser({
        email: response.email,
        role: mapRoleIdToRoleName(response.role_id_fk, t),
      });
    } catch (error) {
      console.error('Error fetching user information:', error);
    }
  };

  const fetchAll = async () => {
    if (tokenExistence) {
      await fetchData();
      updateLinksBasedOnRole(userData.role);
    } else {
      updateLinksBasedOnRole(undefined);
    }
  };
  
  useEffect(() => {
    fetchAll();
  }, [tokenExistence, t]);

  const handleLogout = async () => {
    localStorage.removeItem('access_token');
    // tokenExistence = false;
    updateLinksBasedOnRole(undefined);
    navigate('/login')
  };

  return (
    <>
      <Box bg={useColorModeValue('gray.100', 'gray.900')} px={4}>
        <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
          <IconButton
            size={'md'}
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            aria-label={'Open Menu'}
            display={{ md: 'none' }}
            onClick={isOpen ? onClose : onOpen}
          />
          <HStack spacing={8} alignItems={'center'}>
            <Image src="/logo.svg" alt="Logo" boxSize="50px"/>
            <HStack as={'nav'} spacing={4} display={{ base: 'none', md: 'flex' }}>
            {links.map((link) => (
              <NavLink key={link.label} url={link.url}>
                {link.label}
              </NavLink>
            ))}
            </HStack>
          </HStack>

          <Flex alignItems={'center'}>
              <Stack direction={'row'} spacing={7}>
                <LanguageSwitcher />
                <Button onClick={toggleColorMode}>
                  {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                </Button>

                {tokenExistence && (
                <Menu>
                  <MenuButton
                    as={Button}
                    rounded={'full'}
                    variant={'link'}
                    cursor={'pointer'}
                    minW={0}>
                    <p>{user?.email || t("loading")}</p>
                  </MenuButton>
                  <MenuList alignItems={'center'}>
                    <br />
                    <Center>
                      <p>{user?.email || t("loading")}</p>
                    </Center>
                    <br />
                    <Center>
                      <p>{user?.role || t("loading")}</p>
                    </Center>
                    <br />
                    <MenuDivider />
                    <Link to="/user/profile">
                      <MenuItem>{t("yourProfile")}</MenuItem>
                    </Link>
                    <MenuItem onClick={handleLogout}>{t("logout")}</MenuItem>
                  </MenuList>
                </Menu>
                )}
              </Stack>
          </Flex>
        </Flex>

        {isOpen ? (
          <Box pb={4} display={{ md: 'none' }}>
            <Stack as={'nav'} spacing={4}>
              {links.map((link) => (
                <NavLink key={link.label} url={link.url}>
                {link.label}
              </NavLink>
              ))}
            </Stack>
          </Box>
        ) : null}
      </Box>
    </>
  )
}
