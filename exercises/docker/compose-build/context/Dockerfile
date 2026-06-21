FROM python:3.12-slim
WORKDIR /srv
COPY page.html .
EXPOSE 8000
CMD ["python3", "-m", "http.server", "8000"]
