# Výuková platforma pro SQL s herními prvky

Tento projekt je interaktivní webová aplikace postavená v Reactu, která slouží k výuce a procvičování databázového jazyka SQL zábavnou formou. Místo nudných tabulek a suché teorie nabízí studentům tematické minihry, ve kterých řeší problémy pomocí SQL dotazů.

##  Dostupné minihry

###  SQLCraft
Základní modul inspirovaný fenoménem Minecraft. Hráč se ocitá v kostičkovaném světě a pomocí SQL dotazů musí například zjistit, kolik má v inventáři surovin, nebo vyfiltrovat nepřátelské moby.

###  Escape from TUL
Pokročilejší modul s hackerskou tematikou zasazený do prostředí Technické univerzity v Liberci (TUL). Hráč v roli studenta musí proniknout do univerzitního systému (STAG) přes simulovaný zelený terminál.

##  Použité technologie

* **Frontend:** React.js (funkcionální komponenty, hooks)
* **Stylování:** Čisté CSS
* **Databáze (Klient):** `sql.js` (WebAssembly port SQLite) - databáze běží kompletně v prohlížeči uživatele.
* **Backend / Logování:** Supabase - ukládání historie dotazů, úspěšnosti a chyb pro analytické účely.
* **Validace Dat:** Python 3 + SQLite3 (automatický preprocessing her)
* **CI/CD:** GitHub Actions - automatická kontrola integrity Pull Requestů

## Jak přidat svou novou hru?
Projekt je navržen tak, aby kdokoliv mohl snadno přidat svou vlastní SQL hru bez nutnosti zasahovat do kódu. O vše se postará automatický validátor.

1. **Fork repozitáře**
    - Forkni si kopii repozitáře a naklonuj si ji k sobě, abys na ní mohl pracovat.

2. **Příprava větve**
    - Vytvoř si novou větev s konvencí: **`feature/add-game-[nazev-hry]`**.

3. **Umístění souborů**
    - **JSON s definicí:** `src/data/games/[nazev-hry].json` - návod na správnou strukturu v sekci 'Dokumentace herního JSONu'
    - **Schéma databáze:** `public/assets/[nazev-hry]_scheme.png`
    - **Assety scén (nepovinné):** `public/pageAssets/[nazev-hry]/scenes/[1.jpg, 2.jpg...]`
    - Nakonec vše commitni a pushni to do své větve ve svém repozitáři.

4. **Automatický preprocessing**
    - Jakmile vytvoříš ve své větvi Pull Request, spustí se **GitHub Action**, která:
    1. Zkontroluje integritu tvých SQL skriptů (create i insert).
    2. Ověří, zda všechny scény mají funkční řešení (answer).
    3. Doplní metadata: Automaticky vygeneruje ID, klíčová slova pro nápovědu a defaultní UI texty, pokud validace selže, vypíše se konkrétní chyba přímo do GitHub Action v Pull Requestu.
    4. Commitne upravený JSON zpět do tvého PR.
    - Po finální revizi kódu vývojářem bude tvá hra následně přidána mezi ostatní.

## Dokumentace herního JSONu
Každá hra je specificky definována jedním JSON souborem. Validátor vyžaduje minimálně tyto parametry:

### 1. Kořenová struktura

| Pole | Povinné | Výchozí hodnota | Popis |
| :--- | :---: | :---: | :--- |
| `config` | **ANO** | - | Objekt s metadaty hry (viz níže) |
| `createScript` | **ANO** | - | SQL příkazy pro vytvoření tabulek|
| `insertScript` | **ANO** | - | SQL příkazy pro naplnění tabulek daty. |
| `scenes` | **ANO** | - | Pole objektů definujících jednotlivé úrovně/úlohy |
| `number_of_scenes` | Ne | Àuto | Celkový počet scén (vypočteno automaticky skriptem). |

### 2. Objekt `config` (Metadata hry)
Tato sekce definuje, jak se hra zobrazuje v menu a na úvodní obrazovce.

