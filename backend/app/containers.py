from dependency_injector import containers, providers
from app.models.llm_models import (
    ParaphraseModel
)
from app.routers import llm_router
from app.models import llm_models

class ModelsContainer(containers.DeclarativeContainer):
    beautify_model = providers.DelegatedThreadSafeSingleton(
        ParaphraseModel
    )

def create_container() -> ModelsContainer:
    models_container = ModelsContainer()

    models_container.wire(
        modules=[
            __name__,
            llm_router,
            llm_models
        ]
    )

    return models_container
