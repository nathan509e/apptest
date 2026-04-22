@ -1,145 +0,0 @@
# ScoreFlow Studio

Aplicativo web moderno para leitura, conversao, visualizacao, transposicao e exportacao de partituras a partir de arquivos PDF.

## O que este projeto entrega

- `frontend/`: Next.js com interface inspirada em editores musicais modernos
- `backend/`: API Express para upload, OMR, transposicao e exportacao
- `services/omr/`: documentacao do fluxo de integracao com Audiveris
- `utils/music/`: utilitarios compartilhados para teoria musical e transposicao
- `examples/test-score.pdf`: PDF de exemplo para validar o pipeline
- `examples/sample.musicxml`: MusicXML de fallback para demo e desenvolvimento

## Funcionalidades implementadas

- Upload de PDF via drag and drop
- Pipeline de conversao `PDF -> MusicXML`
- Fallback local quando o OMR externo nao estiver configurado
- Renderizacao da partitura com `OpenSheetMusicDisplay`
- Transposicao por:
  - intervalo em semitons
  - mudanca de tonalidade (`C -> D`, `Bb -> C`, etc.)
- Reproducao no navegador com `Tone.js`
- Exportacao em:
  - `MusicXML`
  - `MIDI`
  - `PDF`
- Layout responsivo com visual mais editorial

## Arquitetura

```text
apptest/
|-- frontend/
|   |-- app/
|   |-- components/
|   |-- lib/
|   `-- types/
|-- backend/
|   `-- src/
|       |-- config/
|       |-- routes/
|       `-- services/
|-- services/
|   `-- omr/
|-- utils/
|   `-- music/
`-- examples/
```

## Stack

- Frontend: `Next.js 15`, `React 19`, `OpenSheetMusicDisplay`, `Tone.js`
- Backend: `Node.js`, `Express`, `Multer`, `fast-xml-parser`, `midi-writer-js`, `pdfkit`
- OMR: preparado para `Audiveris`

## Como executar localmente

### 1. Configurar variaveis de ambiente

Copie `.env.example` para `.env` na raiz e ajuste se necessario:

```env
BACKEND_PORT=4000
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
AUDIVERIS_JAR_PATH=
JAVA_BIN=java
OMR_FALLBACK_SAMPLE=examples/sample.musicxml
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Rodar frontend e backend juntos

```bash
npm run dev
```

### 4. Acessar

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:4000/api/health](http://localhost:4000/api/health)

## Scripts

- `npm run dev`: sobe frontend e backend em paralelo
- `npm run build`: gera build de ambos
- `npm run start`: inicia ambos em modo de producao

## Endpoints principais

- `POST /api/scores/upload`
  - campo multipart: `file`
- `GET /api/scores/:scoreId`
- `POST /api/scores/:scoreId/transpose`
- `GET /api/scores/:scoreId/download/musicxml`
- `GET /api/scores/:scoreId/download/midi`
- `GET /api/scores/:scoreId/download/pdf`

## Fluxo de OMR

O backend tenta usar `Audiveris` se `AUDIVERIS_JAR_PATH` estiver configurado.

Exemplo de configuracao no Windows:

```powershell
$env:AUDIVERIS_JAR_PATH="C:\tools\audiveris\audiveris.jar"
$env:JAVA_BIN="java"
```

Se o OMR nao estiver configurado, o app continua funcional usando `examples/sample.musicxml` como fallback para demonstracao da interface, transposicao e exportacao.

## Exemplo funcional

Use o arquivo [examples/test-score.pdf](C:\Users\Nathan\Documents\GitHub\apptest\examples\test-score.pdf) para validar o upload. Sem Audiveris configurado, ele vai abrir a partitura de exemplo via fallback. Com Audiveris configurado, o backend tenta reconhecer o PDF de verdade.

## Observacoes sobre os desafios

- OMR em PDF de partitura nunca e perfeito; por isso o projeto isola a camada de reconhecimento em `backend/src/services/omrService.ts`
- O fallback local permite desenvolver UX e fluxo mesmo sem Java/OMR instalado
- A transposicao atual atua sobre os eventos de pitch do MusicXML e pode ser evoluida para preservar enarmonias mais sofisticadas
- O exportador PDF atual gera uma versao estruturada do conteudo musical; uma exportacao visual identica ao renderer pode ser adicionada depois via render server-side ou impressao do frontend

## Roadmap sugerido

- Login e autenticacao
- Historico por usuario
- Compartilhamento por link
- Edicao manual por nota/compasso
- Correcao assistida de erros do OMR
- Banco de dados para persistencia

## Arquivos-chave

- [frontend/app/page.tsx](C:\Users\Nathan\Documents\GitHub\apptest\frontend\app\page.tsx)
- [frontend/components/ScoreWorkspace.tsx](C:\Users\Nathan\Documents\GitHub\apptest\frontend\components\ScoreWorkspace.tsx)
- [backend/src/routes/scoreRoutes.ts](C:\Users\Nathan\Documents\GitHub\apptest\backend\src\routes\scoreRoutes.ts)
- [backend/src/services/scoreService.ts](C:\Users\Nathan\Documents\GitHub\apptest\backend\src\services\scoreService.ts)
- [backend/src/services/omrService.ts](C:\Users\Nathan\Documents\GitHub\apptest\backend\src\services\omrService.ts)
- [utils/music/musicxml.ts](C:\Users\Nathan\Documents\GitHub\apptest\utils\music\musicxml.ts)