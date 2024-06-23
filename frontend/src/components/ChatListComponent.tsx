import React, { useEffect, useState } from 'react';
import { Badge, Box, Button, Container, Flex, HStack, Heading, List, ListItem, Radio, RadioGroup, Select, Spinner, Stack, Text, Tooltip, VStack, useToast } from '@chakra-ui/react';
import { decodeToken, getChatList, deleteChat, getUserData } from '../utils/Api';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface UserDetails {
    first_name: string;
    last_name: string;
    email: string;
    }

const ChatList = ()  => {
    const [tokenData, setTokenData] = useState<{ email?: string; role?: number } | null>(null);
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const [userDetailsMap, setUserDetailsMap] = useState<{ [key: string]: UserDetails }>({});
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(2);
    const [filtration, setFiltration] = useState('none');
    const [auth, setAuth] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const fetchChats = async () => {
        try {
            const tokenResponse = await decodeToken();
            let role:number = tokenResponse.role_id_fk;
            if (![1,2].includes(role)) {
                navigate(-1);
                return;
            } else {
                setAuth(true);
                const tokenResponse = await decodeToken();
                setTokenData({
                    email: tokenResponse.email,
                    role: tokenResponse.role_id_fk,
                });
                const chatData: any = await getChatList(currentPage, pageSize, filtration);
                
                setChats(chatData.data.items);
                setTotalPages(chatData.data.pages);

                // Fetch user details for all users in the chats
                const userIds = chatData.data.items.flatMap((chat: { chat_users: any[]; }) => chat.chat_users.map(user => user.user_id));
                const userDetailsPromises = userIds.map((userId: any) => fetchUserDetails(userId));
                const userDetailsArray = await Promise.all(userDetailsPromises);

                // Store user details in a map
                const newUserDetailsMap = userDetailsArray.reduce((acc, details, index) => {
                    acc[userIds[index]] = details;
                    return acc;
                }, {});
                setUserDetailsMap(newUserDetailsMap);
            }
        } catch (error) {
            console.error('Error fetching chat list:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserDetails = async (user_id:any) => {
        try {
            const data = await getUserData(user_id);
            return data;
        } catch (error) {
            console.error('Error fetching user details:', error);
        }
    };

    useEffect(() => {
        fetchChats();
    }, [currentPage, pageSize, filtration]);

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage((prevPage) => prevPage + 1);
        }
    };
    
    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage((prevPage) => prevPage - 1);
        }
    };
    
    const handlePageSizeChange = (event: any) => {
        const newSize = parseInt(event.target.value, 10);
        setPageSize(newSize);
        setCurrentPage(1);
    };

    const handleChat = async (chatId: string)  => {
        navigate(`/chat/${chatId}`);
    }

    const handleDeleteChat = async (chatId: string) => {
        try {
            await deleteChat(chatId);
            toast({
                title: t('toastMessages.chatDeletedSuccessfully'),
                description: t('toastMessages.chatDeletedSuccessfullyText'),
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
            fetchChats();
        } catch (error) {
            console.error('Error deleting chat:', error);
        }
    };

    return (
        <Container maxW="container.lg" mt={8}>
        <VStack spacing={4} align="start">
        {auth && (
            <>
            <Heading as="h1" size="xl">
                {t('chatList')}
            </Heading>
            <Flex justify="space-between" w="100%">
            <Select value={pageSize} onChange={handlePageSizeChange}>
                <option value={2}>2 {t('chatManagement.chatsPerPages')}</option>
                <option value={5}>5 {t('chatManagement.chatsPerPages')}</option>
                <option value={10}>10 {t('chatManagement.chatsPerPages')}</option>
            </Select>

            <Flex>
                <Button
                colorScheme="teal"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                mr={2}
                >
                    {t('previousPage')}
                </Button>
                <Button
                colorScheme="teal"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                >
                    {t('nextPage')}
                </Button>
            </Flex>
            </Flex>

            <RadioGroup onChange={(value) => setFiltration(value)} value={filtration}>
                <Stack spacing={3} direction='row'>
                    <Radio value="none">{t('chatManagement.allChats')}</Radio>
                    <Radio value="teams">{t('chatManagement.teamChats')}</Radio>
                    <Radio value="techs">{t('chatManagement.technicalSupportChats')}</Radio>
                </Stack>
            </RadioGroup>

            {loading ? (
                <Spinner />
                ) : (
                <List spacing={3}>
                    {chats.map((chat: any, index) => (
                    <ListItem key={index}>
                        <Box boxShadow="md" p={4} borderRadius="md">
                            <Flex justify="space-between" width="100%">
                                <Heading as="h2" size="lg">
                                    {chat.name}
                                </Heading>
                                <Tooltip label={t('chatManagement.deleteChat')} placement="top">
                                    <Button
                                        marginLeft={2}
                                        colorScheme="red"
                                        mt={2}
                                        onClick={() => handleDeleteChat(chat.chat_id)}>
                                            {t('chatManagement.deleteChat')}
                                    </Button>
                                </Tooltip>
                            </Flex>
                            <Text>
                                {t('chatManagement.type')}: {chat.type}
                            </Text>
                            <Text>
                                {t('chatManagement.users')}:
                            </Text>
                            <VStack spacing={2} align="start">
                                {chat.chat_users.map((user: any, userIndex: number) => {
                                    const userDetails = userDetailsMap[user.user_id];
                                    return userDetails ? (
                                        <Text key={userIndex}>
                                            {userDetails.first_name} {userDetails.last_name}
                                        </Text>
                                    ) : (
                                        <Text key={userIndex}>{t('chatManagement.loadingUserDetails')}...</Text>
                                    );
                                })}
                            </VStack>
                            <Button
                                marginLeft={2}
                                mt={2}
                                colorScheme="purple"
                                size="sm"
                                onClick={() => handleChat(chat.chat_id)}>
                                {chat.type === 'technical support' ? t('chatManagement.technicalSupportChat') : t('teamChat')}
                            </Button>
                        </Box>
                    </ListItem>
                ))}
                </List>
                )}
            </>
            )}
        </VStack>
        </Container>
    );
};

export default ChatList;