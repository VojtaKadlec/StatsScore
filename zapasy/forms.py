from django import forms
from stats.models import Stats

class GoalForm(forms.ModelForm):
    class Meta:
        model = Stats
        fields = ['hrac', 'goly']

    def __init__(self, *args, **kwargs):
        super(GoalForm, self).__init__(*args, **kwargs)
        self.fields['hrac'].widget = forms.HiddenInput()

class CardForm(forms.ModelForm):
    class Meta:
        model = Stats
        fields = ['hrac', 'zlute_karty', 'trestne_minuty']

    def __init__(self, *args, **kwargs):
        super(CardForm, self).__init__(*args, **kwargs)
        self.fields['hrac'].widget = forms.HiddenInput()