FROM python:3.12-slim
WORKDIR /srv/catalog
COPY products.txt .
EXPOSE 9000
CMD ["python3", "-m", "http.server", "9000", "--directory", "/srv/catalog"]
