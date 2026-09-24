---
title: The standard library
section: Guide Book
summary: A tour of what ships with PHP — dates, JSON, files, regex, hashing, HTTP and the SPL — and how to find the rest.
---
PHP's standard library is unusually large and unusually flat: thousands of functions in the global namespace rather than a package tree. The trade-off is that almost everything is already there, and the cost is that you have to know the names.

## Finding things

```php
<?php

echo count(get_defined_functions()['internal']), " built-in functions\n";
echo count(get_declared_classes()), " built-in classes\n";
print_r(array_slice(get_loaded_extensions(), 0, 10));
```

> 💡 **Tip:** The manual's URLs are predictable: `php.net/<function>` redirects to the page for that function. `php.net/array_map` and `php.net/DateTimeImmutable` both work, and it is faster than searching.

## Dates and times

Use the **immutable** classes. `DateTime` mutates in place, which makes it a source of action-at-a-distance bugs.

```php
<?php

$d = new DateTimeImmutable('2026-01-15 09:30:00', new DateTimeZone('UTC'));

echo $d->format('Y-m-d H:i:s T'), "\n";
echo $d->format('l, j F Y'), "\n";

$later = $d->add(new DateInterval('P1M10D'));     // +1 month 10 days
echo $later->format('Y-m-d'), "\n";
echo $d->format('Y-m-d'), " (original unchanged)\n";

$diff = $d->diff($later);
echo $diff->days, " days apart\n";

echo $d->setTimezone(new DateTimeZone('Asia/Tokyo'))->format('Y-m-d H:i T'), "\n";
var_dump($d < $later);            // comparable directly
```

> ⚠️ `P1M` means "add one month", not "add 30 days". January 31 + 1 month is March 3, because February has no 31st and PHP overflows. When you mean 30 days, say `P30D`.

## JSON

```php
<?php

$data = ['name' => 'Ada', 'langs' => ['PHP', 'Go'], 'active' => true, 'score' => null];

echo json_encode($data), "\n";
echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), "\n";

$back = json_decode('{"a":1,"b":[2,3]}', associative: true);
print_r($back);

try {
    json_decode('{oops}', flags: JSON_THROW_ON_ERROR);
} catch (JsonException $e) {
    echo 'JsonException: ', $e->getMessage(), "\n";
}
```

> 🔍 **Behind the scenes: lists become `[]`, everything else becomes `{}`**
>
> `json_encode()` asks `array_is_list()`. Keys `0…n-1` in order produce a JSON array; anything else — a gap, a string key, a reordering — produces an object. This is why `array_filter()` on a list is such a common JSON bug: it preserves keys, the keys get gaps, and an endpoint that always returned `[…]` starts returning `{"0":…,"2":…}`. Wrap it in `array_values()`.

```php
<?php

$rows = [1, 2, 3, 4];
$big = array_filter($rows, fn($n) => $n > 2);

echo json_encode($big), "\n";                    // {"2":3,"3":4}
echo json_encode(array_values($big)), "\n";      // [3,4]
```

## Regular expressions

PCRE, with a delimiter around the pattern (`/`, `#` and `~` are all common).

```php
<?php

$text = 'Ada was born in 1815 and Grace in 1906.';

var_dump(preg_match('/\d{4}/', $text, $m));
print_r($m);

preg_match_all('/(\w+) in (\d{4})/', $text, $all, PREG_SET_ORDER);
foreach ($all as $set) {
    echo $set[1], ' → ', $set[2], "\n";
}

echo preg_replace('/\d{4}/', 'YYYY', $text), "\n";
echo preg_replace_callback('/\d{4}/', fn($m) => $m[0] + 100, $text), "\n";
print_r(preg_split('/\s*,\s*/', 'a , b,c'));
```

Named groups make a match readable:

```php
<?php

if (preg_match('/^(?<user>[^@]+)@(?<host>.+)$/', 'ada@example.com', $m)) {
    echo $m['user'], ' at ', $m['host'], "\n";
}
```

