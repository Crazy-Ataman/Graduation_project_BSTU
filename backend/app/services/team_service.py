import fastapi as fastapi
import jwt as jwt
from app.dtos.dto_users import DtoUsers
from app.prisma.prisma import prisma
from app.dtos.dto_teams import DtoTeams
from app.dtos.dto_team_members import DtoTeamMembers
from fastapi import HTTPException
from app.services.auth_service import AuthService

class TeamService:
    async def create_team(data, user_id):
        print(data)
        team_data = data.model_dump()
    
        team_data["owner_id_fk"] = user_id["user_id"]
        team_data.pop("team_id", None)
        team_data.pop("creation_date", None)
        team_data.pop("team_members", None)
        team_data.pop("users", None)

        try:
            team = await prisma.teams.create(team_data)
            return {"message": "Team created successfully", "team": team}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
        
    async def update_team(data, user_id):
        team_data_updated = data.model_dump()

        if user_id["user_id"] != team_data_updated["owner_id_fk"]:
            raise HTTPException(status_code=400, detail="You are not the team owner")

        try:
            team_existing = await prisma.teams.find_unique(where={
                "team_id": team_data_updated["team_id"]
            })
        except Exception as ex:
            raise HTTPException(status_code=404, detail="Team for update not found")

        team_data_updated["owner_id_fk"] = user_id["user_id"]
        team_data_updated["creation_date"] = team_existing.creation_date
        team_data_updated.pop("team_members", None)
        team_data_updated.pop("users", None)

        try:
            team_response = await prisma.teams.update(
                where={"team_id": team_existing.team_id},
                data=team_data_updated
            )
            return {"message": "Team updated successfully", "team": team_response}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    async def delete_team(team_id, user_id):
        try:
            team_existing = await prisma.teams.find_first_or_raise(where={
                "team_id": team_id
            })
        except Exception as ex:
            raise HTTPException(status_code=404, detail="Team for delete not found")

        user_data = await prisma.users.find_unique(where={
            "user_id": user_id["user_id"]
        })

        if user_data.role_id_fk != 1:
            if user_id["user_id"] != team_existing.owner_id_fk:
                raise HTTPException(status_code=400, detail="You are not the team owner")

        try:
            team_response = await prisma.teams.delete(
                where={"team_id": team_existing.team_id}
            )
            return {"message": "Team deleted successfully", "team": team_response}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    async def get_teams(user_id):
        user_data = await prisma.users.find_unique(where={
            "user_id": user_id["user_id"]
        })
        try:
            if user_data.role_id_fk == 2:
                teams = await prisma.teams.find_many(where={
                    "owner_id_fk": user_id["user_id"]
                })
            else:
                teams = await prisma.teams.find_many()
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
        
        teams_with_members = []
        for team in teams:
            team_data = DtoTeams(
                team_id=team.team_id,
                name=team.name,
                creation_date=team.creation_date,
                important_languages=team.important_languages,
                owner_id_fk=team.owner_id_fk,
                team_members=[],
                users=[]
            )

            team_members = await prisma.team_members.find_many(where={"team_id_fk": team.team_id})
            for team_member in team_members:
                team_data.team_members.append(DtoTeamMembers(
                    member_id=team_member.member_id, 
                    team_id_fk=team_member.team_id_fk, 
                    user_id_fk=team_member.user_id_fk, 
                    status=team_member.status))

            team_users = await prisma.users.find_many(where={"team_members": {"some": {"team_id_fk": team.team_id}}})
            for team_user in team_users:
                team_data.users.append(DtoUsers(
                    user_id=team_user.user_id,
                    first_name=team_user.first_name,
                    last_name=team_user.last_name,
                    email=team_user.email,
                    password=team_user.password,
                    is_approved=team_user.is_approved,
                    role_id_fk=team_user.role_id_fk
                ))

            teams_with_members.append(team_data)
    
        return teams_with_members