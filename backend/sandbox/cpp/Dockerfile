FROM gcc:latest
WORKDIR /app
COPY runner.cpp .
RUN g++ runner.cpp -o runner
ENTRYPOINT ["./runner"]
