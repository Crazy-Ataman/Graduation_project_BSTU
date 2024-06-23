import { Box, Heading, Text, VStack, Badge, Avatar, Container, List, ListItem, HStack, Button, Flex, useToast, Link } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconBrandGithub, IconBrandLinkedin, IconBrandTwitter, IconBrandFacebook } from '@tabler/icons-react';
import { decodeToken, getUserProfile, getUserResume, getUserTeamMembers, getUserMembershipTeams, getOwnerTeams, deleteTeam, checkChatTeamExisting } from '../utils/Api';

interface UserProfileData {
  first_name: string;
  last_name: string;
  email: string;
  registration_date: string;
  is_approved: boolean;
  socialMediaLinks?: SocialMediaLinks;
}

interface SocialMediaLinks {
  github: string;
  linkedin: string;
  twitter: string;
  facebook: string;
  user_id_fk: string;
}

interface UserResumeData {
  resume_id: string;
  title: string;
  text: string;
  user_id_fk: string;
  visibility: string;
  skills: Skill | null;
  programming_languages: ProgrammingLanguage[] | null;
  experiences: Experience[] | null;
  companies: Company[] | null;
}

interface Skill {
  skill_id: string;
  resume_id_fk: string;
  programming_languages: ProgrammingLanguage[] | null;
  resumes: null;
}

interface ProgrammingLanguage {
  programming_language_id: string;
  programming_language: string;
  skill_id_fk: string;
  experiences: Experience[] | null;
  skills: null;
}

interface Experience {
  experience_id: string;
  start_date: string | null;
  end_date: string | null;
  experience: number;
  level: string;
  programming_language_id_fk: string;
  companies: Company[] | null;
  programming_languages: null;
}

interface Company {
  company_id: string;
  name: string;
  experience_id_fk: string;
  experiences: null;
}

interface UserTeamMember {
  member_id: string;
  team_id_fk: string;
  user_id_fk: string;
  teams: null;
  users: null;
}

interface UserTeam {
  team_id: string;
  name: string;
  creation_date: string;
  owner_id_fk: string;
  team_members: null;
  users: null;
}

