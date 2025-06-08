# backend/sandbox/python/runner.py
import sys
import os

# Đường dẫn mà dockerService.js sẽ mount code và input của người dùng vào
SUBMISSION_DIR = "/submission_data" # Phải khớp với Binds trong dockerService.js
USER_CODE_FILE = os.path.join(SUBMISSION_DIR, "user_code.py") # Tên file code của người dùng
INPUT_FILE = os.path.join(SUBMISSION_DIR, "input.txt")
ERROR_FILE = os.path.join(SUBMISSION_DIR, "error.txt") # Ghi lỗi ra thư mục mount để host có thể đọc
OUTPUT_FILE = os.path.join(SUBMISSION_DIR, "output.txt") # Ghi stdout ra thư mục mount

# Chuyển hướng stdout và stderr để bắt output
original_stdout = sys.stdout
original_stderr = sys.stderr

# Tạo file output.txt và error.txt trong thư mục mount
# để host có thể dễ dàng lấy kết quả
# dockerService.js sẽ đọc từ các file này thay vì cố gắng bắt stream phức tạp.
# Đây là một cách đơn giản hóa việc lấy output/error.
# Hoặc, bạn có thể để runner.py in ra stdout/stderr chuẩn,
# và dockerService.js sẽ bắt stream như trong ví dụ trước của tôi.
# Chọn cách nào tùy thuộc vào bạn thấy dễ quản lý hơn.
# Hiện tại, tôi sẽ giữ cách in ra stdout/stderr chuẩn và để dockerService bắt.

try:
    if not os.path.exists(USER_CODE_FILE):
        raise FileNotFoundError(f"User code file not found: {USER_CODE_FILE}")
    if not os.path.exists(INPUT_FILE):
        # Nếu không có input.txt, coi như input rỗng
        input_data = ""
    else:
        with open(INPUT_FILE, "r") as f:
            input_data = f.read()

    # Ghi đè builtins.input
    import builtins
    # Nếu input_data có nhiều dòng, cần xử lý cho các lần gọi input() liên tiếp
    input_lines = iter(input_data.splitlines())
    builtins.input = lambda: next(input_lines, '') # Trả về dòng tiếp theo, hoặc '' nếu hết dòng

    # Thực thi user_code.py
    # Đọc code từ file thay vì dùng open().read() trong exec trực tiếp để dễ debug hơn
    with open(USER_CODE_FILE, 'r') as f_code:
        user_code_content = f_code.read()
    
    # Tạo một global dict riêng cho code người dùng để hạn chế quyền truy cập
    user_globals = {"__builtins__": builtins} # Chỉ cho phép builtins cơ bản

    # Bắt stdout và stderr của user_code
    # (Phần này có thể không cần nếu bạn để dockerService.js bắt stream trực tiếp từ container)
    # Nếu bạn muốn runner.py tự quản lý output file:
    # with open(OUTPUT_FILE, "w") as stdout_f, open(ERROR_FILE, "w") as stderr_f:
    #    sys.stdout = stdout_f
    #    sys.stderr = stderr_f
    #    exec(user_code_content, user_globals)

    # Cách đơn giản hơn: để code người dùng in ra stdout/stderr chuẩn của container
    exec(user_code_content, user_globals)

except Exception as e:
    # In lỗi ra stderr chuẩn của container để dockerService có thể bắt
    print(str(e), file=sys.stderr)
    sys.exit(1) # Exit với mã lỗi để báo hiệu có lỗi runtime
finally:
    # Khôi phục stdout/stderr gốc (nếu đã thay đổi)
    sys.stdout = original_stdout
    sys.stderr = original_stderr