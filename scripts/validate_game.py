import json
import sqlite3
import re
import os
import sys

SQL_KEYWORDS = [
    "SELECT", "FROM", "WHERE", "JOIN", "LEFT JOIN", "INNER JOIN", 
    "GROUP BY", "HAVING", "ORDER BY", "UNION", "EXCEPT", "INTERSECT",
    "LIMIT", "COUNT", "SUM", "AVG", "MIN", "MAX", "DISTINCT", "AS", 
    "IN", "AND", "OR", "NOT", "EXISTS", "LIKE", "IS NULL", "IFNULL"
]

def slugify(text):
    """
    Převede název na ID (např. 'SQL Vesmír' -> 'sql-vesmir').
    Podporuje odstranění české diakritiky.
    """
    accent_map = {
        'á': 'a', 'č': 'c', 'ď': 'd', 'é': 'e', 'ě': 'e', 'í': 'i', 'ň': 'n',
        'ó': 'o', 'ř': 'r', 'š': 's', 'ť': 't', 'ú': 'u', 'ů': 'u', 'ý': 'y', 'ž': 'z'
    }
    
    text = text.lower()
    for char, replacement in accent_map.items():
        text = text.replace(char, replacement)
    
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def extract_keywords(sql):
    """
    Extrahuje SQL klíčová slova z dotazu.
    """
    found = []
    upper_sql = sql.upper()
    for word in SQL_KEYWORDS:
        if re.search(r'\b' + re.escape(word) + r'\b', upper_sql):
            found.append(word)
    return found

def validate_and_preprocess(file_path):
    """
    Validuje a doplňuje metadata v JSON souboru s hrou.
    """
    print(f"--- Validuji soubor: {file_path} ---")

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"::error file={file_path}::Soubor není validní JSON! ({e})")
        sys.exit(1)
    
    # Kontrola povinných polí na úrovni rootu
    required_root_fields = ['createScript', 'insertScript', 'scenes']
    for field in required_root_fields:
        if field not in data:
            print(f"::error file={file_path}::V souboru chybí povinné pole '{field}'.")
            sys.exit(1)

    config = data.get('config', {})
    title = config.get('title')

    if not title:
        print(f"::error file={file_path}::V configu chybí 'title'.")
        sys.exit(1)

    # Doplnění metadat
    game_id = config.get('id') or slugify(title)
    config['id'] = game_id  
    config['dbName'] = config.get('dbName') or title.replace(" ", "")
    config['assetFolder'] = config.get('assetFolder') or config['dbName']
    config['active'] = config.get('active', True)
    config['btnText'] = config.get('btnText', 'Hrát')
    config['loadingText'] = config.get('loadingText', "Načítám...")

    # Testování SQL
    try:
        connection = sqlite3.connect(':memory:')
        cursor = connection.cursor()

        cursor.executescript(data['createScript'])
        cursor.executescript(data['insertScript'])

        print("Inicializační SQL skripty jsou v pořádku.")

        # Zpracování scén
        scenes_list = data.get('scenes', [])
        data['number_of_scenes'] = len(scenes_list)

        for index, scene in enumerate(scenes_list):
            scene_id = index + 1
            scene['id'] = scene_id

            if 'answer' not in scene:
                print(f"::error file={file_path}::CHYBA ve scéně {scene_id}: Chybí pole 'answer'.")
                sys.exit(1)

            try:
                cursor.execute(scene['answer'])
            except Exception as e:
                print(f"::error file={file_path}::CHYBA ve scéně {scene_id}: Neplatný SQL 'answer'! ({e})")
                sys.exit(1)

            if not scene.get('keywords'):
                scene['keywords'] = extract_keywords(scene['answer'])

            if not scene.get('img'):
                scene['img'] = f"{scene_id}.jpg"

            asset_folder = config.get('assetFolder')
            if asset_folder:
                img_path = os.path.join('public', 'pageAssets', asset_folder, 'scenes', scene['img'])
                if not os.path.exists(img_path):
                    print(f"::warning file={file_path}::Obrázek scény '{img_path}' nebyl nalezen.")

        print(f"Všech {len(scenes_list)} scén bylo úspěšně zvalidováno.")
        connection.close()

    except Exception as e:
        print(f"::error file={file_path}::Kritická chyba při práci s databází: {e}")
        sys.exit(1)

    # Kontrola existence schématu
    schema_name = config.get('schemaImg')
    if schema_name:
        schema_path = os.path.join('public', 'assets', schema_name)
        if not os.path.exists(schema_path):
            print(f"::error file={file_path}::Soubor schématu '{schema_name}' nebyl nalezen v public/assets/!")
            sys.exit(1)
    else:
        print(f"::error file={file_path}::V configu chybí povinné pole 'schemaImg'.")
        sys.exit(1)

    # Kontrola existence náhledového obrázku karty
    card_img = config.get('cardImage')
    if card_img:
        card_path = os.path.join('public', card_img)
        if not os.path.exists(card_path):
            print(f"::warning file={file_path}::Náhledový obrázek karty '{card_img}' nebyl nalezen.")

    data['config'] = config
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

    print(f"--- {file_path} byl úspěšně zpracován ---\n")


if __name__ == "__main__":
    folder = 'src/data/games'
    if not os.path.exists(folder):
        print(f"::error::Složka {folder} neexistuje!")
        sys.exit(1)
        
    for filename in os.listdir(folder):
        if filename.endswith('.json'):
            validate_and_preprocess(os.path.join(folder, filename))