# Grp_Once_WebSecPrj_OnlineProgamming

xong docker => them capcha => 
admin page:

	quản lý được người dung: (trang riêng gồm 1 list các user, bên cạnh là các nút tương ứng với các chức năng)
 
		cấp quyền
  
		xóa tài khoản
  
		đổi mk
  
		qly bài tập (toàn bộ bài tập) (trang riêng)


			
quản lý bài tập:

		sửa testcase
  
		có tất cả các quyền xử lý đối với problem

thay đổi mk, thông tin người dùng

[database](https://drawsql.app/teams/none-3464/diagrams/web-competitive-programming)

. Build Image cho Python:

Lệnh:

docker build -t my-python-runner:v1 -f backend/sandbox/python/Dockerfile backend/sandbox/python
Use code with caution.
Bash
Giải thích:

docker build: Lệnh để build image.

-t my-python-runner:v1: Đặt tên (tag) cho image là my-python-runner và phiên bản (tag) là v1. Bạn có thể chọn tên và tag khác nếu muốn. Quan trọng: Tên này phải khớp với LANG_CONFIG.python.dockerImage trong runInDocker.js của bạn.

-f backend/sandbox/python/Dockerfile: Chỉ định rõ đường dẫn đến file Dockerfile cần sử dụng.

backend/sandbox/python: Đây là "build context". Docker sẽ gửi toàn bộ nội dung của thư mục này (và các thư mục con của nó, nếu có) đến Docker daemon để build image. Trong trường hợp này, context chỉ chứa Dockerfile nên không có gì nhiều được gửi đi.

2. Build Image cho C++:

Lệnh:

docker build -t my-gcc-runner:v1 -f backend/sandbox/cpp/Dockerfile backend/sandbox/cpp
Use code with caution.
Bash
Giải thích:

Tương tự như trên, đặt tên image là my-gcc-runner với tag v1. Đảm bảo tên này khớp với LANG_CONFIG.c_cpp.dockerImage.

3. Build Image cho Java:

Lệnh:

docker build -t my-java-runner:v1 -f backend/sandbox/java/Dockerfile backend/sandbox/java
Use code with caution.
Bash
Giải thích:

Tương tự, đặt tên image là my-java-runner với tag v1. Đảm bảo tên này khớp với LANG_CONFIG.java.dockerImage.
