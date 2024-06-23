from fastapi import HTTPException, WebSocketDisconnect
from app.decorators.auth_decorators import check_roles
from app.dtos.dto_chat_users import DtoChatUsers
from app.dtos.dto_chats import DtoChats
from app.prisma.prisma import prisma
from fastapi_pagination import Page, paginate
from app.routers.auth_router import oauth2_scheme
from app.services.auth_service import AuthService
from app.services.chat_service import ChatService
from app.services.user_service import UserService

from fastapi import (
    APIRouter,
    Cookie,
    Depends,
    FastAPI,
    Query,
    WebSocket,
    WebSocketException,
    status,
)
from fastapi.responses import HTMLResponse

router = APIRouter(
    prefix='/chat'
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, chat_id: str):
        await websocket.accept()
        if chat_id not in self.active_connections:
            self.active_connections[chat_id] = []
        self.active_connections[chat_id].append(websocket)

    def disconnect(self, websocket: WebSocket, chat_id: str):
        if chat_id in self.active_connections:
            self.active_connections[chat_id].remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast_to_chat(self, message: str, chat_id: str, exclude_websocket: WebSocket = None):
        # print(self.active_connections)
        if chat_id in self.active_connections:
            for connection in self.active_connections[chat_id]:
                if connection != exclude_websocket:
                    await connection.send_text(message)


manager = ConnectionManager()

