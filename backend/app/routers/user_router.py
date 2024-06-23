from fastapi import APIRouter, HTTPException
from app.decorators.auth_decorators import check_roles
from app.prisma.prisma import prisma
from app.dtos.dto_users import DtoUsers
from fastapi import FastAPI, HTTPException, Depends, status, APIRouter
from app.routers.auth_router import oauth2_scheme
from app.services.user_service import UserService
from app.services.auth_service import AuthService

router = APIRouter(
    prefix='/user'
)

class UserRouter():
    @router.get('/profile')
    async def get_user_info(token: str = Depends(oauth2_scheme)):
        payload = AuthService().decode_token(token)
        response = await UserService.get_user_info(email=payload["sub"])
        return response

    @router.get('/list/{filtration}')
    @check_roles(["Administrator"])
    async def get_user_list(filtration: str, token: str = Depends(oauth2_scheme)):
        response = await UserService.get_users(filtration)
        return response

    @router.get('/accept/{user_id}')
    @check_roles(["Administrator"])
    async def accept_employer(user_id, token: str = Depends(oauth2_scheme)):
        response = await UserService.update_is_approved(user_id, True)
        return response

    @router.get('/refuse/{user_id}')
    @check_roles(["Administrator"])
    async def refuse_employer(user_id, token: str = Depends(oauth2_scheme)):
        response = await UserService.update_is_approved(user_id, False)
        return response

    @router.delete('/delete/{user_id}')
    @check_roles(["Administrator", "Employer"])
    async def delete_user(user_id, token: str = Depends(oauth2_scheme)):
        response = await UserService.deleteUser(user_id)
        return response

    @router.get('/getUserId/{email}')
    async def get_user_id_by_email(email, token: str = Depends(oauth2_scheme)):
        response = await UserService.get_user_id_by_email(email)
        return response

    @router.get('/getUserData/{user_id}')
    @check_roles(["Administrator", "Employer", "Applicant"])
    async def get_user_data(user_id, token: str = Depends(oauth2_scheme)):
        response = await UserService.get_user_data(user_id)
        return response