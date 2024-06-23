import fastapi as fastapi
import jwt as jwt
from app.prisma.prisma import prisma
from fastapi import HTTPException

class UserService:
    async def get_user_info(email):
        user_info = await prisma.users.find_unique(where={"email": email})
        social_media_links = await prisma.social_media_links.find_first(where={"user_id_fk": user_info.user_id})
        filtered_user_info = {k: v for k, v in user_info if k not in ["user_id",
                                                                    "password",
                                                                    "role_id_fk",
                                                                    "roles",
                                                                    "chat_users",
                                                                    "messages",
                                                                    "resumes",
                                                                    "social_media_links",
                                                                    "teams",
                                                                    "team_members"]}
        filtered_social = {k: v for k, v in social_media_links if k not in ["social_media_link_id",
                                                                    "users"]}
        
        return filtered_user_info, filtered_social
    
    async def get_user_data(user_id):
        response = await prisma.users.find_first_or_raise(
                                where={"user_id": user_id},
                                include={
                                    "social_media_links": True
                                })
        filtered_response = {k: v for k, v in response if k not in ["password",
                                                                    "roles",
                                                                    "teams",
                                                                    "team_members"]}
        return filtered_response
    
    async def get_user_id_by_email(email):
        response = await prisma.users.find_unique(where={"email": email})
        filtered_response = {k: v for k, v in response if k in ["user_id"]}
        return filtered_response
    
    async def get_role_by_email(role_id):
        response = await prisma.roles.find_unique(where={"role_id": role_id})
        filtered_response = {k: v for k, v in response if k in ["role"]}
        return filtered_response
    
    async def get_users(filtration: str):
        try:
            match filtration:
                case "none":
                    usersData = await prisma.users.find_many()
                case "employers":
                    usersData = await prisma.users.find_many(
                        where={
                            'role_id_fk': 2
                        })
                case "applicants":
                    usersData = await prisma.users.find_many(
                        where={
                            'role_id_fk': 3
                        })
            filtered_response = []
            for user_dict in usersData:
                filtered_user_dict = {k: v for k, v in user_dict if k not in [ "password",
                                                                                "roles",
                                                                                "teams",
                                                                                "team_members",
                                                                                "resumes"]}
                filtered_response.append(filtered_user_dict)
            return filtered_response
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def update_is_approved(user_id, accept: bool):
        try:
            user = await prisma.users.find_unique(where={"user_id": user_id})
            if user.role_id_fk != 2:
                raise HTTPException(status_code=400, detail="User not employer")
            else:
                pass
        except HTTPException as ex:
            raise ex
        except Exception as e:
            raise HTTPException(status_code=404, detail="User not found")
        if(accept == True):
            user_data = {
                "is_approved": True
            }
        else:
            user_data = {
                "is_approved": False
            }
        update_response = await prisma.users.update(
                                where={"user_id": user_id},
                                data=user_data)
        return {"message": "User updated successfully", "user": update_response}
    
    async def deleteUser(user_id):
        response = await prisma.users.delete(where={"user_id": user_id})
        return response
