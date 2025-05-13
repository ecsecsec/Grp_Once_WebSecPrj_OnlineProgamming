import subprocess
import os
import uuid
import resource
from django.conf import settings

def run_code(source_code, language, input_data, time_limit, memory_limit):
    file_id = str(uuid.uuid4())
    work_dir = f"/tmp/{file_id}"
    os.makedirs(work_dir, exist_ok=True)

    # File mapping
    if language == 'cpp':
        code_file = f"{work_dir}/main.cpp"
        exec_file = f"{work_dir}/main"
        with open(code_file, "w") as f:
            f.write(source_code)
        compile_cmd = ["g++", code_file, "-o", exec_file]
    elif language == 'java':
        code_file = f"{work_dir}/Main.java"
        with open(code_file, "w") as f:
            f.write(source_code)
        compile_cmd = ["javac", code_file]
        exec_file = ["java", "-cp", work_dir, "Main"]
    elif language == 'py':
        code_file = f"{work_dir}/main.py"
        with open(code_file, "w") as f:
            f.write(source_code)
        exec_file = ["python3", code_file]
        compile_cmd = None
    else:
        return "Unsupported Language"

    # Compile if needed
    if compile_cmd:
        result = subprocess.run(compile_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if result.returncode != 0:
            return "Compilation Error"

    # Run program
    try:
        def set_limits():
            resource.setrlimit(resource.RLIMIT_AS, (memory_limit * 1024 * 1024, resource.RLIM_INFINITY))

        result = subprocess.run(
            exec_file if isinstance(exec_file, list) else [exec_file],
            input=input_data.encode(),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=time_limit,
            preexec_fn=set_limits
        )
        if result.returncode != 0:
            return "Runtime Error"
        return result.stdout.decode().strip()
    except subprocess.TimeoutExpired:
        return "Time Limit Exceeded"
    except MemoryError:
        return "Memory Limit Exceeded"
    except Exception:
        return "Runtime Error"
