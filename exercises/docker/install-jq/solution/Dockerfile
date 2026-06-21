FROM debian:12-slim
WORKDIR /app
COPY data.json show.sh ./
RUN apt-get update && apt-get install -y jq && rm -rf /var/lib/apt/lists/*
CMD ["sh", "show.sh"]
