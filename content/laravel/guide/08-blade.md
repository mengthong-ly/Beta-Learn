---
title: Blade
section: Guide Book
summary: How a template becomes compiled PHP, the directive set worth knowing, layouts and components, and why `{{ }}` is the security boundary.
---
Blade is a compiler. A `.blade.php` file is turned into plain PHP once, cached, and then included like any other file — so a directive costs nothing at run time beyond the PHP it became.

```text
greeting.blade.php ──► compiled PHP ──► storage/framework/views/<hash>.php ──► include
        {{ $name }}          <?= e($name) ?>
```

## Echoing

`{{ }}` escapes. `{!! !!}` does not. That is the whole security model, and it is on by default.

```php
<?php

use Illuminate\Support\Facades\Blade;

$nasty = '<script>alert("xss")</script>';

echo Blade::render('escaped: {{ $v }}', ['v' => $nasty]), PHP_EOL;
echo Blade::render('raw:     {!! $v !!}', ['v' => $nasty]), PHP_EOL;
```

> ⚠️ `{!! !!}` is for HTML you produced, never for anything a user sent. Rendering user input raw is the most common XSS hole in any templating language — and in Blade it requires you to type four extra characters, which is deliberate.

```php
<?php

use Illuminate\Support\Facades\Blade;

echo Blade::render('{{ $missing ?? "a default" }}', []), PHP_EOL;
echo Blade::render('{{ $name }} has {{ strlen($name) }} letters', ['name' => 'Ada']), PHP_EOL;
echo Blade::render('@{{ notBlade }}', []), PHP_EOL;    // @ escapes the braces for JS frameworks
```

## Conditionals

Each directive needs its own line. Blade compiles line by line, and an `@if` tucked onto the end of another line produces invalid PHP.

```php
<?php

use Illuminate\Support\Facades\Blade;

$template = <<<'BLADE'
@if ($score >= 90)
A
@elseif ($score >= 70)
B
@else
C
@endif
BLADE;

foreach ([95, 75, 40] as $score) {
    echo trim(Blade::render($template, ['score' => $score])), PHP_EOL;
}
```

```php
<?php

use Illuminate\Support\Facades\Blade;

$template = <<<'BLADE'
@unless ($admin)
not an admin
@endunless
@isset($name)
name is set: {{ $name }}
@endisset
@empty($items)
no items
@endempty
BLADE;

echo Blade::render($template, ['admin' => false, 'name' => 'Ada', 'items' => []]);
```

## Loops

```php
<?php

use Illuminate\Support\Facades\Blade;

$template = <<<'BLADE'
@foreach ($users as $user)
{{ $loop->iteration }}/{{ $loop->count }} {{ $user }}
@if ($loop->first)
  ↑ first
@endif
@if ($loop->last)
  ↑ last
@endif
@endforeach
@forelse ($empty as $e)
never
@empty
the list was empty
@endforelse
BLADE;

echo Blade::render($template, ['users' => ['Ada', 'Grace', 'Linus'], 'empty' => []]);
```

`$loop` carries `index`, `iteration`, `first`, `last`, `count`, `remaining`, `depth` and `parent` — the last two for nested loops.

> 🔍 **Behind the scenes: `$loop` is a real object, built per loop**
>
> `@foreach` compiles to a `foreach` plus a `LoopVariable` the compiler pushes onto a stack. Nesting pushes another, which is how `$loop->parent` works. It is cheap, but it is not free: a `@foreach` over 100,000 rows constructs and updates that object 100,000 times. For very hot loops, a plain `@php foreach @endphp` avoids it — though the real answer is usually to paginate.

## Layouts

Template inheritance: a parent defines the holes, children fill them.

```php
<?php

use Illuminate\Support\Facades\Blade;

// In real apps these are separate files; here they show the compiled shape.
$page = <<<'BLADE'
@section('title')
{{ $title }}
@endsection
@yield('title') — {{ $body }}
BLADE;

echo trim(Blade::render($page, ['title' => 'Home', 'body' => 'welcome'])), PHP_EOL;
```

The directives, for reference:

```blade-snippet
{{-- resources/views/layouts/app.blade.php --}}
<html>
<head><title>@yield('title', 'Default')</title></head>
<body>
    @include('partials.nav')
    @yield('content')
    @stack('scripts')
</body>
</html>

{{-- resources/views/home.blade.php --}}
@extends('layouts.app')

@section('title', 'Home')

@section('content')
    <h1>Welcome</h1>
@endsection

@push('scripts')
    <script src="/js/home.js"></script>
@endpush
```

| Directive | Does |
| --- | --- |
| `@extends` | names the parent layout |
| `@section` / `@endsection` | fills a hole |
| `@yield` | the hole, in the parent |
| `@parent` | keeps the parent's content and appends |
| `@include` | pulls in a partial, sharing variables |
| `@includeIf` / `@includeWhen` | conditional include |
| `@push` / `@stack` | append to a named stack from anywhere |
| `@once` | render a block only the first time |

## Components

The modern alternative to layouts and includes: a class (or just a template) with a typed interface.

```blade-snippet
{{-- resources/views/components/alert.blade.php --}}
<div class="alert alert-{{ $type }}" {{ $attributes->merge(['role' => 'alert']) }}>
    @if ($title)
        <strong>{{ $title }}</strong>
    @endif

    {{ $slot }}
</div>

{{-- used as --}}
<x-alert type="danger" title="Careful" class="mt-4">
    Something went wrong.
</x-alert>
```

`$slot` is the content between the tags, `$attributes` is everything you did not declare as a prop, and `merge()` combines your defaults with the caller's classes. Named slots (`<x-slot:footer>`) fill several holes.

> 💡 **Tip:** Reach for a component when the markup has *behaviour or props*, and an `@include` when it is a plain fragment. Components give you a real interface — required props, defaults, attribute merging — which is what makes a design system maintainable.

## `@php`, `@json` and friends

```php
<?php

use Illuminate\Support\Facades\Blade;

$template = <<<'BLADE'
@php
    $total = array_sum($prices);
@endphp
total: {{ $total }}
json: @json($prices)
BLADE;

echo Blade::render($template, ['prices' => [10, 20, 30]]);
```

`@json` is `json_encode` with the right flags for embedding in HTML — the safe way to hand data to JavaScript.

> ⚠️ `@php` blocks are a smell in proportion to their length. One line to sum an array is fine; ten lines of business logic means the work belongs in the controller, a view model, or a component class.

## The other directives you will meet

```blade-snippet
@auth / @guest                  is someone logged in?
@can('update', $post) / @cannot authorisation
@csrf                           the hidden token field — required on every POST form
@method('PUT')                  spoof a verb HTML forms cannot send
@error('email') … @enderror     the validation message for one field
@class(['btn', 'btn-lg' => $big])  conditional classes
@vite(['resources/js/app.js'])  the asset tags
```

`@csrf` deserves a word: it renders the hidden `_token` input that the `VerifyCsrfToken` middleware checks. A form that posts without it gets a **419**, and the middleware is in the `web` group precisely so you cannot forget.

**Reference:** [Blade Templates](https://laravel.com/docs/13.x/blade) in the Laravel documentation.
