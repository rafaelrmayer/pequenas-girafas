"""Independent mock boundary; no upstream source or network client is included."""
from dataclasses import dataclass

@dataclass(frozen=True)
class MockGiraf:
    def image_request(self, word: dict) -> dict:
        return {"prompt": f"Pictograma de {word['text'].lower()}, fundo simples, sem texto", "style": "pictogram", "size": [512, 512], "format": "png"}

    def image(self, word: dict) -> dict:
        # Mock deliberately returns a bundled illustration, not a remote-generated image.
        return {"provider": "mock", "status": "bundled_illustration", "image_url": word["image"], "request_contract": self.image_request(word)}

    def tts_request(self, word: dict) -> dict:
        return {"text": word["text"], "language": "pt-BR", "voice": None, "format": "wav"}

    def tts(self, word: dict) -> dict:
        return {"provider": "mock", "status": "no_audio", "audio_base64": None, "format": "wav", "duration_ms": None, "request_contract": self.tts_request(word)}
