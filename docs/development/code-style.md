# Руководство по форматированию кода

## Проблема: VSCode не форматирует код правильно

### Почему VSCode форматирует не так, как команда `npm run format`?

**Основная причина**: VSCode на Windows **по умолчанию использует CRLF** (`\r\n`) окончания строк, а проект требует **LF** (`\n`).

## Решение

### 1. Установите рекомендуемые расширения VSCode

VSCode автоматически предложит установить их при открытии проекта:

- **Prettier - Code formatter** (`esbenp.prettier-vscode`)
- **ESLint** (`dbaeumer.vscode-eslint`)
- **EditorConfig for VS Code** (`EditorConfig.EditorConfig`)

### 2. Перезагрузите VSCode

После установки расширений **обязательно перезагрузите VSCode**:

1. `Ctrl+Shift+P` → "Developer: Reload Window"
2. Или просто закройте и откройте VSCode заново

### 3. Конвертируйте существующие файлы в LF

Если у вас уже есть файлы с CRLF:

```bash
# Форматировать все файлы через Prettier
npm run format

# Или через PowerShell конвертировать конкретный файл
$content = Get-Content путь/к/файлу.ts -Raw
$content = $content -replace "`r`n", "`n"
[System.IO.File]::WriteAllText("путь/к/файлу.ts", $content, (New-Object System.Text.UTF8Encoding $false))
```

## Настройки проекта

### `.prettierrc` - Правила форматирования

```json
{
  "semi": true,              // Точки с запятой обязательны
  "trailingComma": "all",    // Завершающие запятые везде
  "singleQuote": true,       // Одинарные кавычки
  "printWidth": 100,         // Максимум 100 символов в строке
  "tabWidth": 2,             // 2 пробела для отступов
  "useTabs": false,          // Используем пробелы, не табы
  "arrowParens": "always",   // Скобки вокруг параметров стрелочных функций
  "endOfLine": "lf"          // ⚠️ КРИТИЧНО: Только LF окончания строк
}
```

### `.vscode/settings.json` - Настройки VSCode

Ключевые настройки:

```json
{
  "editor.formatOnSave": true,                    // Форматировать при сохранении
  "editor.defaultFormatter": "esbenp.prettier-vscode", // Prettier по умолчанию
  "files.eol": "\n",                              // ⚠️ КРИТИЧНО: Всегда LF
  "files.insertFinalNewline": true,               // Пустая строка в конце файла
  "files.trimTrailingWhitespace": true,           // Удалять пробелы в конце строк
  "prettier.requireConfig": true                   // Требовать .prettierrc
}
```

### `.editorconfig` - Настройки для всех редакторов

```ini
[*]
end_of_line = lf              # ⚠️ КРИТИЧНО: Всегда LF
insert_final_newline = true
trim_trailing_whitespace = true

[*.{ts,tsx,js,jsx,json,css,md}]
indent_style = space
indent_size = 2
```

## Команды для работы

```bash
# Проверить форматирование (не изменяет файлы)
npm run format:check

# Отформатировать все файлы
npm run format

# Проверить код на ошибки
npm run lint

# Автоматически исправить ошибки ESLint
npm run lint:fix

# Проверить типы TypeScript
npm run type-check
```

## Частые проблемы

### ❌ Проблема: После форматирования в VSCode остаются ошибки про `Delete ␍`

**Причина**: VSCode сохранил файл с CRLF вместо LF

**Решение**:
1. Проверьте, что установлено расширение EditorConfig
2. Перезагрузите VSCode
3. Запустите `npm run format`
4. Откройте файл и пересохраните его (`Ctrl+S`)

### ❌ Проблема: VSCode показывает "CRLF" в строке состояния

**Решение**:
1. Кликните на "CRLF" в нижнем правом углу VSCode
2. Выберите "LF"
3. Сохраните файл

### ❌ Проблема: Форматирование не применяется при сохранении

**Решение**:
1. Откройте настройки VSCode (`Ctrl+,`)
2. Найдите "Format On Save" и убедитесь, что включено
3. Найдите "Default Formatter" и выберите "Prettier - Code formatter"

## Workflow при разработке

1. **Пишите код** - не беспокойтесь о форматировании
2. **Сохраняйте файл** (`Ctrl+S`) - VSCode автоматически отформатирует
3. **Перед коммитом** всегда запускайте:

```bash
npm run format      # Форматирование
npm run lint        # Проверка на ошибки
npm run type-check  # Проверка типов
```

## Правила кода

### Console методы

❌ **Неправильно**:
```typescript
console.log('Hello'); // ESLint ошибка!
```

✅ **Правильно**:
```typescript
console.warn('Warning message');  // Для предупреждений
console.error('Error message');   // Для ошибок
```

### Отступы и пробелы

- **2 пробела** для отступов (не 4, не табы!)
- Пробелы в конце строк автоматически удаляются
- Пустая строка в конце файла обязательна

### Кавычки и запятые

```typescript
// Одинарные кавычки
const name = 'Script City';

// Завершающие запятые
const config = {
  width: 800,
  height: 600, // ← запятая обязательна
};
```

## Проверка настроек

Выполните эту команду, чтобы проверить, что всё настроено правильно:

```bash
# Должно пройти без ошибок
npm run format && npm run lint && npm run type-check
```

Если есть ошибки - смотрите раздел "Частые проблемы" выше.

---

**Теги**: #development #code-style #prettier #eslint #vscode

