# Rozwój

## Wymagania

- Node.js 20+
- npm 9+

## Uruchomienie lokalne

```bash
npm install
npm start
```

## Budowanie instalatora

```bash
npm run make
```

Komenda zbuduje instalator dla bieżącej platformy (`.exe` na Windows, `.dmg` na macOS).

## Wydawanie nowej wersji

1. Zaktualizuj pole `version` w `package.json`.
2. Scommituj zmianę i utwórz tag:

```bash
git add package.json
git commit -m "Release v1.1.0"
git tag v1.1.0
git push origin master --tags
```

3. GitHub Actions automatycznie zbuduje instalatory dla obu platform i opublikuje je w [Releases](https://github.com/HesusWhiskus/qa-test-scenarios/releases).
