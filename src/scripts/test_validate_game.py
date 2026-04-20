import pytest
from validate_game import remove_diacritics, slugify, extract_keywords, enrich_config

# --- 1. Testy pro remove_diacritics  ---
@pytest.mark.parametrize("input_text, expected", [
    ("Žluťoučký kůň", "Zlutoucky kun"),
    ("PŘÍLIŠ ŽLUŤOUČKÝ KŮŇ ÚPĚL ĎÁBELSKÉ ÓDY", "PRILIS ZLUTOUCKY KUN UPEL DABELSKE ODY"),
    ("ščřžýáíéňťď", "scrzyaientd"),
    ("1234567890", "1234567890"),
    ("!@#$%^&*()_+", "!@#$%^&*()_+"),
    ("", ""),
    ("   ", "   "),
])
def test_remove_diacritics_exhaustive(input_text, expected):
    assert remove_diacritics(input_text) == expected

# --- 2. Testy pro slugify ---
@pytest.mark.parametrize("input_text, expected", [
    ("SQL Vesmír", "sql-vesmir"),
    ("  Mezery  Na  Konci  ", "mezery-na-konci"),
    ("Te.st/Speciální*Znaky", "te-st-specialni-znaky"),
    ("Dvojité--Pomlčky", "dvojite-pomlcky"),
    ("123-Čísla-A-Text-456", "123-cisla-a-text-456"),
    ("---", ""),
    ("Upper CASE", "upper-case"),
])
def test_slugify_exhaustive(input_text, expected):
    assert slugify(input_text) == expected

# --- 3. Testy pro extract_keywords ---
@pytest.mark.parametrize("sql, expected_keywords", [
    ("SELECT * FROM users", ["SELECT", "FROM"]),
    ("select id from accounts", ["SELECT", "FROM"]),
    ("SELECT id AS user_id FROM users", ["SELECT", "AS", "FROM"]),
    ("INSERT INTO logs VALUES (1)", []),
    ("SELECT COUNT(id), AVG(score) FROM results", ["SELECT", "COUNT", "AVG", "FROM"]),
    ("SELECT DISTINCT name FROM items WHERE price IS NULL", ["SELECT", "DISTINCT", "FROM", "WHERE", "IS NULL"]),
    ("SELECT assignment FROM tasks", ["SELECT", "FROM"]),
    ("SELECT maximum FROM stats", ["SELECT", "FROM"]),
    ("\tSELECT\n*\rFROM\nusers", ["SELECT", "FROM"]),
])
def test_extract_keywords_exhaustive(sql, expected_keywords):
    found = extract_keywords(sql)
    for kw in expected_keywords:
        assert kw in found
    assert len(found) == len(expected_keywords)

# --- 4. Testy pro enrich_config ---
def test_enrich_config_full_cycle():
    """Testuje kompletní doplnění prázdného (ale validního) configu."""
    config = {"title": "Testovací Hra 123", "schemaImg": "mapa.jpg"}
    enriched, errors = enrich_config(config)
    
    assert len(errors) == 0
    assert enriched['id'] == "testovaci-hra-123"
    assert enriched['dbName'] == "TestovaciHra123"
    assert enriched['assetFolder'] == "TestovaciHra123"
    assert enriched['active'] is True
    assert enriched['theme'] == "default-theme"
    assert enriched['loadingText'] == "Načítám..."

def test_enrich_config_partial_override():
    """Testuje, že explicitně zadané hodnoty zůstanou zachovány."""
    config = {
        "title": "SQL Quest",
        "schemaImg": "schema.png",
        "id": "fixed-id",
        "active": False,
        "btnText": "Start"
    }
    enriched, errors = enrich_config(config)
    
    assert enriched['id'] == "fixed-id"
    assert enriched['active'] is False
    assert enriched['btnText'] == "Start"
    assert enriched['dbName'] == "SQLQuest"

def test_enrich_config_error_reporting():
    """Testuje hlášení více chyb najednou."""
    config = {"some_random_field": "value"}
    _, errors = enrich_config(config)
    
    assert "V configu chybí 'title'." in errors
    assert len(errors) == 1 

    config = {"title": "Hra"}
    _, errors = enrich_config(config)
    assert "V configu chybí povinné pole 'schemaImg'." in errors

# --- 5. Testy pro integraci typů v configu ---
def test_enrich_config_data_types():
    """Ověřuje, že datové typy v configu jsou správné (bool, str)."""
    config = {"title": "Typy", "schemaImg": "img.png", "active": 0}
    enriched, _ = enrich_config(config)
    
    assert enriched['active'] == 0
    
    config_no_active = {"title": "Typy", "schemaImg": "img.png"}
    enriched_default, _ = enrich_config(config_no_active)
    assert enriched_default['active'] is True