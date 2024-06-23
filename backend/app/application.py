from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.configuration.server import Server
from app.containers import create_container
from app.prisma.prisma import prisma
from fastapi_pagination import add_pagination

"""
    The new function which replace @app.on_event("startup") and @app.on_event("shutdown")
"""
@asynccontextmanager
async def lifespan(application: FastAPI):
    print("Prisma is connecting")
    await prisma.connect()
    # stop execution of function and send values
    # but retain state to enable, for continue function executing
    yield 
    print("Prisma is disconnecting")
    await prisma.disconnect()

def create_app(_=None) -> FastAPI:
    app = FastAPI(debug=True, lifespan=lifespan)

    app = Server(app).get_app()

    container = create_container()
    app.container = container

    add_pagination(app)

    return app



app = create_app()


