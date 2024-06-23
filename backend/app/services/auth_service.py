from fastapi import FastAPI, HTTPException, Depends, status, APIRouter
from passlib.context import CryptContext
from jose import JWTError
from datetime import datetime, timedelta
import jwt
import jwt.exceptions as jwtExceptions
from app.prisma.prisma import prisma
import os
from dotenv import load_dotenv
from app.services.user_service import UserService

dotenv_path = 'app/.env'

class AuthService:
    def __init__(self):
        self.__pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        if os.path.exists(dotenv_path):
            load_dotenv(dotenv_path, override=False)

    def get_password_hash(self, password):
        return self.__pwd_context.hash(password)

    def verify_password(self, plain_password, hashed_password):
        return self.__pwd_context.verify(plain_password, hashed_password)

    def create_access_token(self, data: dict, expires_delta: timedelta = None):
        to_encode = data.copy()
        # if expires_delta:
        #     expire = datetime.utcnow() + expires_delta
        # else:
        #     expire = datetime.utcnow() + timedelta(minutes=15)
        expire = datetime.max
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, os.getenv("SECRET_KEY"), algorithm=os.getenv("ALGORITHM"))
        return encoded_jwt

    def decode_token(self, token: str):
        try:
            payload = jwt.decode(token, os.getenv("SECRET_KEY"), algorithms=[os.getenv("ALGORITHM")])
            return payload
        except JWTError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        except jwtExceptions.InvalidSignatureError:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Token is wrong")
        except jwtExceptions.ExpiredSignatureError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token is expired")
        except Exception as ex:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unknown error")

    async def get_role_from_token(self, token: str):
        payload = self.decode_token(token)
        role = await UserService.get_role_by_email(role_id=payload["role_id_fk"])
        return role["role"]
    
    def get_email_from_token(self, token: str):
        payload = self.decode_token(token)
        email = payload["sub"]
        return email