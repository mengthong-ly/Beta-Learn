# Course research: Flutter (widget catalog, MVVM architecture, tutorials, course gaps)

Researched 2026-09-28 against primary sources: docs.flutter.dev (read from its source repo, [`flutter/website`](https://github.com/flutter/website) at commit `4ff16e3`, 2026-09-28), the widget catalog's own data file ([`sites/docs/src/data/catalog/widgets.yml`](https://github.com/flutter/website/blob/main/sites/docs/src/data/catalog/widgets.yml)), the architecture recommendations data file ([`architectureRecommendations.yml`](https://github.com/flutter/website/blob/main/sites/docs/src/data/architectureRecommendations.yml)), the Flutter SDK's own doc comments (the installed **Flutter 3.47.5**, framework rev `6a19cca564`, Dart 3.13.4, under `packages/flutter/lib/src/`), the [Compass sample app](https://github.com/flutter/samples/tree/main/compass_app) (last commit `0c5ca75d29`, 2026-08-12), pub.dev's API, dart.dev, the Flutter blog, and YouTube watch pages. Context7 (`/flutter/website`) was used to cross-check the `RadioGroup` migration; it matched the source repo. Anything not confirmed from a primary source is marked **UNVERIFIED**.

**What was actually run** (scratch project made with `flutter create --offline --platforms web`, same shape as `runtimes/flutter`):

- `flutter analyze` on a file that uses 13 older APIs: every deprecation in §2.1 was reported by the 3.47.5 analyzer, with the messages quoted there.
- `flutter analyze` on all 46 Dart blocks in `content/flutter/lessons/*.md`: the only findings are 7 × `avoid_print` in `03-user-input.md` (§7.2).
- The MVVM example in §5.6: `flutter analyze` → **No issues found**; `flutter test` → **5/5 passed** (2 unit tests, 2 widget tests, plus one test written exactly like ThongLearn's check wrapper in `lib/local-runner.ts:313`). A copy migrated with `dart fix --apply --code=migrate_design_widgets` to `package:material_ui` also analyzed clean and passed its tests.
- Videos weren't watched. For each one, the watch page was fetched to confirm the ID, title, channel, upload date and (where given) the description's chapter list.

## 1. Summary

| | |
|---|---|
| Version | **Flutter 3.47.5** stable (3.47 released 2026-08-12: [What's new in 3.47][blog-347]), Dart 3.13.4. `flutter create` now writes `sdk: ^3.13.4`, `flutter_lints: ^6.0.0`, and the template uses dot shorthands (`colorScheme: .fromSeed(...)`). |
| Biggest change | **Material and Cupertino are leaving the SDK.** `package:material_ui` / `package:cupertino_ui` 1.0 shipped with 3.47. The in-SDK `package:flutter/material.dart` has been frozen since 3.44 and is "scheduled for formal deprecation in the upcoming Fall stable release in November" ([blog][blog-347], [migration guide][bc-materialui]). Every ThongLearn Flutter lesson imports `package:flutter/material.dart`. |
| Official curriculum | The [Flutter learning pathway][pathway]: 4 units. ThongLearn's 10 lessons cover units 2–3 **except the last step** (`ListenableBuilder`) and none of unit 4 ("Flutter UI 102": advanced UI, adaptive layouts, slivers, stack navigation, built with **Cupertino** widgets). |
| Architecture | The official guide is MVVM: **View + ViewModel** (UI layer), **Repository + Service** (data layer), optional domain layer. ViewModels are `ChangeNotifier`s, views rebuild with `ListenableBuilder`, user events go through **Commands**, errors travel as a **`Result`** type, dependencies are injected with **`provider`**, navigation uses **`go_router`** ([guide][arch-guide], [recommendations][arch-rec]). |
| SDK-only feasibility | Everything in the guide except `provider`, `go_router`, `freezed` and `http` can be done with the SDK alone. The runner runs `flutter test --no-pub` with `~/.pub-cache` readable and no network, so a package works only if `scripts/setup-runtimes.ts` adds it to `runtimes/flutter` ahead of time (§7.4). |
| Recommendation | Keep the first 10 lessons (fix the items in §7.2), then add **~9 lessons**: ListenableBuilder, Lists & keys, Scrolling & slivers, Navigation, Adaptive layouts, Async builders, MVVM with Commands and Result, Testing, Accessibility (§7.3). Decide about `material_ui` before the November stable (§7.4). |

### Surprises (contradict common assumptions)

- **`package:flutter/material.dart` is on its way out.** Flutter 3.47 published `material_ui` 1.0 and `cupertino_ui` 1.0 ([migration guide][bc-materialui]). pub.dev now shows `material_ui` **1.4.0** (2026-09-22) and `cupertino_ui` **1.1.1** (2026-09-21), both needing `flutter: >=3.47.0` ([pub API](https://pub.dev/api/packages/material_ui)). `dart fix --apply --code=migrate_design_widgets` rewrites the imports; it did so on the §5.6 example, which then passed analysis and tests. In 3.47.5 the old import is **not yet** flagged by the analyzer.
- **SnackBars with an action no longer go away on their own** (since 3.38). Set `persist: false` to get the old auto-dismiss back ([breaking change][bc-snackbar]). The lesson 6 example at `06-material-widgets.md:98-101` is such a SnackBar, while the lesson text says it "briefly tells the user…" (`:74`).
- **`Radio(groupValue:, onChanged:)` is deprecated** (3.35). Wrap the radios in a `RadioGroup` instead ([breaking change][bc-radio]). The analyzer reports: "Use a RadioGroup ancestor to manage group value instead."
- **ListTile now errors in debug** when an opaque `Container`/`ColoredBox` sits between it and its `Material` (3.44). The error is there because the colored widget hides the ink splash ([breaking change][bc-listtile]).
- **ReorderableListView `onReorder` is deprecated** (3.44) in favor of `onReorderItem`, which does the `newIndex -= 1` fix-up for you ([breaking change][bc-reorder]). **`cacheExtent` is deprecated** for `scrollCacheExtent` ([breaking change][bc-cache]).
- **Dart 3.12+ allows private named initializing formals.** You can write `Repo({required this._api})` and callers still pass `api:`. The analyzer's `prefer_initializing_formals` now flags the Compass/case-study style `Repo({required Api api}) : _api = api`, which this pass hit on 3.47.5 ([Dart 3.12 announcement](https://dart.dev/blog/announcing-dart-3-12)).
- **The pathway's "Flutter UI 102" unit is Cupertino-first.** Its advanced-UI, adaptive-layout, slivers and navigation steps build a contacts app with `CupertinoApp`, `CupertinoPageScaffold`, `CupertinoSliverNavigationBar` and `CupertinoPageRoute` ([advanced-ui][pw-advanced], [slivers][pw-slivers], [navigation][pw-nav]).
- **The architecture guide recommends `freezed` or `built_value`, not `json_serializable`,** for generated immutable models ("recommend", not "strongly recommend"; [recommendations][arch-rec]). Compass uses freezed + json_annotation.
- **Material 2 isn't deprecated yet.** `useMaterial3` has defaulted to `true` since 3.16, and `useMaterial3: false` produced no analyzer warning on 3.47.5. The guide only says M2 support "will eventually be deprecated and removed" ([breaking change][bc-m3default]).

---

## 2. Version and recent API changes

### 2.1 Deprecations verified with the 3.47.5 analyzer

Every row was reproduced: the old API was written in a scratch file and `flutter analyze` reported `deprecated_member_use` with the message quoted.

| Old API | Replacement | Deprecated in | Analyzer message (3.47.5) | Source |
|---|---|---|---|---|
| `Color.withOpacity(x)` | `withValues(alpha: x)` | 3.27 | "Use .withValues() to avoid precision loss." | [wide gamut][bc-widegamut] |
| `Color.opacity` / `Color.value` | `.a` / `.r` `.g` `.b`, `toARGB32()` | 3.27 | "Use .a." / "Use component accessors like .r or .g, or toARGB32…" | [wide gamut][bc-widegamut] |
| `MaterialStateProperty` (and `MaterialState*`) | `WidgetStateProperty` | 3.22 | "Use WidgetStateProperty instead. Moved to the Widgets layer…" | [material-state][bc-materialstate] |
| `MediaQuery…textScaleFactor` | `textScaler` | 3.16 | "Use textScaler instead…" | [textScaler][bc-textscaler] |
| `WillPopScope` | `PopScope` (`onPopInvokedWithResult`) | 3.16 (generic `PopScope` 3.24) | "Use PopScope instead. The Android predictive back feature will not work with WillPopScope." | [predictive back][bc-popscope], [PopScope result][bc-popresult] |
| `ButtonBar` | `OverflowBar` | 3.24 | "Use OverflowBar instead." | [ButtonBar][bc-buttonbar] |
| `Radio.groupValue` / `Radio.onChanged` | `RadioGroup` ancestor | 3.35 | "Use a RadioGroup ancestor to manage group value instead." | [Radio redesign][bc-radio] |
| `DropdownButtonFormField(value:)` | `initialValue:` | 3.35 | "Use initialValue instead." | [dropdown value][bc-dropdownff] |
| `AppBarTheme(color:)` | `backgroundColor:` | 3.35 | "Use backgroundColor instead." | [appbar color][bc-appbar] |
| `ReorderableListView(onReorder:)` | `onReorderItem:` | 3.44 | "Use the onReorderItem callback instead…" | [onReorder][bc-reorder] |
| `ListView(cacheExtent:)` | `scrollCacheExtent:` | 3.44 | "Use scrollCacheExtent instead." | [cacheExtent][bc-cache] |

Also deprecated, found in the SDK source but not probed: `ThemeData.dialogBackgroundColor` (use `DialogThemeData.backgroundColor`), `ThemeData.indicatorColor` (use `TabBarThemeData.indicatorColor`) and `ThemeData.buttonBarTheme` (`material/theme_data.dart`, `@Deprecated` at lines 368–378; [dialogBackgroundColor][bc-dialogbg], [indicatorColor][bc-indicator]). Also `ExpansionTileController` → `ExpansibleController` (3.32, [guide][bc-expansible]), `findChildIndexCallback` → `findItemIndexCallback` on `.separated` lists (3.41, [guide][bc-separated]), and `describeEnum` **removed** in 3.47 ([guide][bc-describeenum]).

### 2.2 Behavior changes a learner will notice

| Change | Release | What it means for lessons | Source |
|---|---|---|---|
| `ThemeData.useMaterial3` defaults to `true` | 3.16 | Material 3 is the look; `useMaterial3: false` still works (no warning in 3.47.5) | [M3 default][bc-m3default] |
| SnackBar with action persists until dismissed | 3.38 | Pass `persist: false` for auto-dismiss | [snackbar][bc-snackbar] |
| Default Android page transition is `PredictiveBackPageTransitionsBuilder` (falls back to `FadeForwardsPageTransitionsBuilder`) | 3.38 | Screenshots of old zoom transition are outdated | [page transition][bc-androidtransition] |
| ListTile debug error when wrapped in a colored widget | 3.44 | Put color on `ListTile.tileColor` or on a `Material`/`Card` | [ListTile][bc-listtile] |
| `Form` can't be a sliver | 3.35 | Wrap it in `SliverToBoxAdapter` | [Form][bc-form] |
| Semantics `header`/`headingLevel` behavior on iOS/Android | 3.47 | Affects the accessibility lesson | [semantics header][bc-semheader] |
| M3 token updates (colors, progress indicators, slider) | 3.27, 3.29, 3.41 | Default colors from `fromSeed` shift between releases; don't hard-code expected hex values in checks | [3.27 tokens][bc-m3tokens27], [3.41 tokens][bc-m3tokens41], [progress][bc-progress], [slider][bc-slider] |

### 2.3 Landed but not in stable yet (the index says "Not yet released to stable")

- **Migrate to `material_ui` / `cupertino_ui`** ([guide][bc-materialui]). Opt-in in 3.47; formal deprecation of the in-SDK libraries is planned for the November stable ([blog][blog-347]). The guide includes a `MaterialUiCompatibilityBridge` (used inside `MaterialApp.builder`) for dependencies that still import the old library. It warns that types from the two libraries are distinct: a `ColorScheme` from `package:flutter/material.dart` can't be passed where a `package:material_ui` one is expected.
- `DropdownButton` gets `enabled`, and `onChanged` becomes optional ([guide][bc-dropdown]; Timeline "Not yet").
- `useInheritedMediaQuery` is removed from `MaterialApp`/`CupertinoApp`/`WidgetsApp` ([guide][bc-uimq]; Timeline "TBD").

---

## 3. Full widget catalog

Source: the catalog's data file, [`widgets.yml`][catalog-yml] (229 entries), grouped exactly as [docs.flutter.dev/ui/widgets][catalog] groups them ([`catalog/index.yml`][catalog-index]). Every widget is listed under every category it belongs to. A best-practice note appears the first time a widget comes up; later rows say "see above". Linked notes come from the page they link to (the reference-style labels such as [C] and [P] are defined in §9). **Unlinked one-liners describe standard usage from the widget's API page and were not re-verified one by one in this pass.**

Things to know about the catalog itself:

- The M3 categories (Actions, Communication, Containment, Navigation, Selection, Text inputs) list only 28 widgets. Newer M3 widgets such as `SearchBar`/`SearchAnchor`, `DropdownMenu` and `MenuAnchor` (apart from the "Menu" entry) are missing from the data file, even though Widget of the Week covers them (§6).
- `CarouselView` links to `main-api.flutter.dev`. The stable page `https://api.flutter.dev/flutter/material/CarouselView-class.html` returns 200.
- `Stack` carries a stray category `Stack` in the data file. It's listed below under Multi-child layout.

### 3.1 Basics

#### Basics (11)

| Widget | What it is for (catalog) | Best practice / pitfall | Source |
|---|---|---|---|
| `AppBar` | Container that displays content and actions at the top of a screen | In M3 the theme property is `backgroundColor`; `AppBarTheme.color` is deprecated since 3.35 ([BC][bc-appbar]). | [api](https://api.flutter.dev/flutter/material/AppBar-class.html) |
| `Column` | Layout a list of child widgets in the vertical direction | Unbounded in its main axis inside a scroll view: no `Expanded` there ([C#flex][c-flex]). Use `spacing:` for gaps. | [api](https://api.flutter.dev/flutter/widgets/Column-class.html) |
| `Container` | A convenience widget that combines common painting, positioning, and sizing widgets | Convenience bundle; with no child and no size it tries to be as big as possible ([C]). Prefer `SizedBox`/`Padding`/`ColoredBox`/`DecoratedBox` when you need one thing. | [api](https://api.flutter.dev/flutter/widgets/Container-class.html) |
| `ElevatedButton` | A Material Design elevated button | "Avoid using elevated buttons on already-elevated content such as dialogs or cards" ([API][api-elevated]). | [api](https://api.flutter.dev/flutter/material/ElevatedButton-class.html) |
| `FlutterLogo` | The Flutter logo, in widget form | Handy placeholder image in demos. | [api](https://api.flutter.dev/flutter/widgets/FlutterLogo-class.html) |
| `Icon` | A Material Design icon | Decorative by default; give `semanticLabel` when it carries meaning. `IconData` is `final` since 3.44 ([BC][bc-icondata]). | [api](https://api.flutter.dev/flutter/widgets/Icon-class.html) |
| `Image` | A widget that displays an image | `Image.network` needs network access (none in ThongLearn's sandbox); set `semanticLabel`, and `errorBuilder`. | [api](https://api.flutter.dev/flutter/widgets/Image-class.html) |
| `Placeholder` | A widget that draws a box that represents where other widgets will one day be added | Grey box with a cross; fills available space, so give it a size in unbounded contexts. | [api](https://api.flutter.dev/flutter/widgets/Placeholder-class.html) |
| `Row` | Layout a list of child widgets in the horizontal direction | A `TextField` or `ListView` inside a Row needs `Expanded`/a width, or you get an unbounded-width error ([C]). | [api](https://api.flutter.dev/flutter/widgets/Row-class.html) |
| `Scaffold` | Implements the basic Material Design visual layout structure | Wrap body content in `SafeArea` where system UI intrudes ([SA]). | [api](https://api.flutter.dev/flutter/material/Scaffold-class.html) |
| `Text` | A run of text with a single style | Respects the OS font size (`TextScaler`); `textScaleFactor` is deprecated ([BC][bc-textscaler], [A11y][a11y-style]). | [api](https://api.flutter.dev/flutter/widgets/Text-class.html) |

### 3.2 Material components (Material 3)

#### M3 · Actions (5)

| Widget | What it is for (catalog) | Best practice / pitfall | Source |
|---|---|---|---|
| Common buttons | Clickable blocks that start an action, such as sending an email, sharing a document, or liking a comment | M3 set: `FilledButton` ("important, final actions" ([API][api-filled])), `FilledButton.tonal`, `ElevatedButton`, `OutlinedButton`, `TextButton`. | [api](https://api.flutter.dev/flutter/material/ButtonStyle-class.html#material-3-button-types) |
| `FloatingActionButton` | Clickable block containing an icon that keeps a key action always in reach | One primary action per screen; give it a `tooltip` for screen readers. | [api](https://api.flutter.dev/flutter/material/FloatingActionButton-class.html) |
| Extended FloatingActionButton | Clickable block that triggers an action | `FloatingActionButton.extended(icon:, label:)`. | [api](https://api.flutter.dev/flutter/material/FloatingActionButton/FloatingActionButton.extended.html) |
| `IconButton` | Clickable icons to prompt app users to take supplementary actions | Always set `tooltip` (it becomes the semantics label). | [api](https://api.flutter.dev/flutter/material/IconButton-class.html) |
| `SegmentedButton` | Single or multiple selected clickable blocks to help people select options, switch views, or sort elements | M3 replacement for `ToggleButtons`; `Set<T>` selection. | [api](https://api.flutter.dev/flutter/material/SegmentedButton-class.html) |

#### M3 · Communication (3)

| Widget | What it is for (catalog) | Best practice / pitfall | Source |
|---|---|---|---|
| `Badge` | Icon-like block that conveys dynamic content such as counts or status | M3 count/status dot, usually on an `Icon` in a NavigationBar destination. | [api](https://api.flutter.dev/flutter/material/Badge-class.html) |
| `LinearProgressIndicator` | Vertical line that changes color as an ongoing process, such as loading an app or submitting a form, completes | M3 look was updated in 3.29 ([BC][bc-progress]); a looping indicator never 'settles' in `pumpAndSettle`. | [api](https://api.flutter.dev/flutter/material/LinearProgressIndicator-class.html) |
| `SnackBar` | Brief messages about app processes that display at the bottom of the screen | Since 3.38 a SnackBar **with an action** no longer auto-dismisses; set `persist: false` to restore the old behavior ([BC][bc-snackbar]). Show through `ScaffoldMessenger.of(context)`. | [api](https://api.flutter.dev/flutter/material/SnackBar-class.html) |

#### M3 · Containment (5)

| Widget | What it is for (catalog) | Best practice / pitfall | Source |
|---|---|---|---|
| `AlertDialog` | Hovering containers that prompt app users to provide more data or make a decision | Show with `showDialog`; it returns a `Future`, so check `context.mounted` before using `context` after `await`. | [api](https://api.flutter.dev/flutter/material/AlertDialog-class.html) |
| Bottom sheet | Containers that anchor supplementary content to the bottom of the screen | `showModalBottomSheet` for modal, `Scaffold.bottomSheet` for persistent. | [api](https://api.flutter.dev/flutter/material/BottomSheet-class.html) |
| `Card` | Container for short, related pieces of content displayed in a box with rounded corners and a drop shadow | Is a `Material`, so a `ListTile` inside it keeps its ink splash ([BC 3.44][bc-listtile]). | [api](https://api.flutter.dev/flutter/material/Card-class.html) |
| `Divider` | Thin line that groups content in lists and containers | Horizontal only; `VerticalDivider` for rows (needs a bounded height). | [api](https://api.flutter.dev/flutter/material/Divider-class.html) |
| `ListTile` | A single fixed-height row that typically contains some text as well as a leading or trailing icon | Since 3.44, an opaque `Container`/`ColoredBox` between it and its `Material` ancestor is a debug error ([BC][bc-listtile]). | [api](https://api.flutter.dev/flutter/material/ListTile-class.html) |

#### M3 · Navigation (6)

| Widget | What it is for (catalog) | Best practice / pitfall | Source |
|---|---|---|---|
| `AppBar` | Container that displays content and actions at the top of a screen | see above | [api](https://api.flutter.dev/flutter/material/AppBar-class.html) |
| Bottom app bar | Container that displays navigation and key actions at the bottom of a screen | Pairs with a docked FAB; not a navigation bar. | [api](https://api.flutter.dev/flutter/material/BottomAppBar-class.html) |
| `NavigationBar` | Persistent container that enables switching between primary destinations in an app | M3 replacement for `BottomNavigationBar`; use for windows < 600 dp wide ([A][ar-general]). | [api](https://api.flutter.dev/flutter/material/NavigationBar-class.html) |
| `NavigationDrawer` | Container that slides from the leading edge of the app to navigate to other sections in an app | M3 drawer; put it in `Scaffold.drawer`. | [api](https://api.flutter.dev/flutter/material/NavigationDrawer-class.html) |
| Navigation rail | Persistent container on the leading edge of tablet and desktop screens to navigate to parts of an app | Use for windows >= 600 dp wide, swapping with NavigationBar ([A][ar-general]). | [api](https://api.flutter.dev/flutter/material/NavigationRail-class.html) |
| `TabBar` | Layered containers that organize content across different screens, data sets, and other interactions | Needs a `TabController` or a `DefaultTabController` ancestor. | [api](https://api.flutter.dev/flutter/material/TabBar-class.html) |

#### M3 · Selection (8)

| Widget | What it is for (catalog) | Best practice / pitfall | Source |
|---|---|---|---|
| `Checkbox` | Form control that app users can set or clear to select one or more options from a set | `value` + `onChanged`; `onChanged: null` disables it. | [api](https://api.flutter.dev/flutter/material/Checkbox-class.html) |
| `Chip` | Small blocks that simplify entering information, making selections, filtering content, or triggering actions | Pick the M3 variant: `ActionChip`, `FilterChip`, `ChoiceChip`, `InputChip`. | [api](https://api.flutter.dev/flutter/material/Chip-class.html) |
| `DatePicker` | Calendar interface used to select a date or a range of dates | `showDatePicker` returns `Future<DateTime?>`; handle `null` (dismissed). | [api](https://api.flutter.dev/flutter/material/showDatePicker.html) |
| `Menu` | Container that displays a list of choices on a temporary surface | M3 `MenuAnchor`/`DropdownMenu` supersede `PopupMenuButton`/`DropdownButton` for new M3 UI. | [api](https://api.flutter.dev/flutter/material/MenuAnchor-class.html) |
| `Radio` | Form control that app users can set or clear to select only one option from a set | Since 3.35 wrap radios in a `RadioGroup`; `Radio.groupValue`/`onChanged` are deprecated ([BC][bc-radio]). | [api](https://api.flutter.dev/flutter/material/Radio-class.html) |
| `Slider` | Form control that enables selecting a range of values | M3 visuals updated in 3.29 ([BC][bc-slider]). | [api](https://api.flutter.dev/flutter/material/Slider-class.html) |
| `Switch` | Toggle control that changes the state of a single item to on or off | Use `Switch.adaptive` for platform look; `SwitchListTile` for a labeled row. | [api](https://api.flutter.dev/flutter/material/Switch-class.html) |
| `TimePicker` | Clock interface used to select and set a specific time | `showTimePicker` returns `Future<TimeOfDay?>`. | [api](https://api.flutter.dev/flutter/material/showTimePicker.html) |

#### M3 · Text inputs (1)

| Widget | What it is for (catalog) | Best practice / pitfall | Source |
|---|---|---|---|
| `TextField` | Box into which app users can enter text | Own the `TextEditingController` in a `State` and dispose it ([API][api-editable]). Inside a Row it needs `Expanded` ([C]). | [api](https://api.flutter.dev/flutter/material/TextField-class.html) |

### 3.3 Material 2 components (still in the catalog)

#### M2 · App structure and navigation (11)

| Widget | What it is for (catalog) | Best practice / pitfall | Source |
|---|---|---|---|
| `AppBar` | Container that displays content and actions at the top of a screen | see above | [api](https://api.flutter.dev/flutter/material/AppBar-class.html) |
| `BottomNavigationBar` | Container that includes tools to explore and switch between top-level views in a single tap | "There is an updated version of this component, NavigationBar, that's preferred for new applications" ([API][api-bnb]). | [api](https://api.flutter.dev/flutter/material/BottomNavigationBar-class.html) |
| `Drawer` | A Material Design panel that slides in horizontally from the edge of a Scaffold to show navigation links… | M2-era; prefer `NavigationDrawer` in M3. | [api](https://api.flutter.dev/flutter/material/Drawer-class.html) |
| `MaterialApp` | A convenience widget that wraps a number of widgets that are commonly required for applications… | `useInheritedMediaQuery` is being removed (not yet in stable) ([BC][bc-uimq]). Material itself moves to `package:material_ui` ([BC][bc-materialui]). | [api](https://api.flutter.dev/flutter/material/MaterialApp-class.html) |
| `Scaffold` | Implements the basic Material Design visual layout structure | see above | [api](https://api.flutter.dev/flutter/material/Scaffold-class.html) |
| `SliverAppBar` | A material design app bar that integrates with a CustomScrollView | Only inside a `CustomScrollView`/`NestedScrollView`. | [api](https://api.flutter.dev/flutter/material/SliverAppBar-class.html) |
| `TabBar` | Layered containers that organize content across different screens, data sets, and other interactions | see above | [api](https://api.flutter.dev/flutter/material/TabBar-class.html) |
| `TabBarView` | A page view that displays the widget which corresponds to the currently selected tab | Same controller as its TabBar; children are kept alive only if they opt in. | [api](https://api.flutter.dev/flutter/material/TabBarView-class.html) |
| `TabController` | Coordinates tab selection between a TabBar and a TabBarView | Create in `initState` with a `TickerProvider`, dispose in `dispose`. | [api](https://api.flutter.dev/flutter/material/TabController-class.html) |
| `TabPageSelector` | Displays a row of small circular indicators, one per tab | — | [api](https://api.flutter.dev/flutter/material/TabPageSelector-class.html) |
| `WidgetsApp` | A convenience class that wraps a number of widgets that are commonly required for an application | Design-neutral app shell; what MaterialApp/CupertinoApp build on. | [api](https://api.flutter.dev/flutter/widgets/WidgetsApp-class.html) |

#### M2 · Buttons (8)

| Widget | What it is for (catalog) | Best practice / pitfall | Source |
|---|---|---|---|
| `DropdownButton` | Shows the currently selected item and an arrow that opens a menu for selecting another item | `onChanged` will become optional with a new `enabled` flag (landed, not yet stable) ([BC][bc-dropdown]). | [api](https://api.flutter.dev/flutter/material/DropdownButton-class.html) |
| `ElevatedButton` | A Material Design elevated button | see above | [api](https://api.flutter.dev/flutter/material/ElevatedButton-class.html) |
| `FloatingActionButton` | Clickable block containing an icon that keeps a key action always in reach | see above | [api](https://api.flutter.dev/flutter/material/FloatingActionButton-class.html) |
| Extended FloatingActionButton | Clickable block that triggers an action | see above | [api](https://api.flutter.dev/flutter/material/FloatingActionButton/FloatingActionButton.extended.html) |
| `IconButton` | Clickable icons to prompt app users to take supplementary actions | see above | [api](https://api.flutter.dev/flutter/material/IconButton-class.html) |
| `OutlinedButton` | A Material Design outlined button, essentially a TextButton with an outlined border | Medium-emphasis action. | [api](https://api.flutter.dev/flutter/material/OutlinedButton-class.html) |
| `PopupMenuButton` | Displays a menu when pressed and calls onSelected when the menu is dismissed because an item was selected | M2-style menu; consider `MenuAnchor` in M3 UI. | [api](https://api.flutter.dev/flutter/material/PopupMenuButton-class.html) |
| `TextButton` | A Material Design text button | Lowest emphasis; for dialogs and inline actions. | [api](https://api.flutter.dev/flutter/material/TextButton-class.html) |

#### M2 · Input and selections (6)

| Widget | What it is for (catalog) | Best practice / pitfall | Source |
|---|---|---|---|
| `Checkbox` | Form control that app users can set or clear to select one or more options from a set | see above | [api](https://api.flutter.dev/flutter/material/Checkbox-class.html) |
| `DatePicker` | Calendar interface used to select a date or a range of dates | see above | [api](https://api.flutter.dev/flutter/material/showDatePicker.html) |
| `Radio` | Form control that app users can set or clear to select only one option from a set | see above | [api](https://api.flutter.dev/flutter/material/Radio-class.html) |
| `Slider` | Form control that enables selecting a range of values | see above | [api](https://api.flutter.dev/flutter/material/Slider-class.html) |
| `Switch` | Toggle control that changes the state of a single item to on or off | see above | [api](https://api.flutter.dev/flutter/material/Switch-class.html) |
| `TextField` | Box into which app users can enter text | see above | [api](https://api.flutter.dev/flutter/material/TextField-class.html) |

#### M2 · Dialogs, alerts, and panels (4)

| Widget | What it is for (catalog) | Best practice / pitfall | Source |
|---|---|---|---|
| `AlertDialog` | Hovering containers that prompt app users to provide more data or make a decision | see above | [api](https://api.flutter.dev/flutter/material/AlertDialog-class.html) |
| `ExpansionPanel` | Expansion panels contain creation flows and allow lightweight editing of an element | Only works inside an `ExpansionPanelList`; `ExpansionTileController` is deprecated for `ExpansibleController` ([BC 3.32][bc-expansible]). | [api](https://api.flutter.dev/flutter/material/ExpansionPanel-class.html) |
| `SimpleDialog` | Simple dialogs can provide additional details or actions about a list item | For choosing one option; returns the value via `Navigator.pop(context, value)`. | [api](https://api.flutter.dev/flutter/material/SimpleDialog-class.html) |
| `SnackBar` | Brief messages about app processes that display at the bottom of the screen | see above | [api](https://api.flutter.dev/flutter/material/SnackBar-class.html) |

#### M2 · Information displays (9)

| Widget | What it is for (catalog) | Best practice / pitfall | Source |
|---|---|---|---|
| `Card` | Container for short, related pieces of content displayed in a box with rounded corners and a drop shadow | see above | [api](https://api.flutter.dev/flutter/material/Card-class.html) |
| `Chip` | Small blocks that simplify entering information, making selections, filtering content, or triggering actions | see above | [api](https://api.flutter.dev/flutter/material/Chip-class.html) |
| `CircularProgressIndicator` | Circular progress indicator that spins to indicate a busy application | Indeterminate one animates forever, so `tester.pumpAndSettle()` times out while it's on screen. | [api](https://api.flutter.dev/flutter/material/CircularProgressIndicator-class.html) |
| `DataTable` | Data tables display sets of raw data | "It's expensive to display large amounts of data with this widget" (measured twice); use `PaginatedDataTable` ([API][api-datatable]). | [api](https://api.flutter.dev/flutter/material/DataTable-class.html) |
| `GridView` | A grid list consists of a repeated pattern of cells arrayed in a vertical and horizontal layout | Prefer `SliverGridDelegateWithMaxCrossAxisExtent` (max item width) over a hard-coded column count ([LS]). | [api](https://api.flutter.dev/flutter/widgets/GridView-class.html) |
| `Icon` | A Material Design icon | see above | [api](https://api.flutter.dev/flutter/widgets/Icon-class.html) |
| `Image` | A widget that displays an image | see above | [api](https://api.flutter.dev/flutter/widgets/Image-class.html) |
| `LinearProgressIndicator` | Vertical line that changes color as an ongoing process, such as loading an app or submitting a form, completes | see above | [api](https://api.flutter.dev/flutter/material/LinearProgressIndicator-class.html) |
| `Tooltip` | Tooltips provide text labels that help explain the function of a button or other user interface action | `IconButton(tooltip:)` also provides the accessible label. | [api](https://api.flutter.dev/flutter/material/Tooltip-class.html) |

#### M2 · Layout (3)

| Widget | What it is for (catalog) | Best practice / pitfall | Source |
|---|---|---|---|
| `Divider` | Thin line that groups content in lists and containers | see above | [api](https://api.flutter.dev/flutter/material/Divider-class.html) |
| `ListTile` | A single fixed-height row that typically contains some text as well as a leading or trailing icon | see above | [api](https://api.flutter.dev/flutter/material/ListTile-class.html) |
| `Stepper` | A Material Design stepper widget that displays progress through a sequence of steps | M2 component; fine but not restyled for M3 spec. | [api](https://api.flutter.dev/flutter/material/Stepper-class.html) |

### 3.4 Layout

#### Single-child layout widgets (19)

| Widget | What it is for (catalog) | Best practice / pitfall | Source |
|---|---|---|---|
| `Align` | A widget that aligns its child within itself and optionally sizes itself based on the child's size | `widthFactor`/`heightFactor` make it shrink-wrap; otherwise it's as big as allowed ([C]). | [api](https://api.flutter.dev/flutter/widgets/Align-class.html) |
| `AspectRatio` | A widget that attempts to size the child to a specific aspect ratio | Needs bounded constraints in at least one direction. | [api](https://api.flutter.dev/flutter/widgets/AspectRatio-class.html) |
| `Baseline` | Container that positions its child according to the child's baseline | Aligns by text baseline; for rows of text prefer `Row(crossAxisAlignment: .baseline, textBaseline: ...)`. | [api](https://api.flutter.dev/flutter/widgets/Baseline-class.html) |
| `Center` | Alignment block that centers its child within itself | Turns tight constraints into loose ones for its child ([C]). | [api](https://api.flutter.dev/flutter/widgets/Center-class.html) |
| `ConstrainedBox` | A widget that imposes additional constraints on its child | Can only *add* constraints within the parent's; it can't make a child bigger than the parent allows ([C]). | [api](https://api.flutter.dev/flutter/widgets/ConstrainedBox-class.html) |
| `Container` | A convenience widget that combines common painting, positioning, and sizing widgets | see above | [api](https://api.flutter.dev/flutter/widgets/Container-class.html) |
| `CustomSingleChildLayout` | A widget that defers the layout of its single child to a delegate | Delegate-based; reach for it only when Align/Positioned can't express the layout. | [api](https://api.flutter.dev/flutter/widgets/CustomSingleChildLayout-class.html) |
| `Expanded` | A widget that expands a child of a Row, Column, or Flex | Must be a descendant of a Row/Column/Flex with only Stateless/Stateful widgets in between ([API][api-expanded]); throws inside an unbounded flex ([C#flex][c-flex]). | [api](https://api.flutter.dev/flutter/widgets/Expanded-class.html) |
| `FittedBox` | Scales and positions its child within itself according to fit | Scales the child's *painting*; good for text that must fit one line. | [api](https://api.flutter.dev/flutter/widgets/FittedBox-class.html) |
| `FractionallySizedBox` | A widget that sizes its child to a fraction of the total available space | Needs bounded parent constraints to compute the fraction. | [api](https://api.flutter.dev/flutter/widgets/FractionallySizedBox-class.html) |
| `IntrinsicHeight` | A widget that sizes its child to the child's intrinsic height | Triggers a second (intrinsic) layout pass: expensive, avoid in lists ([P][p-intrinsic]). | [api](https://api.flutter.dev/flutter/widgets/IntrinsicHeight-class.html) |
| `IntrinsicWidth` | A widget that sizes its child to the child's intrinsic width | Same cost as IntrinsicHeight ([P][p-intrinsic]). | [api](https://api.flutter.dev/flutter/widgets/IntrinsicWidth-class.html) |
| `LimitedBox` | A box that limits its size only when it's unconstrained | Only applies its limit when the incoming constraint is unbounded ([C]). | [api](https://api.flutter.dev/flutter/widgets/LimitedBox-class.html) |
| `Offstage` | A widget that lays the child out as if it was in the tree, but without painting anything, without making… | Still lays out the child; use `Visibility` or don't build it if you want no cost. | [api](https://api.flutter.dev/flutter/widgets/Offstage-class.html) |
| `OverflowBox` | A widget that imposes different constraints on its child than it gets from its parent, possibly allowing… | Lets the child overflow **without** the debug warning ([C]). | [api](https://api.flutter.dev/flutter/widgets/OverflowBox-class.html) |
| `Padding` | A widget that insets its child by the given padding | Use instead of `Container(padding:)` when padding is all you need. | [api](https://api.flutter.dev/flutter/widgets/Padding-class.html) |
| `SizedBox` | A box with a specified size | Fixed size or gap (`SizedBox(height: 8)`); `SizedBox.expand` fills. Can be `const`. Prefer `spacing:` on Row/Column for gaps. | [api](https://api.flutter.dev/flutter/widgets/SizedBox-class.html) |
| `SizedOverflowBox` | A widget that is a specific size but passes its original constraints through to its child, which will… | Fixed size, passes original constraints: child will probably overflow. | [api](https://api.flutter.dev/flutter/widgets/SizedOverflowBox-class.html) |
| `Transform` | A widget that applies a transformation before painting its child | Paint-only: layout still uses the untransformed size. | [api](https://api.flutter.dev/flutter/widgets/Transform-class.html) |

#### Multi-child layout widgets (14)

| Widget | What it is for (catalog) | Best practice / pitfall | Source |
|---|---|---|---|
| `Column` | Layout a list of child widgets in the vertical direction | see above | [api](https://api.flutter.dev/flutter/widgets/Column-class.html) |
| `CustomMultiChildLayout` | A widget that uses a delegate to size and position multiple children | Delegate-based; children identified by `LayoutId`. | [api](https://api.flutter.dev/flutter/widgets/CustomMultiChildLayout-class.html) |
| `CarouselView` | A Material carousel widget that presents a scrollable list of items, each of which can dynamically change… | M3 carousel (catalog links to main-api, so check the stable API page). | [api](https://main-api.flutter.dev/flutter/material/CarouselView-class.html) |
| `Flow` | A widget that implements the flow layout algorithm | Efficient transforms-only repositioning; rarely needed. | [api](https://api.flutter.dev/flutter/widgets/Flow-class.html) |
| `GridView` | A grid list consists of a repeated pattern of cells arrayed in a vertical and horizontal layout | see above | [api](https://api.flutter.dev/flutter/widgets/GridView-class.html) |
| `IndexedStack` | A Stack that shows a single child from a list of children | Builds (and keeps state of) all children; only one is shown. | [api](https://api.flutter.dev/flutter/widgets/IndexedStack-class.html) |
| `LayoutBuilder` | Builds a widget tree that can depend on the parent widget's size | Gives the *parent's constraints*, not the window size ([A][ar-general]). | [api](https://api.flutter.dev/flutter/widgets/LayoutBuilder-class.html) |
| `ListBody` | A widget that arranges its children sequentially along a given axis, forcing them to the dimension of the… | Non-scrolling, non-lazy list layout; usually you want Column or ListView. | [api](https://api.flutter.dev/flutter/widgets/ListBody-class.html) |
| `ListView` | A scrollable, linear list of widgets | Default constructor builds every child: only for small lists; use `ListView.builder` for long lists ([API][api-listview], [P][p-lazy]). `cacheExtent` is deprecated for `scrollCacheExtent` ([BC][bc-cache]). | [api](https://api.flutter.dev/flutter/widgets/ListView-class.html) |
| `OverflowBar` | A widget that lays out its children in a row unless they "overflow" the available horizontal space, in… | Replacement for the deprecated `ButtonBar` ([BC][bc-buttonbar]). | [api](https://api.flutter.dev/flutter/widgets/OverflowBar-class.html) |
| `Row` | Layout a list of child widgets in the horizontal direction | see above | [api](https://api.flutter.dev/flutter/widgets/Row-class.html) |
| `Stack` | This class is useful if you want to overlap several children in a simple way, for example having some text… | Non-positioned children size the Stack; `Positioned` must be a direct (Stateless/Stateful-only path) descendant of a Stack ([API][api-positioned]). | [api](https://api.flutter.dev/flutter/widgets/Stack-class.html) |
| `Table` | Displays child widgets in rows and columns | Not lazy and not scrollable; fine for small grids. | [api](https://api.flutter.dev/flutter/widgets/Table-class.html) |
| `Wrap` | A widget that displays its children in multiple horizontal or vertical runs | Use when children should flow to the next line instead of overflowing a Row. | [api](https://api.flutter.dev/flutter/widgets/Wrap-class.html) |

#### Sliver widgets (13)

| Widget | What it is for (catalog) | Best practice / pitfall | Source |
|---|---|---|---|
| `CupertinoSliverNavigationBar` | A navigation bar with iOS-11-style large titles using slivers | Large-title nav bar used in the pathway's slivers step ([pathway][pw-slivers]). | [api](https://api.flutter.dev/flutter/cupertino/CupertinoSliverNavigationBar-class.html) |
| `CupertinoSliverRefreshControl` | A sliver widget implementing the iOS-style pull to refresh content control | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoSliverRefreshControl-class.html) |
| `CustomScrollView` | A ScrollView that creates custom scroll effects using slivers | The container for slivers; mix lists, grids and app bars in one scroll ([pathway: slivers][pw-slivers]). | [api](https://api.flutter.dev/flutter/widgets/CustomScrollView-class.html) |
| `SliverAppBar` | A material design app bar that integrates with a CustomScrollView | see above | [api](https://api.flutter.dev/flutter/material/SliverAppBar-class.html) |
| `SliverChildBuilderDelegate` | A delegate that supplies children for slivers using a builder callback | Lazy children for SliverList/SliverGrid; most code uses `SliverList.builder`. | [api](https://api.flutter.dev/flutter/widgets/SliverChildBuilderDelegate-class.html) |
| `SliverChildListDelegate` | A delegate that supplies children for slivers using an explicit list | Eager children; small fixed lists only. | [api](https://api.flutter.dev/flutter/widgets/SliverChildListDelegate-class.html) |
| `SliverFillRemaining` | A sliver that contains a single box child that fills the remaining space in the viewport | Fills what's left of the viewport (e.g. an empty state). | [api](https://api.flutter.dev/flutter/widgets/SliverFillRemaining-class.html) |
| `SliverFixedExtentList` | A sliver that places multiple box children with the same main axis extent in a linear array | Faster when every item has the same height. | [api](https://api.flutter.dev/flutter/widgets/SliverFixedExtentList-class.html) |
| `SliverGrid` | A sliver that places multiple box children in a two dimensional arrangement | Sliver version of GridView. | [api](https://api.flutter.dev/flutter/widgets/SliverGrid-class.html) |
| `SliverList` | A sliver that places multiple box children in a linear array along the main axis | `SliverList.separated`: use `findItemIndexCallback`, not the deprecated `findChildIndexCallback` ([BC][bc-separated]). | [api](https://api.flutter.dev/flutter/widgets/SliverList-class.html) |
| `SliverPadding` | A sliver that applies padding on each side of another sliver | Padding for slivers (a plain `Padding` can't wrap a sliver). | [api](https://api.flutter.dev/flutter/widgets/SliverPadding-class.html) |
| `SliverPersistentHeader` | A sliver whose size varies when the sliver is scrolled to the edge of the viewport opposite the sliver's… | Needs a delegate with min/max extent; SliverAppBar is the ready-made version. | [api](https://api.flutter.dev/flutter/widgets/SliverPersistentHeader-class.html) |
| `SliverToBoxAdapter` | A sliver that contains a single box widget | Puts one normal box widget in a CustomScrollView; don't put a whole list in it (not lazy). | [api](https://api.flutter.dev/flutter/widgets/SliverToBoxAdapter-class.html) |

### 3.5 Other base categories

#### Text (3)

| Widget | What it is for (catalog) | Best practice / pitfall | Source |
|---|---|---|---|
| `DefaultTextStyle` | The text style to apply to descendant Text widgets without explicit style | Sets the inherited style for `Text` without an explicit style. | [api](https://api.flutter.dev/flutter/widgets/DefaultTextStyle-class.html) |
| `RichText` | The RichText widget displays text that uses multiple different styles | Prefer `Text.rich` so the default style and text scaling apply. | [api](https://api.flutter.dev/flutter/widgets/RichText-class.html) |
| `Text` | A run of text with a single style | see above | [api](https://api.flutter.dev/flutter/widgets/Text-class.html) |

#### Assets, images, and icons (4)

| Widget | What it is for (catalog) | Best practice / pitfall | Source |
|---|---|---|---|
| `AssetBundle` | Asset bundles contain resources, such as images and strings, that can be used by an application | Declare assets in `pubspec.yaml`; `AssetManifest.json` is no longer generated ([BC 3.19][bc-assetmanifest]). | [api](https://api.flutter.dev/flutter/services/AssetBundle-class.html) |
| `Icon` | A Material Design icon | see above | [api](https://api.flutter.dev/flutter/widgets/Icon-class.html) |
| `Image` | A widget that displays an image | see above | [api](https://api.flutter.dev/flutter/widgets/Image-class.html) |
| `RawImage` | A widget that displays a dart:ui.Image directly | Low level; use `Image` normally. | [api](https://api.flutter.dev/flutter/widgets/RawImage-class.html) |

#### Input (4)

| Widget | What it is for (catalog) | Best practice / pitfall | Source |
|---|---|---|---|
| `Autocomplete` | A widget for helping the user make a selection by entering some text and choosing from among a list of options | Material version; provide `optionsBuilder` that is cheap (runs per keystroke). | [api](https://api.flutter.dev/flutter/material/Autocomplete-class.html) |
| `Form` | An optional container for grouping together multiple form field widgets (e.g | Reach its state with `GlobalKey<FormState>`; since 3.35 it can no longer be used as a sliver ([BC][bc-form]). | [api](https://api.flutter.dev/flutter/widgets/Form-class.html) |
| `FormField` | A single form field | Base for custom validated fields; `DropdownButtonFormField.value` is now `initialValue` ([BC][bc-dropdownff]). | [api](https://api.flutter.dev/flutter/widgets/FormField-class.html) |
| `KeyboardListener` | A widget that calls a callback whenever the user presses or releases a key on a keyboard | Uses `KeyEvent`/`HardwareKeyboard`; `RawKeyboardListener` was deprecated in 3.19 ([BC][bc-rawkey]). Prefer `Shortcuts`/`CallbackShortcuts` for key bindings. | [api](https://api.flutter.dev/flutter/widgets/KeyboardListener-class.html) |

#### Animation and motion (29)

| Widget | What it is for (catalog) | Best practice / pitfall | Source |
|---|---|---|---|
| `AlignTransition` | Animated version of an Align that animates its Align.alignment property | — | [api](https://api.flutter.dev/flutter/widgets/AlignTransition-class.html) |
| `AnimatedAlign` | Animated transition that moves the child's position over a given duration whenever the given alignment changes | — | [api](https://api.flutter.dev/flutter/widgets/AnimatedAlign-class.html) |
| `AnimatedBuilder` | A general-purpose widget for building animations | Build the non-animating subtree once and pass it as `child` ([P][p-pitfalls]). | [api](https://api.flutter.dev/flutter/widgets/AnimatedBuilder-class.html) |
| `AnimatedContainer` | A container that gradually changes its values over a period of time | The workhorse implicit animation; animate *changes* by rebuilding with new values. | [api](https://api.flutter.dev/flutter/widgets/AnimatedContainer-class.html) |
| `AnimatedCrossFade` | A widget that cross-fades between two given children and animates itself between their sizes | 3.47 added a clip behavior option ([What's new 3.47][blog-347]). | [api](https://api.flutter.dev/flutter/widgets/AnimatedCrossFade-class.html) |
| `AnimatedDefaultTextStyle` | Animated version of DefaultTextStyle which automatically transitions the default text style (the text… | — | [api](https://api.flutter.dev/flutter/widgets/AnimatedDefaultTextStyle-class.html) |
| `AnimatedList` | A scrolling container that animates items when they are inserted or removed | Keep items in sync via `GlobalKey<AnimatedListState>` / `insertItem` / `removeItem`. | [api](https://api.flutter.dev/flutter/widgets/AnimatedList-class.html) |
| `AnimatedListState` | The state for a scrolling container that animates items when they are inserted or removed | — | [api](https://api.flutter.dev/flutter/widgets/AnimatedListState-class.html) |
| `AnimatedModalBarrier` | A widget that prevents the user from interacting with widgets behind itself | — | [api](https://api.flutter.dev/flutter/widgets/AnimatedModalBarrier-class.html) |
| `AnimatedOpacity` | Animated version of Opacity which automatically transitions the child's opacity over a given duration… | Prefer over animating `Opacity` yourself ([P][p-pitfalls]). | [api](https://api.flutter.dev/flutter/widgets/AnimatedOpacity-class.html) |
| `AnimatedPhysicalModel` | Animated version of PhysicalModel | — | [api](https://api.flutter.dev/flutter/widgets/AnimatedPhysicalModel-class.html) |
| `AnimatedPositioned` | Animated version of Positioned which automatically transitions the child's position over a given duration… | — | [api](https://api.flutter.dev/flutter/widgets/AnimatedPositioned-class.html) |
| `AnimatedScale` | Animated version of `Transform.scale` that automatically transitions the child's scale over a given… | — | [api](https://api.flutter.dev/flutter/widgets/AnimatedScale-class.html) |
| `AnimatedSize` | Animated widget that automatically transitions its size over a given duration whenever the given child's… | — | [api](https://api.flutter.dev/flutter/widgets/AnimatedSize-class.html) |
| `AnimatedWidget` | A widget that rebuilds when the given Listenable changes value | Base class for explicit animations that rebuild on a `Listenable`. | [api](https://api.flutter.dev/flutter/widgets/AnimatedWidget-class.html) |
| `ImplicitlyAnimatedWidget` | An abstract class for building widgets that animate changes to their properties | Base class of `AnimatedFoo` widgets; subclass for custom implicit animations. | [api](https://api.flutter.dev/flutter/widgets/ImplicitlyAnimatedWidget-class.html) |
| `DecoratedBoxTransition` | Animated version of a DecoratedBox that animates the different properties of its Decoration | — | [api](https://api.flutter.dev/flutter/widgets/DecoratedBoxTransition-class.html) |
| `DefaultTextStyleTransition` | Animated version of a DefaultTextStyle that animates the different properties of its TextStyle | — | [api](https://api.flutter.dev/flutter/widgets/DefaultTextStyleTransition-class.html) |
| `FadeTransition` | Animates the opacity of a widget | Explicit (needs an `AnimationController`); cheaper than an animated `Opacity`. | [api](https://api.flutter.dev/flutter/widgets/FadeTransition-class.html) |
| `Hero` | A widget that marks its child as being a candidate for hero animations | Routes must not contain more than one Hero per `tag` ([API][api-hero]). | [api](https://api.flutter.dev/flutter/widgets/Hero-class.html) |
| `MatrixTransition` | Animates the Matrix4 of a transformed widget | — | [api](https://api.flutter.dev/flutter/widgets/MatrixTransition-class.html) |
| `PositionedTransition` | Animated version of Positioned which takes a specific Animation to transition the child's position from a… | — | [api](https://api.flutter.dev/flutter/widgets/PositionedTransition-class.html) |
| `RelativePositionedTransition` | Animated version of Positioned which transitions the child's position based on the value of rect relative… | — | [api](https://api.flutter.dev/flutter/widgets/RelativePositionedTransition-class.html) |
| `RepeatingAnimationBuilder` | A widget that animates an Animatable value and repeats indefinitely | Newer catalog entry: loops an `Animatable` without a hand-written controller ([API][api-repeating]). | [api](https://api.flutter.dev/flutter/widgets/RepeatingAnimationBuilder-class.html) |
| `RotationTransition` | Animates the rotation of a widget | — | [api](https://api.flutter.dev/flutter/widgets/RotationTransition-class.html) |
| `ScaleTransition` | Animates the scale of transformed widget | — | [api](https://api.flutter.dev/flutter/widgets/ScaleTransition-class.html) |
| `SizeTransition` | Animates its own size and clips and aligns the child | — | [api](https://api.flutter.dev/flutter/widgets/SizeTransition-class.html) |
| `SlideTransition` | Animates the position of a widget relative to its normal position | — | [api](https://api.flutter.dev/flutter/widgets/SlideTransition-class.html) |
| `SliverFadeTransition` | Animates the opacity of a sliver widget | — | [api](https://api.flutter.dev/flutter/widgets/SliverFadeTransition-class.html) |

#### Interaction models · Touch interactions (10)

| Widget | What it is for (catalog) | Best practice / pitfall | Source |
|---|---|---|---|
| `AbsorbPointer` | A widget that absorbs pointers during hit testing | Still takes space and paints; it only blocks hit testing ([API][api-absorb]). | [api](https://api.flutter.dev/flutter/widgets/AbsorbPointer-class.html) |
| `Dismissible` | A widget that can be dismissed by dragging in the indicated direction | Each item needs a key that distinguishes it from the others, and must be removed from the list in `onDismissed` ([API][api-dismissible]). | [api](https://api.flutter.dev/flutter/widgets/Dismissible-class.html) |
| `DragTarget` | A widget that receives data when a Draggable widget is dropped | — | [api](https://api.flutter.dev/flutter/widgets/DragTarget-class.html) |
| `Draggable` | A widget that can be dragged from to a DragTarget | — | [api](https://api.flutter.dev/flutter/widgets/Draggable-class.html) |
| `DraggableScrollableSheet` | A container for a Scrollable that responds to drag gestures by resizing the scrollable until a limit is… | Pass its `scrollController` to the inner list or dragging won't resize the sheet. | [api](https://api.flutter.dev/flutter/widgets/DraggableScrollableSheet-class.html) |
| `GestureDetector` | A widget that detects gestures | Gives no semantics or focus by itself; prefer a button or `InkWell` for tappable UI ([A11y][a11y-style], 48x48 tap target). | [api](https://api.flutter.dev/flutter/widgets/GestureDetector-class.html) |
| `IgnorePointer` | A widget that is invisible during hit testing | Invisible to hit testing (taps pass *through*), unlike AbsorbPointer which swallows them. | [api](https://api.flutter.dev/flutter/widgets/IgnorePointer-class.html) |
| `InteractiveViewer` | A widget that enables pan and zoom interactions with its child | Pan and zoom; set `constrained: false` for content larger than the viewport. | [api](https://api.flutter.dev/flutter/widgets/InteractiveViewer-class.html) |
| `LongPressDraggable` | Makes its child draggable starting from long press | — | [api](https://api.flutter.dev/flutter/widgets/LongPressDraggable-class.html) |
| `Scrollable` | Scrollable implements the interaction model for a scrollable widget, including gesture recognition, but… | Low level; use `ListView`/`CustomScrollView` unless building a new scroll view. | [api](https://api.flutter.dev/flutter/widgets/Scrollable-class.html) |

#### Interaction models · Routing (2)

| Widget | What it is for (catalog) | Best practice / pitfall | Source |
|---|---|---|---|
| `Hero` | A widget that marks its child as being a candidate for hero animations | see above | [api](https://api.flutter.dev/flutter/widgets/Hero-class.html) |
| `Navigator` | A widget that manages a set of child widgets with a stack discipline | Imperative stack (`push`/`pop`); named routes are not recommended for most apps ([navigation][nav]). Use `PopScope`, not the deprecated `WillPopScope` ([BC][bc-popscope]). | [api](https://api.flutter.dev/flutter/widgets/Navigator-class.html) |

#### Styling (3)

| Widget | What it is for (catalog) | Best practice / pitfall | Source |
|---|---|---|---|
| `MediaQuery` | Establishes a subtree in which media queries resolve to the given data | Use `MediaQuery.sizeOf(context)` (and other `xOf` methods), not `MediaQuery.of(context).size`, so you rebuild only on that property ([A][ar-general]). | [api](https://api.flutter.dev/flutter/widgets/MediaQuery-class.html) |
| `Padding` | A widget that insets its child by the given padding | see above | [api](https://api.flutter.dev/flutter/widgets/Padding-class.html) |
| `Theme` | Applies a theme to descendant widgets | `ColorScheme.fromSeed` + M3 `TextTheme` roles; `ThemeData.useMaterial3` defaults to `true` since 3.16 ([BC][bc-m3default]). | [api](https://api.flutter.dev/flutter/material/Theme-class.html) |

#### Painting and effects (10)

| Widget | What it is for (catalog) | Best practice / pitfall | Source |
|---|---|---|---|
| `BackdropFilter` | A widget that applies a filter to the existing painted content and then paints a child | Expensive (`saveLayer`); keep blurred regions small ([P][p-savelayer]). | [api](https://api.flutter.dev/flutter/widgets/BackdropFilter-class.html) |
| `ClipOval` | A widget that clips its child using an oval | Clipping is costly; don't animate clips ([P][p-opacity]). | [api](https://api.flutter.dev/flutter/widgets/ClipOval-class.html) |
| `ClipPath` | A widget that clips its child using a path | Most expensive clip; prefer `borderRadius` where possible ([P][p-opacity]). | [api](https://api.flutter.dev/flutter/widgets/ClipPath-class.html) |
| `ClipRect` | A widget that clips its child using a rectangle | Clipping is off by default (`Clip.none`) on most widgets; turn it on only when needed ([P][p-opacity]). | [api](https://api.flutter.dev/flutter/widgets/ClipRect-class.html) |
| `CustomPaint` | A widget that provides a canvas on which to draw during the paint phase | Implement `shouldRepaint` properly; wrap in `RepaintBoundary` if it repaints often. | [api](https://api.flutter.dev/flutter/widgets/CustomPaint-class.html) |
| `DecoratedBox` | A widget that paints a Decoration either before or after its child paints | Use for a decoration without Container's extra layout widgets. | [api](https://api.flutter.dev/flutter/widgets/DecoratedBox-class.html) |
| `FractionalTranslation` | A widget that applies a translation expressed as a fraction of the box's size before painting its child | Paint-only offset, like Transform. | [api](https://api.flutter.dev/flutter/widgets/FractionalTranslation-class.html) |
| `Opacity` | A widget that makes its child partially transparent | Expensive; for a fade use AnimatedOpacity/FadeTransition, for simple shapes use a translucent color ([P][p-opacity]). | [api](https://api.flutter.dev/flutter/widgets/Opacity-class.html) |
| `RotatedBox` | A widget that rotates its child by a integral number of quarter turns | Rotates *before* layout (quarter turns), unlike Transform.rotate. | [api](https://api.flutter.dev/flutter/widgets/RotatedBox-class.html) |
| `Transform` | A widget that applies a transformation before painting its child | see above | [api](https://api.flutter.dev/flutter/widgets/Transform-class.html) |

#### Async (2)

| Widget | What it is for (catalog) | Best practice / pitfall | Source |
|---|---|---|---|
| `FutureBuilder` | Widget that builds itself based on the latest snapshot of interaction with a Future | The future "must have been obtained earlier" (initState etc.), never created in `build` ([API][api-async]). | [api](https://api.flutter.dev/flutter/widgets/FutureBuilder-class.html) |
| `StreamBuilder` | Widget that builds itself based on the latest snapshot of interaction with a Stream | Same rule: obtain the stream outside `build` ([API][api-async]). | [api](https://api.flutter.dev/flutter/widgets/StreamBuilder-class.html) |

#### Scrolling (14)

| Widget | What it is for (catalog) | Best practice / pitfall | Source |
|---|---|---|---|
| `CarouselView` | A Material carousel widget that presents a scrollable list of items, each of which can dynamically change… | see above | [api](https://main-api.flutter.dev/flutter/material/CarouselView-class.html) |
| `CustomScrollView` | A ScrollView that creates custom scroll effects using slivers | see above | [api](https://api.flutter.dev/flutter/widgets/CustomScrollView-class.html) |
| `DraggableScrollableSheet` | A container for a Scrollable that responds to drag gestures by resizing the scrollable until a limit is… | see above | [api](https://api.flutter.dev/flutter/widgets/DraggableScrollableSheet-class.html) |
| `GridView` | A grid list consists of a repeated pattern of cells arrayed in a vertical and horizontal layout | see above | [api](https://api.flutter.dev/flutter/widgets/GridView-class.html) |
| `ListView` | A scrollable, linear list of widgets | see above | [api](https://api.flutter.dev/flutter/widgets/ListView-class.html) |
| `NestedScrollView` | A scrolling view inside of which can be nested other scrolling views, with their scroll positions being… | For a header that scrolls with inner tab views; more complex than CustomScrollView. | [api](https://api.flutter.dev/flutter/widgets/NestedScrollView-class.html) |
| `NotificationListener` | A widget that listens for Notifications bubbling up the tree | Return `true` to stop the notification bubbling. | [api](https://api.flutter.dev/flutter/widgets/NotificationListener-class.html) |
| `PageView` | A scrollable list that works page by page | `controller` is nullable since 3.22 ([BC][bc-pageview]). | [api](https://api.flutter.dev/flutter/widgets/PageView-class.html) |
| `RefreshIndicator` | A Material Design pull-to-refresh wrapper for scrollables | `onRefresh` must return a `Future` that completes when refresh is done. | [api](https://api.flutter.dev/flutter/material/RefreshIndicator-class.html) |
| `ReorderableListView` | A list whose items the user can interactively reorder by dragging | Use `onReorderItem`; `onReorder` (with manual `newIndex -= 1`) is deprecated since 3.44 ([BC][bc-reorder]). Items need keys. | [api](https://api.flutter.dev/flutter/material/ReorderableListView-class.html) |
| `ScrollConfiguration` | Controls how Scrollable widgets behave in a subtree | Sets `ScrollBehavior` (e.g. mouse drag on web/desktop). | [api](https://api.flutter.dev/flutter/widgets/ScrollConfiguration-class.html) |
| `Scrollable` | Scrollable implements the interaction model for a scrollable widget, including gesture recognition, but… | see above | [api](https://api.flutter.dev/flutter/widgets/Scrollable-class.html) |
| `Scrollbar` | A Material Design scrollbar | Needs the same `ScrollController` as the scroll view when you pass one. | [api](https://api.flutter.dev/flutter/material/Scrollbar-class.html) |
| `SingleChildScrollView` | A box in which a single widget can be scrolled | Mounts and paints the whole child; for long lists `ListView` is "vastly more efficient" ([API][api-scsv]). | [api](https://api.flutter.dev/flutter/widgets/SingleChildScrollView-class.html) |

#### Accessibility (3)

| Widget | What it is for (catalog) | Best practice / pitfall | Source |
|---|---|---|---|
| `ExcludeSemantics` | A widget that drops all the semantics of its descendants | Hides decorative subtrees from screen readers. | [api](https://api.flutter.dev/flutter/widgets/ExcludeSemantics-class.html) |
| `MergeSemantics` | A widget that merges the semantics of its descendants | Reads a label + control as one node (e.g. a checkbox row). | [api](https://api.flutter.dev/flutter/widgets/MergeSemantics-class.html) |
| `Semantics` | A widget that annotates the widget tree with a description of the meaning of the widgets | Label custom controls; test with `meetsGuideline(labeledTapTargetGuideline)` ([a11y testing][a11y-test]). `containsSemantics` matcher is deprecated for `isSemantics` ([BC][bc-issemantics]). | [api](https://api.flutter.dev/flutter/widgets/Semantics-class.html) |

### 3.6 Cupertino

#### Cupertino (61)

| Widget | What it is for (catalog) | Best practice / pitfall | Source |
|---|---|---|---|
| `CupertinoActionSheet` | An iOS-style modal bottom action sheet to choose an option among many | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoActionSheet-class.html) |
| `CupertinoActionSheetAction` | A button typically used in a CupertinoActionSheet | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoActionSheetAction-class.html) |
| `CupertinoActivityIndicator` | An iOS-style activity indicator | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoActivityIndicator-class.html) |
| `CupertinoAdaptiveTextSelectionToolbar` | The default Cupertino context menu for text selection for the current platform with the given children | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoAdaptiveTextSelectionToolbar-class.html) |
| `CupertinoAlertDialog` | An iOS-style alert dialog | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoAlertDialog-class.html) |
| `CupertinoApp` | An application that uses Cupertino design | The learning pathway's UI 102 unit (contacts app) is built with CupertinoApp ([pathway][pw-advanced]). | [api](https://api.flutter.dev/flutter/cupertino/CupertinoApp-class.html) |
| `CupertinoButton` | An iOS-style button | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoButton-class.html) |
| `CupertinoCheckBox` | A macOS-style checkbox | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoCheckbox-class.html) |
| `CupertinoColors` | A palette of Color constants that describe colors commonly used when matching the iOS platform aesthetics | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoColors-class.html) |
| `CupertinoContextMenu` | An iOS-style full-screen modal route that opens when the child is long-pressed | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoContextMenu-class.html) |
| `CupertinoContextMenuAction` | A button in a ContextMenuSheet | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoContextMenuAction-class.html) |
| `CupertinoDatePicker` | An iOS-style date or date and time picker | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoDatePicker-class.html) |
| `CupertinoDesktopTextSelectionControls` | Desktop Cupertino styled text selection controls | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoDesktopTextSelectionControls-class.html) |
| `CupertinoDesktopTextSelectionToolbar` | A macOS-style text selection toolbar | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoDesktopTextSelectionToolbar-class.html) |
| `CupertinoDesktopTextSelectionToolbarButton` | A button in the style of the macOS context menu buttons | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoDesktopTextSelectionToolbarButton-class.html) |
| `CupertinoDialogAction` | A button typically used in a CupertinoAlertDialog | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoDialogAction-class.html) |
| `CupertinoDialogRoute` | A dialog route that shows an iOS-style dialog | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoDialogRoute-class.html) |
| `CupertinoDynamicColor` | A Color subclass that represents a family of colors, and the correct effective color in the color family | Wide-gamut support since 3.38 ([BC][bc-cupdyn]). | [api](https://api.flutter.dev/flutter/cupertino/CupertinoDynamicColor-class.html) |
| `CupertinoFormRow` | An iOS-style form row | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoFormRow-class.html) |
| `CupertinoFormSection` | An iOS-style form section | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoFormSection-class.html) |
| `CupertinoFullscreenDialogTransition` | An iOS-style transition used for summoning fullscreen dialogs | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoFullscreenDialogTransition-class.html) |
| `CupertinoThemeData` | Styling specifications for a CupertinoTheme | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoThemeData-class.html) |
| `CupertinoListSection` | Container that uses the iOS style to display a scrollable view | Grouped iOS list; used in the pathway slivers step ([pathway][pw-slivers]). | [api](https://api.flutter.dev/flutter/cupertino/CupertinoListSection-class.html) |
| `CupertinoListTile` | A block that uses the iOS style to create a row in a list | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoListTile-class.html) |
| `CupertinoListTileChevron` | A typical iOS trailing widget used to denote that a CupertinoListTile is a button with an action | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoListTileChevron-class.html) |
| `CupertinoLocalizations` | Defines the localized resource values used by the Cupertino widgets | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoLocalizations-class.html) |
| `CupertinoMagnifier` | A RawMagnifier used for magnifying text in cases where a user's finger may be blocking the point of… | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoMagnifier-class.html) |
| `CupertinoModalPopupRoute` | A route that shows a modal iOS-style popup that slides up from the bottom of the screen | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoModalPopupRoute-class.html) |
| `CupertinoNavigationBar` | Container at the top of a screen that uses the iOS style | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoNavigationBar-class.html) |
| `CupertinoNavigationBarBackButton` | A nav bar back button typically used in CupertinoNavigationBar | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoNavigationBarBackButton-class.html) |
| `CupertinoPage` | A page that creates a cupertino style PageRoute | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoPage-class.html) |
| `CupertinoPageRoute` | A modal route that replaces the entire screen with an iOS transition | Used by the pathway's stack-navigation step ([pathway][pw-nav]). | [api](https://api.flutter.dev/flutter/cupertino/CupertinoPageRoute-class.html) |
| `CupertinoPageScaffold` | Basic iOS style page layout structure | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoPageScaffold-class.html) |
| `CupertinoPageTransition` | Provides an iOS-style page transition animation | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoPageTransition-class.html) |
| `CupertinoPicker` | An iOS-style picker control | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoPicker-class.html) |
| `CupertinoPickerDefaultSelectionOverlay` | A default selection overlay for CupertinoPickers | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoPickerDefaultSelectionOverlay-class.html) |
| `CupertinoPopupSurface` | Rounded rectangle surface that looks like an iOS popup surface, such as an alert dialog or action sheet | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoPopupSurface-class.html) |
| `CupertinoRadio` | A macOS-style radio button | Same `RadioGroup` migration as Material `Radio` ([BC][bc-radio]). | [api](https://api.flutter.dev/flutter/cupertino/CupertinoRadio-class.html) |
| `CupertinoScrollbar` | An iOS-style scrollbar that indicates which portion of a scrollable widget is currently visible | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoScrollbar-class.html) |
| `CupertinoScrollBehavior` | Describes how Scrollable widgets behave for CupertinoApps | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoScrollBehavior-class.html) |
| `CupertinoSearchTextField` | An iOS-style search field | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoSearchTextField-class.html) |
| `CupertinoSlider` | Used to select from a range of values | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoSlider-class.html) |
| `CupertinoSlidingSegmentedControl` | An iOS-13-style segmented control | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoSlidingSegmentedControl-class.html) |
| `CupertinoSliverNavigationBar` | A navigation bar with iOS-11-style large titles using slivers | see above | [api](https://api.flutter.dev/flutter/cupertino/CupertinoSliverNavigationBar-class.html) |
| `CupertinoSliverRefreshControl` | A sliver widget implementing the iOS-style pull to refresh content control | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoSliverRefreshControl-class.html) |
| `CupertinoSpellCheckSuggestionsToolbar` | The default spell check suggestions toolbar for iOS | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoSpellCheckSuggestionsToolbar-class.html) |
| `CupertinoSwitch` | An iOS-style switch | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoSwitch-class.html) |
| `CupertinoTabBar` | An iOS-style bottom tab bar | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoTabBar-class.html) |
| `CupertinoTabController` | Coordinates tab selection between a CupertinoTabBar and a CupertinoTabScaffold | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoTabController-class.html) |
| `CupertinoTabScaffold` | Tabbed iOS app structure | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoTabScaffold-class.html) |
| `CupertinoTabView` | Root content of a tab that supports parallel navigation between tabs | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoTabView-class.html) |
| `CupertinoTextField` | An iOS-style text field | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoTextField-class.html) |
| `CupertinoTextFormFieldRow` | Creates a CupertinoFormRow containing a FormField that wraps a CupertinoTextField | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoTextFormFieldRow-class.html) |
| `CupertinoTextMagnifier` | A CupertinoMagnifier used for magnifying text in cases where a user's finger may be blocking the point of… | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoTextMagnifier-class.html) |
| `CupertinoTextSelectionControls` | iOS-style text selection controls | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoTextSelectionControls-class.html) |
| `CupertinoTextSelectionToolbar` | An iOS-style text selection toolbar | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoTextSelectionToolbar-class.html) |
| `CupertinoTextSelectionToolbarButton` | A button in the style of the iOS text selection toolbar buttons | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoTextSelectionToolbarButton-class.html) |
| `CupertinoTextThemeData` | Cupertino typography theme in a CupertinoThemeData | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoTextThemeData-class.html) |
| `CupertinoTheme` | Applies a visual styling theme to descendant Cupertino widgets | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoTheme-class.html) |
| `CupertinoThumbPainter` | Paints an iOS-style slider thumb or switch thumb | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoThumbPainter-class.html) |
| `CupertinoTimerPicker` | An iOS-style countdown timer picker | — | [api](https://api.flutter.dev/flutter/cupertino/CupertinoTimerPicker-class.html) |

---

## 4. Best practices for the ~40 widgets learners use most

### 4.1 Layout: the one rule, and the errors it explains

- **"Constraints go down. Sizes go up. Parent sets position."** A widget sizes itself only within its parent's constraints, and it can't know or choose its own position ([C]). Teach this before `Row`/`Column`.
- **Three kinds of box** ([C]): as big as possible (`Center`, `ListView`), same size as the child (`Transform`, `Opacity`), a particular size (`Image`, `Text`). `Container` changes kind depending on its arguments: with no child and no size it's as big as possible, and with `width` it tries to be that width.
- **Tight and loose constraints.** The screen gives the root tight constraints, and `Center` loosens them for its child ([C#tight][c-tight]).
- **Unbounded constraints** are the #1 beginner crash. A `ListView` in a `Column`, a `TextField` in a `Row`, or a vertical list inside a horizontal list each hand the child an infinite max, and "a box that tries to be as big as possible won't function usefully… and, in debug mode, throws an exception" ([C#unbounded][c-unbounded]). Official video: *Unbounded height / width* (§6), embedded on that page.
- **Flex rules** ([C#flex][c-flex]): a Row/Column bounded in its main axis tries to be as big as possible. When it's unbounded there, every child's flex must be 0, so "you can't use `Expanded` when the flex box is inside another flex box or a scrollable". The cross axis "must never be unbounded".

| Widget | Best practice | Source |
|---|---|---|
| `Container` vs `SizedBox` / `Padding` / `ColoredBox` / `DecoratedBox` | `Container` is "a convenience widget that combines common painting, positioning, and sizing widgets". When you need one thing, use the single-purpose widget: it can be `const`, and its size behavior is easier to predict. | [catalog][catalog-yml], [C] |
| `Row` / `Column` / `Flex` | Use `spacing:` for gaps rather than `SizedBox` spacers (lesson 2 already does). `mainAxisSize: .min` shrink-wraps. | [layout pathway][pw-layout] |
| `Expanded` vs `Flexible` | `Expanded` *forces* the child to fill its share; `Flexible` "does not require the child to fill the available space". Both must sit under a Row/Column/Flex with only Stateless/Stateful widgets in between. | `widgets/basic.dart:5912,5986` ([Flexible API][api-flexible], [Expanded API][api-expanded]) |
| `Stack` / `Positioned` | Non-positioned children decide the Stack's size. `Positioned` must be a descendant of a Stack with only Stateless/Stateful widgets on the path. | [API][api-positioned] |
| `Wrap` | Use when chips or tags should flow onto the next line instead of overflowing a Row. | [catalog][catalog-yml] |
| `SafeArea` | Wrapping the `Scaffold` body is a good start. Nested SafeAreas don't double the padding, because SafeArea removes the padding it consumed from the `MediaQuery` it passes down. | [SA] |

### 4.2 Lists, grids, scrolling

| Widget | Best practice | Source |
|---|---|---|
| `ListView(children:)` vs `ListView.builder` | The default constructor "is appropriate for list views with a small number of children"; `.builder` "for list views with a large (or infinite) number of children because the builder is called only for those children that are actually visible". Give `itemCount`. | `widgets/scroll_view.dart:1297,1360` ([API][api-listview]), [P "Be lazy!"][p-lazy] |
| `ListView.separated` | Use `findItemIndexCallback` (item indices), not the deprecated `findChildIndexCallback`. | [BC][bc-separated] |
| `SingleChildScrollView` | Fine for a form or page that might overflow. For a list, `ListView` "is vastly more efficient than a SingleChildScrollView containing a ListBody or Column with many children". | `widgets/single_child_scroll_view.dart:40` ([API][api-scsv]) |
| `GridView` | Use `SliverGridDelegateWithMaxCrossAxisExtent` (max item width) so the column count follows the window size. The docs say not to hard-code the column count. | [LS] |
| `CustomScrollView` + slivers | One scroll with mixed parts: `SliverAppBar`, `SliverList.builder`, `SliverGrid`, `SliverToBoxAdapter` for single boxes, `SliverFillRemaining` for empty states. Compass's `HomeScreen` is a `CustomScrollView` with `SliverList.builder` inside a `ListenableBuilder`. | [pathway slivers][pw-slivers], [slivers guide][slivers], [case study UI][arch-ui] |
| Keys in lists | Give list items stable keys (`ValueKey(item.id)`) when items can be reordered, inserted or removed. Compass does `key: ValueKey(booking.id)`. `Dismissible` *requires* one, and so do `ReorderableListView` items. `GlobalKey` reparenting "is relatively expensive". | [case study UI][arch-ui], [API Dismissible][api-dismissible], `widgets/framework.dart:128`, video *When to Use Keys* (§6) |
| Avoid intrinsics | `IntrinsicHeight`/`IntrinsicWidth` (and `shrinkWrap`-style measuring) add an extra layout pass. Avoid them in lists. | [P][p-intrinsic] |

### 4.3 App structure and navigation (Material 3)

| Widget | Best practice | Source |
|---|---|---|
| `Scaffold` / `AppBar` | Theme the app bar with `backgroundColor`; `AppBarTheme.color` is deprecated. | [BC][bc-appbar] |
| `NavigationBar` vs `BottomNavigationBar` | "There is an updated version of this component, `NavigationBar`, that's preferred for new applications." | `material/bottom_navigation_bar.dart:69` ([API][api-bnb]) |
| `NavigationBar` ↔ `NavigationRail` | Switch at **600 logical pixels** of *window* width (Material window size classes), never on device type or orientation. | [A][ar-general], [adaptive best practices][ar-best] |
| `Drawer` / `NavigationDrawer` | `NavigationDrawer` is the M3 component listed in the catalog's M3 Navigation group. | [catalog][catalog-yml] |
| `Navigator` | `push`/`pop` for small apps. "We don't recommend using named routes for most applications". Use `go_router` when you need deep links. Use `PopScope` (not `WillPopScope`) to intercept back. | [navigation][nav], [BC][bc-popscope] |
| `Hero` | Same `tag` on both routes; a route must not contain more than one Hero per tag. | `widgets/heroes.dart:100` ([API][api-hero]) |

### 4.4 Buttons, input, forms, feedback

| Widget | Best practice | Source |
|---|---|---|
| `FilledButton` | "important, final actions that complete a flow, like **Save**, **Join now**, or **Confirm**". Not taught in any current lesson. | `material/filled_button.dart:32` ([API][api-filled]) |
| `ElevatedButton` | "Avoid using elevated buttons on already-elevated content such as dialogs or cards." | `material/elevated_button.dart:32` ([API][api-elevated]) |
| `OutlinedButton` / `TextButton` / `IconButton` | Medium / low emphasis. Give `IconButton` a `tooltip`: it's also the accessible label, and the a11y guideline test `labeledTapTargetGuideline` checks for one. | [a11y testing][a11y-test] |
| `SegmentedButton` / `RadioGroup` / `DropdownMenu` | M3 selection controls; `Radio` now needs a `RadioGroup`. | [BC][bc-radio], WotW (§6) |
| `TextField` + `TextEditingController` | Create the controller in a `State` and "Remember to dispose of the TextEditingController when it is no longer needed". In a `Row`, wrap the field in `Expanded`. | `widgets/editable_text.dart:203` ([API][api-editable]), [C] |
| `Form` / `TextFormField` | `GlobalKey<FormState>`; `validate()` runs every validator; `DropdownButtonFormField` takes `initialValue`. | [cookbook validation][cb-validation], [BC][bc-dropdownff] |
| Dialogs / bottom sheets | `showDialog`/`showModalBottomSheet` return a `Future`. After `await`, check `context.mounted` before using the context again. | **UNVERIFIED** in this pass against a docs page (standard `use_build_context_synchronously` lint) |
| `SnackBar` | Show through `ScaffoldMessenger.of(context)`. A SnackBar with an `action` stays up until dismissed (3.38+). | [cookbook][cb-snackbar], [BC][bc-snackbar] |

### 4.5 Async, state and rebuilding

| Widget | Best practice | Source |
|---|---|---|
| `FutureBuilder` / `StreamBuilder` | "The future must have been obtained earlier, e.g. during `State.initState`, `State.didUpdateWidget`, or `State.didChangeDependencies`. It must not be created during the `State.build` or `StatelessWidget.build` method call…" | `widgets/async.dart:335,468` ([API][api-async]); [fetch-data cookbook][cb-fetch] |
| `ListenableBuilder` | The official way to rebuild a view from a `ChangeNotifier` view model. Pass subtrees that don't depend on the listenable as `child` ("more efficient to build that subtree once"). | `widgets/transitions.dart:1103` ([API][api-listenablebuilder]), [pathway][pw-listenable], [case study UI][arch-ui] |
| `ValueListenableBuilder` | Same idea for a single `ValueNotifier<T>`; the pathway's slivers step uses it. | [pathway slivers][pw-slivers] |
| `setState` placement | "Localize the `setState()` call to the part of the subtree whose UI actually needs to change." | [P][p-build] |
| `const` | "Use `const` constructors on widgets as much as possible"; `flutter_lints` reminds you. | [P][p-build] |
| Widgets vs helper functions | "Prefer using a `StatelessWidget` rather than a function" for reusable UI. Official video: *Widgets vs helper methods*. | [P][p-build] |
| `operator ==` on widgets | Don't override it; it "results in O(N²) behavior". | [P][p-pitfalls] |

### 4.6 Animation

| Widget | Best practice | Source |
|---|---|---|
| `AnimatedContainer` and other `Animated*` | Implicit: change a value in `setState`, and the widget animates. Covered by lesson 5. | [implicit animations][implicit] |
| `AnimatedOpacity` / `FadeTransition` vs `Opacity` | "Avoid using the `Opacity` widget, and particularly avoid it in an animation." | [P][p-pitfalls] |
| `AnimatedBuilder` | Build the non-animating subtree once and pass it as `child`. | [P][p-pitfalls] |
| `Hero` | See 4.3. | [hero animations][hero-guide] |

### 4.7 Adaptive and responsive

- Follow the docs' three steps: **Abstract → Measure → Branch** ([A][ar-general]).
- Measure with `MediaQuery.sizeOf(context)` ("for performance reasons": it rebuilds only when the size changes) or with `LayoutBuilder` (the *parent's* constraints) ([A][ar-general]).
- Don't lock orientation, don't branch on orientation or device type, don't let text fields or boxes take the full width of large screens, and support mouse and keyboard ([adaptive best practices][ar-best]).

### 4.8 Theming

- `ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: …))`. Read colors and text styles from `Theme.of(context).colorScheme` and `.textTheme` ([themes cookbook][cb-themes]; lesson 7 already follows this).
- The M3 default is on ([BC][bc-m3default]). Use `WidgetStateProperty` for state-dependent styles ([BC][bc-materialstate]). Use `Color.withValues(alpha:)` ([BC][bc-widegamut]).
- `flutter create` output now uses dot shorthands (`colorScheme: .fromSeed(...)`), which need Dart language 3.10+ ([dot shorthands](https://dart.dev/language/dot-shorthands)); `lib/main.dart` of a fresh 3.47.5 project shows this.

### 4.9 Accessibility

- Text respects the OS font size, so test layouts at the largest setting. Contrast should be at least 4.5:1 for small text and 3:1 for large text. Tap targets should be at least 48×48 dp on Android and 44×44 pt on iOS ([a11y styling][a11y-style]).
- Use `Semantics`, `MergeSemantics` and `ExcludeSemantics` for custom widgets ([catalog][catalog-yml]).
- **Checkable in ThongLearn:** `await expectLater(tester, meetsGuideline(androidTapTargetGuideline / iOSTapTargetGuideline / labeledTapTargetGuideline / textContrastGuideline))` works in a `testWidgets` body, after `final handle = tester.ensureSemantics();` ([a11y testing][a11y-test]). That makes an accessibility lesson auto-checkable.

---

## 5. MVVM and app architecture (official guide)

Pages read: [Architecting Flutter apps][arch-index], [Concepts][arch-concepts], [Guide][arch-guide], [Case study][arch-case] ([UI layer][arch-ui], [Data layer][arch-data], [DI][arch-di], [Testing][arch-test]), [Recommendations][arch-rec], [Design patterns][arch-patterns] ([Command][dp-command], [Result][dp-result], [Optimistic state][dp-optimistic], [Offline-first][dp-offline]), plus the [Compass app][compass].

### 5.1 Concepts ([concepts page][arch-concepts])

- **Separation of concerns** is "the most important principle". The UI and the data layer are separate, and so are features within each layer. Widgets should be "reusable, lean widgets that hold as little logic as possible".
- **Layers:** UI (presentation), Logic (domain, *optional*, for complex client-side logic), and Data. "Each layer can only communicate with the layers directly below or above it."
- **Single source of truth:** each data type has one class that owns it and is the only one allowed to change it. Usually that's a **Repository**.
- **Unidirectional data flow:** state flows from data → logic → UI, and events flow from UI → logic → data. Data changes always happen in the source of truth.
- **UI is a function of (immutable) state.**

### 5.2 Components ([guide][arch-guide])

| Component | Role | Relationships |
|---|---|---|
| **View** | Widgets for a feature, often a screen with a `Scaffold`. Allowed logic: simple if-statements on view-model flags, animation, layout by screen size, simple routing. | 1:1 with a view model |
| **ViewModel** | Turns repository data into UI state, keeps that state, and exposes **commands** | many:many with repositories |
| **Repository** | Source of truth. Polls services, turns raw data into **domain models**, and handles caching, errors, retries and refresh. Repositories never know about each other. | many:many with services |
| **Service** | Wraps one external data source (REST endpoint, platform API, file). Holds no state and returns `Future`/`Stream`. | one per data source |
| **Use-case** (optional) | Only when logic merges several repositories, is very complex, or is reused across view models. "Add use-cases only when needed." | view models may use both use-cases and repositories |

"Views and view models should have a one-to-one relationship"; "one view doesn't equal one widget" ([guide][arch-guide]).

### 5.3 The recommendation table (from [`architectureRecommendations.yml`][arch-rec-yml], rendered on [Recommendations][arch-rec])

| Category | Recommendation | Level |
|---|---|---|
| Separation of concerns | Use clearly defined data and UI layers | **Strongly recommend** |
| | Use the repository pattern in the data layer (Repository + Service classes) | **Strongly recommend** |
| | Use ViewModels and Views in the UI layer (MVVM) | **Strongly recommend** |
| | Use `ChangeNotifier`s and `Listenable`s to handle widget updates | Conditional ("ultimately the decision comes down to personal preference") |
| | Do not put logic in widgets | **Strongly recommend** |
| | Use a domain layer | Conditional ("Use in apps with complex logic requirements") |
| Handling data | Use unidirectional data flow | **Strongly recommend** |
| | Use `Commands` to handle events from user interaction | Recommend |
| | Use immutable data models | **Strongly recommend** |
| | Use freezed or built_value to generate immutable data models | Recommend (adds build time) |
| | Create separate API models and domain models | Conditional ("Use in large apps") |
| App structure | Use dependency injection ("We recommend you use the provider package") | **Strongly recommend** |
| | Use go_router for navigation ("the preferred way to write 90% of Flutter applications") | Recommend |
| | Use standardized naming conventions (`HomeViewModel`, `HomeScreen`, `UserRepository`, `ClientApiService`; shared widgets in `ui/core/`, not `/widgets`) | Recommend |
| | Use abstract repository classes | **Strongly recommend** |
| Testing | Test architectural components separately, and together (unit tests for every service, repository and view model; widget tests for views) | **Strongly recommend** |
| | Make fakes for testing (and write code that takes advantage of fakes) | **Strongly recommend** |

Levels as defined on the page: *Strongly recommend* = "always implement… if you're starting to build a new application"; *Recommend* = "will likely improve your app"; *Conditional* = "can improve your app in certain circumstances". (The ChangeNotifier row links to `/get-started/fwe/state-management`, which now 301-redirects to `/learn/pathway`.)

### 5.4 Patterns in detail

- **ChangeNotifier view models + `ListenableBuilder` views.** The view takes the view model through its constructor ("a view's only inputs should be a `key`… and the view's corresponding view model"). State is exposed through getters over private fields, and lists as `UnmodifiableListView`. The view model calls `notifyListeners()` in `finally` ([case study UI][arch-ui]).
- **Command** ([UI layer][arch-ui], [design pattern][dp-command], Compass [`utils/command.dart`](https://github.com/flutter/samples/blob/main/compass_app/app/lib/utils/command.dart)): `abstract class Command<T> extends ChangeNotifier` with `running`, `error` and `completed`. `Command0`/`Command1<T, A>` wrap `Future<Result<T>> Function(...)`. `_execute` ignores re-entry ("avoid multiple taps"), notifies at start and in `finally`. Commands are created in the view-model constructor (`load = Command0(_load)..execute()`), so the view can render before data exists and `ListenableBuilder(listenable: viewModel.load, …)` switches between spinner, error and content. The docs mention [`command_it`](https://pub.dev/packages/command_it) as a package option.
- **Result** ([design pattern][dp-result], Compass [`utils/result.dart`](https://github.com/flutter/samples/blob/main/compass_app/app/lib/utils/result.dart)): `sealed class Result<T>` with `Ok<T>(value)` and `Error<T>(Exception error)`. Services/repositories return `Result` instead of throwing, and callers `switch` exhaustively. It's SDK-only (Dart 3 sealed classes).
- **Dependency injection** ([DI][arch-di]): Compass puts services and repositories in a `MultiProvider` above `MaterialApp`, injects with `context.read()`, and creates screen view models inside `go_router` route builders. Injected dependencies are **private** fields. "Teams at Google recommend using `package:provider` to implement dependency injection."
- **Folder structure** ([case study][arch-case]): data by *type*, UI by *feature*:
  ```text
  lib/
    ui/core/{ui,themes}/          ui/<feature>/{view_models,widgets}/
    domain/models/                data/{repositories,services,model}/
    config/ utils/ routing/       main.dart main_development.dart main_staging.dart
  test/{data,domain,ui,utils}/    testing/{fakes,models}/   # fakes shared across tests
  ```
  The live Compass repo matches (`lib/ui/{activities,auth,booking,core,home,results,search_form}`, `testing/{fakes,models,utils,app.dart,mocks.dart}`).
- **Immutable models:** Compass uses `freezed` (`@freezed class User with _$User`, `fromJson` via `json_annotation`) ([case study UI][arch-ui]). Current packages are `freezed` 4.0.2 and `json_serializable` 6.14.1 (pub.dev API, 2026-09-28). Whether the case study's `with _$User` form still matches freezed 4's required syntax is **UNVERIFIED**.
- **Optimistic state** ([design pattern][dp-optimistic]): set the success state and `notifyListeners()` *before* awaiting the repository; revert and set `error` on failure.
- **Offline-first** ([design pattern][dp-offline]): the repository combines a local `DatabaseService` (SQL) with an API service. It can fall back to local data, emit a `Stream` (local first, then remote), write locally first, and sync with a flag or background task.
- **Testing** ([testing][arch-test]): view-model unit tests need only fake repositories (`FakeBookingRepository implements BookingRepository`). Widget tests reuse the same fakes; Compass mocks `GoRouter` with `mocktail`. "View and view model tests only require mocking repositories if your architecture is sound."
- **Alternatives are fine:** "it could've easily been written with streams, or with other libraries such as riverpod, flutter_bloc, and signals… aren't all architectures MVVM anyway?" ([case study][arch-case]).

### 5.5 How ThongLearn can teach this SDK-only

| Guide element | SDK-only? | How in a single `main.dart` |
|---|---|---|
| View / ViewModel / Repository / Service | ✅ | Plain classes; section comments stand in for folders |
| `ChangeNotifier`, `ListenableBuilder`, `UnmodifiableListView` | ✅ | `flutter/foundation`, `flutter/widgets`, `dart:collection` |
| Command, Result | ✅ | Copy Compass's ~90 lines (sealed classes need Dart 3) |
| Abstract repository + fake | ✅ | `abstract class` + `implements`. A check block can drive the fake via `app.` |
| DI | ✅ with manual constructor injection in `main()`. `provider` needs the package. | The guide itself shows constructor injection before introducing provider ([DI][arch-di]) |
| Routing with go_router | ❌ package | Use `Navigator.push` + `MaterialPageRoute` (SDK) |
| freezed / json_serializable | ❌ package + build_runner code generation | Hand-written `@immutable` classes with `final` fields and a `switch`-pattern `fromJson` (lesson 9 already does this) |
| HTTP service | ❌ `package:http`, and **no network in the sandbox** anyway | A fake service with `Future.delayed` (lessons 9–10 already do this) |
| Offline-first DB | ❌ `sqflite`/`shared_preferences` need platform plugins | Explain only, or use an in-memory map |

### 5.6 Minimal SDK-only MVVM example: verified

A single `lib/main.dart` using only `package:flutter/material.dart`, `dart:collection`. **`flutter analyze`: No issues found. `flutter test`: 5/5 passed** (Flutter 3.47.5; tests below plus a ThongLearn-wrapper-shaped check that does `app.main(); await tester.pumpAndSettle();`, finds the seeded todo, types and taps **Add**, and finds the new one).

The first version used the case-study constructor style `Repo({required TodoApiService api}) : _api = api;`. The 3.47.5 analyzer flagged it with `prefer_initializing_formals` (two infos), and the Dart 3.12 private named formal below fixed that.

```dart
import 'dart:collection';

import 'package:flutter/material.dart';

// ---------------------------------------------------------------- utils
// Result and Command follow compass_app/app/lib/utils/{result,command}.dart.

sealed class Result<T> {
  const Result();
  const factory Result.ok(T value) = Ok._;
  const factory Result.error(Exception error) = Error._;
}

final class Ok<T> extends Result<T> {
  const Ok._(this.value);
  final T value;
}

final class Error<T> extends Result<T> {
  const Error._(this.error);
  final Exception error;
}

abstract class Command<T> extends ChangeNotifier {
  bool _running = false;
  bool get running => _running;

  Result<T>? _result;
  bool get error => _result is Error;
  bool get completed => _result is Ok;

  Future<void> _execute(Future<Result<T>> Function() action) async {
    if (_running) return; // ignore double taps
    _running = true;
    _result = null;
    notifyListeners();
    try {
      _result = await action();
    } finally {
      _running = false;
      notifyListeners();
    }
  }
}

class Command0<T> extends Command<T> {
  Command0(this._action);
  final Future<Result<T>> Function() _action;
  Future<void> execute() => _execute(_action);
}

class Command1<T, A> extends Command<T> {
  Command1(this._action);
  final Future<Result<T>> Function(A) _action;
  Future<void> execute(A argument) => _execute(() => _action(argument));
}

// ---------------------------------------------------------------- domain model

@immutable
class Todo {
  const Todo({required this.id, required this.title});

  final int id;
  final String title;
}

// ---------------------------------------------------------------- data layer

/// Service: wraps one data source, holds no state. A real app would call an
/// HTTP API here (package:http); this one fakes the network with a delay.
class TodoApiService {
  final Map<int, Map<String, Object?>> _server = {
    1: {'id': 1, 'title': 'Read the architecture guide'},
  };

  Future<List<Map<String, Object?>>> fetchTodos() async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    return [
      for (final json in _server.values) {...json},
    ];
  }

  Future<Map<String, Object?>> postTodo(String title) async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    final id = _server.length + 1;
    return _server[id] = {'id': id, 'title': title};
  }
}

/// Repository: the single source of truth for todos. Abstract, so tests and
/// other environments can swap in a fake.
abstract class TodoRepository {
  Future<Result<List<Todo>>> getTodos();
  Future<Result<Todo>> addTodo(String title);
}

class TodoRepositoryRemote implements TodoRepository {
  TodoRepositoryRemote({required this._api});

  final TodoApiService _api;

  static Todo _fromJson(Map<String, Object?> json) => switch (json) {
    {'id': int id, 'title': String title} => Todo(id: id, title: title),
    _ => throw const FormatException('Bad todo'),
  };

  @override
  Future<Result<List<Todo>>> getTodos() async {
    try {
      final list = await _api.fetchTodos();
      return Result.ok([for (final json in list) _fromJson(json)]);
    } on Exception catch (e) {
      return Result.error(e);
    }
  }

  @override
  Future<Result<Todo>> addTodo(String title) async {
    try {
      return Result.ok(_fromJson(await _api.postTodo(title)));
    } on Exception catch (e) {
      return Result.error(e);
    }
  }
}

// ---------------------------------------------------------------- UI layer

class TodoViewModel extends ChangeNotifier {
  TodoViewModel({required this._todoRepository}) {
    load = Command0(_load)..execute();
    add = Command1(_add);
  }

  final TodoRepository _todoRepository;

  late final Command0<void> load;
  late final Command1<void, String> add;

  List<Todo> _todos = [];
  UnmodifiableListView<Todo> get todos => UnmodifiableListView(_todos);

  Future<Result<void>> _load() async {
    final result = await _todoRepository.getTodos();
    if (result case Ok(:final value)) _todos = value;
    notifyListeners();
    return result;
  }

  Future<Result<void>> _add(String title) async {
    final result = await _todoRepository.addTodo(title);
    if (result case Ok(:final value)) _todos = [..._todos, value];
    notifyListeners();
    return result;
  }
}

class TodoScreen extends StatefulWidget {
  const TodoScreen({super.key, required this.viewModel});

  final TodoViewModel viewModel;

  @override
  State<TodoScreen> createState() => _TodoScreenState();
}

class _TodoScreenState extends State<TodoScreen> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _submit() {
    final title = _controller.text.trim();
    if (title.isEmpty) return;
    widget.viewModel.add.execute(title);
    _controller.clear();
  }

  @override
  Widget build(BuildContext context) {
    final viewModel = widget.viewModel;
    return Scaffold(
      appBar: AppBar(title: const Text('Todos')),
      body: ListenableBuilder(
        listenable: viewModel.load,
        builder: (context, child) {
          if (viewModel.load.running) {
            return const Center(child: CircularProgressIndicator());
          }
          if (viewModel.load.error) {
            return Center(
              child: FilledButton(
                onPressed: viewModel.load.execute,
                child: const Text('Try again'),
              ),
            );
          }
          return child!;
        },
        child: ListenableBuilder(
          listenable: viewModel,
          builder: (context, _) => ListView.builder(
            itemCount: viewModel.todos.length,
            itemBuilder: (context, index) {
              final todo = viewModel.todos[index];
              return ListTile(key: ValueKey(todo.id), title: Text(todo.title));
            },
          ),
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: Row(
            spacing: 8,
            children: [
              Expanded(
                child: TextField(
                  controller: _controller,
                  decoration: const InputDecoration(labelText: 'New todo'),
                  onSubmitted: (_) => _submit(),
                ),
              ),
              ListenableBuilder(
                listenable: viewModel.add,
                builder: (context, _) => IconButton(
                  tooltip: 'Add',
                  icon: const Icon(Icons.add),
                  onPressed: viewModel.add.running ? null : _submit,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------- DI

void main() {
  // Manual constructor injection: service -> repository -> view model -> view.
  // The guide uses package:provider for this; one screen doesn't need it.
  final repository = TodoRepositoryRemote(api: TodoApiService());
  runApp(
    MaterialApp(
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.teal),
      ),
      home: TodoScreen(viewModel: TodoViewModel(todoRepository: repository)),
    ),
  );
}
```

`test/todo_test.dart` (fake repository, as the guide recommends):

```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:probe/main.dart';
import 'package:probe/main.dart' as app;

class FakeTodoRepository implements TodoRepository {
  final todos = <Todo>[const Todo(id: 1, title: 'Seeded')];
  bool fail = false;

  @override
  Future<Result<List<Todo>>> getTodos() async =>
      fail ? Result.error(Exception('offline')) : Result.ok([...todos]);

  @override
  Future<Result<Todo>> addTodo(String title) async {
    final todo = Todo(id: todos.length + 1, title: title);
    todos.add(todo);
    return Result.ok(todo);
  }
}

void main() {
  test('view model loads and adds through the repository', () async {
    final vm = TodoViewModel(todoRepository: FakeTodoRepository());
    await Future<void>.delayed(Duration.zero); // let load finish
    expect(vm.load.completed, isTrue);
    expect(vm.todos.map((t) => t.title), ['Seeded']);
    await vm.add.execute('Write tests');
    expect(vm.todos.map((t) => t.title), ['Seeded', 'Write tests']);
  });

  test('load error is exposed on the command', () async {
    final vm = TodoViewModel(todoRepository: FakeTodoRepository()..fail = true);
    await Future<void>.delayed(Duration.zero);
    expect(vm.load.error, isTrue);
    expect(vm.todos, isEmpty);
  });

  testWidgets('screen shows todos and adds one', (tester) async {
    final vm = TodoViewModel(todoRepository: FakeTodoRepository());
    await tester.pumpWidget(MaterialApp(home: TodoScreen(viewModel: vm)));
    await tester.pump();
    expect(find.text('Seeded'), findsOneWidget);
    await tester.enterText(find.byType(TextField), 'From the UI');
    await tester.tap(find.byTooltip('Add'));
    await tester.pump();
    expect(find.text('From the UI'), findsOneWidget);
  });

  testWidgets('real app shows a spinner, then the service data', (
    tester,
  ) async {
    app.main();
    await tester.pump();
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    await tester.pump(const Duration(milliseconds: 300));
    expect(find.text('Read the architecture guide'), findsOneWidget);
  });
}
```

Notes for turning this into a lesson:

- ThongLearn's wrapper calls `app.main(); await tester.pumpAndSettle();` (`lib/local-runner.ts:313-323`). That works here because the 300 ms fake delay ends and the spinner goes away. A lesson whose `load` never completes, or that keeps an indeterminate `CircularProgressIndicator` on screen, would make `pumpAndSettle` time out.
- A check block can reach the classes as `app.TodoViewModel`, `app.TodoRepository` and so on (lesson 10's check already uses `app.TodoViewModel()`). So a challenge can ship its own fake repository inside the check.
- The declared `Error` class shadows `dart:core`'s `Error` inside the lesson file. That's what Compass does too, and the analyzer is silent about it, but learners may find it confusing. Calling it `Err` is a reasonable deviation.

---

## 6. YouTube tutorials

Every URL below was fetched on 2026-09-28. Title, channel, upload date and length come from the watch page, and "Covers" comes from the title, description or chapter list. **The videos weren't watched**, so "Matches the current guide?" is a judgment from the date, title and chapters, and any claim about a video's content beyond those is **UNVERIFIED**.

### 6.1 First-party (Flutter team)

The *Widget of the Week* playlist: https://www.youtube.com/playlist?list=PLjxrf2q8roU23XGwz3Km7sQZFTdB996iG. Its first 100 entries (newest first) include 2026 slivers episodes (`SliverToBoxAdapter`, `SliverFillRemaining`, `SliverSemantics`, `NestedScrollView`) and a run of Cupertino episodes. Videos from before 2022 were uploaded under the channel now named "Google for Developers".

| Title | Channel | URL | Date | Covers | Matches current guide? |
|---|---|---|---|---|---|
| Widgets vs helper methods \| Decoding Flutter | Flutter | https://www.youtube.com/watch?v=IOyq-eTRhvo | 2021-12-10 | Why `StatelessWidget`s beat helper functions | ✅ Linked from [perf best practices][p-build] |
| Unbounded height / width \| Decoding Flutter | Flutter | https://www.youtube.com/watch?v=jckqXR5CrPI | 2021-06-29 | The "viewport was given unbounded height" error | ✅ Embedded on [Understanding constraints][C] |
| When to Use Keys - Flutter Widgets 101 Ep. 4 | Google for Developers | https://www.youtube.com/watch?v=kn0EOS-ZiIc | 2018-11-26 | Keys, element/state matching | ✅ The concept is unchanged; the UI shown is pre-M3 |
| ChangeNotifier (Technique of the Week) | Flutter | https://www.youtube.com/watch?v=iBRrnCqzTuk | 2026-06-11 | Keeping app state and UI in sync (speaker Craig Labenz) | ✅ Current |
| UnmodifiableListView (Technique of the Week) | Flutter | https://www.youtube.com/watch?v=lbxJ4K5MD2o | 2024-09-17 | Read-only list views | ✅ Used by the case study's view model |
| MediaQuery.propertyOf (Technique of the Week) | Flutter | https://www.youtube.com/watch?v=xVk1kPvkgAY | 2024-10-01 | `MediaQuery.sizeOf` & co. | ✅ Matches [adaptive guidance][ar-general] |
| MediaQuery (Flutter Widget of the Week) | Flutter | https://www.youtube.com/watch?v=A3WrA4zAaPw | 2019-05-23 | MediaQuery basics | ⚠️ Predates the `sizeOf` advice; pair it with the video above |
| Expanded / Flexible / Stack / SafeArea (WotW) | Google for Developers / Flutter | [Expanded](https://www.youtube.com/watch?v=_rnZaagadyo) 2018-08-21 · [Flexible](https://www.youtube.com/watch?v=CI7x0mAZiY0) 2019-05-17 · [Stack](https://www.youtube.com/watch?v=liEGSeD3Zt8) 2019-09-05 · [SafeArea](https://www.youtube.com/watch?v=lkF0TQJO0bA) 2018-08-14 | | Layout basics | ✅ Semantics unchanged; the visuals are pre-M3 |
| ListView / GridView / SliverAppBar (WotW) | Flutter | [ListView](https://www.youtube.com/watch?v=KJpkjHGiI5A) 2019-09-26 · [GridView](https://www.youtube.com/watch?v=bLOtZDTm4H8) 2020-11-19 · [SliverAppBar](https://www.youtube.com/watch?v=mSc7qFzxHDw) 2020-10-22 | | Lists, grids, collapsing app bar | ✅ Mostly; check for `cacheExtent` (deprecated 3.44) |
| SliverToBoxAdapter / SliverFillRemaining (WotW) | Flutter | [SliverToBoxAdapter](https://www.youtube.com/watch?v=vWec9DrAbHE) 2026-02-24 · [SliverFillRemaining](https://www.youtube.com/watch?v=egZjhWNqrXc) 2026-02-10 | | Slivers | ✅ Current |
| FutureBuilder (WotW), old and new | Google for Developers / Flutter | [2018](https://www.youtube.com/watch?v=ek8ZPdWj4Qo) 2018-09-18 · [2022](https://www.youtube.com/watch?v=zEdw_1B7JHY) 2022-11-17 | | FutureBuilder | ✅ Prefer the 2022 one |
| StreamBuilder / ValueListenableBuilder / LayoutBuilder (WotW) | Google for Developers / Flutter | [StreamBuilder](https://www.youtube.com/watch?v=MkKEWHfy99Y) 2018-11-13 · [ValueListenableBuilder](https://www.youtube.com/watch?v=s-ZG-jS5QHQ) 2019-04-22 · [LayoutBuilder](https://www.youtube.com/watch?v=IYDVcriKjsw) 2019-01-08 | | Builders | ✅ Concepts unchanged |
| AnimatedContainer / Hero / GestureDetector (WotW) | Google for Developers / Flutter | [AnimatedContainer](https://www.youtube.com/watch?v=yI-8QHpGIP4) 2018-09-04 · [Hero](https://www.youtube.com/watch?v=Be9UH1kXFDw) 2018-12-11 · [GestureDetector](https://www.youtube.com/watch?v=WhVXkCFPmK4) 2021-11-24 | | Animation, gestures | ✅ |
| NavigationBar / NavigationRail / ScaffoldMessenger (WotW) | Flutter | [NavigationBar](https://www.youtube.com/watch?v=DVGYddFaLv0) 2022-12-06 · [NavigationRail](https://www.youtube.com/watch?v=y9xchtVTtqQ) 2022-07-07 · [ScaffoldMessenger](https://www.youtube.com/watch?v=lytQi-slT5Y) 2022-03-17 | | M3 navigation, SnackBars | ✅, except that SnackBars with an action now persist (3.38) |
| SegmentedButton / DropdownMenu (WotW) | Flutter | [SegmentedButton](https://www.youtube.com/watch?v=Kj6jwKsVC3A) 2024-03-26 · [DropdownMenu](https://www.youtube.com/watch?v=giV9AbM2gd8) 2024-01-16 | | M3 selection | ✅ |
| Semantics (WotW) | Flutter | https://www.youtube.com/watch?v=NvtMt_DtFrQ | 2019-08-22 | Semantics annotations | ✅ Concept; 3.47 changed header/headingLevel behavior ([BC][bc-semheader]) |
| Theme (Flutter Hallowidget of the Week) | Flutter | https://www.youtube.com/watch?v=oTvQDJOBXmM | 2021-10-29 | ThemeData | ⚠️ Pre-M3-default (M3 has been the default since 3.16), so `ColorScheme.fromSeed`/M3 text roles are likely missing (**UNVERIFIED**) |
| go_router / Freezed (Package of the Week) | Flutter | [go_router](https://www.youtube.com/watch?v=b6Z885Z46cU) 2022-12-15 · [Freezed](https://www.youtube.com/watch?v=RaThk0fiphA) 2021-12-09 | | The two packages the guide recommends | ⚠️ go_router is now 18.0.1 and freezed 4.0.2; the APIs shown are likely outdated (**UNVERIFIED**) |

Not found: an official Flutter-channel video walking through the 2024+ architecture guide or Compass. Searches ("flutter app architecture mvvm compass flutter team", "Observable Flutter compass") returned only third-party videos. **UNVERIFIED** that none exists.

### 6.2 Educators

| Title | Channel | URL | Date | Covers (from description/chapters) | Matches current guide? |
|---|---|---|---|---|---|
| MVVM Architecture Simplified - Flutter Recommendation | Tadas Petra | https://www.youtube.com/watch?v=f2pwD4UsGZI | 2024-12-13 | Reacts to the official architecture guide ("met with… mixed feelings") | ✅ On topic; opinions are his own |
| The Definitive Guide to our MVVM Architecture in Flutter | Hungrimind | https://www.youtube.com/watch?v=62P2fbxo45M | 2025-03-28 | "*our* MVVM": Hungrimind's own variant | ⚠️ May differ from the official layering (**UNVERIFIED**) |
| The Ultimate Flutter Tutorial for Beginners - 2025 Full Course | Flutter Mapp | https://www.youtube.com/watch?v=3kaGC_DrUnw | 2025-01-07 | Chapters include NavigationBar, ValueNotifier, TextField/Checkbox/Switch/Slider, Push/Pop, Hero, SnackBar, LayoutBuilder/MediaQuery, Expanded & Flexible, FutureBuilder, Shared Preferences, Firebase | ✅ Closest match to a beginner sequence; state is ValueNotifier-based, not full MVVM |
| FULL Flutter Masterclass: Beginner to Pro | Mitch Koko | https://www.youtube.com/watch?v=TclK5gNM_PM | 2024-03-27 | ~9.6 h: widgets, navigation, stateful, user input, themes (light/dark), **Provider** state, local DB, Firebase, APIs, responsive design | ✅ Mostly post-M3; uses Provider for state rather than MVVM layers (**UNVERIFIED** detail) |
| FULL Flutter Beginner Course | Mitch Koko | https://www.youtube.com/watch?v=HQ_ytw58tC4 | 2023-09-17 | ~2.4 h: Dart basics, Scaffold/Container/Text/Icon/AppBar/Row/Column, navigation, input | ✅ Beginner-level |
| Flutter Course for Beginners – 37-hour Cross Platform App Development Tutorial | freeCodeCamp.org (by Vandad Nahavandipoor) | https://www.youtube.com/watch?v=VPvVD8t02U8 | 2022-02-24 | Firebase notes app: auth service, unit tests, local CRUD, Firestore, **Bloc**, store releases | ⚠️ 2022 (Flutter 2.x era, pre-M3 default); Bloc instead of ChangeNotifier MVVM |
| The Complete Dart & Flutter Developer Course | Rivaan Ranawat | https://www.youtube.com/watch?v=CzRQ9mnmh44 | 2023-08-03 | ~20 h, Dart from scratch then Flutter | ✅ Basics; 2023 |
| Flutter Clean Architecture Full Course For Beginners - Bloc, Supabase, Hive, GetIt | Rivaan Ranawat | https://www.youtube.com/watch?v=ELFORM9fmss | 2024-03-08 | ~7 h clean architecture | ⚠️ A different stack: use-cases everywhere (the guide makes the domain layer *conditional*), `get_it` instead of provider, Bloc instead of ChangeNotifier |
| Bloc State Management for Flutter Developers | Vandad Nahavandipoor | https://www.youtube.com/watch?v=Mn254cnduOY | 2022-04-03 | ~11 h Cubit/Bloc + testing | ⚠️ Bloc is a listed *alternative* ([case study][arch-case]), not the default |
| Flutter TDD Clean Architecture Course [1] – Explanation & Project Structure | Reso Coder | https://www.youtube.com/watch?v=KjE2IDphA_U | 2019-08-27 | Clean Architecture + TDD (course series) | ❌ Pre-null-safety (2019). The `dartz` `Either` idea is replaced by the SDK-only sealed `Result` |
| Starter Architecture for Flutter & Firebase Apps | Andrea Bizzotto | https://www.youtube.com/watch?v=rMDRgXnBMq0 | 2020-02-10 | Firebase app architecture | ❌ 2020. His site now centers on a Riverpod architecture ([codewithandrea.com](https://codewithandrea.com/)); content **UNVERIFIED** |
| Flutter Clean Architecture | HeyFlutter.com | https://www.youtube.com/watch?v=x5Sd2L9axiQ | 2023-12-23 | Clean architecture overview | ⚠️ Not the official layering (**UNVERIFIED** detail) |

For "BLoC vs provider" debates, the official position is neutral: ChangeNotifier is "Conditional… comes down to personal preference", and riverpod, flutter_bloc and signals are named as valid alternatives ([recommendations][arch-rec], [case study][arch-case]). Treat videos that say one of them is *required* as opinion.

---

## 7. Gap analysis for ThongLearn's Flutter course

### 7.1 What the 10 lessons cover (and against which official page)

| # | Lesson | Pathway step it follows | Status |
|---|---|---|---|
| 01 | Widgets | [widget-fundamentals][pw-widget] | ✅ Good. `const` tip (`01-widget-fundamentals.md:94`) matches [P][p-build] |
| 02 | Layout | [layout][pw-layout] | ✅ Good. Uses `spacing:`; dot-shorthand tip (`02-layout.md:127`, "since Dart 3.10") is correct ([dart.dev](https://dart.dev/language/dot-shorthands)). Missing: the constraints rule and the unbounded-constraints error |
| 03 | User input | [user-input][pw-input] | ⚠️ See 7.2 |
| 04 | Stateful widgets | [stateful-widget][pw-stateful] | ✅ Good; teaches `dispose` |
| 05 | Implicit animations | [implicit-animations][pw-implicit] | ✅ Good |
| 06 | Material widgets | cookbook snackbars + layout | ⚠️ SnackBar behavior (7.2); no FilledButton, NavigationBar or dialogs |
| 07 | Themes | [themes cookbook][cb-themes] | ✅ Good (`fromSeed`, `Theme.of`, `onPrimary`) |
| 08 | Forms | [validation cookbook][cb-validation] | ✅ Good |
| 09 | Fetching data | [http-requests][pw-http], [fetch-data][cb-fetch] | ✅ Good (future created in `initState`; fake instead of `package:http`) |
| 10 | ChangeNotifier | [change-notifier][pw-cn] | ⚠️ Dangling reference, globals (7.2) |

Not covered at all (a grep of the 10 lessons finds no `ListView`, `Navigator`, `MediaQuery`, `LayoutBuilder`, `ListenableBuilder`, `Semantics`, `Key(` or `FilledButton`): lists, scrolling, navigation, adaptive layout, `ListenableBuilder`, keys, accessibility, testing, architecture beyond one view model, Cupertino.

### 7.2 Outdated or wrong, with file:line

| Where | Issue | Evidence | Fix |
|---|---|---|---|
| All 10 lessons (import line), `lib/courses.ts:110`, `lib/local-runner.ts:313` | `import 'package:flutter/material.dart'`: frozen since 3.44, formal deprecation scheduled for the November stable | [blog][blog-347], [guide][bc-materialui] | Nothing to change today (no analyzer warning on 3.47.5). See 7.4 for the decision |
| `06-material-widgets.md:74` + `:98-101` | Text says a SnackBar "briefly" appears, but the example has `SnackBarAction`, so since 3.38 it **stays until dismissed** | [BC][bc-snackbar] | Mention `persist`, or drop the action from the first example |
| `10-change-notifier.md:67` | "The next lesson shows the widget that does it for you." There is no lesson 11 | `ls content/flutter/lessons` | Add the `ListenableBuilder` lesson (it's the pathway's next step, [listenable-builder][pw-listenable]) |
| `10-change-notifier.md:26`, `:108` | Global `final counter = …` / `final viewModel = …` singletons | Guide: DI "prevents your app from having globally accessible objects" ([rec][arch-rec]) | Fine as step 1; the next lesson should pass the view model through the constructor |
| `03-user-input.md:25,29,33,67,89,153,179` | `print` in app code → 7 × `avoid_print` from `flutter_lints` 6 (the analyzer output from this pass) | analyzer | Acceptable (the lesson explains browser console), or use `debugPrint` (**UNVERIFIED** whether `avoid_print` flags `debugPrint`; it's not in the probe) |
| `03-user-input.md:52,141,167` | Top-level `TextEditingController` that is never disposed | [API][api-editable] | Already flagged by the tip at `:132` and fixed in lesson 4. OK |
| `03-user-input.md:24`, `04-stateful-widgets.md:29,151,186`, `06-material-widgets.md:96`, `08-forms.md:50,155,198` | `ElevatedButton` for primary/final actions (Submit, Sign up) | M3 docs: `FilledButton` is for "important, final actions" ([API][api-filled]) | Introduce `FilledButton` in lesson 6 and use it for Submit/Sign up |
| `09-http-requests.md:19` | Calls the fetching class the "model"; the architecture guide splits this into Service + Repository | [guide][arch-guide] | Matches the pathway wording. Add a sentence mapping it to the guide's terms in the MVVM lesson |
| `05-implicit-animations.md:31` | `GestureDetector` as the tap target (no semantics, no focus) | [a11y][a11y-style] | Fine for animation focus; mention it in the accessibility lesson |

The analyzer found nothing else in any lesson example, starter or solution (46 blocks).

### 7.3 Proposed sequence (existing 10 + 9 new)

Section names follow the existing `section:` front matter. The "SDK-only?" column assumes today's `runtimes/flutter` (no extra packages).

| # | Lesson | Key widgets / ideas | Base it on (official) | SDK-only? | Auto-checkable? |
|---|---|---|---|---|---|
| 01–05 | *(existing: Widgets, Layout, User input, Stateful, Implicit animations)* | + add the constraints rule and unbounded-constraints errors to 02 | [constraints][C] | ✅ | ✅ |
| 06–08 | *(existing: Material widgets, Themes, Forms)* | + FilledButton, SnackBar `persist`, AlertDialog in 06 | [catalog M3][catalog-material], [BC][bc-snackbar] | ✅ | ✅ |
| 09–10 | *(existing: Fetching data, ChangeNotifier)* | fix `:67` | | ✅ | ✅ |
| **11** | **ListenableBuilder** | `ListenableBuilder`, view model passed via constructor, `child` optimization, `ValueListenableBuilder` | [pathway listenable-builder][pw-listenable], [API][api-listenablebuilder] | ✅ | ✅ |
| **12** | **Lists and keys** | `ListView.builder`, `ListTile`, `Dismissible`, `ValueKey`, `ReorderableListView` (`onReorderItem`) | [long lists][cb-longlists], [lists][lists], [BC][bc-reorder], video *When to Use Keys* | ✅ | ✅ (`find.byKey`, `tester.drag`) |
| **13** | **Scrolling and slivers** | `CustomScrollView`, `SliverAppBar`, `SliverList.builder`, `SliverGrid`, `SliverToBoxAdapter`, `SliverFillRemaining` | [pathway slivers][pw-slivers], [slivers][slivers] | ✅ | ✅ (`tester.scrollUntilVisible`, [scrolling test cookbook][cb-testscroll]) |
| **14** | **Navigation** | `Navigator.push/pop`, `MaterialPageRoute`, passing/returning data, `Hero`, `PopScope` | [pathway navigation][pw-nav], [navigation basics][cb-navbasics], [hero][hero-guide] | ✅ (go_router ❌ package) | ✅ (`tester.tap` + `pumpAndSettle` + `find`) |
| **15** | **Adaptive layouts** | `MediaQuery.sizeOf`, `LayoutBuilder`, `NavigationBar` ↔ `NavigationRail` at 600, `SafeArea`, `GridView` max-extent | [pathway adaptive][pw-adaptive], [A][ar-general], [best practices][ar-best] | ✅ | ✅ (`tester.view.physicalSize` / `binding.setSurfaceSize`, as Compass's `testApp` does) |
| **16** | **Async builders and Result** | `FutureBuilder` vs `StreamBuilder`, `AsyncSnapshot.connectionState`, the SDK-only `Result` | [API][api-async], [Result pattern][dp-result] | ✅ | ✅ |
| **17** | **MVVM architecture** | View / ViewModel / Repository / Service, Command, abstract repo + fake, constructor DI (the §5.6 example) | [guide][arch-guide], [case study][arch-case], [command][dp-command], [recommendations][arch-rec] | ✅ (provider ❌) | ✅ (check drives `app.TodoViewModel` with a fake) |
| **18** | **Testing** | `flutter_test`: `testWidgets`, finders, `pump` vs `pumpAndSettle`, unit-testing a view model with a fake | [widget testing][cb-widgettest], [mocking][cb-mocking], [case study testing][arch-test] | ✅ | ⚠️ The check *is* a test; the challenge could be "make these assertions pass" |
| **19** | **Accessibility** | `Semantics`, `tooltip`, tap targets, contrast, text scaling | [a11y][a11y-index], [a11y testing][a11y-test] | ✅ | ✅ (`meetsGuideline(...)`) |
| *(optional)* | Cupertino / adaptive widgets | `CupertinoApp`, `CupertinoPageScaffold`, `.adaptive` constructors | [pathway advanced-ui][pw-advanced], [catalog Cupertino][catalog-cupertino] | ✅ | ✅ |
| *(optional)* | Optimistic state | subscribe-button example | [optimistic state][dp-optimistic] | ✅ | ✅ |

Topics that **can't** be SDK-only: `provider`, `go_router`, `freezed`/`json_serializable` (also need `build_runner`), `http` (no network in the sandbox anyway), `shared_preferences`/`sqflite` (platform plugins), `google_fonts` (network), and `material_ui` (§7.4).

### 7.4 Packages and `material_ui`: what it would take

- The Flutter runner runs `flutter test --no-pub` in the shared `runtimes/flutter` project. Reads of `~/.pub-cache` are allowed and the network is not (`docs/runtimes.md`, "Reads"/"Network"; `lib/local-runner.ts:337`). So a package works only if `scripts/setup-runtimes.ts` adds it to `runtimes/flutter/pubspec.yaml` (for example `flutter pub add provider go_router material_ui`) before the first run. That's feasible, but it adds to the setup the learner runs once. Current versions (pub.dev API, 2026-09-28): provider 6.1.5+1 (2025-08-19), go_router 18.0.1 (needs Flutter ≥ 3.44), http 1.6.0, material_ui 1.4.0 (needs Flutter ≥ 3.47).
- **The `material_ui` decision:** the migration is one `dart fix` per lesson, and it worked on the §5.6 example. **But** `lib/local-runner.ts:313` imports `package:flutter/material.dart` in the generated check wrapper. The migration guide warns that types from the two libraries are distinct. So a lesson migrated to `material_ui` whose check does `find.byType(SnackBar)` would likely look for the *old* `SnackBar` type and never match (**UNVERIFIED**: not run through the real wrapper in this pass; the probe's test file was migrated along with `main.dart`). The wrapper's import and the lessons' imports have to move together, and `runtimes/flutter` needs the package. Until the November stable actually deprecates the in-SDK library, staying on `package:flutter/material.dart` is the lowest-risk choice.

---

## 8. Open questions / not verified

- Whether freezed 4.x still accepts the case study's `@freezed class User with _$User` form (the case-study snippet may be out of date). **UNVERIFIED.**
- The exact content of every video (§6): **UNVERIFIED** beyond title, description and chapters.
- Whether `avoid_print` also flags `debugPrint`. **UNVERIFIED.**
- The claim in §4.4 about `context.mounted` after `await` (standard lint `use_build_context_synchronously`) wasn't traced to a docs page in this pass. **UNVERIFIED.**
- Whether an official Flutter-channel video on the 2024+ architecture guide exists (none found). **UNVERIFIED.**
- The November 2026 deprecation date for in-SDK Material/Cupertino comes from the [3.47 blog][blog-347]. It's a plan, not a shipped change.

## 9. References

[catalog]: https://docs.flutter.dev/ui/widgets
[catalog-material]: https://docs.flutter.dev/ui/widgets/material
[catalog-cupertino]: https://docs.flutter.dev/ui/widgets/cupertino
[catalog-yml]: https://github.com/flutter/website/blob/main/sites/docs/src/data/catalog/widgets.yml
[catalog-index]: https://github.com/flutter/website/blob/main/sites/docs/src/data/catalog/index.yml
[C]: https://docs.flutter.dev/ui/layout/constraints
[c-tight]: https://docs.flutter.dev/ui/layout/constraints#tight-vs-loose-constraints
[c-unbounded]: https://docs.flutter.dev/ui/layout/constraints#unbounded
[c-flex]: https://docs.flutter.dev/ui/layout/constraints#flex
[P]: https://docs.flutter.dev/perf/best-practices
[p-build]: https://docs.flutter.dev/perf/best-practices#control-build-cost
[p-lazy]: https://docs.flutter.dev/perf/best-practices#be-lazy
[p-intrinsic]: https://docs.flutter.dev/perf/best-practices#minimize-layout-passes-caused-by-intrinsic-operations
[p-opacity]: https://docs.flutter.dev/perf/best-practices#minimize-use-of-opacity-and-clipping
[p-savelayer]: https://docs.flutter.dev/perf/best-practices#use-savelayer-thoughtfully
[p-pitfalls]: https://docs.flutter.dev/perf/best-practices#pitfalls
[A]: https://docs.flutter.dev/ui/adaptive-responsive/general
[ar-general]: https://docs.flutter.dev/ui/adaptive-responsive/general
[ar-best]: https://docs.flutter.dev/ui/adaptive-responsive/best-practices
[LS]: https://docs.flutter.dev/ui/adaptive-responsive/large-screens
[SA]: https://docs.flutter.dev/ui/adaptive-responsive/safearea-mediaquery
[A11y]: https://docs.flutter.dev/ui/accessibility/ui-design-and-styling
[a11y-style]: https://docs.flutter.dev/ui/accessibility/ui-design-and-styling
[a11y-index]: https://docs.flutter.dev/ui/accessibility
[a11y-test]: https://docs.flutter.dev/ui/accessibility/accessibility-testing
[nav]: https://docs.flutter.dev/ui/navigation
[slivers]: https://docs.flutter.dev/ui/layout/scrolling/slivers
[lists]: https://docs.flutter.dev/ui/layout/lists
[implicit]: https://docs.flutter.dev/ui/animations/implicit-animations
[hero-guide]: https://docs.flutter.dev/ui/animations/hero-animations
[cb-snackbar]: https://docs.flutter.dev/cookbook/design/snackbars
[cb-themes]: https://docs.flutter.dev/cookbook/design/themes
[cb-validation]: https://docs.flutter.dev/cookbook/forms/validation
[cb-fetch]: https://docs.flutter.dev/cookbook/networking/fetch-data
[cb-longlists]: https://docs.flutter.dev/cookbook/lists/long-lists
[cb-navbasics]: https://docs.flutter.dev/cookbook/navigation/navigation-basics
[cb-widgettest]: https://docs.flutter.dev/cookbook/testing/widget/introduction
[cb-testscroll]: https://docs.flutter.dev/cookbook/testing/widget/scrolling
[cb-mocking]: https://docs.flutter.dev/cookbook/testing/unit/mocking
[pathway]: https://docs.flutter.dev/learn/pathway
[pw-widget]: https://docs.flutter.dev/learn/pathway/tutorial/widget-fundamentals
[pw-layout]: https://docs.flutter.dev/learn/pathway/tutorial/layout
[pw-input]: https://docs.flutter.dev/learn/pathway/tutorial/user-input
[pw-stateful]: https://docs.flutter.dev/learn/pathway/tutorial/stateful-widget
[pw-implicit]: https://docs.flutter.dev/learn/pathway/tutorial/implicit-animations
[pw-http]: https://docs.flutter.dev/learn/pathway/tutorial/http-requests
[pw-cn]: https://docs.flutter.dev/learn/pathway/tutorial/change-notifier
[pw-listenable]: https://docs.flutter.dev/learn/pathway/tutorial/listenable-builder
[pw-advanced]: https://docs.flutter.dev/learn/pathway/tutorial/advanced-ui
[pw-adaptive]: https://docs.flutter.dev/learn/pathway/tutorial/adaptive-layout
[pw-slivers]: https://docs.flutter.dev/learn/pathway/tutorial/slivers
[pw-nav]: https://docs.flutter.dev/learn/pathway/tutorial/navigation
[arch-index]: https://docs.flutter.dev/app-architecture
[arch-concepts]: https://docs.flutter.dev/app-architecture/concepts
[arch-guide]: https://docs.flutter.dev/app-architecture/guide
[arch-case]: https://docs.flutter.dev/app-architecture/case-study
[arch-ui]: https://docs.flutter.dev/app-architecture/case-study/ui-layer
[arch-data]: https://docs.flutter.dev/app-architecture/case-study/data-layer
[arch-di]: https://docs.flutter.dev/app-architecture/case-study/dependency-injection
[arch-test]: https://docs.flutter.dev/app-architecture/case-study/testing
[arch-rec]: https://docs.flutter.dev/app-architecture/recommendations
[arch-rec-yml]: https://github.com/flutter/website/blob/main/sites/docs/src/data/architectureRecommendations.yml
[arch-patterns]: https://docs.flutter.dev/app-architecture/design-patterns
[dp-command]: https://docs.flutter.dev/app-architecture/design-patterns/command
[dp-result]: https://docs.flutter.dev/app-architecture/design-patterns/result
[dp-optimistic]: https://docs.flutter.dev/app-architecture/design-patterns/optimistic-state
[dp-offline]: https://docs.flutter.dev/app-architecture/design-patterns/offline-first
[compass]: https://github.com/flutter/samples/tree/main/compass_app
[blog-347]: https://flutter.dev/blog/whats-new-in-flutter-3-47
[bc-materialui]: https://docs.flutter.dev/release/breaking-changes/material-ui-and-cupertino-ui
[bc-snackbar]: https://docs.flutter.dev/release/breaking-changes/snackbar-with-action-behavior-update
[bc-radio]: https://docs.flutter.dev/release/breaking-changes/radio-api-redesign
[bc-listtile]: https://docs.flutter.dev/release/breaking-changes/list-tile-color-warning
[bc-reorder]: https://docs.flutter.dev/release/breaking-changes/deprecate-onreorder-callback
[bc-cache]: https://docs.flutter.dev/release/breaking-changes/scroll-cache-extent
[bc-separated]: https://docs.flutter.dev/release/breaking-changes/separated-builder-find-child-index-callback
[bc-appbar]: https://docs.flutter.dev/release/breaking-changes/appbar-theme-color
[bc-dropdownff]: https://docs.flutter.dev/release/breaking-changes/deprecate-dropdownbuttonformfield-value
[bc-dropdown]: https://docs.flutter.dev/release/breaking-changes/dropdownbutton-enabled-property
[bc-uimq]: https://docs.flutter.dev/release/breaking-changes/remove-useInheritedMediaQuery
[bc-form]: https://docs.flutter.dev/release/breaking-changes/form-semantics
[bc-widegamut]: https://docs.flutter.dev/release/breaking-changes/wide-gamut-framework
[bc-materialstate]: https://docs.flutter.dev/release/breaking-changes/material-state
[bc-textscaler]: https://docs.flutter.dev/release/breaking-changes/deprecate-textscalefactor
[bc-popscope]: https://docs.flutter.dev/release/breaking-changes/android-predictive-back
[bc-popresult]: https://docs.flutter.dev/release/breaking-changes/popscope-with-result
[bc-buttonbar]: https://docs.flutter.dev/release/breaking-changes/deprecate-buttonbar
[bc-m3default]: https://docs.flutter.dev/release/breaking-changes/material-3-default
[bc-dialogbg]: https://docs.flutter.dev/release/breaking-changes/deprecate-themedata-dialogbackgroundcolor
[bc-indicator]: https://docs.flutter.dev/release/breaking-changes/deprecate-themedata-indicatorcolor
[bc-expansible]: https://docs.flutter.dev/release/breaking-changes/expansion-tile-controller
[bc-describeenum]: https://docs.flutter.dev/release/breaking-changes/remove-describeEnum
[bc-androidtransition]: https://docs.flutter.dev/release/breaking-changes/default-android-page-transition
[bc-semheader]: https://docs.flutter.dev/release/breaking-changes/semantics-header-heading-level
[bc-m3tokens27]: https://docs.flutter.dev/release/breaking-changes/material-design-3-token-update
[bc-m3tokens41]: https://docs.flutter.dev/release/breaking-changes/material-color-utilities
[bc-progress]: https://docs.flutter.dev/release/breaking-changes/updated-material-3-progress-indicators
[bc-slider]: https://docs.flutter.dev/release/breaking-changes/updated-material-3-slider
[bc-icondata]: https://docs.flutter.dev/release/breaking-changes/icondata-class-marked-final
[bc-issemantics]: https://docs.flutter.dev/release/breaking-changes/deprecate-contains-semantics
[bc-cupdyn]: https://docs.flutter.dev/release/breaking-changes/wide-gamut-cupertino-dynamic-color
[bc-pageview]: https://docs.flutter.dev/release/breaking-changes/pageview-controller
[bc-rawkey]: https://docs.flutter.dev/release/breaking-changes/key-event-migration
[bc-assetmanifest]: https://docs.flutter.dev/release/breaking-changes/asset-manifest-dot-json
[api-async]: https://api.flutter.dev/flutter/widgets/FutureBuilder-class.html
[api-listview]: https://api.flutter.dev/flutter/widgets/ListView-class.html
[api-scsv]: https://api.flutter.dev/flutter/widgets/SingleChildScrollView-class.html
[api-editable]: https://api.flutter.dev/flutter/widgets/TextEditingController-class.html
[api-expanded]: https://api.flutter.dev/flutter/widgets/Expanded-class.html
[api-flexible]: https://api.flutter.dev/flutter/widgets/Flexible-class.html
[api-positioned]: https://api.flutter.dev/flutter/widgets/Positioned-class.html
[api-dismissible]: https://api.flutter.dev/flutter/widgets/Dismissible-class.html
[api-hero]: https://api.flutter.dev/flutter/widgets/Hero-class.html
[api-bnb]: https://api.flutter.dev/flutter/material/BottomNavigationBar-class.html
[api-elevated]: https://api.flutter.dev/flutter/material/ElevatedButton-class.html
[api-filled]: https://api.flutter.dev/flutter/material/FilledButton-class.html
[api-datatable]: https://api.flutter.dev/flutter/material/DataTable-class.html
[api-absorb]: https://api.flutter.dev/flutter/widgets/AbsorbPointer-class.html
[api-repeating]: https://api.flutter.dev/flutter/widgets/RepeatingAnimationBuilder-class.html
[api-listenablebuilder]: https://api.flutter.dev/flutter/widgets/ListenableBuilder-class.html
