---
title: Input, gestures & forms
section: Guide Book
summary: Buttons and gesture detectors, text input and controllers, and the `Form` machinery for validation.
---
## Buttons and taps

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: Buttons())));

class Buttons extends StatefulWidget {
  const Buttons({super.key});

  @override
  State<Buttons> createState() => _ButtonsState();
}

class _ButtonsState extends State<Buttons> {
  String _last = 'nothing yet';

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('last action: $_last'),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => setState(() => _last = 'elevated'),
            child: const Text('Elevated'),
          ),
          FilledButton(
            onPressed: () => setState(() => _last = 'filled'),
            child: const Text('Filled'),
          ),
          OutlinedButton(
            onPressed: () => setState(() => _last = 'outlined'),
            child: const Text('Outlined'),
          ),
          TextButton(
            onPressed: () => setState(() => _last = 'text'),
            child: const Text('Text'),
          ),
          IconButton(
            onPressed: () => setState(() => _last = 'icon'),
            icon: const Icon(Icons.favorite),
          ),
          const ElevatedButton(
            onPressed: null,             // null disables the button
            child: Text('Disabled'),
          ),
        ],
      ),
    );
  }
}
```

`onPressed: null` is how a button is disabled — there is no `enabled` property.

## Gestures

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: Gestures())));

class Gestures extends StatefulWidget {
  const Gestures({super.key});

  @override
  State<Gestures> createState() => _GesturesState();
}

class _GesturesState extends State<Gestures> {
  String _last = 'try tapping, long-pressing or dragging';
  Offset _position = Offset.zero;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(_last),
          Text('drag offset: ${_position.dx.toStringAsFixed(0)},'
              ' ${_position.dy.toStringAsFixed(0)}'),
          const SizedBox(height: 16),
          GestureDetector(
            onTap: () => setState(() => _last = 'tap'),
            onDoubleTap: () => setState(() => _last = 'double tap'),
            onLongPress: () => setState(() => _last = 'long press'),
            onPanUpdate: (details) => setState(() {
              _last = 'pan';
              _position += details.delta;
            }),
            child: Container(
              width: 160,
              height: 160,
              color: Colors.indigo.shade100,
              child: const Center(child: Text('gesture area')),
            ),
          ),
          const SizedBox(height: 16),
          // InkWell adds the Material ripple that GestureDetector lacks.
          InkWell(
            onTap: () => setState(() => _last = 'inkwell tap'),
            child: const Padding(
              padding: EdgeInsets.all(16),
              child: Text('InkWell — with a ripple'),
            ),
          ),
        ],
      ),
    );
  }
}
```

> 💡 **Tip:** Prefer `InkWell` or a button over a bare `GestureDetector` for anything the user taps. You get the ripple, the correct hit area, keyboard focus and screen-reader semantics for free — all of which a `GestureDetector` leaves you to build.

## Text input

```dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: TextInput())));

class TextInput extends StatefulWidget {
  const TextInput({super.key});

  @override
  State<TextInput> createState() => _TextInputState();
}

class _TextInputState extends State<TextInput> {
  final _controller = TextEditingController();
  String _submitted = '';

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          TextField(
            controller: _controller,
            decoration: const InputDecoration(
              labelText: 'Name',
              hintText: 'e.g. Ada Lovelace',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.person),
            ),
            textInputAction: TextInputAction.next,
            onSubmitted: (value) => setState(() => _submitted = value),
          ),
          const SizedBox(height: 12),
          TextField(
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            decoration: const InputDecoration(labelText: 'Digits only'),
          ),
          const SizedBox(height: 12),
          const TextField(
            obscureText: true,
            decoration: InputDecoration(labelText: 'Password'),
          ),
          const SizedBox(height: 12),
          const TextField(
            maxLines: 3,
            decoration: InputDecoration(labelText: 'Notes', alignLabelWithHint: true),
          ),
          const SizedBox(height: 12),
          Text('submitted: $_submitted'),
        ],
      ),
    );
  }
}
```

## Forms and validation

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: SignupForm())));

class SignupForm extends StatefulWidget {
  const SignupForm({super.key});

  @override
  State<SignupForm> createState() => _SignupFormState();
}

class _SignupFormState extends State<SignupForm> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  String _result = '';

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      _formKey.currentState!.save();
      setState(() => _result = 'valid: ${_email.text}');
    } else {
      setState(() => _result = 'please fix the errors above');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Form(
        key: _formKey,
        autovalidateMode: AutovalidateMode.onUserInteraction,
        child: Column(
          children: [
            TextFormField(
              controller: _email,
              decoration: const InputDecoration(labelText: 'Email'),
              keyboardType: TextInputType.emailAddress,
              validator: (value) {
                if (value == null || value.isEmpty) return 'Email is required';
                if (!value.contains('@')) return 'That does not look like an email';
                return null;                      // null means valid
              },
            ),
            TextFormField(
              controller: _password,
              decoration: const InputDecoration(labelText: 'Password'),
              obscureText: true,
              validator: (value) =>
                  (value == null || value.length < 8) ? 'At least 8 characters' : null,
            ),
            const SizedBox(height: 16),
            FilledButton(onPressed: _submit, child: const Text('Sign up')),
            const SizedBox(height: 8),
            Text(_result),
          ],
        ),
      ),
    );
  }
}
```

> 🔍 **Behind the scenes: what the `GlobalKey<FormState>` is for**
>
> `Form` keeps a `FormState` that tracks every `TextFormField` beneath it. To call `validate()` or `save()` you need a reference to that state from *outside* the `Form` widget — and a `GlobalKey` is Flutter's mechanism for reaching a specific element's state from elsewhere in the tree. This is one of the few places a `GlobalKey` is idiomatic; elsewhere it usually signals that state should have been lifted up instead.

## Selection widgets

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: Selections())));

class Selections extends StatefulWidget {
  const Selections({super.key});

  @override
  State<Selections> createState() => _SelectionsState();
}

class _SelectionsState extends State<Selections> {
  bool _checked = false;
  bool _switched = true;
  String _radio = 'a';
  double _slider = 30;
  String _dropdown = 'one';

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        CheckboxListTile(
          title: const Text('Checkbox'),
          value: _checked,
          onChanged: (v) => setState(() => _checked = v ?? false),
        ),
        SwitchListTile(
          title: const Text('Switch'),
          value: _switched,
          onChanged: (v) => setState(() => _switched = v),
        ),
        for (final option in ['a', 'b'])
          RadioListTile<String>(
            title: Text('Option $option'),
            value: option,
            groupValue: _radio,
            onChanged: (v) => setState(() => _radio = v ?? 'a'),
          ),
        Slider(
          value: _slider,
          max: 100,
          divisions: 10,
          label: _slider.round().toString(),
          onChanged: (v) => setState(() => _slider = v),
        ),
        DropdownButton<String>(
          value: _dropdown,
          isExpanded: true,
          items: const [
            DropdownMenuItem(value: 'one', child: Text('One')),
            DropdownMenuItem(value: 'two', child: Text('Two')),
          ],
          onChanged: (v) => setState(() => _dropdown = v ?? 'one'),
        ),
      ],
    );
  }
}
```

Every one follows the same **controlled** pattern: the widget takes a `value` and reports changes through `onChanged`. It holds nothing itself, which is why `setState` is always required.

**Reference:** [Forms](https://docs.flutter.dev/cookbook/forms) and [Handling gestures](https://docs.flutter.dev/ui/interactivity/gestures) on docs.flutter.dev.
