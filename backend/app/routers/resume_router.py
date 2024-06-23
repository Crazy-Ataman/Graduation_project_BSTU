from math import e
from typing import Optional
from fastapi import FastAPI, HTTPException, Depends, status, APIRouter
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from fastapi_pagination import Page, paginate
from app.decorators.auth_decorators import check_roles
from app.prisma.prisma import prisma
from app.dtos.dto_resumes import DtoResumes
import os
from app.services.auth_service import AuthService
from app.services.resume_service import ResumeService
from app.services.user_service import UserService
from app.services.pdf_service import PDFBuilder
from app.routers.auth_router import oauth2_scheme
from fastapi.responses import FileResponse

router = APIRouter(
    prefix='/resume'
)

authService = AuthService()

class ResumeRouter():
    @router.post("/create/")
    @check_roles(["Administrator", "Applicant"])
    async def create_resume(data: dict, token: str = Depends(oauth2_scheme)):
        user_id = await UserService.get_user_id_by_email(email=AuthService().get_email_from_token(token))
        return await ResumeService.create_resume(ResumeService, data, user_id["user_id"])

    @router.put("/update/")
    @check_roles(["Administrator", "Applicant"])
    async def update_resume(data: dict, token: str = Depends(oauth2_scheme)):
        user_id = await UserService.get_user_id_by_email(email=AuthService().get_email_from_token(token))
        return await ResumeService.update_resume(ResumeService, data, user_id["user_id"])

    @router.delete("/delete/{resume_id}")
    @check_roles(["Administrator"])
    async def delete_resume(resume_id, token: str = Depends(oauth2_scheme)):
        return await ResumeService.delete_resume(resume_id)

    @router.get("/list/", response_model=Page[DtoResumes])
    @check_roles(["Administrator", "Employer", "Applicant"])
    async def list_resumes(
        token: str = Depends(oauth2_scheme),
        minExperience: Optional[float] = 0.0,
        maxExperience: Optional[float] = 99.0,
        experience: Optional[str] = None,
        programming_language: Optional[str] = None,
    ):
        resumes = await ResumeService.get_resumes(ResumeService, minExperience=minExperience, maxExperience=maxExperience, experience=experience, programming_language=programming_language)
        return paginate(resumes)

    @router.get("/pdf/{user_id}")
    @check_roles(["Administrator", "Employer", "Applicant"])
    async def create_pdf_resume(user_id, token: str = Depends(oauth2_scheme)):
        try:
            user_data = await prisma.users.find_unique(where={"user_id": user_id})
        except Exception as ex:
            raise HTTPException(status_code=404, detail="User with this id not found")
        try:
            resume_data = await prisma.resumes.find_first_or_raise(where={"user_id_fk": user_id})
            skill_data = await prisma.skills.find_first_or_raise(where={"resume_id_fk": resume_data.resume_id})
            programming_language_data = await prisma.programming_languages.find_many(where={"skill_id_fk": skill_data.skill_id})

            programming_language_only_names = []
            for lang in programming_language_data:
                programming_language_only_names.append(lang.programming_language)

            experience_data = []
            for language in programming_language_data:
                experience_data.extend(await prisma.experiences.find_many(where={"programming_language_id_fk": language.programming_language_id}))
            
            experience_only_necessary_data = []
            for exp in experience_data:
                necessary_data = {
                    "start_date": exp.start_date,
                    "end_date": exp.end_date,
                    "experience": exp.experience,
                    "level": exp.level,
                }
                experience_only_necessary_data.append(necessary_data)

            company_data = []
            for experience in experience_data:
                if(experience.start_date == None):
                    company_data.append(None)
                else:
                    company_data.extend(await prisma.companies.find_many(where={"experience_id_fk": experience.experience_id}))

            company_only_names = []
            for comp in company_data:
                if(comp == None):
                    company_only_names.append(comp)
                else:
                    company_only_names.append(comp.name)

        except Exception as ex:
            raise HTTPException(status_code=404, detail="Resume for convert to pdf not found")
        
        PDFBuilder.pdf_resume(user_data, resume_data, programming_language_only_names, experience_only_necessary_data, company_only_names)
        pdf_path = os.getenv("OUTPUT_PATH") + "resume.pdf"
        try:
            return FileResponse(pdf_path, filename="resume.pdf", media_type="application/pdf")
        except Exception as e:
            raise HTTPException(status_code=500, detail="Error while generating or serving PDF")
        
    @router.get("/userResume/")
    @check_roles(["Administrator", "Applicant"])
    async def get_user_resume(token: str = Depends(oauth2_scheme)):
        user_id = await UserService.get_user_id_by_email(email=AuthService().get_email_from_token(token))
        try:
            resume = await prisma.resumes.find_first_or_raise(where={"user_id_fk": user_id["user_id"]})
            skills = await prisma.skills.find_first_or_raise(
                        where={"resume_id_fk": resume.resume_id})
            programming_languages = await prisma.programming_languages.find_many(
                        where={"skill_id_fk": skills.skill_id})
            
            experiences = []
            for lang in programming_languages:
                experiences.append(await prisma.experiences.find_first(
                    where={"programming_language_id_fk": lang.programming_language_id}))

            companies = []
            for exp in experiences:
                companies.append(await prisma.companies.find_first(
                    where={"experience_id_fk": exp.experience_id}))
        except Exception as ex:
            print(ex)
            return None
        return resume, skills, programming_languages, experiences, companies

    @router.get("/statistics")
    @check_roles(["Administrator", "Employer", "Applicant"])
    async def get_statistics(token: str = Depends(oauth2_scheme)):
        languages_hired_statistics = await ResumeService.get_hired_applicants_languages()
        languages_resumes_statistics = await ResumeService.get_resumes_languages()
        experiences_statistics = await ResumeService.get_resumes_experiences()
        return {"languages_hired_statistics": languages_hired_statistics,
                    "languages_resumes_statistics":languages_resumes_statistics,
                    "experiences_statistics":experiences_statistics}

    @router.get("/get-resume/{resume_id}")
    @check_roles(["Administrator", "Employer", "Applicant"])
    async def get_resume_by_resume_id(resume_id, token: str = Depends(oauth2_scheme)):
        test = await ResumeService.get_resume_by_resume_id(resume_id)
        return test
