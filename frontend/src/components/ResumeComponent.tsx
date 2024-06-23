import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Badge,
  VStack,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Container,
  useToast,
  Tooltip,
  HStack,
  Flex,
  Divider,
  Center,
  Code,
  RadioGroup,
  Stack,
  Radio,
} from '@chakra-ui/react';
import { Select } from "chakra-react-select";
import { SingleDatepicker } from "chakra-dayzed-datepicker";
import useMementoState from '@utilityjs/use-memento-state';
import { createResume, getUserResume, updateResume, paraphraseLLM, decodeToken, getUserId, resumeToPDF } from '../utils/Api';
import { useTranslation } from 'react-i18next';

const ResumeForm = ()  => {
  const [resumeData, setResumeData] = useState({
    title: '',
    text: ''
  });
  const [hasExistingResume, setHasExistingResume] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const { t } = useTranslation();

  const {
    state: paraphrasedVariant_1,
    setState: setParaphrasedVariant_1,
    pastStates: pastState_1,
    futureStates: futureState_1,
    undo: undo_1,
    redo: redo_1,
    reset: reset_1,
    hasPastState: hasPastState_1,
    hasFutureState: hasFutureState_1
  } = useMementoState('');

  const {
    state: paraphrasedVariant_2,
    setState: setParaphrasedVariant_2,
    pastStates: pastState_2,
    futureStates: futureState_2,
    undo: undo_2,
    redo: redo_2,
    reset: reset_2,
    hasPastState: hasPastState_2,
    hasFutureState: hasFutureState_2
  } = useMementoState('');

  const {
    state: paraphrasedVariant_3,
    setState: setParaphrasedVariant_3,
    pastStates: pastState_3,
    futureStates: futureState_3,
    undo: undo_3,
    redo: redo_3,
    reset: reset_3,
    hasPastState: hasPastState_3,
    hasFutureState: hasFutureState_3
  } = useMementoState('');


  const [loadingParaphrase, setLoadingParaphrase] = useState(false);
  const [loadingStates, setLoadingStates] = useState([false, false, false]);
  const toast = useToast();
  const [auth, setAuth] = useState(false);
  const [visibility, setVisible] = useState('visible');

  const [programmingLanguages, setProgrammingLanguages] = useState(
    [{ language: '', experience: { level: 'Junior', hasExperience: true, isSelectDisabled: false, startDate: new Date(), endDate: new Date(), companyName: '' } }]
  );

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

  const levelOptions = [
    { value: "Junior", label: "Junior"},
    { value: "Middle", label: "Middle"},
    { value: "Senior", label: "Senior"},
  ];

  const handleInputChange = (e: any) => {
    const { id, value } = e.target;
    setResumeData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const isFieldValid = (field: string, fieldName: string, minFieldLength: number, maxFieldLength: number) => {
    if (!field || field.length < minFieldLength || field.length > maxFieldLength) {
      if(fieldName === 'language' )
      {
        toast({
          title: t('toastMessages.creationResumeFailed'),
          description: t('toastMessages.selectProgrammingLanguage'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return false;
      }
      if(fieldName === 'level' )
      {
        toast({
          title: t('toastMessages.creationResumeFailed'),
          description: t('toastMessages.selectLevel'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return false;
      }
      toast({
        title: t('toastMessages.creationResumeFailed'),
        description: t('toastMessages.fieldError', { fieldName: fieldName, minFieldLength: minFieldLength, maxFieldLength: maxFieldLength }),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
    return true;
  };

  const handleCreationResume = async () => {
    try {
      const { title, text } = resumeData;

      if (!title.trim() || !text.trim()) {
        toast({
          title: t('toastMessages.creationOrUpdatingResumeFailed'),
          description: t('toastMessages.dataInvalid'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      if (
        !isFieldValid(title, 'title', 5, 250) ||
        !isFieldValid(text, 'text', 20, 999)
      ) {
        return;
      }

      let invalidData = false;
      programmingLanguages.map(lang => {
        if (!lang.experience.hasExperience) {
          if (
            !isFieldValid(lang.language, 'language', 1, 500) ||
            !isFieldValid(lang.experience.level, 'level', 1, 500)) {
            invalidData = true;
            return;
          }
        }
        else {
          if (
            !isFieldValid(lang.experience.companyName, 'company\'s name', 3, 999) ||
            !isFieldValid(lang.language, 'language', 1, 500) ||
            !isFieldValid(lang.experience.level, 'level', 1, 500)) {
            invalidData = true;
            return;
          }
        }
      })

      if(invalidData) {
        return;
      }

      const userHasResume = await getUserResume();

      const resume = {
        resume_data: {
          title: title,
          text: text,
          visibility: visibility,
        },
        programming_languages_data: programmingLanguages.map(lang => ({
          programming_language: lang.language,
        })),
        experiences_data: programmingLanguages.map(exp => {
          if (exp.experience.hasExperience) {
            return {
              level: exp.experience.level,
              start_date: exp.experience.startDate,
              end_date: exp.experience.endDate,
            };
          } else {
            return {
              level: exp.experience.level,
            };
          }
        }),
        companies_data: programmingLanguages.map(comp => {
          if (comp.experience.hasExperience) {
            return {name: comp.experience.companyName}
          }
          else {
            return {name: ''}
          }
        }),
      };

      if (userHasResume) {
        const result = await updateResume(resume);

        toast({
          title: t('toastMessages.updateResumeSuccessfully'),
          description: t('toastMessages.resumeUpdated'),
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {

        const result = await createResume(resume);
        console.log(result);

        if (result === 'Resume has already been created') {
          toast({
            title: t('toastMessages.creationResumeFailed'),
            description: t('toastMessages.resumeAlreadyCreated'),
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        } else {
          toast({
            title: t('toastMessages.creationResumeSuccessfully'),
            description: t('toastMessages.resumeCreated'),
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
          setHasExistingResume(true);
        }
      }
    }
    catch(error:any) {
      console.error('Error creating resume:', error)
    }
  };

  const handleTextHighlight = () => {
    const textArea:any = document.getElementById("text");
    textArea.focus();
    const selectedText = textArea.value.substring(
      textArea.selectionStart,
      textArea.selectionEnd
    );
    setSelectedText(selectedText);
  };

  const handleParaphrase = async () => {
    try {
      if (!selectedText.trim()) {
        toast({
          title: t('toastMessages.paraphraseFailed'),
          description: t('toastMessages.selectedTextIsEmpty'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      setLoadingParaphrase(true);
      const { response: paraphrasedResults } = await paraphraseLLM(selectedText);
      // Reset all data
      reset_1();
      reset_2();
      reset_3();

      setParaphrasedVariant_1(paraphrasedResults[0]);
      setParaphrasedVariant_2(paraphrasedResults[1]);
      setParaphrasedVariant_3(paraphrasedResults[2]);
    } catch (error) {
      console.error('Error paraphrasing text:', error);
    } finally {
      setLoadingParaphrase(false);
    }
  };

  const regenerateParaphraseVariant = async(index:any, text: string) => {
    try {
      setLoadingStates(prevStates => {
        const newStates = [...prevStates];
        newStates[index] = true;
        return newStates;
      });
      console.log(text);
      const { response: paraphrasedResults } = await paraphraseLLM(
        text,
        "creative",
        1,
        1
      );

    if (index === 0) setParaphrasedVariant_1(paraphrasedResults[0]);
    if (index === 1) setParaphrasedVariant_2(paraphrasedResults[0]);
    if (index === 2) setParaphrasedVariant_3(paraphrasedResults[0]);

    } catch (error) {
      console.error('Error paraphrasing text:', error);
    } finally {
      setLoadingStates(prevStates => {
        const newStates = [...prevStates];
        newStates[index] = false;
        return newStates;
      });
    }
  }

  const addLanguage = () => {
    if (programmingLanguages.length < 3) {
      setProgrammingLanguages([...programmingLanguages, { language: '', experience: { level: 'Junior', hasExperience: true, isSelectDisabled: false, startDate: new Date(), endDate: new Date(), companyName: '' } }]);
    } else {
      console.log("You cannot add more than three languages.");
    }
  };
  
  const updateLanguage = (index: string | number, field: string, value: any) => {
    const updatedLanguages:any = [...programmingLanguages];
    if (field === 'language') {
      if(value == null){
        updatedLanguages[index].language = '';
      }
      else {
        updatedLanguages[index].language = value.value;
      }
    } else {
      if (field === 'level'){
        updatedLanguages[index].experience[field] = value.value;
      }
      else { 
        if (field === 'hasExperience') {
          if (!value) {
            updatedLanguages[index].experience[field] = value;
            updatedLanguages[index].experience.level= 'Junior';
            updatedLanguages[index].experience.isSelectDisabled = true;
          } else {
            updatedLanguages[index].experience.isSelectDisabled = false;
          }
        }
        updatedLanguages[index].experience[field] = value;
      }
    }
    setProgrammingLanguages(updatedLanguages);
  };
  
  const removeLanguage = (index:number) => {
    if (programmingLanguages.length > 1) {
      const updatedLanguages = programmingLanguages.filter((_, i) => i !== index);
      setProgrammingLanguages(updatedLanguages);
    } else {
      console.log("You cannot remove the last language.");
    }
  };

  const handleConvertToPDF = async () => {
    try {
      const tokenResponse = await decodeToken();
      const {user_id: user_id} = await getUserId(tokenResponse.email);
      const resumePDF = await resumeToPDF(user_id);
      if(resumePDF === "Resume for convert to pdf not found") {
        toast({
          title: t('toastMessages.createPDFFailed'),
          description: t('toastMessages.createResumeFirst'),
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error converting resume to pdf format:', error);
    }
  }

  useEffect(() => {
    const fetchUserResume = async () => {
      try {
        const tokenResponse = await decodeToken();
        let role:number = tokenResponse.role_id_fk;
        if (![3].includes(role)) {
          window.location.href = '/';
          return;
        } else {
          setAuth(true);
          const userResumeData = await getUserResume();
          if (userResumeData) {
            setResumeData({title:userResumeData[0].title, text:userResumeData[0].text});
            setVisible(userResumeData[0].visibility);
            
            const programmingLanguagesData = userResumeData[2]
            const experiencesData = userResumeData[3];
            const companiesData = userResumeData[4];

            const programmingLanguages = programmingLanguagesData.map((language: { programming_language_id: any; programming_language: any; }) => {
              const experience = experiencesData.find((exp: { programming_language_id_fk: any; }) => exp.programming_language_id_fk === language.programming_language_id);
              const companyData = companiesData.find((comp?: { experience_id_fk: any; }) => comp?.experience_id_fk === experience.experience_id);
              const companyName = companyData ? companyData.name : '';
  
              return {
                language: language.programming_language,
                experience: {
                  level: experience.level,
                  hasExperience: experience.start_date === null ? false : true,
                  startDate: experience.start_date ? new Date(experience.start_date) : new Date(),
                  endDate: experience.end_date ? new Date(experience.end_date) : new Date(),
                  companyName: companyName
                }
              };
            });
            setProgrammingLanguages(programmingLanguages);
            setHasExistingResume(true);
          }
        }
      } catch (error) {
        console.error('Error fetching user resume:', error);
      }
    };

    fetchUserResume();
  }, [hasExistingResume]);


  return (
    
    <Container maxW="container.lg" paddingX={0}>
      <Center>
        <Heading as="h2" size="lg" mb={4}>
          {hasExistingResume ? t('resumePageCreator.updateResume') : t('resumePageCreator.createResume')}
        </Heading>
      </Center>
      <Flex direction="row" h="100vh">
        <Box w="50%" flex="1" overflowY="auto">
          <VStack align="start">
            <FormControl isRequired p={4}>
              <FormLabel>{t('resumePageCreator.title')}</FormLabel>
              <Input
                type="text"
                id="title"
                value={resumeData.title}
                onChange={handleInputChange}
                placeholder={t('resumePageCreator.softwareEngineer')}
              />
            </FormControl>
    
            <FormControl isRequired p={4}>
              <FormLabel>{t('resumePageCreator.text')}</FormLabel>
              <Textarea
                id="text"
                value={resumeData.text}
                onChange={handleInputChange}
                placeholder={t('resumePageCreator.softwareEngineerText')}
                onMouseUp={handleTextHighlight}
                spellCheck={false}
              />
            </FormControl>

            <Box mt={4}>
              <Heading as="h3" size="md" mt={4}>
                {t('resumePageCreator.selectedText')}: {selectedText}
              </Heading>
              <Tooltip label="Select text to paraphrase before clicking" placement="right">
                <Button colorScheme="teal" mt={2} onClick={handleParaphrase} isLoading={loadingParaphrase}>
                  {t('resumePageCreator.paraphraseSelectedText')}
                </Button>
              </Tooltip>
              <Heading as="h3" size="md" mt={4}>
                {t('resumePageCreator.paraphrasedVariants')}:
              </Heading>
              {paraphrasedVariant_1 && paraphrasedVariant_2 && paraphrasedVariant_3 && (
              <>
              <VStack align="start" spacing={2}>
              <div>
                  <Text>{paraphrasedVariant_1}</Text>
                  <Button onClick={() => regenerateParaphraseVariant(0, paraphrasedVariant_1)} isLoading={loadingStates[0]} mt={2} ml={4}>{t('resumePageCreator.regenerate')}</Button>
                  <Button onClick={undo_1} isDisabled={pastState_1.length === 1} mt={0.5} ml={4}>{t('resumePageCreator.back')}</Button>
                  <Button onClick={redo_1} isDisabled={!hasFutureState_1()} mt={0.5} ml={4}>{t('resumePageCreator.forward')}</Button>
              </div>
              <div>
                  <Text>{paraphrasedVariant_2}</Text>
                  <Button onClick={() => regenerateParaphraseVariant(1, paraphrasedVariant_2)} isLoading={loadingStates[1]} mt={2} ml={4}>{t('resumePageCreator.regenerate')}</Button>
                  <Button onClick={undo_2} isDisabled={pastState_2.length === 1} mt={0.5} ml={4}>{t('resumePageCreator.back')}</Button>
                  <Button onClick={redo_2} isDisabled={!hasFutureState_2()} mt={0.5} ml={4}>{t('resumePageCreator.forward')}</Button>
              </div>
              <div>
                  <Text>{paraphrasedVariant_3}</Text>
                  <Button onClick={() => regenerateParaphraseVariant(2, paraphrasedVariant_3)} isLoading={loadingStates[2]} mt={2} ml={4}>{t('resumePageCreator.regenerate')}</Button>
                  <Button onClick={undo_3} isDisabled={pastState_3.length === 1} mt={0.5} ml={4}>{t('resumePageCreator.back')}</Button>
                  <Button onClick={redo_3} isDisabled={!hasFutureState_3()} mt={0.5} ml={4}>{t('resumePageCreator.forward')}</Button>
              </div>
              </VStack>
              </>
              )}

              <FormControl isRequired>
                <FormLabel htmlFor="visibility" fontWeight={'normal'} mt="2%">
                  {t('resumePageCreator.visibility')}
                </FormLabel>
                <RadioGroup onChange={setVisible} value={visibility}>
                    <Stack spacing={3} direction='row'>
                        <Radio value='visible' defaultChecked>{t('resumePageCreator.visible')}</Radio>
                        <Radio value='hidden'>{t('resumePageCreator.hidden')}</Radio>
                    </Stack>
                </RadioGroup>
              </FormControl>
            </Box>
          </VStack>
        </Box>
      <Divider orientation="vertical" />
      <Box flex="1" overflowY="auto">
        {programmingLanguages.map((language, index) => (
            <div key={index}>
              <FormControl p={4} isRequired>
                <FormLabel>{t('resumePageCreator.programmingLanguage')}</FormLabel>
                <Select
                  isMulti={false}
                  name="option-color-scheme"
                  isClearable={true}
                  isSearchable={true}
                  options={programmingLanguagesOptions}
                  placeholder={t('resumePageCreator.selectProgrammingLanguageText')}
                  value={programmingLanguagesOptions.find(option => option.value === language.language)}
                  onChange={(e:any) => updateLanguage(index, 'language', e)}
                />
              </FormControl>

              <FormControl p={4}>
                <FormLabel>{t('resumePageCreator.experience')}</FormLabel>
                <RadioGroup onChange={(e:any) => updateLanguage(index, 'hasExperience', e === 'yes' ? true : false)} value={language.experience.hasExperience ? 'yes' : 'no'}>
                  <Stack spacing={3} direction='row'>
                    <Radio value="yes">{t('resumePageCreator.haveExperience')}</Radio>
                    <Radio value="no">{t('resumePageCreator.noExperience')}</Radio>
                  </Stack>
                </RadioGroup>
                <FormControl p={4}>
                  <FormLabel>{t('resumePageCreator.level')}</FormLabel>
                  <Select
                    isMulti={false}
                    defaultValue={levelOptions[0]}
                    name="option-color-scheme"
                    isClearable={true}
                    isSearchable={true}
                    options={levelOptions}
                    isDisabled={language.experience.isSelectDisabled || !language.experience.hasExperience}
                    placeholder="Select your level"
                    value={levelOptions.find(option => option.value === language.experience.level)}
                    onChange={(e:any) => updateLanguage(index, 'level', e)}
                  />
                </FormControl>
                {language.experience.hasExperience && (
                  <>
                    <FormLabel>{t('resumePageCreator.startOfExperience')}</FormLabel>
                    <SingleDatepicker
                      name="start-date-input"
                      date={language.experience.startDate}
                      onDateChange={(date:any) => updateLanguage(index, 'startDate', date)}
                    />
                    <FormLabel>{t('resumePageCreator.endOfExperience')}</FormLabel>
                    <SingleDatepicker
                      name="end-date-input"
                      date={language.experience.endDate}
                      onDateChange={(date:any) => updateLanguage(index, 'endDate', date)}
                      minDate={language.experience.startDate}
                    />
                  </>
                )}
              </FormControl>

              {language.experience.hasExperience && (
                <FormControl p={4}>
                  <FormLabel>{t('resumePageCreator.companyName')}</FormLabel>
                  <Input
                    type="text"
                    id="company"
                    value={language.experience.companyName}
                    onChange={(e:any) => updateLanguage(index, 'companyName', e.target.value)}
                    placeholder="IBM"
                  />
                </FormControl>
              )}
              {programmingLanguages.length !== 1 && (
                <Button onClick={() => removeLanguage(index)} mt={2} ml={4}>{t('remove')}</Button>
              )}
            </div>
          ))}
        {programmingLanguages.length < 3 &&(
          <Button onClick={addLanguage} mt={2} ml={4}>{t('resumePageCreator.addLanguage')}</Button>
        )}
        </Box>
    </Flex>

      <HStack justify="space-between" w="100%" h="100%">
        <Button
          colorScheme={hasExistingResume ? 'orange' : 'teal'}
          onClick={handleCreationResume}
        >
          {hasExistingResume ? t('resumePageCreator.updateResume') : t('resumePageCreator.createResume')}
        </Button>

        <Button
          colorScheme="purple"
          onClick={handleConvertToPDF}
          isDisabled={!hasExistingResume}
        >
          {t('resumePageCreator.resumeToPDF')}
        </Button>
      </HStack>
    </Container>
    
  );
};

export default ResumeForm;
