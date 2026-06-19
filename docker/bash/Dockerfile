# osprep-bash: sandbox image for grading Bash exercises.
# Carries bash, shellcheck (syntax/lint), bats (behavioral tests) and jq (JSON out).
FROM alpine:3.20

RUN apk add --no-cache bash shellcheck bats jq coreutils grep sed gawk

COPY grade.sh /usr/local/bin/grade
RUN chmod +x /usr/local/bin/grade

# Run as an unprivileged user; /work is where the executor drops the submission.
RUN adduser -D -h /work runner
WORKDIR /work
USER runner

ENTRYPOINT ["grade"]
