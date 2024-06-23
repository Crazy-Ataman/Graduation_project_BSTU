from fastapi import HTTPException, Depends
from functools import wraps
from app.prisma.prisma import prisma
from app.services.auth_service import AuthService

def check_roles(expected_roles: list):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            token = kwargs.get('token')
            if token is None:
                raise HTTPException(status_code=401, detail="Unauthorized: Token missing")

            user_role = await AuthService().get_role_from_token(token)
            print(user_role)
            print(expected_roles)
            if user_role not in expected_roles:
                raise HTTPException(status_code=403, detail="Forbidden: Insufficient role")
            
            email = AuthService().get_email_from_token(token)
            user = await prisma.users.find_unique(where={"email": email})
            if (not user.is_approved):
                raise HTTPException(status_code=403, detail="Forbidden: Your account has not yet been approved by the administrator")

            return await func(*args, **kwargs)

        return wrapper

    return decorator
