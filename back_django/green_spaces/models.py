from django.contrib.gis.db import models
from django.contrib.gis.geos import GEOSGeometry
import json
# Create your models here.

class GreenSpace(models.Model):
    """
    Modèle pour les espaces verts avec support PostGIS
    """
    
    # Champs basés sur les propriétés du GeoJSON
    full_id = models.CharField(max_length=50, unique=True, help_text="ID complet OpenStreetMap")
    osm_id = models.CharField(max_length=20, help_text="ID OpenStreetMap")
    osm_type = models.CharField(max_length=10, help_text="Type d'objet OSM (way, node, relation)")
    
    # Champs spécifiques aux espaces verts
    leisure = models.CharField(max_length=50, null=True, blank=True, help_text="Type de loisir (garden, park, etc.)")
    landuse = models.CharField(max_length=50, null=True, blank=True, help_text="Usage du terrain")
    name = models.CharField(max_length=200, null=True, blank=True, help_text="Nom de l'espace vert")
    
    # Champs optionnels
    fee = models.CharField(max_length=10, null=True, blank=True, help_text="Frais d'entrée")
    access = models.CharField(max_length=50, null=True, blank=True, help_text="Type d'accès")
    barrier = models.CharField(max_length=50, null=True, blank=True, help_text="Barrières")
    
    # Liens vers des ressources externes
    wikimedia_commons = models.URLField(null=True, blank=True, help_text="Lien Wikimedia Commons")
    wikidata = models.CharField(max_length=50, null=True, blank=True, help_text="ID Wikidata")
    
    # Champ géométrique PostGIS - le plus important !
    geometry = models.MultiPolygonField(
        srid=4326,  # WGS84 - système de coordonnées standard pour GPS
        help_text="Géométrie de l'espace vert"
    )
    
   
    
    class Meta:
        verbose_name = "Espace Vert"
        verbose_name_plural = "Espaces Verts"
        indexes = [
            # Index spatial pour améliorer les performances des requêtes géographiques
            models.Index(fields=['geometry']),
            models.Index(fields=['leisure']),
            models.Index(fields=['landuse']),
        ]
    
    def __str__(self):
        return self.name or f"Espace vert {self.osm_id}"
    
    @property
    def area(self):
        """Calcule la superficie en mètres carrés"""
        if self.geometry:
            # Transforme en projection métrique (UTM) pour calcul précis
            # Zone UTM 29N pour le Maroc (Rabat/Casablanca)
            utm_geom = self.geometry.transform(32629, clone=True)
            return utm_geom.area
        return 0
    
    @property 
    def centroid(self):
        """Retourne le centroïde de la géométrie"""
        if self.geometry:
            return self.geometry.centroid
        return None
    
    def distance_to_point(self, longitude, latitude):
        """
        Calcule la distance en mètres vers un point donné
        """
        from django.contrib.gis.geos import Point
        point = Point(longitude, latitude, srid=4326)
        # Utilise une projection métrique pour un calcul précis
        geom_utm = self.geometry.transform(32629, clone=True)
        point_utm = point.transform(32629, clone=True)
        return geom_utm.distance(point_utm)
    
    @classmethod
    def from_geojson_feature(cls, feature):
        """
        Crée une instance à partir d'un feature GeoJSON
        """
        properties = feature.get('properties', {})
        geometry_data = feature.get('geometry')
        
        # Convertit la géométrie GeoJSON en objet GEOS
        geometry = GEOSGeometry(json.dumps(geometry_data))
        
        # Assure que c'est un MultiPolygon
        if geometry.geom_type == 'Polygon':
            from django.contrib.gis.geos import MultiPolygon
            geometry = MultiPolygon(geometry)
        
        return cls(
            full_id=properties.get('full_id'),
            osm_id=properties.get('osm_id'),
            osm_type=properties.get('osm_type'),
            leisure=properties.get('leisure'),
            landuse=properties.get('landuse'),
            name=properties.get('name'),
            opening_date=None,  # À parser si nécessaire
            fee=properties.get('fee'),
            access=properties.get('access'),
            barrier=properties.get('barrier'),
            wikimedia_commons=properties.get('wikimedia_commons'),
            wikidata=properties.get('wikidata'),
            geometry=geometry
        )

# Manager personnalisé avec des méthodes géospatiales utiles
class GreenSpaceManager(models.Manager):
    def within_distance(self, longitude, latitude, distance_m):
        """
        Trouve les espaces verts dans un rayon donné (en mètres)
        """
        from django.contrib.gis.geos import Point
        from django.contrib.gis.measure import D
        
        point = Point(longitude, latitude, srid=4326)
        return self.filter(geometry__distance_lte=(point, D(m=distance_m)))
    
    def containing_point(self, longitude, latitude):
        """
        Trouve les espaces verts qui contiennent un point donné
        """
        from django.contrib.gis.geos import Point
        point = Point(longitude, latitude, srid=4326)
        return self.filter(geometry__contains=point)
    
    def intersecting_bbox(self, min_lon, min_lat, max_lon, max_lat):
        """
        Trouve les espaces verts qui intersectent une bounding box
        """
        from django.contrib.gis.geos import Polygon
        bbox = Polygon.from_bbox((min_lon, min_lat, max_lon, max_lat))
        return self.filter(geometry__intersects=bbox)

# Ajouter le manager au modèle
GreenSpace.add_to_class('objects', GreenSpaceManager())
