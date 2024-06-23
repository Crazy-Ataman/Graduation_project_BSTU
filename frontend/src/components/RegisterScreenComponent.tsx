'use client'

import { useState } from 'react'
import {
  Progress,
  Box,
  ButtonGroup,
  Button,
  Heading,
  Flex,
  FormControl,
  GridItem,
  FormLabel,
  Input,
  Select,
  SimpleGrid,
  InputLeftAddon,
  InputGroup,
  Textarea,
  FormHelperText,
  InputRightElement,
  RadioGroup,
  Stack,
  Radio,
  Tooltip,
} from '@chakra-ui/react'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useToast } from '@chakra-ui/react'
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import validator from 'validator';
import { SocialLinks } from 'social-links';
import { decodeToken, registrationUser } from '../utils/Api'

const RegistrationForm = ({basicInfo, handleBasicInfoChange, role, setRole}:any) => {
  const [show, setShow] = useState(false);
  const { t } = useTranslation();
  const handleClick = () => setShow(!show)
  return (
    <>
      <Heading w="100%" textAlign={'center'} fontWeight="normal" mb="2%">
        {t('registrationPage.heading')}
      </Heading>
      <Flex>
        <FormControl mr="5%" isRequired>
          <FormLabel htmlFor="first-name" fontWeight={'normal'}>
            {t('registrationPage.firstName')}
          </FormLabel>
          <Input id="first_name"
            name="first_name"
            value={basicInfo.first_name}
            onChange={handleBasicInfoChange}
            maxLength={70}
            placeholder={t('registrationPage.firstName')}  />
        </FormControl>

        <FormControl isRequired>
          <FormLabel htmlFor="last-name" fontWeight={'normal'}>
            {t('registrationPage.lastName')}
          </FormLabel>
          <Input id="last_name"
            name="last_name"
            value={basicInfo.last_name}
            onChange={handleBasicInfoChange}
            maxLength={70}
            placeholder={t('registrationPage.lastName')} />
        </FormControl>
      </Flex>
      <FormControl mt="2%" isRequired>
        <FormLabel htmlFor="email" fontWeight={'normal'}>
          {t('registrationPage.email')}
        </FormLabel>
        <Input id="email"
          value={basicInfo.email}
          onChange={handleBasicInfoChange}
          maxLength={250}
          type="email" />
        <FormHelperText>{t('registrationPage.helperTextEmail')}</FormHelperText>
      </FormControl>
      <FormControl isRequired>
        <FormLabel htmlFor="password" fontWeight={'normal'} mt="2%">
          {t('registrationPage.password')}
        </FormLabel>
        <InputGroup size="md">
          <Input
            id="password"
            pr="4.5rem"
            type={show ? 'text' : 'password'}
            value={basicInfo.password}
            onChange={handleBasicInfoChange}
            maxLength={100}
            placeholder={t('registrationPage.enterPassword')}
          />
          <InputRightElement h={'full'}>
            <Button variant={'ghost'} onClick={handleClick}>
              {show ? <ViewIcon /> : <ViewOffIcon />}
            </Button>
          </InputRightElement>
        </InputGroup>
      </FormControl>
      <FormControl isRequired>
        <FormLabel htmlFor="role" fontWeight={'normal'} mt="2%">
          {t('role')}
        </FormLabel>
        <RadioGroup onChange={setRole} value={role}>
            <Stack spacing={3} direction='row'>
                <Radio value='2'>{t('employer')}</Radio>
                <Radio value='3'>{t('applicant')}</Radio>
            </Stack>
        </RadioGroup>
      </FormControl>
    </>
  )
}

