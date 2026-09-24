---
title: Animation
section: Guide Book
summary: Implicit animations for almost everything, explicit controllers when you need control, and the transitions that come for free.
---
## Implicit animations

Change a property and the widget animates to the new value. No controller, no `dispose`.

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: ImplicitDemo())));

class ImplicitDemo extends StatefulWidget {
  const ImplicitDemo({super.key});

  @override
  State<ImplicitDemo> createState() => _ImplicitDemoState();
}

class _ImplicitDemoState extends State<ImplicitDemo> {
  bool _big = false;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 400),
            curve: Curves.easeInOut,
            width: _big ? 200 : 100,
            height: _big ? 200 : 100,
            decoration: BoxDecoration(
              color: _big ? Colors.indigo : Colors.teal,
              borderRadius: BorderRadius.circular(_big ? 100 : 8),
            ),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: () => setState(() => _big = !_big),
            child: const Text('toggle'),
          ),
        ],
      ),
    );
  }
}
```

Two properties — a `duration` and the new value — and Flutter interpolates every frame between them.

| Widget | Animates |
| --- | --- |
| `AnimatedContainer` | size, colour, decoration, padding, alignment |
| `AnimatedOpacity` | opacity |
| `AnimatedPositioned` | position inside a `Stack` |
| `AnimatedAlign` | alignment |
| `AnimatedPadding` | padding |
| `AnimatedDefaultTextStyle` | text style |
| `AnimatedSwitcher` | swaps one child for another |
| `AnimatedCrossFade` | crossfades between two children |
| `TweenAnimationBuilder` | any value you can tween |

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: MoreImplicit())));

class MoreImplicit extends StatefulWidget {
  const MoreImplicit({super.key});

  @override
  State<MoreImplicit> createState() => _MoreImplicitState();
}

class _MoreImplicitState extends State<MoreImplicit> {
  bool _on = false;

  @override
  Widget build(BuildContext context) {
    const duration = Duration(milliseconds: 350);

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          AnimatedOpacity(
            opacity: _on ? 1 : 0.25,
            duration: duration,
            child: const Text('fading text'),
          ),
          const SizedBox(height: 16),
          AnimatedDefaultTextStyle(
            duration: duration,
            style: TextStyle(
              fontSize: _on ? 28 : 16,
              color: _on ? Colors.deepPurple : Colors.black54,
              fontWeight: _on ? FontWeight.bold : FontWeight.normal,
            ),
            child: const Text('growing text'),
          ),
          const SizedBox(height: 16),
          AnimatedSwitcher(
            duration: duration,
            child: _on
                ? const Icon(Icons.check_circle, key: ValueKey('on'), size: 48)
                : const Icon(Icons.circle_outlined, key: ValueKey('off'), size: 48),
          ),
          const SizedBox(height: 24),
          FilledButton(onPressed: () => setState(() => _on = !_on), child: const Text('toggle')),
        ],
      ),
    );
  }
}
```

> ⚠️ `AnimatedSwitcher` compares its child by **key**. Two `Icon`s with different `IconData` but no keys look like the same widget, and nothing animates. Give each child a distinct `ValueKey` — it is the single most common reason "AnimatedSwitcher does nothing".

## `TweenAnimationBuilder`

For a value none of the built-in widgets animate.

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: TweenDemo())));

class TweenDemo extends StatefulWidget {
  const TweenDemo({super.key});

  @override
  State<TweenDemo> createState() => _TweenDemoState();
}

