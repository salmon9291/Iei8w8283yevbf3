
import os
import sys
import json
from instagrapi import Client
from instagrapi.exceptions import LoginRequired, PleaseWaitFewMinutes

def download_instagram_video(url: str, output_path: str) -> dict:
    """
    Descarga un video de Instagram usando instagrapi
    
    Args:
        url: URL del reel/video de Instagram
        output_path: Ruta donde guardar el video
    
    Returns:
        dict con 'success' (bool) y 'message' (str)
    """
    try:
        cl = Client()
        
        # Intentar login anónimo o usar credenciales si están disponibles
        # Para uso público, intentamos sin login primero
        try:
            # Extraer el media_pk de la URL
            media_pk = cl.media_pk_from_url(url)
            
            # Intentar obtener información del media sin login
            media_info = cl.media_info(media_pk)
            
            # Verificar que sea un video
            if media_info.media_type != 2 and media_info.media_type != 8:  # 2 = video, 8 = album con video
                return {
                    'success': False,
                    'message': 'El contenido no es un video'
                }
            
            # Descargar el video
            downloaded_path = cl.video_download(media_pk, output_path)
            
            return {
                'success': True,
                'message': 'Video descargado exitosamente',
                'path': str(downloaded_path)
            }
            
        except LoginRequired:
            # Si requiere login, intentar con credenciales de variables de entorno
            username = os.getenv('INSTAGRAM_USERNAME')
            password = os.getenv('INSTAGRAM_PASSWORD')
            
            if not username or not password:
                return {
                    'success': False,
                    'message': 'El contenido requiere autenticación. Configure INSTAGRAM_USERNAME e INSTAGRAM_PASSWORD en las variables de entorno.'
                }
            
            # Login con credenciales
            cl.login(username, password)
            
            # Reintentar descarga
            media_pk = cl.media_pk_from_url(url)
            media_info = cl.media_info(media_pk)
            
            if media_info.media_type != 2 and media_info.media_type != 8:
                return {
                    'success': False,
                    'message': 'El contenido no es un video'
                }
            
            downloaded_path = cl.video_download(media_pk, output_path)
            
            return {
                'success': True,
                'message': 'Video descargado exitosamente (con autenticación)',
                'path': str(downloaded_path)
            }
            
    except PleaseWaitFewMinutes as e:
        return {
            'success': False,
            'message': f'Instagram solicita esperar. Intenta de nuevo en unos minutos: {str(e)}'
        }
    except Exception as e:
        return {
            'success': False,
            'message': f'Error al descargar: {str(e)}'
        }

if __name__ == "__main__":
    # Recibir argumentos desde Node.js
    if len(sys.argv) != 3:
        print(json.dumps({
            'success': False,
            'message': 'Uso: python instagram_downloader.py <url> <output_path>'
        }))
        sys.exit(1)
    
    url = sys.argv[1]
    output_path = sys.argv[2]
    
    result = download_instagram_video(url, output_path)
    print(json.dumps(result))
