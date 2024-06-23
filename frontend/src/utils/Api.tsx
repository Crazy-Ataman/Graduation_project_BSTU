import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const loginUser = async (email: string, password: string) => {
  try {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await api.post('/auth/login/', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
    })
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const registrationUser = async (formData: any) => {
    try {
          let formDataJson = JSON.stringify({
            first_name: formData.firstName,
            last_name: formData.lastName,
            ...formData,
            role_id_fk: parseInt(formData.role_id_fk),
          });
          const response = await api.post('/auth/register', formDataJson, {
          headers: {
              'Content-Type': 'application/json',
          }});
          return response.data;
    } catch (error: any) {
      if (error.response.data.detail === "Unique constraint failed on the fields: (`email`)")
      {
        return "User already exists with this email."
      } else {
        console.error('Error during registration:', error);
      }
    }
  };

export const decodeToken = async () => {
  try {
    const response = await api.get('/auth/secure/', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
    return response.data;
  }
  catch (error: any){
    if (error.response.data.detail === "Forbidden: Your account has not yet been approved by the administrator")
      {
        return "Your account has not yet been approved by the administrator"
      } else {
        console.error('Error during decode token:', error);
      }
  }
}

export const getUserProfile = async () => {
  try {
    const response = await api.get('/user/profile/', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
    return response.data;
  }
  catch (error: any){
    console.error('Error during fething user data:', error);
  }
}

export const getUserResume = async () => {
  try {
    const response = await api.get('/resume/userResume/', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
    return response.data;
  }
  catch (error: any){
    if (error.response.data.detail === "Forbidden: Insufficient role")
      {
        return null
      } else {
        console.error('Error during registration:', error);
      }
  }
}

export const getUserTeamMembers = async () => {
  try {
    const response = await api.get('/team-member/check/', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
    return response.data;
  }
  catch (error: any){
    if (error.response.data.detail === "Forbidden: Insufficient role")
      {
        return null
      } else {
        console.error('Error during check team member membership:', error);
      }
  }
}

export const getUserMembershipTeams = async (team_id: string) => {
  try {
    const response = await api.get(`/team/get-team/${team_id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
    return response.data;
  }
  catch (error: any){
    if (error.response.data.detail === "Forbidden: Insufficient role")
      {
        return null
      } else {
        console.error('Error during get team:', error);
      }
  }
}

export const createResume = async (resumeData: any) => {
  try {
        let resumeDataJson = JSON.stringify({
          ...resumeData,
        });
        const response = await api.post('/resume/create', resumeDataJson, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        }});
        return response.data;
  } catch (error: any) {
    if (error.response.data.detail === "Resume has already been created")
      {
        return "Resume has already been created"
      } else {
        console.error('Error during registration:', error);
      }
  }
};

export const updateResume = async (resumeData: any) => {
  try {
        let resumeDataJson = JSON.stringify({
          ...resumeData,
        });
        const response = await api.put('/resume/update', resumeDataJson, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        }});
        return response.data;
  } catch (error: any) {
    console.error('Error during update resume:', error);
      
  }
};

export const paraphraseLLM = async (text: string, mode?: string, temp?: number, num_return_sequences?: number) => {
  try {
    let paraphraseDataJson: any = { query: text };

    if (mode !== undefined) {
      paraphraseDataJson.mode = mode;
    }
    if (temp !== undefined) {
      paraphraseDataJson.temp = temp;
    }
    if (num_return_sequences !== undefined) {
      paraphraseDataJson.num_return_sequences = num_return_sequences;
    }

    paraphraseDataJson = JSON.stringify(paraphraseDataJson);
    console.log(paraphraseDataJson)
    const response = await api.post('/llm/paraphrase', paraphraseDataJson, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      }});
    return response.data;
  } catch(error:any) {
    console.error('Error during paraphrase:', error);
  }
}

export const getUserId = async (email: any) => {
  try {
    const response = await api.get(`/user/getUserId/${email}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      }});
    return response.data;
  } catch(error:any) {
    console.error('Error during fetch user_id:', error);
  }
}

export const resumeToPDF = async (user_id: string) => {
  try {
    const response = await api.get(`/resume/pdf/${user_id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      },
      responseType: 'blob',
    });
    console.log("123457yu")
    console.log(response)
    
    
    const blob = new Blob([response.data], { type: 'application/pdf' });

    // Create a download URL for the Blob
    const url = URL.createObjectURL(blob);

    // Trigger a download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Free up resources
    URL.revokeObjectURL(url);

    return response;
  } catch(error:any) {
    if (error.response && error.response.status === 404)
      {
        return "Resume for convert to pdf not found";
      } else {
        console.error('Error during convert resume to pdf format:', error);
    }
  }
}

export const getResumeList = async ({ page, size, minExperience, maxExperience, experienceLevel, programming_language }: { page: number, size: number, minExperience?: number, maxExperience?: number, experienceLevel?: string, programming_language?: any }) => {
  try {
    let queryString = `/resume/list?page=${page}&size=${size}`;

    if (minExperience) {
      queryString += `&minExperience=${minExperience}`;
    }
    if (maxExperience) {
      queryString += `&maxExperience=${maxExperience}`;
    }
    if (experienceLevel) {
      queryString += `&experience=${experienceLevel}`;
    }
    if (programming_language) {
      const encodedProgrammingLanguage = encodeURIComponent(programming_language);
      queryString += `&programming_language=${encodedProgrammingLanguage}`;
    }

    const response = await api.get(queryString, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
    return response;
  } catch (error: any) {
    if (error.response.data.detail === "Forbidden: Your account has not yet been approved by the administrator")
      {
        return "Your account has not yet been approved by the administrator"
      } else {
      console.error('Error during get resume list:', error);
    }
  }
}

export const getUserResumeByResumeId = async (resume_id: any) => {
  try {
    const response = await api.get(`/resume/get-resume/${resume_id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      }});
    return response;
  }
  catch(error:any) {
    if (error.response.data.detail === "Resume not found or hidden")
    {
      return "Resume not found or hidden";
    } else {
      console.error('Error during get resume by id:', error);
    }
  }
}

export const deleteResume = async (resume_id: string) => {
  try {
    const response = await api.delete(`/resume/delete/${resume_id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      }});
    return response;
  } catch(error:any) {
    if (error.response.data.detail === "Forbidden: Your account has not yet been approved by the administrator")
      {
        return "Your account has not yet been approved by the administrator"
      } else {
      console.error('Error during delete resume:', error);
      }
  }
}

export const getUserList = async (filtration: string) => {
  try {
    const response = await api.get(`/user/list/${filtration}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      }});
    return response.data;
  } catch(error:any) {
    console.error('Error during get user list:', error);
  }
}

