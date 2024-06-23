import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heading, VStack, HStack, Text, Badge, Box, useColorModeValue, Container, Button, Select, useToast, Link } from "@chakra-ui/react";
import { addTeamMember, decodeToken, deleteResume, getOwnerTeams, getUserResumeByResumeId, resumeToPDF, getUserData } from '../utils/Api'
import { IconBrandFacebook, IconBrandGithub, IconBrandLinkedin, IconBrandTwitter } from '@tabler/icons-react';

const ResumeUser = ()  => {
    const [tokenData, setTokenData] = useState<{ email?: string; role?: number } | null>(null);
    const [resume, setResume] = useState<any>();
    const [userData, setUserData] = useState<any>();
    const [isLoading, setIsLoading] = useState(true);
    const { resumeId } = useParams();
    const [selectedTeam, setSelectedTeam] = useState('');
    const [teamOptions, setTeamOptions] = useState([]);
    const toast = useToast();
    const { t } = useTranslation();

    const fetchResume = async () => {
        setIsLoading(true);
        const response: any = await getUserResumeByResumeId(resumeId);
        if (response === "Resume not found or hidden") {
            setResume(null);
        } else {
            setResume(response.data);
            setUserData(await getUserData(response.data.user_id_fk));
            const test:any = await getUserData(response.data.user_id_fk)
        }
        const tokenResponse = await decodeToken();
        setTokenData({
            email: tokenResponse.email,
            role: tokenResponse.role_id_fk,
        });
        setIsLoading(false);
    };

    const fetchTeamOptions = async () => {
        try {
            const tokenResponse = await decodeToken();
            if (tokenResponse.role_id_fk === 2) {
                const response = await getOwnerTeams();
                setTeamOptions(response);
            }
        } catch (error) {
            console.error('Error fetching teams:', error);
        }
    };

    const fetchData = async () => {
        await fetchResume();
        await fetchTeamOptions();
    };

    useEffect(() => {
        fetchData();
    }, [resumeId]);

    const handleConvertToPDF = async (user_id:string) => {
        try {
            const resumePDF = await resumeToPDF(user_id);
        } catch (error) {
            console.error('Error converting resume to pdf format:', error);
        }
    }

    const handleAddTeamMember = async (team_id_fk: string, user_id_fk: string) => {
        try {
            if (!selectedTeam) {
            toast({
                title: t('toastMessages.teamNotSelected'),
                description: t('toastMessages.selectTeam'),
                status: 'warning',
                duration: 5000,
                isClosable: true,
                });
            return;
            }
            const result = await addTeamMember({ team_id_fk: selectedTeam, user_id_fk: user_id_fk, status: "pending" });
            if (result === 'The user is already a member of the team'){
                toast({
                title: t('toastMessages.conflict'),
                description: t('toastMessages.userAlreadyInTeam'),
                status: 'error',
                duration: 5000,
                isClosable: true,
                });
            return;
            } else if (result === "Your account has not yet been approved by the administrator"){
            toast({
                title: t('toastMessages.waitConfirmation'),
                description: t('toastMessages.waitConfirmationText'),
                status: 'warning',
                duration: 5000,
                isClosable: true,
            });
            return;
            } else {
            toast({
                title: t('toastMessages.teamMemberAddedSuccessfully'),
                description: t('toastMessages.teamMemberAddedSuccessfullyText'),
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
            }
            fetchResume();
        } catch (error) {
            console.error('Error adding team member:', error);
        }
    };

    const handleDeleteResume = async (resumeId: string) => {
        try {
            await deleteResume(resumeId);
            fetchResume();
        } catch (error) {
            console.error('Error deleting resume:', error);
        }
    };

    if (isLoading) {
        return <Text>{t('loading')}</Text>;
    }

    if (!resume) {
        return <Text fontSize="4xl" align="center">{t('resumeUserPage.resumeNotFoundOrHidden')}</Text>;
    }

    return (
        <Container key={resume.resume_id} maxW="container.md" p={8} boxShadow="md" borderRadius="md" borderWidth="1px">
            <Heading as="h1" size="lg" mb={4} textAlign="center">
                {resume.title}
            </Heading>
            <Text>{resume.text}</Text>
            <Heading as="h2" size="md" mt={6} mb={4}>
                {t('resumeUserPage.skills')}
            </Heading>
            <VStack align="start" spacing={4}>
                {resume.skills.map((skill:any) => (
                <VStack key={skill.skill_id} align="start" spacing={2}>
                    <Heading as="h3" size="md">
                    {skill.programming_languages
                        .map((lang:any) => lang.programming_language)
                        .join(', ')}
                    </Heading>
                    {skill.programming_languages.map((lang:any) => (
                    <Box key={lang.programming_language_id} borderLeft="4px solid" borderColor="blue.500" pl={4}>
                        <Text fontWeight="bold" mb={2}>{lang.programming_language}</Text>
                        {lang.experiences.map((experience: any) => {
                            // Check if start_date and end_date are not null
                            const startDate = experience.start_date ? new Date(experience.start_date) : null;
                            const endDate = experience.end_date ? new Date(experience.end_date) : null;

                            // Format dates only if they are not null
                            const formattedStartDate = startDate ? `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}` : 'N/A';
                            const formattedEndDate = endDate ? `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}` : 'N/A';

                            // Check if companies array is not empty and the first company has a non-empty name
                            const hasValidCompany = experience.companies.length > 0 && experience.companies[0].name.trim() !== "";

                            return (
                                <Box key={experience.experience_id} ml={4}>
                                    {hasValidCompany ? (
                                        <Text fontSize="lg">
                                            {experience.experience} {t('resumeUserPage.experienceYearsIn')} {experience.companies[0].name} ({formattedStartDate} - {formattedEndDate})
                                        </Text>
                                    ) : (
                                        <Text fontSize="lg">
                                            {t('resumeUserPage.noExperience')}
                                        </Text>
                                    )}
                                    <Badge colorScheme="green" mt={1} fontSize="md">{experience.level}</Badge>
                                </Box>
                            );
                        })}
                    </Box>
                    ))}
                </VStack>
                ))}
                {!!userData.social_media_links && (
                    <VStack spacing={2} align="start" mt={4}>
                        <Heading as="h3" size="md">{t('socialMediaLinks')}</Heading>
                            <HStack spacing={4}>
                                {!!userData.social_media_links[0].github && (
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <Link href={userData.social_media_links[0].github} isExternal>
                                    <IconBrandGithub stroke={1.5} size={50}/>
                                    </Link>
                                </div>
                                )}
                                {!!userData.social_media_links[0].linkedin && (
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <Link href={userData.social_media_links[0].linkedin} isExternal>
                                    <IconBrandLinkedin stroke={1.5} size={50}/>
                                    </Link>
                                </div>
                                )}
                                {!!userData.social_media_links[0].twitter && (
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <Link href={userData.social_media_links[0].twitter} isExternal>
                                    <IconBrandTwitter stroke={1.5} size={50}/>
                                    </Link>
                                </div>
                                )}
                                {!!userData.social_media_links[0].facebook && (
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <Link href={userData.social_media_links[0].facebook} isExternal>
                                    <IconBrandFacebook stroke={1.5} size={50}/>
                                    </Link>
                                </div>
                                )}
                            </HStack>
                    </VStack>
                )}
                <Button
                colorScheme="purple"
                size="sm"
                onClick={() => handleConvertToPDF(resume.user_id_fk )}
                mt={2}>
                    {t('convertToPDF')}
                </Button>
                {tokenData?.role === 2 && (
                    <>
                        <Select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
                        <option value="" disabled>
                            {t('resumeUserPage.selectTeam')}
                        </option>
                        {teamOptions.map((team:any) => (
                            <option key={team.team_id} value={team.team_id}>
                            {team.name}
                            </option>
                        ))}
                    </Select>
                    <Button
                        colorScheme="green"
                        size="sm"
                        onClick={() => handleAddTeamMember(selectedTeam, resume.user_id_fk )}
                        mt={2}>
                            {t('resumeUserPage.addToTeam')}
                    </Button>
                    </>
                    )}

                    {tokenData?.role === 1 && (
                        <Button
                        colorScheme="red"
                        size="sm"
                        onClick={() => handleDeleteResume(resume.resume_id)}
                        >
                            {t('deleteResume')}
                        </Button>
                    )}
            </VStack>
            

        </Container>
        
    );
}

export default ResumeUser;