# osprep-java: sandbox image for grading Java concurrency exercises.
# Temurin JDK 21 gives javac + java; `timeout` (coreutils) bounds runaway/deadlocked runs.
FROM eclipse-temurin:21-jdk

COPY grade.sh /usr/local/bin/grade
RUN chmod +x /usr/local/bin/grade

# Unprivileged user; /work is where the executor drops the submission + test driver.
RUN useradd -m runner && mkdir -p /work && chown runner:runner /work
WORKDIR /work
USER runner

ENTRYPOINT ["grade"]
