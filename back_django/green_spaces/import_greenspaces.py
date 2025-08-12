import os
import sys
import json
import django
from django.contrib.gis.geos import GEOSGeometry

# Ajouter le répertoire racine du projet au PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configurer l'environnement Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Importer le modèle après l'initialisation de Django
from .models import GreenSpace

def import_greenspaces(geojson_file_path):
    # Charger le fichier GeoJSON
    with open(geojson_file_path, 'r', encoding='utf-8') as f:
        geojson_data = json.load(f)

    # Parcourir les features du GeoJSON
    for feature in geojson_data['features']:
        properties = feature['properties']
        geometry = feature['geometry']

        # Convertir la géométrie GeoJSON en objet GEOS
        geom = GEOSGeometry(json.dumps(geometry), srid=4326)
        # Gérer opening_date : utiliser None si null ou valeur invalide
       

        # Créer une instance de GreenSpace
        greenspace = GreenSpace(
            full_id=properties.get('full_id'),
            osm_id=properties.get('osm_id'),
            osm_type=properties.get('osm_type'),
            leisure=properties.get('leisure'),
            fee=properties.get('fee'),
            access=properties.get('access'),
            wikimedia_commons=properties.get('wikimedia_commons'),
            wikidata=properties.get('wikidata'),
            barrier=properties.get('barrier'),
            name=properties.get('name'),
            landuse=properties.get('landuse'),
            geometry=geom
        )
        greenspace.save()

    print(f"Importation terminée : {len(geojson_data['features'])} espaces verts importés.")

if __name__ == "__main__":
    # Chemin vers votre fichier GeoJSON
    geojson_file_path = os.path.join(os.path.dirname(__file__), './Park_Garden_Rabat.geojson')
    import_greenspaces(geojson_file_path)