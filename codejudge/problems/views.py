from django.shortcuts import render, redirect, get_object_or_404
from .models import Problem
from .forms import ProblemForm, SubmissionForm
from django.contrib.auth.decorators import login_required
from .judge import run_code
import os

# Create your views here.

@login_required
def problem_list(request):
    problems = Problem.objects.all()
    return render(request, 'problems/list.html', {'problems': problems})

@login_required
def problem_detail(request, pk):
    problem = get_object_or_404(Problem, pk=pk)
    if request.method == 'POST':
        form = SubmissionForm(request.POST)
        if form.is_valid():
            submission = form.save(commit=False)
            submission.user = request.user
            submission.problem = problem
            submission.status = 'Pending'
            submission.save()

            # Load and run test cases
            base_dir = f"media/testcases/{problem.id}"
            test_count = len([f for f in os.listdir(base_dir) if f.startswith('input')])
            passed_all = True

            for i in range(1, test_count + 1):
                with open(f"{base_dir}/input{i}.txt") as fin:
                    input_data = fin.read()
                with open(f"{base_dir}/output{i}.txt") as fout:
                    expected = fout.read().strip()

                result = run_code(
                    source_code=submission.code,
                    language=submission.language,
                    input_data=input_data,
                    time_limit=problem.time_limit,
                    memory_limit=problem.memory_limit
                )

                if result in ["Compilation Error", "Runtime Error", "Time Limit Exceeded", "Memory Limit Exceeded"]:
                    submission.status = result
                    passed_all = False
                    break
                elif result.strip() != expected:
                    submission.status = "Wrong Answer"
                    passed_all = False
                    break

            if passed_all:
                submission.status = "Accepted"

            submission.save()
            return redirect('problem_list')
    else:
        form = SubmissionForm()
    return render(request, 'problems/detail.html', {'problem': problem, 'form': form})

@login_required
def create_problem(request):
    if not request.user.is_creator() and not request.user.is_admin():
        return redirect('problem_list')

    if request.method == 'POST':
        form = ProblemForm(request.POST)
        if form.is_valid():
            problem = form.save(commit=False)
            problem.creator = request.user
            problem.save()
            return redirect('problem_list')
    else:
        form = ProblemForm()
    return render(request, 'problems/create.html', {'form': form})
