import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, VStack, Text, Button, Spinner, Select, Flex, Input, useToast, FormControl, FormLabel, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, RadioGroup, Stack, Radio, Spacer, Box, FlexProps, useColorModeValue, Icon } from '@chakra-ui/react';
import { Select as SelectAdvanced } from "chakra-react-select";
import { useTranslation } from 'react-i18next';
import { FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import { decodeToken, getResumeList, deleteResume, addTeamMember, getOwnerTeams, resumeToPDF } from '../utils/Api';

const ResumeList = () => {
  const [tokenData, setTokenData] = useState<{ email?: string; role?: number } | null>(null);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(2);
  const [selectedExperienceLevel, setSelectedExperienceLevel] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedMinExperience, setSelectedMinExperience] = useState(0)
  const [selectedMaxExperience, setSelectedMaxExperience] = useState(10)
  const [selectedTeam, setSelectedTeam] = useState('');
  const toast = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const programmingLanguagesOptions = [
    { value: "Python", label: "Python"},
    { value: "Java", label: "Java"},
    { value: "C", label: "C"},
    { value: "C++", label: "C++"},
    { value: "C#", label: "C#"},
    { value: "SQL", label: "SQL"},
    { value: "PHP", label: "PHP"},
    { value: "R", label: "R"},
    { value: "Go", label: "Go"},
    { value: "Ruby", label: "Ruby"},
    { value: "Rust", label: "Rust"},
    { value: "Lua", label: "Lua"},
    { value: "COBOL", label: "COBOL"},
    { value: "Kotlin", label: "Kotlin"},
    { value: "Delphi", label: "Delphi"},
    { value: "Haskell", label: "Haskell"},
    { value: "Visual Basic .NET", label: "Visual Basic .NET"},
    { value: "Assembly language", label: "Assembly language"},
    { value: "Visual Basic", label: "Visual Basic"},
    { value: "Perl", label: "Perl"},
    { value: "Objective-C", label: "Objective-C"},
    { value: "Swift", label: "Swift"},
    { value: "Fortran", label: "Fortran"},
    { value: "Ada", label: "Ada"},
    { value: "Dart", label: "Dart"},
    { value: "Scala", label: "Scala"},
    { value: "PL/SQL", label: "PL/SQL"},
    { value: "Transact-SQL", label: "Transact-SQL"},
  ];
  programmingLanguagesOptions.sort((a, b) => a.label.localeCompare(b.label));

  interface PaginationButtonProps extends FlexProps {
    children: ReactNode;
    isActive?: boolean;
    isDisabled?: boolean;
    currentPage?: number;
    totalPages?: number;
  }
  
  const PaginationButton = ({ children, isDisabled, isActive, ...props }: PaginationButtonProps) => {
    const activeStyle = {
      bg: useColorModeValue('gray.300', 'gray.700')
    };
  
    return (
      <Flex
        p={3}
        px={4}
        fontSize="md"
        fontWeight="500"
        lineHeight={0.8}
        opacity={isDisabled ? 0.7 : undefined}
        _hover={!isDisabled ? activeStyle : undefined}
        cursor={isDisabled ? 'not-allowed' : 'pointer'}
        border="1px solid"
        mr="-1px"
        borderColor={useColorModeValue('gray.300', 'gray.700')}
        {...(isActive && activeStyle)}
        {...props}
      >
        {children}
      </Flex>
    );
  };

  const fetchResumes = async () => {
    try {
      const response: any = await getResumeList({ page: currentPage, size: pageSize, minExperience: selectedMinExperience, maxExperience: selectedMaxExperience, experienceLevel: selectedExperienceLevel, programming_language: selectedLanguages });
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
      setResumes(response.data.items);
      setTotalPages(response.data.pages);
      const tokenResponse = await decodeToken();
      setTokenData({
        email: tokenResponse.email,
        role: tokenResponse.role_id_fk,
      });
    } catch (error) {
      console.error('Error fetching resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    await fetchResumes();
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize, selectedMinExperience, selectedMaxExperience, selectedExperienceLevel, selectedLanguages]);  

  const handleDeleteResume = async (resumeId: string) => {
    try {
      await deleteResume(resumeId);
      fetchResumes();
    } catch (error) {
      console.error('Error deleting resume:', error);
    }
  };

  const handleConvertToPDF = async (user_id:string) => {
    try {
      const resumePDF = await resumeToPDF(user_id);
    } catch (error) {
      console.error('Error converting resume to pdf format:', error);
    }
  }

  const handleResumeUser = async (resume_id:string) => {
    try {
      navigate(`/resume/get-resume/${resume_id}`);
    } catch (error) {
      console.error('Error:', error);
    }
  }

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

  const handleLevelChange = (event: any) => {
    const newLevel = event.target.value;
    setSelectedExperienceLevel(newLevel);
  }

  const handleMinExperienceChange = (event: any) => {
    const newMinExperience = event;
    setSelectedMinExperience(newMinExperience);
    if (newMinExperience > selectedMaxExperience) {
      setSelectedMaxExperience(newMinExperience);
    }
  }

  const handleMaxExperienceChange = (event: any) => {
    const newMaxExperience = event;
    setSelectedMaxExperience(newMaxExperience);
  }

  const handleLanguageChange = (selectedOptions:any) => {
    const selectedValues = selectedOptions.map((option: { value: any; }) => option.value);
    setSelectedLanguages(selectedValues);
  };

  return (
    <Container maxW="container.lg" paddingX={0}>
      <VStack spacing={4} align="start">
        <Flex justify="space-between" w="100%">
          <Select value={pageSize} onChange={handlePageSizeChange}>
            <option value={2}>2 {t('resumeListPage.resumesPerPages')}</option>
            <option value={5}>5 {t('resumeListPage.resumesPerPages')}</option>
            <option value={10}>10 {t('resumeListPage.resumesPerPages')}</option>
          </Select>
            <FormControl>
              <NumberInput value={selectedMinExperience} onChange={handleMinExperienceChange} min={0} max={99} step={0.2} allowMouseWheel>
                <NumberInputField placeholder={t('resumeListPage.enterMinExperience')}/>
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
            <FormControl>
              <NumberInput value={selectedMaxExperience} onChange={handleMaxExperienceChange} min={selectedMinExperience} max={99} step={0.2} allowMouseWheel>
                <NumberInputField placeholder={t('resumeListPage.enterMaxExperience')}/>
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
            <Select value={selectedExperienceLevel} onChange={handleLevelChange}>
              <option value="Junior">Junior</option>
              <option value="Middle">Middle</option>
              <option value="Senior">Senior</option>
            </Select>
        </Flex>
        <SelectAdvanced
                  isMulti={true}
                  name="option-color-scheme"
                  isClearable={true}
                  isSearchable={true}
                  options={programmingLanguagesOptions}
                  placeholder={t('resumeListPage.selectProgrammingLanguage')}
                  onChange={handleLanguageChange}
                  isOptionDisabled={(option) => selectedLanguages.length >= 3}
                />

        {loading ? (
          <Spinner size="xl" />
        ) : (
          resumes.map((resume: any) => (
            <VStack key={resume.resume_id} borderWidth="1px" borderRadius="md" p={4} w="100%">
              <Text fontWeight="bold">{resume.title}</Text>
              <Text>{resume.text}</Text>
              <Button
                colorScheme="blue"
                size="sm"
                onClick={() => handleResumeUser(resume.resume_id)}
                mt={2}>
                  {t('resumeListPage.viewFullResume')}
              </Button>
              <Button
                colorScheme="purple"
                size="sm"
                onClick={() => handleConvertToPDF(resume.user_id_fk )}
                mt={2}>
                  {t('convertToPDF')}
              </Button>

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
          ))
        )}
        {!loading && resumes.length === 0 && <Flex
          justifyContent="center"
          alignItems="center">
          <Text fontSize="4xl">{t('resumeListPage.noResumesFound')}</Text>
        </Flex>}
      </VStack>
      <Flex
        as="nav"
        aria-label="Pagination"
        w="full"
        justifyContent="center"
        alignItems="center"
        mt={4}
        >
        <PaginationButton
            borderTopLeftRadius="md"
            borderBottomLeftRadius="md"
            onClick={handlePrevPage}
            isDisabled={currentPage === 1}
        >
          <Icon as={FaChevronLeft} w={3.5} h={3.5} />
        </PaginationButton>
        {Array.from({ length: totalPages }, (_, i) => (
            <PaginationButton key={i} isActive={currentPage === i + 1}>
              {i + 1}
            </PaginationButton>
          ))}
        <PaginationButton
            borderTopRightRadius="md"
            borderBottomRightRadius="md"
            onClick={handleNextPage}
            isDisabled={currentPage === totalPages}
        >
          <Icon as={FaChevronRight} w={3.5} h={3.5} />
        </PaginationButton>
        </Flex>
    </Container>
  );
};

export default ResumeList;