> ⚠️ `preg_match()` returns `1`, `0` **or** `false` — `false` means the pattern itself failed to compile. `if (preg_match(...))` treats both `0` and `false` as "no match" and hides your broken regex. Compare with `=== 1` when it matters.

## Files

In this course PHP runs on an in-memory filesystem in your browser, so these are real reads and writes — they just disappear when the run ends.

```php
<?php

$path = 'notes.txt';

file_put_contents($path, "first line\nsecond line\n");
file_put_contents($path, "third line\n", FILE_APPEND);

echo file_get_contents($path);
print_r(file($path, FILE_IGNORE_NEW_LINES));

var_dump(file_exists($path), is_readable($path), filesize($path));

$fh = fopen($path, 'r');
while (($line = fgets($fh)) !== false) {
    echo '> ', $line;
}
fclose($fh);

unlink($path);
var_dump(file_exists($path));
```

```php
<?php

$p = '/var/www/app/config/database.php';

echo basename($p), "\n";
echo dirname($p), "\n";
echo pathinfo($p, PATHINFO_EXTENSION), "\n";
print_r(pathinfo($p));
```

## Hashing and randomness

```php
<?php

echo hash('sha256', 'hello'), "\n";
echo md5('hello'), "\n";              // checksums only — never passwords

$hash = password_hash('correct horse', PASSWORD_DEFAULT);
var_dump(password_verify('correct horse', $hash));
var_dump(password_verify('wrong', $hash));

echo bin2hex(random_bytes(16)), "\n";   // cryptographically secure
echo random_int(1, 6), "\n";
```

> ⚠️ `rand()` and `mt_rand()` are predictable and must never produce a token, password-reset link or session id. `random_int()` and `random_bytes()` are the secure ones, and they throw rather than returning weak output if the system has no entropy.

## The SPL

The Standard PHP Library adds data structures and interfaces that arrays cannot express.

```php
<?php

$stack = new SplStack();
$stack->push('a'); $stack->push('b');
echo $stack->pop(), ' then ', $stack->top(), "\n";

$queue = new SplQueue();
$queue->enqueue('first'); $queue->enqueue('second');
echo $queue->dequeue(), "\n";

$heap = new SplMinHeap();
foreach ([5, 1, 3] as $n) $heap->insert($n);
echo $heap->extract(), "\n";       // 1

$set = new SplObjectStorage();
$o = new stdClass();
$set[$o] = 'some data';        // attach() is deprecated in PHP 8.5
var_dump(isset($set[$o]), count($set), $set[$o]);

$fixed = new SplFixedArray(3);     // fixed size, lower memory than an array
$fixed[0] = 'x';
print_r($fixed->toArray());
```

`ArrayAccess`, `Iterator`, `Countable` and `IteratorAggregate` let your own classes behave like arrays:

```php
<?php

final class Collection implements IteratorAggregate, Countable, ArrayAccess {
    public function __construct(private array $items = []) {}

    public function getIterator(): ArrayIterator { return new ArrayIterator($this->items); }
    public function count(): int { return count($this->items); }
    public function offsetExists(mixed $k): bool { return isset($this->items[$k]); }
    public function offsetGet(mixed $k): mixed { return $this->items[$k] ?? null; }
    public function offsetSet(mixed $k, mixed $v): void {
        $k === null ? $this->items[] = $v : $this->items[$k] = $v;
    }
    public function offsetUnset(mixed $k): void { unset($this->items[$k]); }
}

$c = new Collection(['a', 'b']);
$c[] = 'c';

foreach ($c as $i => $v) echo "$i=$v ";
echo "\n", count($c), ' items, [1] is ', $c[1], "\n";
```

## Output buffering

```php
<?php

ob_start();
echo "this is captured\n";
$captured = ob_get_clean();

echo 'captured ', strlen($captured), " bytes:\n";
echo $captured;
```

This is how templating engines, and this course's own check runner, capture what a script printed.

**Reference:** [Function Reference](https://www.php.net/manual/en/funcref.php) in the PHP Manual.
