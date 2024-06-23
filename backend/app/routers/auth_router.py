from xml.etree.ElementInclude import include
from fastapi import FastAPI, HTTPException, Depends, status, APIRouter
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from app.prisma.prisma import prisma
from app.dtos.dto_users import DtoUsers
from app.dtos.dto_social_media_links import DtoSocialMediaLinks
import os
from app.services.auth_service import AuthService


# OAuth2PasswordBearer for token retrieval
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

authService = AuthService()

router = APIRouter(
    prefix='/auth'
)

class AuthRouter():
    @router.post("/register/")
    async def register_user(data: dict):
        # get user data from dictionary
        user_data = data.get("user_data", {}) 
        if(not user_data):
            raise HTTPException(status_code=422, detail=str("User data is empty!"))
        # unpack and serialize the instance 
        user_data = DtoUsers(**user_data).model_dump()
        user_data.pop("user_id", None)
        user_data["password"] = authService.get_password_hash(user_data["password"])

        social_data = data.get("social_media_links_data", {})
        social_data = DtoSocialMediaLinks(**social_data).model_dump()
        social_data.pop("social_media_link_id", None)

        try:
            user = await prisma.users.create(user_data)
            social_data["user_id_fk"] = user.user_id
            social_media = await prisma.social_media_links.create(social_data)
            return {"message": "User registered successfully"}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @router.post("/login/")
    async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
        # OAuth2PasswordRequestForm hardcoded username and password
        # no possibilities to change it in swagger
        user = await prisma.users.find_unique(where={
            "email": form_data.username
        })
        if (user is None):
            raise HTTPException(status_code=404, detail=str("User is not found!"))
        user_data = user.model_dump()
        if user_data is None or not authService.verify_password(form_data.password, user_data["password"]):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        # access_token_expires = timedelta(minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")))
        access_token_expires = timedelta.max
        access_token = authService.create_access_token(data={"sub": user_data["email"],
                                                    "role_id_fk": user_data["role_id_fk"],
                                                    "is_approved": user_data["is_approved"]}
                                                    , expires_delta=access_token_expires)
        return {"access_token": access_token, "token_type": "bearer"}

    @router.get("/secure/")
    def secure_endpoint(token: str = Depends(oauth2_scheme)):
        payload = authService.decode_token(token)
        return {"message": "You are authorized!", "email": payload["sub"], "role_id_fk" : payload["role_id_fk"], "is_approved": payload["is_approved"]}