class _TweenDemoState extends State<TweenDemo> {
  double _target = 0.25;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: _target),
            duration: const Duration(milliseconds: 600),
            curve: Curves.easeOutCubic,
            builder: (context, value, child) => Column(
              children: [
                SizedBox(
                  width: 200,
                  child: LinearProgressIndicator(value: value),
                ),
                const SizedBox(height: 8),
                Text('${(value * 100).round()}%'),
              ],
            ),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: () => setState(() => _target = _target >= 1 ? 0.25 : _target + 0.25),
            child: const Text('advance'),
          ),
        ],
      ),
    );
  }
}
```

The builder runs every frame with the interpolated value — which is why an expensive subtree belongs in `child:` rather than inside the builder.

## Explicit animations

When you need to start, stop, reverse or chain, drive it yourself with an `AnimationController`.

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: ExplicitDemo())));

class ExplicitDemo extends StatefulWidget {
  const ExplicitDemo({super.key});

  @override
  State<ExplicitDemo> createState() => _ExplicitDemoState();
}

class _ExplicitDemoState extends State<ExplicitDemo> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    duration: const Duration(milliseconds: 600),
    vsync: this,                    // ties the ticker to this widget's visibility
  );

  late final Animation<double> _scale = CurvedAnimation(
    parent: _controller,
    curve: Curves.elasticOut,
  );

  late final Animation<Color?> _colour = ColorTween(
    begin: Colors.teal,
    end: Colors.deepOrange,
  ).animate(_controller);

  @override
  void dispose() {
    _controller.dispose();          // always
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          AnimatedBuilder(
            animation: _controller,
            builder: (context, child) => Transform.scale(
              scale: 0.5 + _scale.value * 0.5,
              child: ColoredBox(
                color: _colour.value ?? Colors.teal,
                child: child,       // NOT rebuilt every frame
              ),
            ),
            child: const SizedBox(
              width: 120,
              height: 120,
              child: Center(child: Text('animate me')),
            ),
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              FilledButton(onPressed: () => _controller.forward(), child: const Text('forward')),
              const SizedBox(width: 8),
              OutlinedButton(onPressed: () => _controller.reverse(), child: const Text('reverse')),
              const SizedBox(width: 8),
              TextButton(onPressed: () => _controller.reset(), child: const Text('reset')),
            ],
          ),
        ],
      ),
    );
  }
}
```

> 🔍 **Behind the scenes: what `vsync` is for**
>
> An `AnimationController` needs a `Ticker` — a callback fired once per frame. `vsync: this` (with `SingleTickerProviderStateMixin`) binds that ticker to this `State`, so it is **paused when the widget is not visible**, for example when its route is covered by another. Without it, an off-screen animation would keep waking the app every 16 ms and draining the battery. It is also why forgetting `dispose` on a controller is worse than an ordinary leak: the ticker keeps running.

## Staggered animations with intervals

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: StaggerDemo())));

class StaggerDemo extends StatefulWidget {
  const StaggerDemo({super.key});

  @override
  State<StaggerDemo> createState() => _StaggerDemoState();
}

class _StaggerDemoState extends State<StaggerDemo> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    duration: const Duration(milliseconds: 900),
    vsync: this,
  );

  late final List<Animation<double>> _steps = [
    for (var i = 0; i < 3; i++)
      CurvedAnimation(
        parent: _controller,
        // Each item starts a third of the way later than the last.
        curve: Interval(i * 0.25, 0.5 + i * 0.25, curve: Curves.easeOut),
      ),
  ];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          for (final step in _steps)
            FadeTransition(
              opacity: step,
              child: SlideTransition(
                position: Tween(begin: const Offset(0.3, 0), end: Offset.zero).animate(step),
                child: const Padding(
                  padding: EdgeInsets.all(8),
                  child: Text('staggered item'),
                ),
              ),
            ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: () => _controller.forward(from: 0),
            child: const Text('play'),
          ),
        ],
      ),
    );
  }
}
```

`FadeTransition`, `SlideTransition`, `ScaleTransition` and `RotationTransition` take an `Animation` directly and rebuild only themselves — cheaper than an `AnimatedBuilder` wrapping the whole subtree.

## Hero transitions

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: HeroList()));

class HeroList extends StatelessWidget {
  const HeroList({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Hero')),
      body: ListView(
        children: [
          for (final colour in [Colors.red, Colors.green, Colors.blue])
            ListTile(
              leading: Hero(
                tag: 'swatch-${colour.toARGB32()}',
                child: CircleAvatar(backgroundColor: colour),
              ),
              title: Text('${colour.toARGB32().toRadixString(16)}'),
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => HeroDetail(colour: colour)),
              ),
            ),
        ],
      ),
    );
  }
}

class HeroDetail extends StatelessWidget {
  const HeroDetail({required this.colour, super.key});

  final Color colour;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Detail')),
      body: Center(
        child: Hero(
          // The SAME tag on both screens is what links them.
          tag: 'swatch-${colour.toARGB32()}',
          child: CircleAvatar(backgroundColor: colour, radius: 80),
        ),
      ),
    );
  }
}
```

Two widgets with the same `tag` on two routes, and Flutter animates one into the other across the transition — no controller anywhere.

> 💡 **Tip:** Start with implicit animations. Reach for a controller only when you need to sequence, repeat, reverse on demand, or drive several things from one timeline. Most "we need a custom animation" requirements turn out to be an `AnimatedContainer` and a well-chosen `Curve`.

**Reference:** [Animations overview](https://docs.flutter.dev/ui/animations) and [Implicit animations](https://docs.flutter.dev/codelabs/implicit-animations) on docs.flutter.dev.