export const userAccept = async (user_id: string) => {
  try {
    const response = await api.get(`/user/accept/${user_id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      }});
    return response.data;
  } catch(error:any) {
    console.error('Error during user accept:', error);
  }
}

export const userRefuse = async (user_id: string) => {
  try {
    const response = await api.get(`/user/refuse/${user_id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      }});
    return response.data;
  } catch(error:any) {
    console.error('Error during user refuse:', error);
  }
}

export const getTeamList = async (page: number, size: number) => {
  try {
    const response = await api.get(`/team/list?page=${page}&size=${size}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      }});
    return response;
  } catch(error:any) {
    if (error.response.data.detail === "Forbidden: Your account has not yet been approved by the administrator")
      {
        return "Your account has not yet been approved by the administrator"
      } else {
      console.error('Error during get team list:', error);
      }
  }
}

export const deleteTeam = async (team_id: string) => {
  try {
    const response = await api.delete(`/team/delete/${team_id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      }});
    return response;
  } catch(error:any) {
    console.error('Error during delete team:', error);
  }
}

export const getOwnerTeams = async () => {
  try {
    const response = await api.get('/team/get-teams', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      }});
    return response.data;
  } catch(error:any) {
    console.error('Error during delete team:', error);
  }
}

export const getUserData= async (user_id: string) => {
  try {
    const response = await api.get(`/user/getUserData/${user_id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
    return response.data;
  }
  catch (error: any){
    console.error('Error during fetching user data:', error);
  }
}

export const createTeam = async (teamData: any) => {
  try {
        let teamDataJson = JSON.stringify({
          ...teamData,
        });
        console.log(teamDataJson)
        const response = await api.post('/team/create', teamDataJson, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        }});
        return response.data;
  } catch (error: any) {
    if (error.response.data.detail === "Forbidden: Your account has not yet been approved by the administrator")
      {
        return "Your account has not yet been approved by the administrator"
      } else {
      console.error('Error during registration:', error);
      }
  }
};

export const updateTeam = async (teamData: any) => {
  try {
        let teamDataJson = JSON.stringify({
          ...teamData,
        });
        const response = await api.put('/team/update', teamDataJson, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        }});
        return response.data;
  } catch (error: any) {
      console.error('Error during registration:', error);
  }
};

export const addTeamMember = async (teamMemberData: any) => {
  try {
        let teamMemberDataJson = JSON.stringify({
          ...teamMemberData,
        });
        const response = await api.post('/team-member/add', teamMemberDataJson, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        }});
        return response.data;
  } catch (error: any) {
      if (error.response.data.detail === "The user is already a member of the team")
      {
        return "The user is already a member of the team"
      } else if (error.response.data.detail === "Forbidden: Your account has not yet been approved by the administrator")
      {
        return "Your account has not yet been approved by the administrator"
      } else {
        console.error('Error during adding team member:', error);
      }
      
  }
};

export const updateTeamMember = async (teamMemberData: any) => {
  try {
        let teamMemberDataJson = JSON.stringify({
          ...teamMemberData,
        });
        const response = await api.put('/team-member/update', teamMemberDataJson, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        }});
        return response.data;
  } catch (error: any) {
      if (error.response.data.detail === "Forbidden: Your account has not yet been approved by the administrator")
      {
        return "Your account has not yet been approved by the administrator"
      } else {
        console.error('Error during adding team member:', error);
      }
  }
};

export const deleteTeamMember = async (teamMemberData: any) => {
  try {
      let teamMemberDataJson = JSON.stringify({
        ...teamMemberData,
      });
      const response = await api.delete('/team-member/remove', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        data: teamMemberDataJson,
      });
      return response.data;
  } catch (error: any) {
      console.error('Error during removing team member:', error);
  }
};

export const deleteUser = async (user_id: string) => {
  try {
    const response = await api.delete(`/user/delete/${user_id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      }});
    return response;
  } catch(error:any) {
    console.error('Error during delete user:', error);
  }
}

