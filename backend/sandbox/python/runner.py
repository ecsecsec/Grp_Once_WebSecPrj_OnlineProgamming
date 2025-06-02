with open("input.txt", "r") as f:
    input_data = f.read()

try:
    # Giả sử user_code.py có hàm main() đọc từ input()
    exec(open("user_code.py").read())
except Exception as e:
    with open("error.txt", "w") as f:
        f.write(str(e))
