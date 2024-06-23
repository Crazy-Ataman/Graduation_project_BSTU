import React, { useState, useEffect } from 'react';
import {
  Container,
  Heading,
  VStack,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  useToast,
  RadioGroup,
  Stack,
  Radio,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { decodeToken, deleteUser, getUserList, userAccept, userRefuse } from '../utils/Api';

interface User {
    user_id: string;
    email: string;
    first_name: string;
    last_name: string;
    registration_date: string;
    is_approved: boolean;
    role_id_fk: number;
  }

const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(false);
  const [filtration, setFiltration] = useState('none');
  const toast = useToast();
  const { t } = useTranslation();

  const mapRoleIdToRoleName = (roleId: number): string => {
    switch (roleId) {
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

  const handleUserAccept = async (user_id: string) => {
    try {
      await userAccept(user_id);
      const updatedUsers = users.map((user) =>
        user.user_id === user_id ? { ...user, is_approved: true } : user
      );
      setUsers(updatedUsers);
    } catch (error) {
      console.error('Error during user accept:', error);
    }
  };

  const handleUserRefuse = async (user_id: string) => {
    try {
      await userRefuse(user_id);
      const updatedUsers = users.map((user) =>
        user.user_id === user_id ? { ...user, is_approved: false } : user
      );
      setUsers(updatedUsers);
    } catch (error) {
      console.error('Error during user refuse:', error);
    }
  };

  const handleDeleteUser = async (user_id: string) => {
    try {
      await deleteUser(user_id);
      toast({
        title: t('toastMessages.userDeletedSuccessfully'),
        description: t('toastMessages.userDeletedSuccessfullyText'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  }

  const fetchUsers = async () => {
    try {
      const tokenResponse = await decodeToken();
      console.log(tokenResponse);
      let role:number = tokenResponse.role_id_fk;
      console.log(role);
      if (![1].includes(role)) {
        window.location.href = '/';
        return;
      } else {
        setAuth(true);
        const userList: User[] = await getUserList(filtration);
        setUsers(userList);
        console.log(userList);
      }
    } catch (error) {
      console.error('Error fetching user list:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filtration]);

  return (
    <Container maxW="container.lg" mt={8}>
      <VStack spacing={2} align="start">
        {auth && (
          <>
            <Heading as="h1" size="xl">
              {t('userList')}
            </Heading>

            <RadioGroup onChange={(value) => setFiltration(value)} value={filtration}>
                <Stack spacing={3} direction='row'>
                    <Radio value="none">{t('userManagement.allUsers')}</Radio>
                    <Radio value="employers">{t('userManagement.employers')}</Radio>
                    <Radio value="applicants">{t('userManagement.applicants')}</Radio>
                </Stack>
            </RadioGroup>
  
            {loading ? (
              <Text>{t('userManagement.loadingMessage')}</Text>
            ) : (
              <Table variant="striped" colorScheme="teal" size="sm">
                <Thead>
                  <Tr>
                    <Th>{t('email')}</Th>
                    <Th>{t('userManagement.firstName')}</Th>
                    <Th>{t('userManagement.lastName')}</Th>
                    <Th>{t('registrationDate')}</Th>
                    <Th>{t('role')}</Th>
                    <Th>{t('userManagement.confirmation')}</Th>
                    <Th>{t('userManagement.verify')}</Th>
                    <Th>{t('userManagement.action')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {users.map((user, index) => (
                    <Tr key={index}>
                      <Td>{user.email}</Td>
                      <Td>{user.first_name}</Td>
                      <Td>{user.last_name}</Td>
                      <Td>{new Date(user.registration_date).toLocaleString()}</Td>
                      <Td>{mapRoleIdToRoleName(user.role_id_fk)}</Td>
                      <Td>{user.is_approved ? t('approved') : t('notApproved')}</Td>
                      <Td>
                        {user.role_id_fk !== 1 && user.role_id_fk !== 3 && user.is_approved && (
                          <Button
                            colorScheme="red"
                            size="sm"
                            onClick={() => handleUserRefuse(user.user_id)}
                          >
                            {t('userManagement.refuseAction')}
                          </Button>
                        )}
                        {user.role_id_fk !== 1 && user.role_id_fk !== 3 && !user.is_approved && (
                          <Button
                            colorScheme="teal"
                            size="sm"
                            onClick={() => handleUserAccept(user.user_id)}
                          >
                            {t('userManagement.acceptAction')}
                          </Button>
                        )}
                        
                      </Td>
                      <Td>
                      {user.role_id_fk !== 1 && (
                          <Button
                            colorScheme="red"
                            size="sm"
                            onClick={() => handleDeleteUser(user.user_id)}
                          >
                            {t('userManagement.deleteAction')}
                          </Button>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </>
        )}
      </VStack>
    </Container>
  );
  
};

export default UserList;