const SocialLinksForm = ({socialData, handleSocialDataChange, validationStatus}:any) => {
  const { t } = useTranslation();
  return (
    <>
      <Heading w="100%" textAlign={'center'} fontWeight="normal">
        {t('socialMediaLinks')}
      </Heading>
      <SimpleGrid columns={1} spacing={6}>
        <FormControl as={GridItem} colSpan={[3, 2]}>
          <FormLabel
            fontSize="sm"
            fontWeight="md"
            color="gray.700"
            _dark={{
              color: 'gray.50',
            }}>
              {t('registrationPage.githubLink')}
          </FormLabel>
          <InputGroup size="sm">
            <Input
              id="github"
              type="url"
              placeholder="https://github.com/Rezumix"
              focusBorderColor={validationStatus.github ? "brand.400" : "red"}
              rounded="md"
              value={socialData.github}
              onChange={handleSocialDataChange}
            />
          </InputGroup>
        </FormControl>
        <FormControl as={GridItem} colSpan={[3, 2]}>
          <FormLabel
            fontSize="sm"
            fontWeight="md"
            color="gray.700"
            _dark={{
              color: 'gray.50',
            }}>
              {t('registrationPage.linkedinLink')}
          </FormLabel>
          <InputGroup size="sm">
            <Input
              id="linkedin"
              type="url"
              placeholder="https://linkedin.com/Rezumix"
              focusBorderColor="brand.400"
              rounded="md"
              value={socialData.linkedin}
              onChange={handleSocialDataChange}
            />
          </InputGroup>
        </FormControl>
        <FormControl as={GridItem} colSpan={[3, 2]}>
          <FormLabel
            fontSize="sm"
            fontWeight="md"
            color="gray.700"
            _dark={{
              color: 'gray.50',
            }}>
              {t('registrationPage.twitterLink')}
          </FormLabel>
          <InputGroup size="sm">
            <Input
              id="twitter"
              type="url"
              placeholder="https://twitter.com/Rezumix"
              focusBorderColor="brand.400"
              rounded="md"
              value={socialData.twitter}
              onChange={handleSocialDataChange}
            />
          </InputGroup>
        </FormControl>
        <FormControl as={GridItem} colSpan={[3, 2]}>
          <FormLabel
            fontSize="sm"
            fontWeight="md"
            color="gray.700"
            _dark={{
              color: 'gray.50',
            }}>
              {t('registrationPage.facebookLink')}
          </FormLabel>
          <InputGroup size="sm">
            <Input
              id="facebook"
              type="url"
              placeholder="https://facebook.com/Rezumix"
              focusBorderColor="brand.400"
              rounded="md"
              value={socialData.facebook}
              onChange={handleSocialDataChange}
            />
          </InputGroup>
        </FormControl>
      </SimpleGrid>
    </>
  )
}

