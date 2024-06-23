from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from dependency_injector.wiring import inject, Provide
from app.decorators.auth_decorators import check_roles
from app.models.llm_models_schemas import RequestModel
from app.routers.auth_router import oauth2_scheme

router = APIRouter(
    prefix='/llm'
)

class LLMRouter():
    @router.post('/paraphrase')
    @check_roles(["Administrator", "Applicant"])
    @inject
    async def paraphrase(
            request_body: RequestModel,
            token: str = Depends(oauth2_scheme),
            model=Depends(Provide['beautify_model'])
    ) -> JSONResponse:
        text = request_body.query
        mode = request_body.mode
        temp = request_body.temp
        num_return_sequences = request_body.num_return_sequences
        print(request_body)
        resp = model.get_response(text, mode, temp, num_return_sequences)
        response = JSONResponse(content={'response': resp, })

        return response
