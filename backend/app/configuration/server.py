from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import __routes__

class Server:
    __app: FastAPI

    def __init__(self, app: FastAPI):
        self.__app = app

        app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
        )

        self.__register_routs(app)

    def get_app(self) -> FastAPI:
        return self.__app

    @staticmethod
    def __register_routs(app):
        __routes__.register_routs(app)