export default function Multistep() {
  const toast = useToast();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(50.00);
  const [role, setRole] = useState('3');
  const [basicInfo, setBasicInfo] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role_id_fk: role
  });
  type SocialData = Record<string, string>;
  const [socialData, setSocialData] = useState<SocialData>({
    github: '',
    linkedin: '',
    twitter: '',
    facebook: ''
  });
  const [validationStatus, setValidationStatus] = useState({
    github: true,
    linkedin: true,
    twitter: true,
    facebook: true,
  });
  const navigate = useNavigate();

  const handleBasicInfoChange  = (e: any) => {
    const { id, value } = e.target;
    setBasicInfo((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const handleSocialDataChange = (e: any) => {
    const { id, value } = e.target;
    const socialLinks = new SocialLinks();
    const isValid = socialLinks.detectProfile(value) === id;
    setValidationStatus((prevStatus:any) => ({
      ...prevStatus,
      [id]: isValid,
    }));
    setSocialData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const isFieldValid = (field: string, fieldName: string, minFieldLength: number, maxFieldLength: number) => {
    if (!field || field.length < minFieldLength || field.length > maxFieldLength) {
      toast({
        title: t('toastMessages.registrationFailed'),
        description: t('toastMessages.fieldError', { fieldName: fieldName, minFieldLength: minFieldLength, maxFieldLength: maxFieldLength }),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
    return true;
  };

  const checkToken = async() => {
    console.log("I am here!")
    const tokenResponse = await decodeToken();
    let isApproved: boolean = tokenResponse.is_approved;
    if (!isApproved) {
      navigate(-1);
      return;
    }
  }

  const checkBasicFields = () => {
    try {

      if (!basicInfo.first_name.trim() || 
            !basicInfo.last_name.trim() || 
            !basicInfo.email.trim() || 
            !basicInfo.password.trim()) {
        toast({
          title: t('toastMessages.registrationFailed'),
          description: t('toastMessages.dataInvalid'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return false;
      }

      if (
        !isFieldValid(basicInfo.first_name, 'first name', 2, 70) ||
        !isFieldValid(basicInfo.last_name, 'last name', 2, 70) ||
        !isFieldValid(basicInfo.email, 'email', 5, 250) ||
        !isFieldValid(basicInfo.password, 'password', 6, 100)
      ) {
        return false;
      }

      if (!validator.isEmail(basicInfo.email)) {
        toast({
          title: t('toastMessages.registrationFailed'),
          description: t('toastMessages.invalidEmail'),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return false;
      }
      return true;
    }
    catch (error: any) {
      console.error('Error during registration:', error);
    }
  }
  
  const validateSocialLinks = () => {
    const invalidLinks = Object.entries(validationStatus).filter(([key, isValid]) => !isValid && socialData[key] !== '');
    
    if (invalidLinks.length > 0) {
      invalidLinks.forEach(([key]) => {
        toast({
          title: t('toastMessages.registrationFailed'),
          description: t('toastMessages.socialLinksFailed', { key: key }),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      });
      return false;
    }
    return true;
  };

  const handleRegistration = async() => {
    basicInfo.role_id_fk = role;
    const userData = {
      user_data: basicInfo,
      social_media_links_data: socialData
    };

    if (!validateSocialLinks()) {
      return;
    }
    
    const result = await registrationUser(userData);

    if (result === 'User already exists with this email.') {
      toast({
        title: t('toastMessages.registrationFailed'),
        description: t('toastMessages.userExists'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } else {
        toast({
          title: t('toastMessages.registrationSuccess'),
          description: t('toastMessages.loginPrompt'),
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        navigate('/login');
    }
  }

  return (
    <>
      <Box
        borderWidth="1px"
        rounded="lg"
        shadow="1px 1px 3px rgba(0,0,0,0.3)"
        maxWidth={800}
        p={6}
        m="10px auto"
        as="form">
        <Progress hasStripe value={progress} mb="5%" mx="5%" isAnimated></Progress>
        {step === 1 ? (
          <RegistrationForm
            basicInfo={basicInfo}
            handleBasicInfoChange={handleBasicInfoChange}
            role={role}
            setRole={setRole}
          />
          ) : (
          <SocialLinksForm
            socialData={socialData}
            handleSocialDataChange={handleSocialDataChange}
            validationStatus={validationStatus}
          />)}
        <ButtonGroup mt="5%" w="100%">
          <Flex w="100%" justifyContent="space-between">
            <Flex>
              <Button
                onClick={() => {
                  setStep(step - 1)
                  setProgress(progress - 50.00)
                }}
                isDisabled={step === 1}
                colorScheme="teal"
                variant="solid"
                w="7rem"
                mr="5%">
                  {t('registrationPage.back')}
              </Button>
              <Button
                w="7rem"
                isDisabled={step === 2}
                onClick={() => {
                  if (checkBasicFields()){
                    setStep(step + 1)
                    if (step === 2) {
                      setProgress(100)
                    } else {
                      setProgress(progress + 50.00)
                    }
                  }
                }}
                colorScheme="teal"
                variant="outline">
                  {t('registrationPage.next')}
              </Button>
            </Flex>
            {step === 2 ? (
              <Button
                w="7rem"
                colorScheme="red"
                variant="solid"
                onClick={handleRegistration}>
                  {t('registrationPage.submit')}
              </Button>
            ) : null}
          </Flex>
        </ButtonGroup>
      </Box>
    </>
  )
}