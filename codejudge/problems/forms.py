from django import forms
from .models import Problem, Submission

class ProblemForm(forms.ModelForm):
    class Meta:
        model = Problem
        exclude = ['creator']

class SubmissionForm(forms.ModelForm):
    class Meta:
        model = Submission
        fields = ['code', 'language']
