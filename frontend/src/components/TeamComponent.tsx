import React, { useEffect, useState } from 'react';
import {
  Container,
  VStack,
  Heading,
  Input,
  Button,
  Text,
  useToast,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { Select } from "chakra-react-select";
import { createTeam, decodeToken, updateTeam } from '../utils/Api';
import { useLocation, useNavigate } from 'react-router-dom';

const TeamForm = () => {
  let { state } = useLocation();
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isUpdatingTeam, setIsUpdatingTeam] = useState(state && state.team);
  const [importantLanguages, setImportantLanguages] = useState<string[]>([]);
  const toast = useToast();
  const [auth, setAuth] = useState(false);
  const navigate = useNavigate();
  let transformedImportantLanguages:any;

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

  const isFieldValid = (field: string, fieldName: string, minFieldLength: number, maxFieldLength: number) => {
    if (!field || field.length < minFieldLength || field.length > maxFieldLength) {
      toast({
        title: 'Creation Team Failed',
        description: `Please enter a valid ${fieldName} between ${minFieldLength} and ${maxFieldLength} characters.`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
    return true;
  };

  const handleImportantLanguageChange = (selectedOptions:any) => {
    console.log(selectedOptions)
    const selectedValues = selectedOptions.map((option: { value: any; }) => option.value);
    setImportantLanguages(selectedValues);
  };

  const handleAction = async () => {
    try {
      setLoading(true);
  
      if (!teamName.trim()) {
        toast({
          title: 'Team Name Required',
          description: 'Please enter a team name.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      if (
        !isFieldValid(teamName, 'team name', 5, 50)
      ) {
        return;
      }

      if (importantLanguages.length === 0) {
        toast({
          title: 'Important Programming Languages Required',
          description: `Please select an important programming language`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
  
      if (isUpdatingTeam) {
        console.log(isUpdatingTeam);
        console.log(teamName);
        console.log(importantLanguages);
        const response = await updateTeam({
          team_id: isUpdatingTeam.team_id,
          name: teamName,
          important_languages: importantLanguages.join(','),
          owner_id_fk: isUpdatingTeam.owner_id_fk,
        });
  
        setIsUpdatingTeam((prevState: any) => ({ ...prevState, ...response.team }));
  
        toast({
          title: 'Team Updated',
          description: response.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        const response = await createTeam({ name: teamName, important_languages: importantLanguages.join(',') });
        if (response === "Your account has not yet been approved by the administrator"){
          toast({
            title: 'Wait for confirmation',
            description: 'Your account has not yet been approved by the administrator',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          return;
        }
        setIsUpdatingTeam(response.team);
  
        toast({
          title: 'Team Created',
          description: response.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error creating/updating the team. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchTeam = async () => {
    const tokenResponse = await decodeToken();
    let role:number = tokenResponse.role_id_fk;
    if (![2].includes(role)) {
      window.location.href = '/';
      return;
    } else {
      setAuth(true);
      if (isUpdatingTeam) {
        const { name } = isUpdatingTeam;
        setTeamName(name);
        setImportantLanguages(isUpdatingTeam.important_languages.split(","));
        transformedImportantLanguages = isUpdatingTeam.important_languages.trim().split(",").map((lang: any) => ({
          value: lang,
          label: lang
        }));
      }
    }
  }
  fetchTeam();
  console.log(importantLanguages)
  }, [state, isUpdatingTeam]);

  return (
    <Container maxW="container.sm" mt={8}>
      <VStack spacing={4} align="start">
      {auth && (
          <>
        <Heading as="h1" size="xl">
            {isUpdatingTeam ? 'Update Team' : 'Create a New Team'}
        </Heading>

        <Input
          placeholder="Enter team name"
          id="team name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
        />
        <FormControl p={4} isRequired>
          <FormLabel>Important Programming Languages</FormLabel>
          <Select
            isMulti={true}
            name="option-color-scheme"
            isClearable={true}
            isSearchable={true}
            options={programmingLanguagesOptions}
            placeholder="Select important programming languages"
            onChange={handleImportantLanguageChange}
            value={programmingLanguagesOptions.filter(option => importantLanguages.includes(option.value))}
            isOptionDisabled={(option) => importantLanguages.length >= 3}
          />
        </FormControl>

        <Button
          colorScheme={isUpdatingTeam ? 'orange' : 'teal'}
          isLoading={loading}
          loadingText={isUpdatingTeam ? 'Updating...' : 'Creating...'}
          onClick={handleAction}
        >
          {isUpdatingTeam ? 'Update Team' : 'Create Team'}
        </Button>

        {loading && <Text>{isUpdatingTeam ? 'Updating team...' : 'Creating team...'}</Text>}
        </>
        )}
      </VStack>
    </Container>
  );
};

export default TeamForm;
