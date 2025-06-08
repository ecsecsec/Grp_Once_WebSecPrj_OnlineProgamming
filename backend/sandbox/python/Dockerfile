# backend/sandbox/python/Dockerfile
FROM python:3.9-slim
# Tạo user không phải root
RUN useradd -ms /bin/bash appuser
# Không cần WORKDIR hay COPY gì ở đây, vì code sẽ được mount
# Không cần USER ở đây, vì lệnh docker run sẽ chỉ định user
# Không cần CMD, vì lệnh sẽ được truyền đầy đủ vào `docker run`