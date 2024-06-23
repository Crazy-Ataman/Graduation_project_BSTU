from fastapi import FastAPI, HTTPException, Depends, status, APIRouter
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from fastapi_pagination import Page, paginate
from app.decorators.auth_decorators import check_roles
from app.dtos.dto_teams import DtoTeams
from app.prisma.prisma import prisma
import os
from app.services.auth_service import AuthService
from app.services.team_service import TeamService
from app.services.user_service import UserService
from app.routers.auth_router import oauth2_scheme

router = APIRouter(
    prefix='/team'
)

class TeamRouter():
    @router.post("/create/")
    @check_roles(["Employer"])
    async def create_team(data: DtoTeams, token: str = Depends(oauth2_scheme)):
        user_id = await UserService.get_user_id_by_email(email=AuthService().get_email_from_token(token))
        return await TeamService.create_team(data, user_id)

    @router.put("/update/")
    @check_roles(["Employer"])   
    async def update_team(data: DtoTeams, token: str = Depends(oauth2_scheme)):
        user_id = await UserService.get_user_id_by_email(email=AuthService().get_email_from_token(token))
        return await TeamService.update_team(data, user_id)

    @router.delete("/delete/{team_id}")
    @check_roles(["Administrator", "Employer"])
    async def delete_team(team_id, token: str = Depends(oauth2_scheme)):
        user_id = await UserService.get_user_id_by_email(email=AuthService().get_email_from_token(token))
        return await TeamService.delete_team(team_id, user_id)

    @router.get("/list/", response_model=Page[DtoTeams])
    @check_roles(["Administrator", "Employer"])
    async def list_teams(token: str = Depends(oauth2_scheme)):
        user_id = await UserService.get_user_id_by_email(email=AuthService().get_email_from_token(token))
        return paginate(await TeamService.get_teams(user_id))

    @router.get("/get-team/{team_id}")
    @check_roles(["Applicant"])
    async def list_membership_team(team_id, token: str = Depends(oauth2_scheme)):
        response = await prisma.teams.find_unique(where={"team_id": team_id})
        return response

    @router.get("/get-teams")
    @check_roles(["Employer"])
    async def list_membership(token: str = Depends(oauth2_scheme)):
        user_id = await UserService.get_user_id_by_email(email=AuthService().get_email_from_token(token))
        response = await prisma.teams.find_many(where={"owner_id_fk": user_id["user_id"]})
        return response