import fastapi as fastapi
import jwt as jwt
from app.prisma.prisma import prisma
from app.prisma.prisma import prisma
from app.services.email_service import EmailService
from fastapi import HTTPException

class TeamMemberService:
    async def add_team_member(data):
        team_member_data = data.model_dump()
        
        try:
            await TeamMemberService._check_team_existence(team_member_data["team_id_fk"])
            user_data = await TeamMemberService._check_user_existence(team_member_data["user_id_fk"])
            await TeamMemberService._check_team_member_duplicate(team_member_data["team_id_fk"], team_member_data["user_id_fk"])
            
            team_member_data.pop("member_id", None)
            team_member = await prisma.team_members.create(team_member_data)

            email_service = EmailService()
            try:
                email_service.connect_smtp_server()

                receiver_email = user_data.email
                subject = "Welcome! Your Probationary Period Starts Now"
                body = """Congratulations on joining our team! Your skills have truly stood out, and we're excited to have you on board. As you settle into your new role, please be aware that you're currently in a probationary period.
                        During this time, we'll closely monitor your progress and ensure you're adjusting well to your responsibilities and our team dynamics.
                        Welcome aboard, and here's to a successful probationary period!\nRezumix"""

                email_service.send_email(receiver_email, subject, body)
            finally:
                email_service.disconnect_smtp_server()
            
            return {"message": "Team member added successfully", "Team member": team_member}
        except HTTPException as ex:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
        
    async def update_team_member(data):
        print("JFJFJFJJF")
        team_member_data = data.model_dump()
        print(team_member_data)
        
        try:
            await TeamMemberService._check_team_existence(team_member_data["team_id_fk"])
            user_data = await TeamMemberService._check_user_existence(team_member_data["user_id_fk"])
            member_data = await prisma.team_members.find_unique_or_raise(
                where={
                    "member_id": team_member_data["member_id"],
                    "team_id_fk": team_member_data["team_id_fk"],
                    "user_id_fk": team_member_data["user_id_fk"]
                    })
            
            team_member = await prisma.team_members.update(
                where={
                    "member_id": team_member_data["member_id"],
                    "team_id_fk": team_member_data["team_id_fk"],
                    "user_id_fk": team_member_data["user_id_fk"]},
                    data=team_member_data
                    )

            email_service = EmailService()
            try:
                email_service.connect_smtp_server()

                receiver_email = user_data.email
                subject = "Congratulations! You've Been Hired"
                body = """You have been hired and added to a team with the colleagues you will be working with. Your skills stood out, and we believe you'll make a valuable addition to our team.\nRezumix"""

                email_service.send_email(receiver_email, subject, body)
            finally:
                email_service.disconnect_smtp_server()
            
            return {"message": "Team member updated successfully", "Team member": team_member}
        except HTTPException as ex:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    async def remove_team_member(data):
        team_member_data = data.model_dump()
        print(team_member_data)

        try:
            await TeamMemberService._check_team_existence(team_member_data["team_id_fk"])
            team_member = await prisma.team_members.delete(
                where={"member_id": team_member_data["member_id"], "team_id_fk": team_member_data["team_id_fk"]}
            )

            if team_member is None:
                raise HTTPException(status_code=404, detail="User is not in this team")
            
            user_data = await TeamMemberService._check_user_existence(team_member.user_id_fk)
            
            email_service = EmailService()
            try:
                email_service.connect_smtp_server()

                receiver_email = user_data.email
                subject = "Dismissal from work"
                body = """This decision was made after careful consideration, taking into account various factors. We understand that this news may be disappointing, and we want to express our gratitude for the contributions you made during your time with us. Thank you for your contributions during your time with us.\nRezumix"""

                email_service.send_email(receiver_email, subject, body)
            finally:
                email_service.disconnect_smtp_server()

            return {"message": "Team member removed successfully", "Team member": team_member}
        except HTTPException as ex:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    async def _check_team_existence(team_id):
        try:
            await prisma.teams.find_unique(where={"team_id": team_id})
        except Exception as ex:
            raise HTTPException(status_code=404, detail="Team not found")

    async def _check_user_existence(user_id):
        try:
            user_data = await prisma.users.find_unique(where={"user_id": user_id})
        except Exception as ex:
            raise HTTPException(status_code=404, detail="User not found")
        return user_data

    async def _check_team_member_duplicate(team_id, user_id):
        team_member_duplicate = None
        try:
            team_member_duplicate = await prisma.team_members.find_first_or_raise(
                where={"team_id_fk": team_id, "user_id_fk": user_id}
            )
        except Exception as ex:
            pass

        if team_member_duplicate:
            raise HTTPException(status_code=409, detail="The user is already a member of the team")