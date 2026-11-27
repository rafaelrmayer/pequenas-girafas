"""Generate only the fixed generic catalog with Edge TTS. Never a runtime service."""
import argparse
import asyncio
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import tempfile
from urllib.request import getproxies

WORDS = {'peixe': 'peixe', 'mar': 'mar', 'agua': 'água', 'polvo': 'polvo', 'concha': 'concha', 'praia': 'praia', 'caranguejo': 'caranguejo', 'lua': 'lua', 'sol': 'sol', 'estrela': 'estrela', 'ceu': 'céu', 'planeta': 'planeta', 'flor': 'flor', 'grama': 'grama', 'folha': 'folha', 'arvore': 'árvore', 'semente': 'semente', 'jardim': 'jardim', 'maca': 'maçã', 'pera': 'pera', 'laranja': 'laranja', 'abacaxi': 'abacaxi', 'manga': 'manga', 'pessego': 'pêssego'}
LETTERS = dict(zip('abcdefghijklmnopqrstuvwxyz', ['á','bê','cê','dê','é','éfe','gê','agá','i','jóta','cá','éle','ême','êne','ó','pê','quê','érre','ésse','tê','u','vê','dáblio','xis','ípsilon','zê']))
ROOT = Path(__file__).resolve().parents[1]
PHRASES = {item['id']:item['text'].lower()+'.' for item in json.loads((ROOT/'frontend/phrases/catalog.json').read_text())}
CATALOG = {**WORDS, **{'letra-'+key:value for key,value in LETTERS.items()}, **PHRASES}
VOICES = ('pt-BR-FranciscaNeural','pt-BR-AntonioNeural','pt-BR-ThalitaMultilingualNeural')

async def generate(output, synthesize, *, voice, version, rate='-15%', only=None):
    """Stage the complete catalog before replacing any current audio."""
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    keys = list(CATALOG) if only is None else list(dict.fromkeys(only))
    if not keys or any(key not in CATALOG for key in keys):
        raise ValueError('Selecione apenas IDs do catálogo fixo.')
    records = []
    if only is not None:
        previous = json.loads((output/'manifest.json').read_text())
        if (previous['voice'],previous['rate'],previous['packageVersion']) != (voice,rate,version):
            raise ValueError('Geração parcial exige a mesma voz, taxa e versão do catálogo anterior.')
        for entry in previous['entries']:
            if entry['id'] in keys: continue
            if entry['id'] not in CATALOG or entry['text'] != CATALOG[entry['id']] or hashlib.sha256((output/entry['file']).read_bytes()).hexdigest() != entry['sha256']:
                raise ValueError('Catálogo anterior inconsistente.')
            records.append(entry)
    with tempfile.TemporaryDirectory(prefix='girafas-edge-', dir=output.parent) as directory:
        stage = Path(directory)
        for key in keys:
            text = CATALOG[key]
            destination = stage / (key+'.mp3')
            await synthesize(text, destination)
            data = destination.read_bytes()
            if len(data) < 256:
                raise ValueError('Audio vazio ou inválido: '+key)
            records.append({'id':key,'text':text,'file':key+'.mp3','sha256':hashlib.sha256(data).hexdigest()})
            print('Gerado: '+key, flush=True)
        manifest = {'provider':'edge-tts','packageVersion':version,'voice':voice,'rate':rate,'language':'pt-BR','personalData':False,'entries':records}
        (stage/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
        for record in records:
            if record['id'] not in keys: continue
            os.replace(stage/record['file'],output/record['file'])
        os.replace(stage/'manifest.json',output/'manifest.json')
    return manifest

async def main(args):
    import edge_tts
    # Extend trusted CAs only if explicitly supplied; never disable TLS validation.
    if args.ca_file:
        import edge_tts.communicate, edge_tts.voices
        for module in (edge_tts.communicate, edge_tts.voices):
            module._SSL_CTX.load_verify_locations(args.ca_file)
    proxy = getproxies().get('https')
    voices = await asyncio.wait_for(edge_tts.list_voices(proxy=proxy),timeout=25)
    if args.voice not in {voice['ShortName'] for voice in voices}:
        raise RuntimeError('Voz solicitada não disponível no serviço')
    async def synthesize(text, path):
        for attempt in range(3):
            try:
                communicator = edge_tts.Communicate(text,args.voice,rate='-15%',proxy=proxy,connect_timeout=10,receive_timeout=20)
                await asyncio.wait_for(communicator.save(str(path)),timeout=30)
                return
            except Exception:
                if attempt == 2: raise
                await asyncio.sleep(attempt+1)
    await generate(args.output,synthesize,voice=args.voice,version=importlib.metadata.version('edge-tts'),only=args.only)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--voice',choices=VOICES,default=VOICES[0])
    parser.add_argument('--output',type=Path,default=ROOT/'frontend/assets/audio')
    parser.add_argument('--only',nargs='+',choices=tuple(CATALOG),help='Gerar somente estes IDs, preservando os demais arquivos e hashes')
    parser.add_argument('--ca-file',help='Optional trusted CA bundle for managed development networks')
    asyncio.run(main(parser.parse_args()))
