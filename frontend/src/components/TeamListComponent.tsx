import React, { useState, useEffect, Fragment } from 'react';
import {
  Container,
  VStack,
  Heading,
  List,
  ListItem,
  Text,
  Button,
  Badge,
  Box,
  Flex,
  Select,
  Input,
  useToast,
  HStack,
  Tooltip,
  Spinner,
} from '@chakra-ui/react';
import { getTeamList, getUserData, deleteTeam, updateTeamMember, deleteTeamMember, decodeToken, checkChatTeamExisting } from '../utils/Api';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';


const TeamList = () => {
  const [tokenData, setTokenData] = useState<{ email?: string; role?: number } | null>(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(2);
  const toast = useToast();
  const [auth, setAuth] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const getOwnerInfo = async (user_id: string) => {
    try {
      const ownerData = getUserData(user_id);
      return ownerData;
    } catch (error) {
      console.error('Error fetching data for owner:', error);
    }
  }

  const renderOwnerInfo = (ownerInfo:any) => {
    if (!ownerInfo) {
      return <Text>{t('teamManagement.loadingOwnerInfo')}</Text>;
    }

    return (
      <Box>
        <Text>{t('teamManagement.owner')}: {ownerInfo.first_name} {ownerInfo.last_name} {ownerInfo.email}</Text>
      </Box>
    );
  };

  const fetchTeams = async () => {
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
        const response: any = await getTeamList(currentPage, pageSize);
        if (response === "Your account has not yet been approved by the administrator"){
          toast({
            title: t('toastMessages.waitConfirmation'),
            description: t('toastMessages.waitConfirmationText'),
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          return;
        }
        const teamsData = response.data.items;

        const teamsWithOwnerInfoPromises = teamsData.map(async (team: any) => {
          const ownerInfo = await getOwnerInfo(team.owner_id_fk);
          return { ...team, ownerInfo };
        });

        const teamsWithOwnerInfo: any = await Promise.all(teamsWithOwnerInfoPromises);

        setTeams(teamsWithOwnerInfo);
        setTotalPages(response.data.pages);
        console.log(teamsWithOwnerInfo);
      }
    } catch (error) {
      console.error('Error fetching team list:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [currentPage, pageSize]);

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

  const handleTeamChat = async (teamId: string)  => {
    const chatExisting:any = await checkChatTeamExisting(teamId);
    navigate(`/chat/${chatExisting.chat_id}`);
  }

  const handleDeleteTeam = async (teamId: string) => {
    try {
      await deleteTeam(teamId);
      toast({
        title: t('toastMessages.teamDeletedSuccessfully'),
        description: t('toastMessages.teamDeletedSuccessfullyText'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  const handleUpdateTeamMember = async (member_id: string, team_id_fk: string, user_id_fk: string, status: string) => {
    try {
      const newStatus = status === "pending" ? "hired" : "pending";
      await updateTeamMember({ member_id: member_id, team_id_fk: team_id_fk, user_id_fk: user_id_fk, status: newStatus });
      toast({
        title: t('toastMessages.teamMemberUpdatedSuccessfully'),
        description: t('toastMessages.teamMemberUpdatedSuccessfullyText'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchTeams();
    } catch (error) {
      console.error('Error updating team member:', error);
    }
  }

  const handleDeleteTeamMember = async (member_id: string, team_id_fk: string) => {
    try {
      await deleteTeamMember({ member_id: member_id, team_id_fk: team_id_fk });
      toast({
        title: t('toastMessages.teamMemberDeletedSuccessfully'),
        description: t('toastMessages.teamMemberDeletedSuccessfullyText'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchTeams();
    } catch (error) {
      console.error('Error deleting team member:', error);
    }
  };

  return (
    <Container maxW="container.lg" mt={8}>
      <VStack spacing={4} align="start">
      {auth && (
          <>
        <Heading as="h1" size="xl">
          {t('teamList')}
        </Heading>
        <Flex justify="space-between" w="100%">
          <Select value={pageSize} onChange={handlePageSizeChange}>
            <option value={2}>2 {t('teamManagement.teamsPerPages')}</option>
            <option value={5}>5 {t('teamManagement.teamsPerPages')}</option>
            <option value={10}>10 {t('teamManagement.teamsPerPages')}</option>
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

        {loading ? (
              <Spinner />
            ) : (
              <List spacing={3}>
                {teams.map((team: any, index) => (
                  <ListItem key={index}>
                    <Box boxShadow="md" p={4} borderRadius="md">
                      <Flex justify="space-between" width="100%">
                        <Heading as="h2" size="lg">
                          {team.name}
                        </Heading>
                        <Tooltip label="Delete Team" placement="top">
                          <Button
                            marginLeft={2}
                            colorScheme="red"
                            mt={2}
                            onClick={() => handleDeleteTeam(team.team_id)}>
                              {t('teamManagement.deleteTeam')}
                          </Button>
                        </Tooltip>
                      </Flex>
                      <Text>
                        {t('teamManagement.creationDate')}: {new Date(team.creation_date).toLocaleString()}
                      </Text>
                      {renderOwnerInfo(team.ownerInfo)}

                      <Badge colorScheme="teal" mt={2}>
                        {t('teamManagement.members')}: {team.team_members.length}
                      </Badge>
                      <Button
                        marginLeft={2}
                        mt={2}
                        colorScheme="purple"
                        size="sm"
                        onClick={() => handleTeamChat(team.team_id)}>
                          {t('teamChat')}
                      </Button>
                      <VStack spacing={2} align="start" mt={2}>
                        <Text fontWeight="bold">{t('teamManagement.teamMembers')}:</Text>
                        {team.users.map((member: any, memberIndex: any) => (
                          <Flex key={memberIndex} justify="space-between" width="100%">
                            <Text>
                              {member.first_name} {member.last_name} {member.email}
                            </Text>
                            <HStack>
                              {team.team_members.map((teamMember: any, memberIndex2: any) => (
                                <React.Fragment key={memberIndex2}>
                                  {member.user_id === teamMember.user_id_fk && (
                                    <>                                      
                                      <Badge colorScheme={teamMember.status === 'pending' ? 'blue' : 'teal'} mt={2} marginLeft={2}>
                                        {teamMember.status}
                                      </Badge>
                                      <Tooltip label={t('teamManagement.updateStatus')} placement="top">
                                        <Button
                                          marginLeft={2}
                                          colorScheme="orange"
                                          size="sm"
                                          onClick={() => handleUpdateTeamMember(teamMember.member_id, teamMember.team_id_fk, teamMember.user_id_fk, teamMember.status)}>
                                            {t('teamManagement.updateStatus')}
                                        </Button>
                                      </Tooltip>
                                      <Tooltip label={t('remove')} placement="top">
                                        <Button
                                          marginLeft={2}
                                          colorScheme="red"
                                          size="sm"
                                          onClick={() => handleDeleteTeamMember(teamMember.member_id, teamMember.team_id_fk)}>
                                            {t('remove')}
                                        </Button>
                                      </Tooltip>
                                    </>
                                    
                                  )}
                                </React.Fragment>
                                
                              ))}
                            </HStack>
                          </Flex>
                        ))}
                      </VStack>
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

export default TeamList;
