import json
from pathlib import Path
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.integrations.giraf import MockGiraf

client = TestClient(app)

def test_catalog_graph_and_resources_are_consistent():
    response = client.get('/api/v1/catalog')
    assert response.status_code == 200
    data = response.json()
    ids = {w['id'] for w in data['words']}
    assert len(ids) == 7 and 'peixe' in ids
    graph_ids=ids | {node['id'] for node in data['concepts']}
    assert all(not node['playable'] for node in data['concepts'])
    for edge in data['relations']:
        assert edge['from'] in graph_ids and edge['to'] in graph_ids
    for word in data['words']:
        assert client.get(word['image']).status_code == 200
        resource = client.get(f"/api/v1/resources/{word['id']}").json()
        assert resource['image']['provider'] == 'mock'
        assert resource['tts']['status'] == 'no_audio'
        assert resource['tts']['request_contract']['language'] == 'pt-BR'
    assert client.get('/api/v1/resources/unknown').status_code == 404

def test_catalog_is_read_only_and_no_child_records_endpoint():
    before = client.get('/api/v1/catalog').json()
    assert client.post('/api/v1/catalog', json={'name':'not accepted'}).status_code == 405
    assert client.post('/api/v1/progress', json={'events':[]}).status_code == 405
    assert client.get('/api/v1/catalog').json() == before

def test_security_and_no_remote_assets():
    response = client.get('/')
    assert response.status_code == 200
    assert "connect-src 'self'" in response.headers['content-security-policy']
    assert "frame-ancestors 'none'" in response.headers['content-security-policy']
    assert response.headers['permissions-policy'] == 'camera=(), microphone=(), geolocation=()'
    assert 'https://' not in response.text and 'http://' not in response.text
    assert response.headers['cache-control'] == 'no-store'
    assert client.get('/sw.js').headers['service-worker-allowed'] == '/'
    assert client.get('/storage/store.mjs').status_code == 200

def test_mock_contract_does_not_import_network_client():
    mock = MockGiraf()
    word = {'text':'PEIXE', 'image':'/assets/peixe.svg'}
    request = mock.image_request(word)
    assert set(request) == {'prompt', 'style', 'size', 'format'}
    assert request['format'] == 'png' and request['size'] == [512,512]
    assert mock.tts(word)['audio_base64'] is None
    assert mock.tts_request(word)['text'] == 'PEIXE'

def test_all_offline_assets_exist():
    import re
    sw = client.get('/sw.js').text
    assets = json.loads(re.search(r'const ASSETS = (.*);', sw).group(1))
    assert len(assets) == len(set(assets))
    for asset in assets:
        assert client.get(asset).status_code == 200, asset
    assert '/api/v1/resources' not in assets

def test_absolute_paths_from_another_working_directory(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    assert client.get('/').status_code == 200
    assert client.get('/assets/peixe.svg').status_code == 200

def test_visual_presentations_are_local_unique_and_have_accessible_assets():
    import xml.etree.ElementTree as ET
    catalog=client.get('/api/v1/catalog').json()
    for word in catalog['words']:
        values=word['pedagogy']['presentations']
        assert len(values)==(3 if word['id'] in {'peixe','polvo','agua'} else 1)
        assert len({p['id'] for p in values})==len(values)
        for presentation in values:
            assert presentation['alt'] and presentation['label']
            assert presentation['asset'].startswith('/assets/')
            response=client.get(presentation['asset'])
            assert response.status_code==200
            svg=ET.fromstring(response.text)
            assert svg.attrib['viewBox']=='0 0 300 300'
            assert svg.find('{http://www.w3.org/2000/svg}title') is not None
