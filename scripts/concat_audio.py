import os
import subprocess
import imageio_ffmpeg

ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
audio_dir = os.path.join(os.getcwd(), 'video_assets', 'audio')
concat_file = os.path.join(audio_dir, 'concat.txt')
scenes = [
    'scene1_login', 
    'scene2_catalog', 
    'scene3_cart', 
    'scene4_checkout', 
    'scene5_receipt', 
    'scene6_tables', 
    'scene7_customers', 
    'scene8_orders_void', 
    'scene9_reports_admin', 
    'scene10_conclusion'
]

with open(concat_file, 'w', encoding='utf-8') as f:
    for s in scenes:
        path = os.path.join(audio_dir, s + '.mp3').replace('\\', '/')
        f.write(f"file '{path}'\n")

out_audio = os.path.join(audio_dir, 'full_narration.mp3')
cmd = [ffmpeg, '-y', '-f', 'concat', '-safe', '0', '-i', concat_file, '-c', 'copy', out_audio]
subprocess.run(cmd, check=True)
print('Concatenated full_narration.mp3 size:', os.path.getsize(out_audio))
