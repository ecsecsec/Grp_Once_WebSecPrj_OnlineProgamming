try:
    with open("input.txt", "r") as f:
        input_data = f.read()

    # Cung cấp input() cho user_code
    import builtins
    builtins.input = lambda: input_data.strip()

    # Thực thi user_code.py
    exec(open("user_code.py").read())
except Exception as e:
    with open("error.txt", "w") as f:
        f.write(str(e))
