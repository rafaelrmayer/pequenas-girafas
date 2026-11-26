"""Offline generic catalog recordings. Requires espeak-ng 1.52 and ffmpeg."""
from pathlib import Path
import os, subprocess, tempfile
WORDS = {'peixe':'peixe','mar':'mar','agua':'água','polvo':'polvo','concha':'concha','praia':'praia','caranguejo':'caranguejo'}
LETTERS = dict(zip('abcdefghijklmnopqrstuvwxyz', ['á','bê','cê','dê','é','éfe','gê','agá','i','jóta','cá','éle','ême','êne','ó','pê','quê','érre','ésse','tê','u','vê','dáblio','xis','ípsilon','zê']))
OUT = Path(__file__).resolve().parents[1] / 'frontend/assets/audio'
def main():
    OUT.mkdir(parents=True, exist_ok=True)
    executable = os.environ.get('ESPEAK_BIN','espeak-ng')
    extra = ['--path='+os.environ['ESPEAK_DATA_PARENT']] if os.environ.get('ESPEAK_DATA_PARENT') else []
    for key,text in {**WORDS, **{'letra-'+k:v for k,v in LETTERS.items()}}.items():
        with tempfile.TemporaryDirectory() as directory:
            wav = Path(directory)/'speech.wav'
            subprocess.run([executable,*extra,'-v','pt-br','-s','145','-w',str(wav),text],check=True)
            subprocess.run(['ffmpeg','-loglevel','error','-y','-i',str(wav),'-codec:a','libmp3lame','-b:a','64k',str(OUT/(key+'.mp3'))],check=True)
if __name__ == '__main__': main()
