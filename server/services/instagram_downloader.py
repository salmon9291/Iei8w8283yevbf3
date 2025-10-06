
import os
import sys
import json
from instagrapi import Client
from instagrapi.exceptions import LoginRequired, PleaseWaitFewMinutes, ClientError

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
        
        # Obtener credenciales de las variables de entorno
        username = os.getenv('INSTAGRAM_USERNAME')
        password = os.getenv('INSTAGRAM_PASSWORD')
        
        # Si hay credenciales, hacer login primero
        if username and password:
            try:
                print(f"Intentando login con usuario: {username}", file=sys.stderr)
                cl.login(username, password)
                print("Login exitoso", file=sys.stderr)
            except Exception as login_error:
                print(f"Error en login: {str(login_error)}", file=sys.stderr)
                return {
                    'success': False,
                    'message': f'Error al iniciar sesión en Instagram: {str(login_error)}'
                }
        
        # Extraer el media_pk de la URL
        try:
            media_pk = cl.media_pk_from_url(url)
            print(f"Media PK extraído: {media_pk}", file=sys.stderr)
        except Exception as e:
            return {
                'success': False,
                'message': f'Error al extraer ID del video: {str(e)}'
            }
        
        # Obtener información del media
        try:
            media_info = cl.media_info(media_pk)
            print(f"Información del media obtenida, tipo: {media_info.media_type}", file=sys.stderr)
        except LoginRequired:
            return {
                'success': False,
                'message': 'El contenido requiere autenticación. Configura INSTAGRAM_USERNAME e INSTAGRAM_PASSWORD en Secrets.'
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Error al obtener información del video: {str(e)}'
            }
        
        # Verificar que sea un video
        if media_info.media_type != 2 and media_info.media_type != 8:  # 2 = video, 8 = album con video
            return {
                'success': False,
                'message': 'El contenido no es un video'
            }
        
        # Descargar el video
        try:
            downloaded_path = cl.video_download(media_pk, output_path)
            print(f"Video descargado en: {downloaded_path}", file=sys.stderr)
            
            return {
                'success': True,
                'message': 'Video descargado exitosamente' + (' (con autenticación)' if username else ''),
                'path': str(downloaded_path)
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Error al descargar el video: {str(e)}'
            }
            
    except PleaseWaitFewMinutes as e:
        return {
            'success': False,
            'message': f'Instagram solicita esperar. Intenta de nuevo en unos minutos: {str(e)}'
        }
    except ClientError as e:
        return {
            'success': False,
            'message': f'Error de cliente de Instagram: {str(e)}'
        }
    except Exception as e:
        return {
            'success': False,
            'message': f'Error inesperado: {str(e)}'
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
