# ux-ui-review

Skill dla **Claude Code** do oceny UI/UX aplikacji z perspektywy nietechnicznego użytkownika końcowego. Przygotował go [Marek Zettl — zetmar-collab](https://github.com/zetmar-collab). Instrukcje i raporty są w języku polskim.

Wykrywa problemy użyteczności, dostępności, komunikatów, hierarchii wizualnej i doświadczenia mobilnego, a następnie proponuje priorytetowe poprawki. Domyślnie tylko analizuje; kodu nie zmienia.

## Co robi skill

- Ocenia pierwsze wrażenie, ścieżki zadań, formularze, nawigację, komunikaty i stany puste.
- Sprawdza dostępność (kontrast, klawiatura, etykiety, teksty alternatywne) i wersję mobilną.
- Może uruchomić skrypty pomocnicze na działającej aplikacji: zrzuty ekranu (desktop, tablet, telefon), lista tekstów interfejsu i automatyczny audyt WCAG 2.1 A/AA (axe-core).
- Zgłasza tylko to, co da się wskazać w interfejsie lub kodzie. Niepewne rzeczy oznacza jako **Do weryfikacji**.

To zestaw instrukcji dla agenta AI, a nie samodzielne narzędzie. Automatyczny audyt dostępności jest punktem wyjścia, a nie pełną oceną.

## Instalacja

### Windows — PowerShell, dla wszystkich projektów użytkownika

```powershell
New-Item -ItemType Directory -Force -Path "$HOME/.claude/skills" | Out-Null
git clone https://github.com/zetmar-collab/ux-ui-review.git "$HOME/.claude/skills/ux-ui-review"
```

### macOS / Linux, dla wszystkich projektów użytkownika

```bash
mkdir -p ~/.claude/skills
git clone https://github.com/zetmar-collab/ux-ui-review.git ~/.claude/skills/ux-ui-review
```

Instalacja tylko dla jednego projektu: sklonuj repozytorium do `.claude/skills/ux-ui-review` w katalogu tego projektu. Jeśli skill nie jest widoczny, rozpocznij nową sesję Claude Code.

## Zależności skryptów (opcjonalne)

Sam skill nie wymaga niczego poza Claude Code. Skrypty pomocnicze potrzebują Node.js oraz Playwrighta i axe-core, instalowanych w katalogu skilla (nie w projekcie):

```bash
cd ~/.claude/skills/ux-ui-review
npm install
npx playwright install chromium
```

Bez tego skill nadal działa: ocenia kod, teksty i zrzuty ekranu, które mu podasz.

## Użycie

Wpisz w rozmowie z Claude Code (nie w terminalu):

```text
/ux-ui-review Przeanalizuj ekran rejestracji i dashboard pod kątem użytkownika nietechnicznego.
```

```text
/ux-ui-review Przeanalizuj http://localhost:3000 pod kątem użytkownika nietechnicznego.
```

Gdy nie podasz adresu, skill odnajdzie ekrany w kodzie projektu. Jeśli aplikacja nie działa, oceni je na podstawie kodu i oznaczy ustalenia wizualne jako „Do weryfikacji”.

### Skrypty ręcznie

Uruchamiaj z katalogu projektu, podając ścieżkę do skilla:

```bash
node ~/.claude/skills/ux-ui-review/scripts/capture-screens.mjs http://localhost:3000 output/screenshots
node ~/.claude/skills/ux-ui-review/scripts/extract-ui-copy.mjs http://localhost:3000 output/ui-copy.json
node ~/.claude/skills/ux-ui-review/scripts/audit-a11y.mjs http://localhost:3000 output/a11y-report.json
```

Skrypty przyjmują tylko adresy `http` i `https`, a gdy aplikacja nie odpowiada, wypisują krótki komunikat zamiast błędu technicznego.

### Ekrany za logowaniem (np. dashboard)

Skill nigdy nie prosi o hasło. Zapisz sesję samodzielnie, logując się w otwartym oknie:

```bash
cd ~/.claude/skills/ux-ui-review
npx playwright codegen --save-storage=/pełna/ścieżka/auth.json http://localhost:3000/login
```

Potem uruchom skrypty ze zmienną `STORAGE_STATE=/pełna/ścieżka/auth.json` (PowerShell: `$env:STORAGE_STATE = "...\auth.json"`). Plik zawiera tokeny sesji, więc nie dodawaj go do repozytorium i usuń po audycie. Raporty z ekranów po zalogowaniu mogą zawierać dane osobowe.

## Aktualizacja

```bash
git -C ~/.claude/skills/ux-ui-review pull --ff-only
```

W PowerShell: `git -C "$HOME/.claude/skills/ux-ui-review" pull --ff-only`.

## Struktura

```text
ux-ui-review/
├── SKILL.md
├── README.md
├── package.json
├── .gitignore
└── scripts/
    ├── lib.mjs
    ├── audit-a11y.mjs
    ├── capture-screens.mjs
    └── extract-ui-copy.mjs
```