class ChatRouter():
    @router.post("/create")
    async def create_chat(data: DtoChats, token: str = Depends(oauth2_scheme)):
        user_id = await UserService.get_user_id_by_email(email=AuthService().get_email_from_token(token))
        return await ChatService.create_chat(data, user_id)
        
    @router.delete("/delete/{chat_id}")
    @check_roles(["Administrator", "Employer"])
    async def delete_chat(chat_id, token: str = Depends(oauth2_scheme)):
        return await ChatService.delete_chat(chat_id)
        
    @router.post("/add")
    async def add_user_to_chat(data: DtoChatUsers, token: str = Depends(oauth2_scheme)):
        return await ChatService.add_user_to_chat(data)

    @router.delete("/remove")
    @check_roles(["Administrator", "Employer"])
    async def remove_user_from_chat(data: DtoChatUsers, token: str = Depends(oauth2_scheme)):
        return await ChatService.remove_user_from_chat(data)

    @router.get("/list", response_model=Page[DtoChats])
    @check_roles(["Administrator"])
    async def list_chats(filtration: str, token: str = Depends(oauth2_scheme)):
        match filtration:
            case "none":
                chats = await prisma.chats.find_many(
                    include={
                        'chat_users': True            
                    })
            case "teams":
                chats = await prisma.chats.find_many(
                    where={
                        'type': 'team chat'
                    },
                    include={
                        'chat_users': True            
                    })
            case "techs":
                chats = await prisma.chats.find_many(
                    where={
                        'type': 'technical support'
                    },
                    include={
                        'chat_users': True            
                    })
        return paginate(chats)

    @router.get("/check/{user_id}")
    async def check_chat_exisiting(user_id: str, token: str = Depends(oauth2_scheme)):
        try:
            chat_existing = await prisma.chats.find_first_or_raise(
                        where={
                            "type": "technical support",
                            "chat_users": {
                                "some": {
                                    "user_id": user_id
                                }
                            }
                        },
                        include={
                            'chat_users': {'where': {
                                "user_id": user_id
                            }}            
                        })
            return chat_existing
        except Exception as ex:
            raise HTTPException(status_code=404, detail="Chat not found")
        
    @router.get("/check-team-chat/{team_id}")
    async def check_team_chat_exisiting(team_id: str, token: str = Depends(oauth2_scheme)):
        try:
            payload = AuthService().decode_token(token)
            chat_existing = await prisma.chats.find_first_or_raise(
                        where={
                            "type": "team chat",
                            "team_id_fk": team_id
                        })
            
            if payload["role_id_fk"] == 1:
                return chat_existing
            
            user_id = await UserService.get_user_id_by_email(email=payload["sub"])

            try:
                user_owner = await prisma.teams.find_first_or_raise(where={"team_id": team_id, "owner_id_fk": user_id["user_id"]})
                add_user_owner = await prisma.chat_users.upsert(
                    where={
                        "chat_id_user_id": {
                            "chat_id": chat_existing.chat_id,
                            "user_id": user_id["user_id"]
                        }
                    },
                    data={
                        'create': {
                            "chat_id": chat_existing.chat_id,
                            "user_id": user_id["user_id"]
                        },
                        'update': {},
                    }
                )
                return chat_existing
            except Exception as ex:
                print(ex)
                pass

            try:
                team_members = await prisma.team_members.find_first_or_raise(where={"team_id_fk": team_id,"user_id_fk": user_id["user_id"]})
            except Exception as ex:
                raise HTTPException(status_code=404, detail="You are not a team member")

            return chat_existing
        except Exception as ex:
            team = await prisma.teams.find_first_or_raise(where={"team_id": team_id})
            team_members = await prisma.team_members.find_many(where={"team_id_fk": team_id})
            chat = await prisma.chats.create({"name": team.name + " chat", "type": "team chat", "team_id_fk": team_id})
            chat_user_owner = await prisma.chat_users.create({"chat_id": chat.chat_id, "user_id": team.owner_id_fk})
            for member in team_members:
                await prisma.chat_users.create({
                    "chat_id": chat.chat_id,
                    "user_id": member.user_id_fk
                })
            return chat

    @router.get("/{chat_id}")
    async def get(chat_id, token: str = Depends(oauth2_scheme)):
        try:
            chat_existing = await prisma.chats.find_first_or_raise(where={"chat_id": chat_id})
        except Exception as ex:
            raise HTTPException(status_code=404, detail="Chat not found")

        try:
            payload = AuthService().decode_token(token)
            print(payload)
            role = await UserService.get_role_by_email(role_id=payload["role_id_fk"])
            print(role)
            if(role["role"] == "Administrator"):
                user_id = await UserService.get_user_id_by_email(email=payload["sub"])
                return {"message": "Welcome, Administrator!", "chat_id": chat_id, "user_role": "Administrator", "user_id": user_id["user_id"], "chat_name": chat_existing.name}
            else:
                user_id = await UserService.get_user_id_by_email(email=payload["sub"])
                check_access = await prisma.chat_users.find_first_or_raise(where={"chat_id": chat_id ,"user_id": user_id["user_id"]})
                print(check_access)
                return {"message": "Welcome, User!", "chat_id": chat_id, "user_role": "User", "access_info": check_access, "user_id": user_id["user_id"], "chat_name": chat_existing.name}
        except Exception as ex:
            print(ex)
            raise HTTPException(status_code=403, detail="Forbidden: Not enough privileges")


    @router.websocket("/ws/{chat_id}/{client_id}")
    async def websocket_endpoint(websocket: WebSocket, chat_id, client_id):
        await manager.connect(websocket, chat_id)
        try:
            existing_messages = await prisma.messages.find_many(where={"chat_id_fk": chat_id})
            sender = await prisma.users.find_first_or_raise(where={"user_id": client_id})
            users = await prisma.users.find_many(where={"role_id_fk": 1})
            chat_users = await prisma.chat_users.find_many(where={"chat_id": chat_id})

            for chat_user in chat_users:
                users.append(await prisma.users.find_first(where={"user_id": chat_user.user_id}))

            for message in existing_messages:
                user = next((u for u in users if u.user_id == message.user_id_fk), None)
                if user and message.user_id_fk == client_id:
                    await manager.send_personal_message(f"You: {message.text}", websocket)
                else:
                    await manager.send_personal_message(f"{user.first_name} {user.last_name}: {message.text}", websocket)

            while True:
                data = await websocket.receive_text()
                await prisma.messages.create(
                    data={
                        "text": data,
                        "user_id_fk": client_id,
                        "chat_id_fk": chat_id
                    }
                )

                await manager.broadcast_to_chat(f"{sender.first_name} {sender.last_name}: {data}", chat_id, exclude_websocket=websocket)
        except WebSocketDisconnect as wserror:
            print(wserror)
            manager.disconnect(websocket, chat_id)
        except Exception as ex:
            print(ex)