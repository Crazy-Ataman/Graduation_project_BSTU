import { useEffect, useState } from 'react';
import {
  ChakraProvider,
  Box,
  Text,
  Link,
  VStack,
  Code,
  Grid,
  theme,
} from "@chakra-ui/react";
import { BrowserRouter as Router, Route, Routes, Navigate  } from 'react-router-dom';
import Nav from './components/NavBarComponent';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UserProfile from "./pages/UserProfile";
import Resume from "./pages/Resume";
import ResumePagination from './pages/ResumeList';
import UserListPage from './pages/UserList';
import TeamListPage from './pages/TeamList';
import Team from './pages/Team';
import { decodeToken } from './utils/Api';
import ResumeUser from './pages/ResumeUser';
import Statistics from './pages/Statistics';
import Chat from './pages/Chat';
import ChatListPage from './pages/ChatList';

const AuthCheck = ({ children }:any) => {
  const [isLoggedIn, setLoggedIn] = useState(localStorage.getItem('access_token') ? true : false);

  const fetchData = async () => {
    setLoggedIn(localStorage.getItem('access_token') ? true : false);
    console.log(isLoggedIn);
    if(isLoggedIn) {
      const tokenResponse = await decodeToken();
    }
  }

  useEffect(() => {
    fetchData();
  }, [isLoggedIn]);

  return children({ isLoggedIn });
};

export const App = () => (
  <ChakraProvider theme={theme}>
    <Router>
      <Nav/>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/register/:teamId?' element={<Register/>}/>
        <Route
          path="/login"
          element={
            <AuthCheck>
              {({ isLoggedIn }: any) =>
                isLoggedIn ? <Navigate to="/" /> : <Login />
              }
            </AuthCheck>
          }
        />
        <Route path='/user/profile' 
          element={
            <AuthCheck>
              {({ isLoggedIn }: any) =>
                isLoggedIn ? <UserProfile/> : <Navigate to="/login"/>
              }
            </AuthCheck>
          }/>
        <Route
          path="/resume"
          element={
            <AuthCheck>
              {({ isLoggedIn }: any) =>
                isLoggedIn ? (
                  <Resume />
                ) : (
                  <Navigate to="/" />
                )
              }
            </AuthCheck>
          }
        />
        <Route path='/resume/list'
          element={
            <AuthCheck>
              {({ isLoggedIn }: any) =>
                isLoggedIn ? <ResumePagination/> : <Navigate to="/login"/>
              }
            </AuthCheck>
          }
        />
        <Route path='/resume/get-resume/:resumeId?'
          element={
            <AuthCheck>
              {({ isLoggedIn }: any) =>
                isLoggedIn ? <ResumeUser/> : <Navigate to="/login"/>
              }
            </AuthCheck>
          }
        />
        <Route path='/resume/statistics'
          element={
            <AuthCheck>
              {({ isLoggedIn }: any) =>
                isLoggedIn ? <Statistics/> : <Navigate to="/login"/>
              }
            </AuthCheck>
          }
        />
        <Route path='/user/list' 
                element={
                  <AuthCheck>
                    {({ isLoggedIn }: any) => 
                      isLoggedIn ? (
                        <UserListPage />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  </AuthCheck>
                }
        />
        <Route path='/team/list' 
                element={
                  <AuthCheck>
                    {({ isLoggedIn }: any) =>
                      isLoggedIn ? (
                        <TeamListPage />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  </AuthCheck>
                }
        />
        <Route path='/team' 
                element={
                  <AuthCheck>
                    {({ isLoggedIn }: any) =>
                      isLoggedIn ? (
                        <Team/>
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  </AuthCheck>
                }
        />
        <Route path='/chat/tech' 
                element={
                  <AuthCheck>
                    {({ isLoggedIn }: any) =>
                      isLoggedIn ? (
                        <Chat/>
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  </AuthCheck>
                }
        />
        <Route path='/chat/:chatId?' 
                element={
                  <AuthCheck>
                    {({ isLoggedIn }: any) =>
                      isLoggedIn ? (
                        <Chat/>
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  </AuthCheck>
                }
        />
        <Route path='/chat/list' 
                element={
                  <AuthCheck>
                    {({ isLoggedIn }: any) =>
                      isLoggedIn ? (
                        <ChatListPage/>
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  </AuthCheck>
                }
        />
        <Route path='*' element={<Navigate to='/' />} />
      </Routes>
    </Router>
  </ChakraProvider>
)
