import asyncio
import hashlib
import importlib.util
import json
from pathlib import Path
import pytest

ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('audio_generator',ROOT/'scripts/generate_audio.py')
generator=importlib.util.module_from_spec(spec)
spec.loader.exec_module(generator)

def test_generator_accepts_only_fixed_generic_catalog_and_records_provenance(tmp_path):
    sent=[]
    async def provider(text,path):
        sent.append(text)
        path.write_bytes(b'ID3'+text.encode()*300)
    result=asyncio.run(generator.generate(tmp_path/'audio',provider,voice=generator.VOICES[0],version='test'))
    assert len(sent)==99 and sent==list(generator.CATALOG.values())
    assert result['personalData'] is False
    assert result['voice']=='pt-BR-FranciscaNeural'
    assert all((tmp_path/'audio'/record['file']).is_file() for record in result['entries'])

def test_generation_failure_preserves_existing_catalog_and_manifest(tmp_path):
    output=tmp_path/'audio';output.mkdir()
    (output/'peixe.mp3').write_bytes(b'previous audio')
    (output/'manifest.json').write_text('previous manifest')
    async def unavailable(text,path):
        raise RuntimeError('service unavailable')
    with pytest.raises(RuntimeError):
        asyncio.run(generator.generate(output,unavailable,voice=generator.VOICES[0],version='test'))
    assert (output/'peixe.mp3').read_bytes()==b'previous audio'
    assert (output/'manifest.json').read_text()=='previous manifest'

def test_shipped_audio_matches_edge_manifest():
    output=ROOT/'frontend/assets/audio'
    manifest=json.loads((output/'manifest.json').read_text())
    assert manifest['provider']=='edge-tts'
    assert manifest['packageVersion']=='7.3.1'
    assert len(manifest['entries'])==99
    assert {entry['id']:entry['text'] for entry in manifest['entries']}==generator.CATALOG
    for entry in manifest['entries']:
        assert hashlib.sha256((output/entry['file']).read_bytes()).hexdigest()==entry['sha256']


def test_partial_generation_preserves_unchanged_recordings(tmp_path):
    output=tmp_path/'audio'
    async def provider(text,path): path.write_bytes(b'ID3'+text.encode()*300)
    original=asyncio.run(generator.generate(output,provider,voice=generator.VOICES[0],version='test'))
    before=(output/'peixe.mp3').read_bytes()
    sent=[]
    async def replacement(text,path):
        sent.append(text);path.write_bytes(b'ID3'+text.encode()*400)
    result=asyncio.run(generator.generate(output,replacement,voice=generator.VOICES[0],version='test',only=['lua']))
    assert sent==['lua'] and len(result['entries'])==99
    assert (output/'peixe.mp3').read_bytes()==before
    assert next(e for e in original['entries'] if e['id']=='peixe')==next(e for e in result['entries'] if e['id']=='peixe')
