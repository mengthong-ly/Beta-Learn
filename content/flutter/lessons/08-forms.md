---
title: Forms and validation
section: 2 · Material, themes & forms
---

Users type the wrong thing. A `Form` groups input fields so you can check them all at once and show an error message under each field that's wrong.

## Form, key and validator

Three pieces work together:

1. A `Form` widget with a `GlobalKey<FormState>`. The key lets you reach the form's state from a button.
2. `TextFormField`s, each with a `validator`. It returns `null` when the input is valid, or an error message `String` when it isn't.
3. A submit button that calls `_formKey.currentState!.validate()`.

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: Scaffold(body: NameForm())));
}

class NameForm extends StatefulWidget {
  const NameForm({super.key});

  @override
  State<NameForm> createState() => _NameFormState();
}

class _NameFormState extends State<NameForm> {
  final _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextFormField(
              decoration: const InputDecoration(labelText: 'Name'),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter some text';
                }
                return null;
              },
            ),
            ElevatedButton(
              onPressed: () {
                if (_formKey.currentState!.validate()) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Processing Data')),
                  );
                }
              },
              child: const Text('Submit'),
            ),
          ],
        ),
      ),
    );
  }
}
```

Press **Submit** with the field empty: the error appears under it. `validate()` runs every field's validator. If all return `null` it returns `true`; otherwise it rebuilds the form to show the messages and returns `false`.

## Several fields

Each field validates itself, so one `validate()` call checks the whole form. A validator is a plain function, so it can use any Dart logic:

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: Scaffold(body: SignUp())));
}

class SignUp extends StatefulWidget {
  const SignUp({super.key});

  @override
  State<SignUp> createState() => _SignUpState();
}

class _SignUpState extends State<SignUp> {
  final _formKey = GlobalKey<FormState>();

  String? _required(String? value) =>
      value == null || value.trim().isEmpty ? 'Required' : null;

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          TextFormField(
            decoration: const InputDecoration(labelText: 'Username'),
            validator: _required,
          ),
          TextFormField(
            decoration: const InputDecoration(labelText: 'Age'),
            keyboardType: TextInputType.number,
            validator: (value) {
              final age = int.tryParse(value ?? '');
              if (age == null) return 'Enter a number';
              if (age < 13) return 'You must be 13 or older';
              return null;
            },
          ),
          TextButton(
            onPressed: () => _formKey.currentState!.validate(),
            child: const Text('Check'),
          ),
        ],
      ),
    );
  }
}
```

💡 **Tip:** use `GlobalKey<FormState>()`, not a key typed with your own state class. `FormState` is what has `validate()`.

## Challenge

> 🎯 **Challenge:** The sign-up form accepts anything. Add a `validator` to the email field that returns `Enter an email` when the text doesn't contain `@`, and only show the `Signed up` SnackBar when the form is valid.

```dart starter
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: Scaffold(body: EmailForm())));
}

class EmailForm extends StatefulWidget {
  const EmailForm({super.key});

  @override
  State<EmailForm> createState() => _EmailFormState();
}

class _EmailFormState extends State<EmailForm> {
  final _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          TextFormField(decoration: const InputDecoration(labelText: 'Email')),
          ElevatedButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Signed up')),
              );
            },
            child: const Text('Sign up'),
          ),
        ],
      ),
    );
  }
}
```

```dart solution
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: Scaffold(body: EmailForm())));
}

class EmailForm extends StatefulWidget {
  const EmailForm({super.key});

  @override
  State<EmailForm> createState() => _EmailFormState();
}

class _EmailFormState extends State<EmailForm> {
  final _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          TextFormField(
            decoration: const InputDecoration(labelText: 'Email'),
            validator: (value) =>
                value == null || !value.contains('@') ? 'Enter an email' : null,
          ),
          ElevatedButton(
            onPressed: () {
              if (_formKey.currentState!.validate()) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Signed up')),
                );
              }
            },
            child: const Text('Sign up'),
          ),
        ],
      ),
    );
  }
}
```

```dart check
    await tester.enterText(find.byType(TextFormField), 'not-an-email');
    await tester.tap(find.text('Sign up'));
    await tester.pump();
    expect(find.text('Enter an email'), findsOneWidget,
        reason: 'An email without @ should show "Enter an email"');
    expect(find.text('Signed up'), findsNothing, reason: 'Don\'t sign up with an invalid email');
    await tester.enterText(find.byType(TextFormField), 'ada@example.com');
    await tester.tap(find.text('Sign up'));
    await tester.pump();
    expect(find.text('Enter an email'), findsNothing);
    expect(find.text('Signed up'), findsOneWidget, reason: 'A valid email should show the SnackBar');
```

**Reference:** [Build a form with validation](https://docs.flutter.dev/cookbook/forms/validation).
