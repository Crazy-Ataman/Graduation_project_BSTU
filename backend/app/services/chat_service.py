import fastapi as fastapi
import jwt as jwt
from app.dtos.dto_users import DtoUsers
from app.prisma.prisma import prisma
from app.dtos.dto_teams import DtoTeams
from app.dtos.dto_team_members import DtoTeamMembers
from fastapi import HTTPException
from app.services.auth_service import AuthService

class ChatService:
    async def create_chat(data, user_id):
        chat_data = data.model_dump()
        chat_data.pop("chat_id", None)
        if chat_data["team_id_fk"] == None:
            chat_data.pop("team_id_fk", None)
        chat_data.pop("chat_users", None)
        print(chat_data)

        try:
            chat = await prisma.chats.create(chat_data)
            chat_users = await prisma.chat_users.create({"chat_id": chat.chat_id, "user_id": user_id["user_id"]})
            return {"message": "Chat created successfully", "chat": chat}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
        
    async def delete_chat(chat_id):
        try:
            chat_existing = await prisma.chats.find_first_or_raise(where={
                    "chat_id": chat_id
                })
        except Exception as ex:
            raise HTTPException(status_code=404, detail="Chat for delete not found")
        
        try:
            chat = await prisma.chats.delete(where={"chat_id": chat_id})
            return {"message": "Chat deleted successfully", "chat": chat}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
        
    async def add_user_to_chat(data):
        chat_user_data = data.model_dump()
        try:
            chat_user = await prisma.chat_users.create({"chat_id": chat_user_data["chat_id"], "user_id": chat_user_data["user_id"]})
            return {"message": "Adding user to chat successfully added", "chat_users": chat_user}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
        
    async def remove_user_from_chat(data):
        chat_user_data = data.model_dump()
        try:
            # delete (in prisma) doesn't work with composite keys
            chat_user = await prisma.chat_users.delete_many(
                where={
                    "chat_id": chat_user_data["chat_id"],
                    "user_id": chat_user_data["user_id"],
                }
            )
            return {"message": "Removing user from chat successfully"}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))