import React, { useState, useEffect, useRef } from "react";
import { Box, Input, Button, VStack, Text, useColorModeValue, Flex, Center, Divider } from "@chakra-ui/react";
import { decodeToken, connectToChat, createChat, getUserId, checkChatExisting } from '../utils/Api';
import { useParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';

interface Connection {
    message: string;
    chat_id: string;
    user_role: string;
    user_id: string;
    chat_name: string;
}

const ChatComponent = () => {
    const [tokenData, setTokenData] = useState<{ email?: string; role?: number } | null>(null);
    const [userId, setUserId] = useState('');
    const [chatTechSupp, setChatTechSupp] = useState(false);
    const [connection, setConnection] = useState<Connection | null>(null);
    const [chatNotFound, setChatNotFound] = useState(false);
    const { chatId } = useParams();
    const [messages, setMessages] = useState<string[]>([]);
    const [input, setInput] = useState("");
    const { t } = useTranslation();
    const ws:any = useRef(null);
    const count = useRef(0);

    const bgColor = useColorModeValue("gray.100", "gray.700");
    const messageBgColorCompanion = useColorModeValue("gray.200", "gray.600");
    const messageBgColorYou = useColorModeValue("blue.100", "blue.700");

    const fetchTokenData = async () => {
        try {
            const tokenResponse = await decodeToken();
            setTokenData({
                email: tokenResponse.email,
                role: tokenResponse.role_id_fk,
            });
        }
        catch (error) {
            console.error('Error fetching token information:', error);
        }
    };

    const checkConnection = async () => {
        try {
            if (chatId === undefined || chatId === "tech"){
                let chatTech:any;
                const tokenResponse = await decodeToken();
                const {user_id: user_id} = await getUserId(tokenResponse.email);
                const chatExisting:any = await checkChatExisting(user_id);
                console.log(chatExisting)
                console.log(chatExisting.chat_users?.length === 0)
                if (chatExisting === "Chat not found" || chatExisting.chat_users?.length === 0) {
                    chatTech = await createChat({"name": "Technical support", "type": "technical support"});
                    console.log(chatTech);
                }
                setUserId(user_id);
                setChatTechSupp(true);

                ws.current = new WebSocket(`ws://localhost:7676/chat/ws/${chatTech === undefined ? chatExisting.chat_id : chatTech.data.chat.chat_id}/${user_id}`);
                    console.log(ws);
                
                ws.current.onmessage = (event:any) => {
                    setMessages((prevMessages) => [...prevMessages, event.data]);
                };
            }
            else 
            {
                const connect:any = await connectToChat(chatId);
                if(connect === "Chat not found"){
                    setChatNotFound(true);
                    return;
                }
                else 
                {
                    setUserId(connect.user_id);
                    setConnection(connect);
                    
                    ws.current = new WebSocket(`ws://localhost:7676/chat/ws/${chatId}/${connect.user_id}`);
                        console.log(ws);
                    
                    ws.current.onmessage = (event:any) => {
                        setMessages((prevMessages) => [...prevMessages, event.data]);
                    };
                }
            }
        } catch (error) {
            console.error('Error fetching token information:', error);
        }
    };

    useEffect(() => {
        // TODO: remove if condition, but save inside code when everything is done!!!
        if (count.current !== 0) {
            fetchTokenData();
            checkConnection();
        }
        count.current++;
    }, []);

    const sendMessage = () => {
        if (input.trim()) {
            ws.current.send(input);
            setMessages((prevMessages) => [...prevMessages, `You: ${input}`]);
            setInput("");
        }
    };

    return (
        <Center>
            <Box p={4} bg={bgColor} maxW="100%" w="75vw">
                {chatNotFound ? (
                    <Text fontSize="4xl" align="center">{t('chatPage.chatNotFound')}</Text>
                ) : (
                    <VStack spacing={4} align="stretch">
                        <Text fontSize="4xl" align="center">{chatTechSupp ? t('chatPage.technicalSupport') : connection?.chat_name}</Text>
                        <Divider borderBottomWidth="2px" borderColor="gray.400" w="100%"/>
                        {messages.map((message, index) => (
                            <Box key={index} overflowY="auto" maxH="80vh" borderRadius="md" alignSelf={message.startsWith("You:") ? "flex-end" : "flex-start"}>
                                <Text
                                    key={index}
                                    p={2}
                                    bg={message.startsWith("You:") ? messageBgColorYou : messageBgColorCompanion}
                                    borderRadius="md"
                                    my={1}
                                    border="1px solid"
                                    borderColor={message.startsWith("You:") ? "blue.500" : "gray.500"}
                                    alignSelf={message.startsWith("You:") ? "flex-end" : "flex-start"}
                                    textAlign={message.startsWith("You:") ? "right" : "left"}
                                >
                                    {message}
                                </Text>
                            </Box>
                        ))}
                        <Divider borderBottomWidth="2px" borderColor="gray.400" w="100%"/>
                        <Flex alignSelf="flex-end" w="55%">
                            <Input
                                placeholder={t('chatPage.placeholderMessage')}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                maxW="100%"
                                border="2px solid"
                                borderColor="gray.400"
                                borderRadius="md"
                                mr={2}/>
                            <Button colorScheme="blue" onClick={sendMessage}>{t('chatPage.send')}</Button>
                        </Flex>
                    </VStack>
                )}
            </Box>
        </Center>
    );
};

export default ChatComponent;