| Pole | Povinné | Výchozí hodnota | Popis |
| :--- | :---: | :--- | :--- |
| `title` | **ANO** | - | Název hry zobrazený v menu. |
| `schemaImg` | **ANO** | - | Název souboru se schématem (musí být v `public/assets/`). |
| `id` | Ne  | slug z title | Unikátní identifikátor. |
| `dbName` | Ne | title bez diakritiky | Interní název databáze pro SQL engine. |
| `assetFolder` | Ne | title bez diakritiky | Název složky v `public/pageAssets/` pro obrázky scén. |
| `description` | Ne | - | Krátký text zobrazený na výběrové kartě hry. |
| `cardImage` | Ne | - | Cesta k náhledovému obrázku karty. |
| `setupTitle` | Ne | Nová SQL Výzva | Nadpis na startovací obrazovce. |
| `setupDescription` | Ne | Popis této hry zatím chybí. | Dlouhý úvodní text (příběh), který uvádí hráče do děje. |
| `btnText` | Ne | Hrát | Text na spouštěcím tlačítku. |
| `loadingText` | Ne | Načítám... | Text zobrazený během inicializace databáze. |
| `active` | Ne | true | Pokud je false, hra se v nabídce nezobrazí. |

### 3. Pole `scenes` (Definice úrovní)
Každý objekt v tomto poli představuje jednu herní obrazovku s úkolem.
| Pole | Povinné | Výchozí hodnota | Popis |
| :--- | :---: | :---: | :--- |
| `story` |  **ANO** | - | Text pokračujícího příběhu specifický pro tuto scénu. |
| `prompt` |  **ANO** | - | Konkrétní zadání úkolu (co má hráč provést). |
| `answer` |  **ANO** | - | Referenční SQL dotaz pro ověření správnosti. |
| `id` | Ne | index + 1 | Pořadové číslo scény (automaticky doplňováno). |
| `img` | Ne | `id.jpg` |  Název obrázku scény ve složce `assetFolder/scenes/`. |
| `keywords` | Ne | Auto | Pole SQL klíčových slov pro nápovědu (generováno z answer).
| `strict_rules`| Ne | `[]` | Pole pravidel pro přísnější vyhodnocení dotazu (viz níže). | 

####  Nastavení přísnosti vyhodnocení (Striktní pravidla)
Ve výchozím stavu (prázdné pole `[]`) je vyhodnocovací engine **velmi benevolentní**. Pokud se data z uživatelského dotazu shodují s daty v autorském řešení, engine dotaz uzná, i když hráč přehodil pořadí sloupců, řádků nebo si sloupce jinak pojmenoval.

Pokud však chcete otestovat specifické znalosti, můžete chování enginu pro danou scénu zpřísnit přidáním pole `"strict_rules"` do konfigurace scény:

* `"strict_row_order"` – Zapne kontrolu přesného pořadí řádků. Pokud uživatel nepoužije správný `ORDER BY`, odpověď nebude uznána.
* `"strict_column_order"` – Zapne kontrolu přesného pořadí sloupců. Uživatel musí v příkazu `SELECT` vypsat sloupce přesně v tom pořadí, jaké je v referenčním řešení.
* `"strict_as"` – Zapne kontrolu názvů sloupců. Hráč musí dodržet pojmenování všech sloupců (aliasy). Vhodné pro vynucení znalosti klauzule `AS`

##  Instalace a spuštění (Local Setup)

Pro spuštění projektu na svém počítači postupuj podle následujících kroků:

1. **Naklonování repozitáře**
   ```
   bash
   git clone "https://github.com/MarekProchazka12/fm-sql-games.git"
   cd fm-sql-games
   ```
2. **Instalace závislostí**
    ```
    npm install
    ```
3. **Nastavení proměnných prostředí (Environment Variables)**
Projekt využívá Supabase pro logování. Vytvoř v kořenovém adresáři soubor .env.local a vlož do něj své přístupové údaje:
    ```
    VITE_SUPABASE_URL=projekt_url
    VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=anon_key
    ```
4. **Spuštění vývojového serveru**
    ```
    npm run dev
    ```