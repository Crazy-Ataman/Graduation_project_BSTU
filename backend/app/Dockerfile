FROM python:3.11.8-slim

ENV PYTHONUNBUFFERED 1

RUN mkdir /app

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir --ignore-installed -r requirements.txt

RUN pip install -U prisma

COPY . ./app

WORKDIR /app/app

RUN prisma generate

WORKDIR /app

CMD ["uvicorn", "app.application:app", "--host", "0.0.0.0", "--port", "7676", "--reload"]