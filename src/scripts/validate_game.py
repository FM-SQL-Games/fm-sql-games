import argparse
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

def remove_diacritics(text):
    """Odstraní českou diakritiku z textu."""
    accent_map = {
        'á': 'a', 'č': 'c', 'ď': 'd', 'é': 'e', 'ě': 'e', 'í': 'i', 'ň': 'n',
        'ó': 'o', 'ř': 'r', 'š': 's', 'ť': 't', 'ú': 'u', 'ů': 'u', 'ý': 'y', 'ž': 'z',
        'Á': 'A', 'Č': 'C', 'Ď': 'D', 'É': 'E', 'Ě': 'E', 'Í': 'I', 'Ň': 'N',
        'Ó': 'O', 'Ř': 'R', 'Š': 'S', 'Ť': 'T', 'Ú': 'U', 'Ů': 'U', 'Ý': 'Y', 'Ž': 'Z'
    }
    for char, replacement in accent_map.items():
        text = text.replace(char, replacement)
    return text

def slugify(text):
    """
    Převede název na ID (např. 'SQL Vesmír' -> 'sql-vesmir').
    """
    text = remove_diacritics(text).lower()
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


def enrich_config(config):
    """
    Doplní chybějící pole v configu na základě title.
    """
    errors = []
    title = config.get('title')
    if not title:
        errors.append("V configu chybí 'title'.")
        return config, errors

    clean_title = remove_diacritics(title).replace(" ", "") 
    config['id'] = config.get('id') or slugify(title)
    config['dbName'] = config.get('dbName') or clean_title
    config['assetFolder'] = config.get('assetFolder') or clean_title
    config['active'] = config.get('active', True)
    config['theme'] = config.get('theme', 'default-theme')
    config['setupTitle'] = config.get('setupTitle', 'Nová SQL Výzva')
    config['setupDescription'] = config.get('setupDescription', 'Popis této hry zatím chybí.')
    config['btnText'] = config.get('btnText', 'Hrát')
    config['loadingText'] = config.get('loadingText', "Načítám...")

    if not config.get('schemaImg'):
        errors.append("V configu chybí povinné pole 'schemaImg'.")
    
    return config, errors

def validate_and_preprocess(file_path, base_path):
    """
    Validuje a doplňuje metadata v JSON souboru s hrou.
    """
    print(f"--- Validuji soubor: {file_path} ---")

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"::error file={file_path}::Soubor není validní JSON! ({e})")
        return False

    errors = []
    
    # Kontrola povinných polí na úrovni rootu
    required_root_fields = ['createScript', 'insertScript', 'scenes']
    for field in required_root_fields:
        if field not in data:
            errors.append(f"V souboru chybí povinné pole '{field}'.")

    # Doplnění metadat v configu
    config, config_errors = enrich_config(data.get('config', {}))
    errors.extend(config_errors)
    data['config'] = config

    if errors:
        for err in errors:
            print(f"::error file={file_path}::{err}")
        return False
    
    # Testování SQL a zpracování scén
    try:
        connection = sqlite3.connect(':memory:')
        cursor = connection.cursor()
        cursor.executescript(data['createScript'])
        cursor.executescript(data['insertScript'])

        scenes_list = data.get('scenes', [])
        data['number_of_scenes'] = len(scenes_list)
        asset_folder = config.get('assetFolder')

        for index, scene in enumerate(scenes_list):
            scene_id = index + 1
            scene['id'] = scene_id

            if 'answer' not in scene:
                errors.append(f"Scéna {scene_id}: Chybí pole 'answer'.")
                continue

            try:
                cursor.execute(scene['answer'])
            except Exception as e:
                errors.append(f"Scéna {scene_id}: Neplatný SQL v poli 'answer'! ({e})")

            if not scene.get('keywords'):
                scene['keywords'] = extract_keywords(scene['answer'])

            if not scene.get('img'):
                scene['img'] = f"{scene_id}.jpg"

            if asset_folder:
                img_path = os.path.join(base_path, 'public', 'pageAssets', asset_folder, 'scenes', scene['img'])
                if not os.path.exists(img_path):
                    print(f"::warning file={file_path}::Obrázek scény '{img_path}' nebyl nalezen.")
            
            allowed_rules = {"strict_row_order", "strict_column_order", "strict_as"}
            strict_rules = scene.get('strict_rules', [])
            
            if not isinstance(strict_rules, list):
                errors.append(f"Scéna {scene_id}: Pole 'strict_rules' musí být typu pole (array).")
            else:
                for rule in strict_rules:
                    if rule not in allowed_rules:
                        print(f"::warning file={file_path}::Scéna {scene_id}: Neznámé pravidlo '{rule}' v 'strict_rules'.")
            scene['strict_rules'] = strict_rules
        connection.close()

    except Exception as e:
        errors.append(f"Kritická chyba při práci s databází: {e}")

    # Kontrola existence schématu
    schema_name = config.get('schemaImg')
    if schema_name:
        schema_path = os.path.join(base_path, 'public', 'assets', schema_name)
        if not os.path.exists(schema_path):
            errors.append(f"Soubor schématu '{schema_name}' nebyl nalezen v public/assets/!")

    # Kontrola existence náhledového obrázku karty
    card_img = config.get('cardImage')
    if card_img:
        card_path = os.path.join(base_path, 'public', card_img.lstrip('/'))
        if not os.path.exists(card_path):
            print(f"::warning file={file_path}::Náhledový obrázek karty '{card_img}' nebyl nalezen.")

    if errors:
        for err in errors:
            print(f"::error file={file_path}::{err}")
        return False

    json_str = json.dumps(data, indent=4, ensure_ascii=False)
    
    for key in ["keywords", "strict_rules"]:
        pattern = rf'("{key}":\s*)\[(.*?)\]'
        
        def replace_array(match):
            prefix = match.group(1)
            content = re.sub(r'\s*\n\s*', ' ', match.group(2)).strip()
            return f"{prefix}[{content}]"
            
        json_str = re.sub(pattern, replace_array, json_str, flags=re.DOTALL)
        
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(json_str + '\n') 

    print(f"--- {file_path} byl úspěšně zpracován ---\n")
    return True


if __name__ == "__main__":

    parser = argparse.ArgumentParser(description="Validace a preprocessing SQL her.")
    parser.add_argument("--path", default=".", help="Základní cesta k projektu (např. pr-data)")
    args = parser.parse_args()
    
    folder = os.path.join(args.path, 'src', 'data', 'games')
    overall_success = True

    if not os.path.exists(folder):
        print(f"::error::Složka {folder} neexistuje!")
        sys.exit(1)
        
    for filename in os.listdir(folder):
        if filename.endswith('.json'):
            if not validate_and_preprocess(os.path.join(folder, filename), args.path):
                overall_success = False
    
    if not overall_success:
        sys.exit(1)