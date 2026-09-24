---
title: Requests, validation & responses
section: Guide Book
summary: Reading input safely, the validator and form requests, and every way to build a response.
---
## Reading the request

```php
<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

Route::get('/inspect/{id}', function (Request $request, string $id) {
    return implode("\n", [
        'path:     ' . $request->path(),
        'url:      ' . $request->url(),
        'method:   ' . $request->method(),
        'route id: ' . $id,
        'query q:  ' . $request->query('q', '(none)'),
        'is GET:   ' . var_export($request->isMethod('get'), true),
        'expects json: ' . var_export($request->expectsJson(), true),
    ]);
});

echo visit('/inspect/7?q=laravel')->getContent(), PHP_EOL;
```

## Input

`input()` reads from the query string **and** the body. `query()` reads only the query string; `post()` only the body.

```php
<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

Route::post('/form', function (Request $request) {
    return implode("\n", [
        'name:     ' . $request->input('name'),
        'missing:  ' . $request->input('nope', 'default used'),
        'nested:   ' . $request->input('address.city', '-'),
        'has name: ' . var_export($request->has('name'), true),
        'filled:   ' . var_export($request->filled('empty'), true),
        'only:     ' . json_encode($request->only(['name'])),
        'except:   ' . json_encode($request->except(['name'])),
    ]);
});

echo visit('/form', 'POST', [
    'name' => 'Ada',
    'empty' => '',
    'address' => ['city' => 'London'],
])->getContent(), PHP_EOL;
```

> ⚠️ `has()` is true for a present-but-empty value; `filled()` requires it to be non-empty. A checkbox that is unchecked is *absent*, not `false` — so `$request->has('subscribe')` is the check you want, and `$request->boolean('subscribe')` handles the `"on"`/`"1"`/`"true"` conversion.

```php
<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

Route::post('/typed', function (Request $request) {
    return json_encode([
        'string'  => $request->string('name')->upper()->value(),
        'int'     => $request->integer('age'),
        'bool'    => $request->boolean('subscribe'),
        'date'    => $request->date('born')?->format('Y'),
        'missing' => $request->integer('nothing'),
    ]);
});

echo visit('/typed', 'POST', [
    'name' => 'ada',
    'age' => '36',
    'subscribe' => 'on',
    'born' => '1815-12-10',
])->getContent(), PHP_EOL;
```

## Validation

`validate()` checks the input and, on failure, throws — which Laravel turns into a redirect with errors, or a 422 JSON response for an API.

```php
<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

Route::post('/register', function (Request $request) {
    $validated = $request->validate([
        'name'  => ['required', 'string', 'max:50'],
        'email' => ['required', 'email'],
        'age'   => ['nullable', 'integer', 'min:18'],
    ]);

    return 'welcome, ' . $validated['name'];
});

echo visit('/register', 'POST', [
    'name' => 'Ada',
    'email' => 'ada@example.com',
    'age' => 36,
])->getContent(), PHP_EOL;

$bad = visit('/register', 'POST', ['name' => '', 'email' => 'not-an-email']);
echo 'invalid → status ', $bad->getStatusCode(), PHP_EOL;
```

`validate()` returns **only the validated keys**. Passing `$request->all()` to a model is how mass-assignment bugs happen; passing `$validated` is not.

```php
<?php

use Illuminate\Support\Facades\Validator;

$data = ['name' => '', 'email' => 'nope', 'age' => 12, 'extra' => 'ignored'];

$validator = Validator::make($data, [
    'name'  => ['required'],
    'email' => ['required', 'email'],
    'age'   => ['integer', 'min:18'],
]);

var_dump($validator->fails());

foreach ($validator->errors()->all() as $message) {
    echo '  - ', $message, PHP_EOL;
}

echo 'first email error: ', $validator->errors()->first('email'), PHP_EOL;
```

### Custom messages and rules

```php
<?php

use Illuminate\Support\Facades\Validator;

$validator = Validator::make(
    ['username' => 'ab'],
    ['username' => ['required', 'min:3']],
    ['username.min' => 'Pick a username of at least :min characters.'],
);

echo $validator->errors()->first('username'), PHP_EOL;

$closureRule = Validator::make(
    ['code' => 'abc'],
    ['code' => [function (string $attribute, mixed $value, \Closure $fail) {
        if (! ctype_digit($value)) {
            $fail("The {$attribute} must be digits only.");
        }
    }]],
);

echo $closureRule->errors()->first('code'), PHP_EOL;
```

> 💡 **Tip:** Once a controller has more than about three rules, move them into a **form request** — a class with `rules()` and `authorize()`. The controller then type-hints it, the validation runs before the action does, and the action can assume valid input. It also gives the rules a name you can test directly.

## Responses

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/r/string', fn () => 'just a string');
Route::get('/r/array', fn () => ['ok' => true, 'items' => [1, 2]]);
Route::get('/r/manual', fn () => response('created', 201)
    ->header('X-Source', 'guide')
    ->header('Cache-Control', 'no-store'));
Route::get('/r/json', fn () => response()->json(['error' => 'nope'], 422));
Route::get('/r/noContent', fn () => response()->noContent());

foreach (['/r/string', '/r/array', '/r/manual', '/r/json', '/r/noContent'] as $uri) {
    $r = visit($uri);
    printf("%-12s %d %-16s %s\n", $uri, $r->getStatusCode(),
        explode(';', (string) $r->headers->get('content-type'))[0],
        $r->getContent());
}
```

## Redirects

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/target', fn () => 'arrived')->name('target');
Route::get('/go', fn () => redirect('/target'));
Route::get('/go-named', fn () => redirect()->route('target'));
Route::get('/go-away', fn () => redirect()->away('https://laravel.com'));

app('router')->getRoutes()->refreshNameLookups();

foreach (['/go', '/go-named', '/go-away'] as $uri) {
    $r = visit($uri);
    printf("%-10s %d → %s\n", $uri, $r->getStatusCode(), $r->headers->get('location'));
}
```

`redirect()->back()->withInput()` returns to the previous page keeping what the user typed — the standard failed-form response, and what `validate()` does for you automatically.

## Aborting

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/gone', fn () => abort(410, 'This is gone'));
Route::get('/guard/{n}', function (int $n) {
    abort_if($n > 10, 422, 'Too large');
    abort_unless($n > 0, 422, 'Must be positive');
    return "n is $n";
});

echo visit('/gone')->getStatusCode(), PHP_EOL;
echo visit('/guard/5')->getContent(), PHP_EOL;
echo visit('/guard/50')->getStatusCode(), PHP_EOL;
echo visit('/guard/0')->getStatusCode(), PHP_EOL;
```

> 🔍 **Behind the scenes: why `abort()` throws**
>
> `abort()` raises an `HttpException` rather than returning. That means it works from anywhere — a service, a model accessor, six frames deep — without every caller having to check a return value and propagate it. The exception handler catches it at the top and renders the right status. It is the same reason `validate()` throws instead of returning a result: the happy path in your controller stays a straight line.

**Reference:** [Requests](https://laravel.com/docs/13.x/requests), [Responses](https://laravel.com/docs/13.x/responses) and [Validation](https://laravel.com/docs/13.x/validation).
