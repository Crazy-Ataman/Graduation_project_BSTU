from .routes import Routes
from app.routers import chat_router, llm_router, auth_router, user_router, resume_router, team_router, team_members_router

__routes__ = Routes(routers=(llm_router.router,
                              auth_router.router,
                                user_router.router,
                                  resume_router.router,
                                    team_router.router,
                                      team_members_router.router,
                                        chat_router.router))