const UserProfile = () => {
  const [tokenData, setTokenData] = useState<{ email?: string; role?: number } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [userResume, setUserResume] = useState<UserResumeData | null>(null);
  const [userTeamMember, setUserTeamMember] = useState<UserTeamMember[] | null>(null);
  const [userTeam, setUserTeam] = useState<UserTeam[] | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();

  let tokenExisting: boolean = localStorage.getItem('access_token') ? true : false;

  const handleUpdateResume = () => {
    navigate('/resume');
  };

  const handleCreateResume = () => {
    navigate('/resume');
  };

  const handleUserList = () => {
    navigate('/user/list');
  };

  const handleResumeList = () => {
    navigate('/resume/list');
  }

  const handleTeamList = () => {
    navigate('/team/list');
  }

  const handleCreateTeam = () => {
    navigate('/team');
  }

  const handleUpdateTeam = (team: any) => {
    navigate('/team', { state: { team } });
  };

  const handleTeamChat = async (teamId: string)  => {
    const chatExisting:any = await checkChatTeamExisting(teamId);
    navigate(`/chat/${chatExisting.chat_id}`);
  }

  const handleDeleteTeam = async (team_id: string) => {
    try {
      await deleteTeam(team_id);
  
      const employerTeamsResponse:any = await getOwnerTeams();
      setUserTeam(employerTeamsResponse);
  
      toast({
        title: t('toastMessages.teamDeleted'),
        description: t('toastMessages.teamDeletedDescription'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting team:', error);
      toast({
        title: t('toastMessages.error'),
        description: t('toastMessages.errorDeletingTeam'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tokenResponse = await decodeToken();
        setTokenData({
          email: tokenResponse.email,
          role: tokenResponse.role_id_fk,
        });

        const userProfileResponse = await getUserProfile();
        console.log(userProfileResponse)
        const mergedUserProfile: UserProfileData = {
          ...userProfileResponse[0],
          socialMediaLinks: userProfileResponse[1],
        };
        console.log(mergedUserProfile)
        setUserProfile(mergedUserProfile);
        
        switch(tokenResponse.role_id_fk) {
          case 1:
            break;
          case 2:
            const employerTeamsResponse:any = await getOwnerTeams();
            setUserTeam(employerTeamsResponse);
            break;
          case 3: 
              const userResumeResponse = await getUserResume();
              if(userResumeResponse === null) {
                setUserResume(null);
              }
              else {
                const transformedData = {
                  ...userResumeResponse[0],
                  skills: userResumeResponse[1],
                  programming_languages: userResumeResponse[2],
                  experiences: userResumeResponse[3],
                  companies: userResumeResponse[4]
                };
                setUserResume(transformedData);
              }

              const userTeamMemberResponse = await getUserTeamMembers();
              setUserTeamMember(userTeamMemberResponse)

              const teamIds = userTeamMemberResponse.map((member:any) => member.team_id_fk);

              const teamDetailsPromises = teamIds.map(async (teamId: string) => {
                try {
                  const teamDetailsResponse = await getUserMembershipTeams(teamId);
                  return teamDetailsResponse;
                } catch (error) {
                  console.error(`Error fetching team details for team ID ${teamId}:`, error);
                  return null;
                }
              });

              Promise.all(teamDetailsPromises).then(data => setUserTeam(data));
              break;
        }
      } catch (error) {
        console.error('Error fetching user information:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();  
  }, [tokenExisting]);

  return (
    <Container maxW="container.lg">
      <HStack spacing={8} align="stretch">
        <VStack spacing={8} align="start">
          <Heading as="h1" size="xl">
            {t('profilePage.title')}
          </Heading>

          {loading ? (
            <Text>{t('profilePage.loading')}</Text>
          ) : (
            userProfile ? (
              <Box>
                <Avatar
                  size="xl"
                  name={`${userProfile.first_name} ${userProfile.last_name}`}
                />
                <Heading as="h2" size="lg" mt={4}>
                  {`${userProfile.first_name} ${userProfile.last_name}`}
                </Heading>
                <Text>{t('email')}: {userProfile.email}</Text>
                <Text>
                  {t('registrationDate')}:{' '}
                  {new Date(userProfile.registration_date).toLocaleString()}
                </Text>

                {userProfile.is_approved ? (
                  <Badge colorScheme="green" mt={2}>
                    {t('approved')}
                  </Badge>
                ) : (
                  <Badge colorScheme="red" mt={2}>
                    {t('notApproved')}
                  </Badge>
                )}
              </Box>
            ) : (
              <Text>{t('profilePage.errorFetchingProfile')}</Text>
            )
          )}
          {!!userProfile?.socialMediaLinks && (
            <VStack spacing={2} align="start" mt={4}>
                <Heading as="h3" size="md">{t('socialMediaLinks')}</Heading>
                  <HStack spacing={4}>
                    {!!userProfile.socialMediaLinks.github && (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Link href={userProfile.socialMediaLinks.github} isExternal>
                          <IconBrandGithub stroke={1.5} size={50}/>
                        </Link>
                      </div>
                    )}
                    {!!userProfile.socialMediaLinks.linkedin && (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Link href={userProfile.socialMediaLinks.linkedin} isExternal>
                          <IconBrandLinkedin stroke={1.5} size={50}/>
                        </Link>
                      </div>
                    )}
                    {!!userProfile.socialMediaLinks.twitter && (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Link href={userProfile.socialMediaLinks.twitter} isExternal>
                          <IconBrandTwitter stroke={1.5} size={50}/>
                        </Link>
                      </div>
                    )}
                    {!!userProfile.socialMediaLinks.facebook && (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Link href={userProfile.socialMediaLinks.facebook} isExternal>
                          <IconBrandFacebook stroke={1.5} size={50}/>
                        </Link>
                      </div>
                    )}
                  </HStack>
            </VStack>
            )}
            
        </VStack>

        
          <Box>
            <VStack spacing={4} align="start">
              {tokenData?.role === 1 ? (
                <>
                <Heading as="h2" size="lg">
                  {t('profilePage.userListHeading')}
                </Heading>
                <Button colorScheme="blue" mt={2} onClick={handleUserList}>
                  {t('profilePage.userList')}
                </Button>
                
                <Heading as="h2" size="lg">
                  {t('profilePage.resumeListHeading')}
                </Heading>
                <Button colorScheme="blue" mt={2} onClick={handleResumeList}>
                  {t('profilePage.resumeList')}
                </Button>

                <Heading as="h2" size="lg">
                  {t('profilePage.teamListHeading')}
                </Heading>
                <Button colorScheme="blue" mt={2} onClick={handleTeamList}>
                  {t('profilePage.teamList')}
                </Button>
              </>)
              : tokenData?.role === 2 ? (
              <>
                <Heading as="h2" size="lg">
                  {t('profilePage.yourTeams')}
                </Heading>
                {userTeam && userTeam.length > 0 ? (
                  <Flex justify="space-between" align="center" mt={2}>
                  <List spacing={3}>
                    {userTeam.map((team: any) => (
                      <ListItem key={team.team_id}>
                      <Flex justifyContent="space-between" alignItems="center" width="100%">
                        <Text>{team.name}</Text>
                        <Button
                          marginLeft={2}
                          colorScheme="purple"
                          onClick={() => handleTeamChat(team.team_id)}>
                          {t('teamChat')}
                        </Button>
                        <Button
                          colorScheme="orange"
                          marginLeft="2"
                          onClick={() => handleUpdateTeam(team)}
                        >
                          {t('profilePage.update')}
                        </Button>
                        <Button
                          colorScheme="red"
                          marginLeft="2"
                          onClick={() => handleDeleteTeam(team.team_id)}
                        >
                          {t('profilePage.delete')}
                        </Button>
                      </Flex>
                    </ListItem>
                    ))}
                  </List>
                </Flex>
                ) : (
                  <Text mt={2}>{t('profilePage.noTeams')}</Text>
                )}
                <Button colorScheme="teal" mt={2} onClick={handleCreateTeam}>
                  {t('profilePage.createNewTeam')}
                </Button>
                <Heading as="h2" size="lg">
                  {t('profilePage.teamListHeading')}
                </Heading>
                <Button colorScheme="blue" mt={2} onClick={handleTeamList}>
                  {t('profilePage.teamList')}
                </Button>
              </>
            ) : (
                <>
              <Heading as="h2" size="lg">
                {t('profilePage.yourResume')}
              </Heading>
              {userResume?.title ? (
                  <Flex align="center">
                    <Text>{userResume.title}</Text>
                    <Button colorScheme="teal" ml={4} onClick={handleUpdateResume}>
                      {t('profilePage.updateResume')}
                    </Button>
                  </Flex>
                  ) : (
                    <VStack spacing={4} align="start">
                      <Text>{t('profilePage.noResume')}</Text>
                      <Button colorScheme="teal" onClick={handleCreateResume}>
                        {t('profilePage.createResume')}
                      </Button>
                    </VStack>
                  )}

                <Box>
                
                  <Heading as="h2" size="lg">
                    {t('profilePage.teamsYouArePartOf')}
                  </Heading>
                  {userTeam && userTeam.length > 0 ? (
                    <List spacing={3} mt={2}>
                      {userTeam.map((team: any) => (
                        <ListItem key={team.team_id}>
                          <HStack>
                            <Text>{team.name}</Text>
                            <Button
                              marginLeft={2}
                              colorScheme="purple"
                              onClick={() => handleTeamChat(team.team_id)}>
                              {t('profilePage.teamChat')}
                            </Button>
                          </HStack>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Text mt={2}>{t('profilePage.notPartOfAnyTeam')}</Text>
                  )}
              </Box>
              </>
              )}
            </VStack>
            
          </Box>
      </HStack>
    </Container>
  );
};

export default UserProfile;