export const getStatistics = async() => {
  try {
    const response = await api.get(`/resume/statistics`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      }});
    return response;
  } catch(error:any) {
    console.error('Error during getting statistics:', error);
  }
}

export const createChat = async(chatData: any) => {
  try {
    let chatDataJson = JSON.stringify({
      ...chatData,
    });
    const response = await api.post('/chat/create', chatDataJson, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      }
    });
    return response;
  } catch(error:any) {
    console.error('Error during creating chat:', error);
  }
}

export const deleteChat = async(chat_id: string) => {
  try {
    const response = await api.delete(`/chat/delete/${chat_id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      }
    });
    return response;
  } catch(error:any) {
    console.error('Error during deleting chat:', error);
  }
}

export const addUserToChat = async(ChatData: any) => {
  try {
    let chatDataJson = JSON.stringify({
      ...ChatData,
    });
    const response = await api.post('/chat/add', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
      data: chatDataJson,
    });
    return response.data;
  } catch (error: any) {
      console.error('Error during adding user to chat:', error);
  }
}

export const removeUserFromChat = async(ChatData: any) => {
  try {
    let chatDataJson = JSON.stringify({
      ...ChatData,
    });
    const response = await api.delete('/chat/remove', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
      data: chatDataJson,
    });
    return response.data;
  } catch (error: any) {
      console.error('Error during removing user to chat:', error);
  }
}

export const checkChatExisting = async(user_id:any) => {
  try {
    const response = await api.get(`/chat/check/${user_id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response.data.detail === "Chat not found")
      {
        return "Chat not found"
      } else {
        console.error('Error during checking team existing:', error);
      }
  }
}

export const checkChatTeamExisting = async(team_id:any) => {
  try {
    const response = await api.get(`/chat/check-team-chat/${team_id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response.data.detail === "Chat not found")
      {
        return "Chat not found"
      } else {
        console.error('Error during checking chat team existing:', error);
      }
  }
}

export const getChatList = async (page: number, size: number, filtration: string) => {
  try {
    const response = await api.get(`/chat/list?page=${page}&size=${size}&filtration=${filtration}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      }});
    return response;
  } catch(error:any) {
    console.error('Error during getting chat list:', error);
  }
}

export const connectToChat = async(chat_id: any) => {
  try {
    const response = await api.get(`/chat/${chat_id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      }});
    return response.data;
  } catch(error:any) {
    if (error.response.data.detail === "Chat not found")
    {
      return "Chat not found"
    } else {
      console.error('Error during registration:', error);
    }
  }
}