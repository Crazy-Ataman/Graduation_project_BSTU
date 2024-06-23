from fastapi import FastAPI, HTTPException, Depends, status, APIRouter
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi_pagination import Page, paginate
from app.decorators.auth_decorators import check_roles
from app.dtos.dto_team_members import DtoTeamMembers
from app.services.auth_service import AuthService
from app.services.team_members_service import TeamMemberService
from app.routers.auth_router import oauth2_scheme
from app.services.user_service import UserService
from app.prisma.prisma import prisma

router = APIRouter(
    prefix='/team-member'
)

class TeamMemberRouter():
    @router.post("/add/")
    @check_roles(["Employer"])
    async def add_team_member(data: DtoTeamMembers, token: str = Depends(oauth2_scheme)):
        return await TeamMemberService.add_team_member(data)

    @router.put("/update/")
    @check_roles(["Administrator", "Employer"])
    async def update_team_member(data: DtoTeamMembers, token: str = Depends(oauth2_scheme)):
        return await TeamMemberService.update_team_member(data)

    @router.delete("/remove/")
    @check_roles(["Administrator", "Employer"])
    async def remove_team_member(data: DtoTeamMembers, token: str = Depends(oauth2_scheme)):
        return await TeamMemberService.remove_team_member(data)

    @router.get("/check/")
    @check_roles(["Applicant"])
    async def check_user_member_of_teams(token: str = Depends(oauth2_scheme)):
        user_id = await UserService.get_user_id_by_email(email=AuthService().get_email_from_token(token))
        response = await prisma.team_members.find_many(where={"user_id_fk": user_id["user_id"]})
        return response