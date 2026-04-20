# OMR Service

Este diretorio descreve a integracao de reconhecimento optico musical (OMR).

- `Audiveris`: recomendado para execucao local usando `JAVA_BIN` + `AUDIVERIS_JAR_PATH`
- Fallback: em desenvolvimento, o backend pode retornar um MusicXML de exemplo configurado em `OMR_FALLBACK_SAMPLE`

Fluxo esperado:

1. Receber PDF
2. Extrair paginas/imagens conforme necessario
3. Executar OMR
4. Normalizar para MusicXML
5. Gerar MIDI e renderizacao no frontend
