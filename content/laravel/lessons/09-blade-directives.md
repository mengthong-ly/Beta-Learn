---
title: Blade directives & components
section: 1 · The Basics
---

Blade directives start with `@` and are shortcuts for PHP control structures. They compile to plain PHP, so they cost essentially nothing at runtime.

## Conditionals

`@if`, `@elseif`, `@else` and `@endif` work just like PHP's `if`. `@unless` is the opposite of `@if`, and `@isset` / `@empty` are shortcuts for those PHP functions.

```php
<?php

use Illuminate\Support\Facades\Blade;

$template = <<<'blade'
@if (count($records) === 1)
I have one record!
@elseif (count($records) > 1)
I have multiple records!
@else
I don't have any records!
@endif
blade;

echo Blade::render($template, ['records' => ['a', 'b']]);
echo Blade::render($template, ['records' => []]);
```

## Loops and `$loop`

`@foreach` loops over an array. Inside it, Blade gives you a `$loop` variable: `$loop->iteration` (from 1), `$loop->index` (from 0), `$loop->count`, `$loop->first`, `$loop->last` and more. `@forelse … @empty` handles the "nothing to show" case for you.

```php
<?php

use Illuminate\Support\Facades\Blade;

$template = <<<'blade'
@forelse ($users as $user)
{{ $loop->iteration }}/{{ $loop->count }}: {{ $user }}@if ($loop->last) (last)@endif

@empty
No users yet.
@endforelse
blade;

echo Blade::render($template, ['users' => ['Ada', 'Bo', 'Cy']]);
echo Blade::render($template, ['users' => []]);
```

`{{-- comments --}}` are Blade comments. Unlike HTML comments, they never reach the browser.

## Forms

HTML forms can only send `GET` and `POST`. For `PUT`, `PATCH` or `DELETE`, `@method` adds a hidden `_method` field that Laravel reads instead. Add `@csrf` to every form that posts, as you saw in the CSRF lesson.

```blade
<form action="/photos/1" method="POST">
    @csrf
    @method('DELETE')
    <button>Delete photo</button>
</form>
```

## Components

A component is a reusable piece of HTML with its own tag, `<x-name>`. A class in the `App\View\Components` namespace is found automatically: `Alert` becomes `<x-alert>`. Public constructor properties become variables in the template, and `{{ $slot }}` is whatever you put between the tags. Prefix an attribute with `:` to pass a PHP expression instead of a plain string.

```php
<?php

namespace App\View\Components;

use Illuminate\Support\Facades\Blade;
use Illuminate\View\Component;

class Alert extends Component
{
    public function __construct(public string $type = 'info') {}

    public function render(): string
    {
        return <<<'blade'
            <div class="alert alert-{{ $type }}">{{ $slot }}</div>
        blade;
    }
}

echo Blade::render('<x-alert type="error">Disk full!</x-alert>'), PHP_EOL;
echo Blade::render('<x-alert :type="$level">{{ $message }}</x-alert>', [
    'level' => 'warning',
    'message' => 'Battery low',
]), PHP_EOL;
```

In an app, `php artisan make:component Alert` creates the class in `app/View/Components`. Small components can return their markup straight from `render()`, like this one.

> 💡 **Tip:** a heredoc with quotes (`<<<'blade'`) keeps PHP from reading `$variables` inside the template, so Blade gets them untouched.

## Challenge

> 🎯 **Challenge:** Finish the template in `task_list()`. Put each task in an `<li>` inside a `<ul>`, with `✓ ` in front of the title when `done` is true (`<li>✓ Write</li>`). With no tasks, render `<p>Nothing to do</p>` instead of the list.

```php starter
<?php

use Illuminate\Support\Facades\Blade;

function task_list(array $tasks): string
{
    return Blade::render(<<<'blade'
    <ul>
    @foreach ($tasks as $task)
        <li>{{ $task['title'] }}</li>
    @endforeach
    </ul>
    blade, ['tasks' => $tasks]);
}

echo task_list([
    ['title' => 'Write', 'done' => true],
    ['title' => 'Test', 'done' => false],
]);
```

```php solution
<?php

use Illuminate\Support\Facades\Blade;

function task_list(array $tasks): string
{
    return Blade::render(<<<'blade'
    @if (count($tasks) > 0)
    <ul>
    @foreach ($tasks as $task)
        <li>@if ($task['done'])✓ @endif{{ $task['title'] }}</li>
    @endforeach
    </ul>
    @else
    <p>Nothing to do</p>
    @endif
    blade, ['tasks' => $tasks]);
}

echo task_list([
    ['title' => 'Write', 'done' => true],
    ['title' => 'Test', 'done' => false],
]);
```

```php check
$squash = fn (string $html) => preg_replace('/\s*\n\s*/', '', $html);
$html = $squash(task_list([['title' => 'Write', 'done' => true], ['title' => 'Test', 'done' => false]]));
expect(str_contains($html, '<li>✓ Write</li>'), "A done task should render as <li>✓ Write</li>. Got: $html");
expect(str_contains($html, '<li>Test</li>'), "An unfinished task should render as <li>Test</li>. Got: $html");
expect(str_contains($html, '<ul>'), "Wrap the tasks in a <ul>.");
$empty = $squash(task_list([]));
expect(str_contains($empty, '<p>Nothing to do</p>'), "With no tasks, render <p>Nothing to do</p>. Got: $empty");
expect(!str_contains($empty, '<ul>'), "With no tasks, don't render the <ul>.");
expect(str_contains($squash(task_list([['title' => '<i>x</i>', 'done' => false]])), '&lt;i&gt;'), "Titles should still be escaped with {{ }}.");
```

**Reference:** [Blade Templates](https://laravel.com/docs/13.x/blade) in the Laravel 13 docs.
