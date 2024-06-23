from collections import Counter
from operator import itemgetter
from typing import Optional
import fastapi as fastapi
from fastapi import testclient
import jwt as jwt
from dateutil.relativedelta import relativedelta
from fastapi import HTTPException
from numpy import place
from app.prisma.prisma import prisma
from app.dtos.dto_resumes import DtoResumes
from app.dtos.dto_skills import DtoSkills
from app.dtos.dto_experiences import DtoExperiences
from app.dtos.dto_programming_languages import DtoProgrammingLanguages
from app.dtos.dto_companies import DtoCompanies


class ResumeService:
    def parse_resume_prog_lang(self, data: dict):
        programming_languages_data = data.get("programming_languages_data", {}) 
        if(not programming_languages_data):
            raise HTTPException(status_code=422, detail=str("Programming languages data is empty!"))
        
        parsed_programming_languages = []
        for language_data in programming_languages_data:
            programming_language = DtoProgrammingLanguages(**language_data).model_dump()
            programming_language.pop("programming_language_id", None)
            parsed_programming_languages.append(programming_language)

        return parsed_programming_languages
    
    def parse_resume_exp(self, data: dict):
        experiences_data = data.get("experiences_data", {}) 

        parsed_experiences = []
        for experience_var in experiences_data:
            experience = DtoExperiences(**experience_var).model_dump()
            experience.pop("experience_id", None)

            delta = relativedelta(experience['end_date'], experience['start_date'])
            total_days = delta.days + delta.years * 365.25 + delta.months * 30.44
            difference_in_years = round(total_days / 365.25, 1)

            experience.update({"experience": difference_in_years})
            parsed_experiences.append(experience)

        return parsed_experiences
    
    def parse_resume_comp(self, data: dict):
        companies_data = data.get("companies_data", {}) 

        parsed_companies = []
        for company_var in companies_data:
            company = DtoCompanies(**company_var).model_dump()
            company.pop("company_id", None)
            parsed_companies.append(company)

        return parsed_companies
    
    async def get_resumes_without_duplicates(self, data):
        try:
            resume_ids = [experience.programming_languages.skills.resume_id_fk for experience in data
                            if experience.programming_languages is not None]

            unique_resume_ids = list(set(resume_ids))

            resumes = await prisma.resumes.find_many(
                where={
                    "resume_id": {"in": unique_resume_ids},
                    "visibility": "visible"
                }
            )
        except Exception as ex:
            print(ex)


        return resumes

    async def create_resume(self, data: dict, user_id):
        resume_data = data.get("resume_data", {}) 

        if(not resume_data):
            raise HTTPException(status_code=422, detail=str("Resume data is empty!"))

        resume_data = DtoResumes(**resume_data).model_dump()

        try:
            resume_existing = await prisma.resumes.find_first_or_raise(where={"user_id_fk": user_id})
            print(resume_existing)
            # if resume exist => raise error
            raise HTTPException(status_code=400, detail="Resume has already been created")
        except HTTPException:
            raise
        except Exception as ex:
            resume_existing = None


        lang_data = self.parse_resume_prog_lang(self, data)
        exp_data = self.parse_resume_exp(self, data)
        comp_data = self.parse_resume_comp(self, data)

        resume_data["user_id_fk"] = user_id
        resume_data.pop("resume_id", None)
        try:
            resume = await prisma.resumes.create(resume_data)
            skills = await prisma.skills.create(data={"resume_id_fk": resume.resume_id})

            programming_languages = []
            for programming_language in lang_data:
                programming_language["skill_id_fk"] = skills.skill_id
                programming_languages.append(await prisma.programming_languages.create(programming_language))
            
            experiences = []
            for programming_language, experience in zip(programming_languages, exp_data):
                experience["programming_language_id_fk"] = programming_language.programming_language_id
                experiences.append(await prisma.experiences.create(experience))

            companies = []
            for experience, company in zip(experiences, comp_data):
                print(company)
                if(company["name"] == ""):
                    pass
                else:
                    company["experience_id_fk"] = experience.experience_id
                    companies.append(await prisma.companies.create(company))

            return {"message": "Resume created successfully", "resume": resume, "skills": skills}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    async def update_resume(self, data: dict, user_id):
        resume_data_updated = data.get("resume_data", {}) 
        print(resume_data_updated)

        if(not resume_data_updated):
            raise HTTPException(status_code=422, detail=str("Resume data is empty!"))

        resume_data_updated = DtoResumes(**resume_data_updated).model_dump()

        try:
            resume_existing = await prisma.resumes.find_first_or_raise(where={"user_id_fk": user_id})
        except Exception as ex:
            # if resume not exist => raise error
            raise HTTPException(status_code=400, detail="Resume for update not found")

        resume_data_updated["resume_id"] = resume_existing.resume_id
        resume_data_updated["user_id_fk"] = resume_existing.user_id_fk
        resume = await prisma.resumes.update(where={"resume_id": resume_existing.resume_id}, data=resume_data_updated)


        lang_data_updated = self.parse_resume_prog_lang(self, data)
        exp_data_updated = self.parse_resume_exp(self, data)
        comp_data_updated = self.parse_resume_comp(self, data)
        
        try:
            skills = await prisma.skills.find_first_or_raise(
                    where={"resume_id_fk": resume_existing.resume_id})

            programming_languages_old = await prisma.programming_languages.find_many(
                    where={"skill_id_fk": skills.skill_id})

            languages = [{"programming_language": item.programming_language,
                          "programming_language_id": item.programming_language_id} 
                            for item in programming_languages_old]

            for item in lang_data_updated:
                if item['programming_language'] not in [lang_dict["programming_language"] for lang_dict in languages]:
                    item["skill_id_fk"] = skills.skill_id
                    language_new = await prisma.programming_languages.create(item)
                    languages.append({"programming_language": language_new.programming_language, "programming_language_id": language_new.programming_language_id})

            new_languages = []
            for item in lang_data_updated:
                for lang_dict in languages:
                    if lang_dict["programming_language"] == item['programming_language']:
                        new_languages.append(lang_dict)
                        break

            for language_dict in languages[:]:
                language = language_dict["programming_language"]
                if language not in [item['programming_language'] for item in lang_data_updated]:
                    language_id = language_dict["programming_language_id"]
                    await prisma.programming_languages.delete(where={"programming_language_id": language_id})
                    languages.remove(language_dict)

            languages = new_languages

            for language in languages:
                try:
                    experience = await prisma.experiences.find_first_or_raise(where={"programming_language_id_fk": language["programming_language_id"]})
                    await prisma.experiences.delete(where={"experience_id": experience.experience_id})
                except Exception as ex:
                    pass

            experiences = []
            for programming_language, experience in zip(languages, exp_data_updated):
                experience["programming_language_id_fk"] = programming_language["programming_language_id"]
                experiences.append(await prisma.experiences.create(experience))

            companies = []
            for experience, company in zip(experiences, comp_data_updated):
                company["experience_id_fk"] = experience.experience_id
                companies.append(await prisma.companies.create(company))

            return {"message": "Resume updated successfully", "resume": resume_data_updated, "skills": skills}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    async def delete_resume(resume_id):
        try:
            resume_existing = await prisma.resumes.find_first_or_raise(where={"resume_id": resume_id})
        except Exception as ex:
            resume_existing = None

        if not resume_existing:
            raise HTTPException(status_code=404, detail="Resume for delete not found")

        try:
            resume_response = await prisma.resumes.delete(
                where={"resume_id": resume_existing.resume_id}
            )
            return {"message": "Resume deleted successfully", "resume": resume_response}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    async def get_resumes(self, minExperience: Optional[float] = 0.0, maxExperience: Optional[float] = 99.0, experience: Optional[str] = None, programming_language: Optional[str] = None):
        try:
            parsed_programming_language = ''

            if programming_language:
                parsed_programming_language = programming_language.split(',')

            match experience is None, len(parsed_programming_language):
                case True, 0:
                    response = await prisma.experiences.find_many(
                            where={
                                'experience': {'gte': minExperience, 'lte': maxExperience}
                            },
                            include={
                                'programming_languages': {
                                    'include': {
                                        'skills': True
                                    }
                                }
                            })
                    resumes = await self.get_resumes_without_duplicates(self, response)
                    print(resumes)
                    return resumes
                case True, _:
                    response = await prisma.experiences.find_many(
                            where={
                                'experience': {'gte': minExperience, 'lte': maxExperience}
                            },
                            include={
                                'programming_languages': {
                                    'where': {
                                        'programming_language': {'in': parsed_programming_language}
                                    },
                                    'include': {
                                        'skills': True
                                    }
                                }
                            })
                    resumes = await self.get_resumes_without_duplicates(self, response)
                    print(resumes)
                    return resumes
                case False, 0:
                    response = await prisma.experiences.find_many(
                            where={
                                'experience': {'gte': minExperience, 'lte': maxExperience},
                                'level': {'in': [experience]}
                            },
                            include={
                                'programming_languages': {
                                    'include': {
                                        'skills': True
                                    }
                                }
                            })
                    resumes = await self.get_resumes_without_duplicates(self, response)
                    print(resumes)
                    return resumes
                case False, _:
                    response = await prisma.experiences.find_many(
                        where={
                                'experience': {'gte': minExperience, 'lte': maxExperience},
                                'level': {'in': [experience]}
                            },
                        include={
                            'programming_languages': {
                                'where': {
                                    'programming_language': {'in': parsed_programming_language}
                                },
                                'include': {
                                    'skills': True
                                }
                            }
                        })
                    resumes = await self.get_resumes_without_duplicates(self, response)
                    return resumes

            # test = await prisma.experiences.find_many(
            #             where={
            #                     'experience': {'gte': parsed_experience[0], 'lte': parsed_experience[1]},
            #                     'level': {'in': [parsed_experience[2]]}
            #                 },
            #                 include={
            #                     'programming_languages': {
            #                         'where': {
            #                             'programming_language': {'contains': programming_language}
            #                         }
            #                     }
            #                 })
            # print(test)

            # print(repr(tuple(map(str, parsed_programming_language))))

            # test = await prisma.experiences.query_raw(
            #     f"""SELECT *
            #         FROM experiences e
            #         JOIN programming_languages pl ON e.programming_language_id_fk = pl.programming_language_id
            #         WHERE pl.programming_language IN {repr(tuple(map(str, parsed_programming_language)))}
            #         GROUP BY e.experience_id, pl.programming_language_id
            #         HAVING COUNT(DISTINCT pl.programming_language) >= (SELECT COUNT(*) FROM (VALUES {repr(tuple(map(str, parsed_programming_language)))}) AS v(programming_language));"""
            #     )
            # print(test)

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
        
    async def get_hired_applicants_languages():
        team_members_hired = await prisma.team_members.find_many(
            where={"status": "hired"})
        teams = []
        for team_member in team_members_hired:
            if not any(team.team_id == team_member.team_id_fk for team in teams):
                teams.append(await prisma.teams.find_unique(where={"team_id": team_member.team_id_fk}))

        language_counts = {}
        for team in teams:
            languages = [lang.strip() for lang in team.important_languages.split(',')]
            for language in languages:
                if language not in language_counts:
                    count = sum(1 for tm in team_members_hired if tm.team_id_fk == team.team_id)
                    language_counts[language] = count
                else:
                    language_counts[language] += sum(1 for tm in team_members_hired if tm.team_id_fk == team.team_id)

        return language_counts

    async def get_resumes_languages():
        resumes = await prisma.resumes.find_many(where={"visibility": "visible"})
        skills = []
        for resume in resumes:
            skills.extend(await prisma.skills.find_many(
                    where={"resume_id_fk": resume.resume_id}))
        
        programming_languages = []
        for skill in skills:    
            programming_languages.extend(await prisma.programming_languages.find_many(
                where={"skill_id_fk": skill.skill_id}))
    
        language_counts = {}    
        for lang in programming_languages:
            if lang.programming_language not in language_counts:
                language_counts[lang.programming_language] = 1
            else:
                language_counts[lang.programming_language] += 1

        return language_counts

    async def get_resumes_experiences():
        resumes = await prisma.resumes.find_many(where={"visibility": "visible"})
        skills = []
        for resume in resumes:
            skills.extend(await prisma.skills.find_many(
                    where={"resume_id_fk": resume.resume_id}))
        
        programming_languages = []
        for skill in skills:    
            programming_languages.extend(await prisma.programming_languages.find_many(
                where={"skill_id_fk": skill.skill_id}))
    
        experiences = []
        for lang in programming_languages:
            experiences.append(await prisma.experiences.find_first_or_raise(
                where={"programming_language_id_fk": lang.programming_language_id}
            ))

        experience_levels = []
        for exp in experiences:
            if exp.experience >= 10:
                experience_levels.append("10+")
            elif exp.experience >= 5:
                experience_levels.append("5+")
            elif exp.experience >= 2:
                experience_levels.append("2+")
            else:
                experience_levels.append("<2")

        level_counts = Counter(experience_levels)
        experience_list = [{'level': level, 'count': count} for level, count in level_counts.items()]
        level_counts_direct = Counter(exp.level for exp in experiences)
        level_list = [{'level': level, 'count': count} for level, count in level_counts_direct.items()]

        def sort_levels(level):
            if level == "<2":
                return 0
            elif level == "2+":
                return 1
            elif level == "5+":
                return 2
            elif level == "10+":
                return 3
            else:
                return 4

        experience_list_sorted = sorted(experience_list, key=lambda x: sort_levels(x['level']))

        return experience_list_sorted, level_list
    
    async def get_resume_by_resume_id(resume_id):
        try:
            resume = await prisma.resumes.find_unique_or_raise(
                where={"resume_id": resume_id,
                        "visibility": "visible"},
                include={
                    'skills': {
                        'include': {
                            'programming_languages': {
                                'include': {
                                    'experiences': {
                                        'include': {
                                            'companies': True
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            )
        except Exception as ex:
            raise HTTPException(status_code=404, detail="Resume not found or hidden")
        return resume